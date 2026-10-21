const mongoose = require('mongoose');

const DocumentTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      unique: true,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
    },
    customFields: [
      {
        fieldName: { type: String, required: true },
        label: String,
        fieldType: {
          type: String,
          enum: ['text', 'number', 'date', 'select', 'textarea', 'file'],
          default: 'text',
        },
        required: { type: Boolean, default: false },
        options: [String],
      },
    ],
    approvalChain: [
      {
        stage: { type: Number, required: true },
        stageName: String,
        role: {
          type: String,
          enum: ['student', 'class_advisor', 'hod', 'dean', 'admin_staff', 'super_admin'],
          required: true,
        },
        department: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DocumentType', DocumentTypeSchema);
