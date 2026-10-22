const Request = require('../models/Request');
const DocumentType = require('../models/DocumentType');
const Notification = require('../models/Notification');
const User = require('../models/User');
const GeneratedDocument = require('../models/GeneratedDocument');
const { getNextApprover, advanceWorkflow, isWorkflowComplete } = require('../services/workflow.service');
const { sendApprovalEmail, sendRejectionEmail, sendCompletionEmail, sendRevisionEmail } = require('../services/email.service');
const { generateDocument } = require('../services/pdf.service');
const { ErrorResponse } = require('../middleware/errorHandler');
const crypto = require('crypto');
const { validateFormData } = require('../services/requestValidation.service');

exports.approveRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.requestId).populate('student');
    if (!request) return next(new ErrorResponse('Request not found', 404));

    if (!request.currentApprover || !['submitted', 'in_review'].includes(request.status)) {
      return next(new ErrorResponse('This request is no longer awaiting approval', 409));
    }
    if (request.currentApprover.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse('Not authorized to approve this request', 403));
    }

    const documentType = await DocumentType.findById(request.documentType);
    const comments = req.body.comments || '';
    const stageBeforeApproval = request.currentStage;
    request.currentStage += 1;
    const workflowComplete = isWorkflowComplete(request, documentType);
    const nextApprover = workflowComplete ? null : await getNextApprover(request, documentType);
    request.currentStage = stageBeforeApproval;
    if (!workflowComplete && !nextApprover) {
      return next(new ErrorResponse('The next workflow stage has no active approver. Ask an administrator to assign one before approving this request.', 409));
    }
    
    await advanceWorkflow(request, req.user._id, 'approve', comments);

    if (workflowComplete) {
      request.status = 'approved';
      request.currentApprover = null;
      
      // Document Generation
      const documentUid = crypto.randomBytes(16).toString('hex');
      const docResult = await generateDocument(request, documentType, request.student, documentUid);
      
      const genDoc = await GeneratedDocument.create({
        request: request._id,
        documentType: documentType._id,
        student: request.student._id,
        documentUid,
        qrCodeData: docResult.qrCodeData,
        filePath: docResult.filePath,
        issuedBy: req.user._id,
        verificationUrl: `${process.env.CLIENT_URL}/verify/${documentUid}`
      });

      request.generatedDocument = genDoc._id;
      request.status = 'completed';
      await request.save();

      await Notification.create({
        recipient: request.student._id,
        sender: req.user._id,
        type: 'request_completed',
        title: 'Document Ready',
        message: `Your request for ${documentType.name} is complete. Your document is ready for download.`,
        relatedRequest: request._id
      });

      await sendCompletionEmail(request.student, request);

    } else {
      request.currentApprover = nextApprover._id;
      request.status = 'in_review';
      await request.save();

      await Notification.create({
        recipient: nextApprover._id,
        sender: req.user._id,
        type: 'request_submitted',
        title: 'Approval Required',
        message: `Request ${request.documentId} requires your approval.`,
        relatedRequest: request._id
      });
      
      await sendApprovalEmail(request.student, request, req.user, request.currentStage - 1);
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

exports.rejectRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.requestId).populate('student');
    if (!request) return next(new ErrorResponse('Request not found', 404));

    if (!request.currentApprover || !['submitted', 'in_review'].includes(request.status)) {
      return next(new ErrorResponse('This request is no longer awaiting approval', 409));
    }
    if (request.currentApprover.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse('Not authorized to reject this request', 403));
    }

    const { comments } = req.body;
    if (!comments) return next(new ErrorResponse('Rejection reason is required', 400));

    await advanceWorkflow(request, req.user._id, 'reject', comments);

    await Notification.create({
      recipient: request.student._id,
      sender: req.user._id,
      type: 'request_rejected',
      title: 'Request Rejected',
      message: `Your request ${request.documentId} has been rejected.`,
      relatedRequest: request._id
    });

    await sendRejectionEmail(request.student, request, req.user, comments);

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

exports.requestRevision = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.requestId).populate('student');
    if (!request) return next(new ErrorResponse('Request not found', 404));

    if (!request.currentApprover || !['submitted', 'in_review'].includes(request.status)) {
      return next(new ErrorResponse('This request is no longer awaiting approval', 409));
    }
    if (request.currentApprover.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse('Not authorized', 403));
    }

    const { comments } = req.body;
    if (!comments) return next(new ErrorResponse('Revision comments are required', 400));

    await advanceWorkflow(request, req.user._id, 'revision_requested', comments);

    await Notification.create({
      recipient: request.student._id,
      sender: req.user._id,
      type: 'revision_requested',
      title: 'Revision Requested',
      message: `Your request ${request.documentId} needs revision.`,
      relatedRequest: request._id
    });

    await sendRevisionEmail(request.student, request, req.user, comments);

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

exports.resubmitRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.requestId);
    if (!request) return next(new ErrorResponse('Request not found', 404));

    if (request.student.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse('Not authorized', 403));
    }

    if (request.status !== 'revision_requested') {
      return next(new ErrorResponse('Request is not in revision state', 400));
    }

    const documentType = await DocumentType.findById(request.documentType);
    if (req.body.formData !== undefined) {
      const formValidationError = validateFormData(documentType, req.body.formData);
      if (formValidationError) return next(new ErrorResponse(formValidationError, 400));
      request.formData = req.body.formData;
    }
    
    // Find the approver who requested revision based on history or reset to stage 1
    // Simplification: reset to stage 1
    request.currentStage = 1;
    request.status = 'submitted';
    
    const nextApprover = await getNextApprover(request, documentType);
    if (!nextApprover) return next(new ErrorResponse('No active first-stage approver is assigned. Contact the Academic Office.', 409));
    request.currentApprover = nextApprover._id;

    request.history.push({
      action: 'resubmit',
      performedBy: req.user._id,
      stage: request.currentStage,
      comments: req.body.comments || 'Resubmitted'
    });

    await request.save();

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};
