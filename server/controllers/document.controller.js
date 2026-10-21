const GeneratedDocument = require('../models/GeneratedDocument');
const Request = require('../models/Request');
const path = require('path');
const fs = require('fs');
const { ErrorResponse } = require('../middleware/errorHandler');
const { getStoragePath } = require('../config/storage');

exports.downloadDocument = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.requestId);
    if (!request) return next(new ErrorResponse('Request not found', 404));

    if (request.student.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse('Not authorized', 403));
    }

    if (request.status !== 'completed' || !request.generatedDocument) {
      return next(new ErrorResponse('Document is not yet generated', 400));
    }

    const genDoc = await GeneratedDocument.findById(request.generatedDocument);
    if (!genDoc) return next(new ErrorResponse('Generated document not found', 404));

    const filePath = path.join(getStoragePath('uploads', 'documents'), path.basename(genDoc.filePath));
    
    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      return next(new ErrorResponse('File not found on server', 404));
    }
  } catch (error) {
    next(error);
  }
};

exports.verifyDocument = async (req, res, next) => {
  try {
    const genDoc = await GeneratedDocument.findOne({ documentUid: req.params.uid })
      .populate('student', 'name rollNumber department year section')
      .populate('documentType', 'name')
      .populate('issuedBy', 'name role');

    if (!genDoc || !genDoc.isValid) {
      return res.status(404).json({ success: false, message: 'Document is invalid or not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        student: genDoc.student,
        documentType: genDoc.documentType.name,
        issuedAt: genDoc.issuedAt,
        issuedBy: genDoc.issuedBy ? genDoc.issuedBy.name : 'System',
        isValid: genDoc.isValid
      }
    });
  } catch (error) {
    next(error);
  }
};
