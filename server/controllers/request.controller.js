const Request = require('../models/Request');
const DocumentType = require('../models/DocumentType');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { getNextApprover } = require('../services/workflow.service');
const { sendRequestSubmittedEmail } = require('../services/email.service');
const { validateFormData } = require('../services/requestValidation.service');
const { ErrorResponse } = require('../middleware/errorHandler');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.createRequest = async (req, res, next) => {
  try {
    const { documentTypeId, formData } = req.body;

    const documentType = await DocumentType.findById(documentTypeId);
    if (!documentType || !documentType.isActive) {
      return next(new ErrorResponse('Document type not found', 404));
    }

    const formValidationError = validateFormData(documentType, formData);
    if (formValidationError) return next(new ErrorResponse(formValidationError, 400));

    const request = new Request({
      student: req.user._id,
      documentType: documentTypeId,
      formData,
      status: 'submitted',
      currentStage: 1,
    });

    const nextApprover = await getNextApprover(request, documentType);
    if (!nextApprover) {
      return next(new ErrorResponse(
        'This request cannot be submitted yet because no active first-stage approver is assigned. Contact the Academic Office.',
        409
      ));
    }
    request.currentApprover = nextApprover._id;
    request.history.push({ action: 'submitted', performedBy: req.user._id, stage: 0 });

    await request.save();

    if (nextApprover) {
      await Notification.create({
        recipient: nextApprover._id,
        sender: req.user._id,
        type: 'request_submitted',
        title: 'New Document Request',
        message: `A new request for ${documentType.name} requires your approval.`,
        relatedRequest: request._id,
      });
    }

    await sendRequestSubmittedEmail(req.user, request);

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

exports.getAvailableDocumentTypes = async (req, res, next) => {
  try {
    const documentTypes = await DocumentType.find({ isActive: true })
      .select('name category description customFields approvalChain')
      .sort({ category: 1, name: 1 });
    res.status(200).json({ success: true, count: documentTypes.length, data: documentTypes });
  } catch (error) {
    next(error);
  }
};

exports.getMyRequests = async (req, res, next) => {
  try {
    const query = { student: req.user._id };
    if (req.query.status) query.status = req.query.status;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const [requests, total] = await Promise.all([Request.find(query)
      .populate('documentType', 'name category')
      .populate('currentApprover', 'name role')
      .sort('-createdAt').skip((page - 1) * limit).limit(limit), Request.countDocuments(query)]);

    res.status(200).json({ success: true, count: total, data: { requests, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
  } catch (error) {
    next(error);
  }
};

exports.getRequestById = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('documentType')
      .populate('student', 'name email rollNumber department year section')
      .populate('currentApprover', 'name role')
      .populate('history.performedBy', 'name role');

    if (!request) {
      return next(new ErrorResponse('Request not found', 404));
    }

    // Check authorization: Owner, Current Approver, Admin, Super Admin
    const isOwner = request.student._id.toString() === req.user._id.toString();
    const isApprover = request.currentApprover && request.currentApprover._id.toString() === req.user._id.toString();
    const isAdmin = ['admin_staff', 'super_admin'].includes(req.user.role);
    const hasHistory = request.history.some(h => h.performedBy && h.performedBy._id.toString() === req.user._id.toString());

    if (!isOwner && !isApprover && !isAdmin && !hasHistory) {
      return next(new ErrorResponse('Not authorized to view this request', 403));
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

exports.getPendingApprovals = async (req, res, next) => {
  try {
    const query = { currentApprover: req.user._id, status: { $in: ['submitted', 'in_review'] } };
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const [requests, total] = await Promise.all([Request.find(query)
      .populate('documentType', 'name')
      .populate('student', 'name rollNumber department')
      .sort('createdAt').skip((page - 1) * limit).limit(limit), Request.countDocuments(query)]);

    res.status(200).json({ success: true, count: total, data: { requests, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
  } catch (error) {
    next(error);
  }
};

exports.getRequestStats = async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      const query = { student: req.user._id };
      const [total, pending, completed, rejected, revisionRequested] = await Promise.all([
        Request.countDocuments(query),
        Request.countDocuments({ ...query, status: { $in: ['submitted', 'in_review'] } }),
        Request.countDocuments({ ...query, status: 'completed' }),
        Request.countDocuments({ ...query, status: 'rejected' }),
        Request.countDocuments({ ...query, status: 'revision_requested' }),
      ]);
      return res.status(200).json({ success: true, data: { total, pending, completed, rejected, revisionRequested } });
    }
    const [pending, decisions] = await Promise.all([
      Request.countDocuments({ currentApprover: req.user._id, status: { $in: ['submitted', 'in_review'] } }),
      Request.aggregate([
        { $unwind: '$history' },
        { $match: { 'history.performedBy': req.user._id, 'history.action': { $in: ['approve', 'reject'] } } },
        { $group: { _id: '$history.action', count: { $sum: 1 } } },
      ]),
    ]);
    const counts = Object.fromEntries(decisions.map(({ _id, count }) => [_id, count]));
    const approved = counts.approve || 0;
    const rejected = counts.reject || 0;
    res.status(200).json({ success: true, data: { pending, approved, rejected, totalProcessed: approved + rejected } });
  } catch (error) {
    next(error);
  }
};

exports.getAllRequests = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.search) {
      const term = escapeRegex(req.query.search.trim());
      const matchingStudents = await User.find({ $or: [
        { name: { $regex: term, $options: 'i' } },
        { rollNumber: { $regex: term, $options: 'i' } },
      ] }).distinct('_id');
      query.$or = [{ documentId: { $regex: term, $options: 'i' } }, { student: { $in: matchingStudents } }];
    }
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 15));
    const [requests, total] = await Promise.all([Request.find(query)
      .populate('documentType', 'name')
      .populate('student', 'name rollNumber department')
      .populate('currentApprover', 'name role')
      .sort('-createdAt').skip((page - 1) * limit).limit(limit), Request.countDocuments(query)]);

    res.status(200).json({ success: true, count: total, data: { requests, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
  } catch (error) {
    next(error);
  }
};
