const mongoose = require('mongoose');

const GeneratedDocumentSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.ObjectId,
      ref: 'Request',
      required: true,
    },
    documentType: {
      type: mongoose.Schema.ObjectId,
      ref: 'DocumentType',
      required: true,
    },
    student: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    documentUid: {
      type: String,
      required: true,
      unique: true,
    },
    qrCodeData: {
      type: String,
    },
    filePath: {
      type: String,
    },
    issuedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    verificationUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('GeneratedDocument', GeneratedDocumentSchema);
