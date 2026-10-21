const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    documentType: {
      type: mongoose.Schema.ObjectId,
      ref: 'DocumentType',
      required: true,
    },
    formData: {
      type: Map,
      of: String,
    },
    attachments: [
      {
        fileName: String,
        filePath: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: [
        'draft',
        'submitted',
        'in_review',
        'approved',
        'rejected',
        'revision_requested',
        'completed',
      ],
      default: 'draft',
    },
    currentStage: {
      type: Number,
      default: 0,
    },
    currentApprover: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    rejectionReason: String,
    documentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    generatedDocument: {
      type: mongoose.Schema.ObjectId,
      ref: 'GeneratedDocument',
    },
    history: [
      {
        action: String,
        performedBy: {
          type: mongoose.Schema.ObjectId,
          ref: 'User',
        },
        stage: Number,
        comments: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: auto-generate documentId on first save using pattern DOC-YYYY-NNNNN
RequestSchema.pre('save', async function (next) {
  if (this.isNew && !this.documentId) {
    const date = new Date();
    const year = date.getFullYear();
    const count = await mongoose.model('Request').countDocuments();
    const sequence = (count + 1).toString().padStart(5, '0');
    this.documentId = `DOC-${year}-${sequence}`;
  }
  next();
});

module.exports = mongoose.model('Request', RequestSchema);
