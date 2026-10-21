const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('./models/User');
const DocumentType = require('./models/DocumentType');
const connectDB = require('./config/db');

const seedDatabase = async () => {
  const adminEmail = (process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@easwari.edu').toLowerCase();
  let admin = await User.findOne({ email: adminEmail });

  if (!admin) {
    const bootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || crypto.randomBytes(24).toString('base64url');
    admin = await User.create({
      name: 'Academic Office Administrator',
      email: adminEmail,
      password: bootstrapPassword,
      role: 'super_admin',
      department: 'Administration',
      isActive: true,
    });
    console.log(`Initial administrator created: ${adminEmail}`);
    if (!process.env.BOOTSTRAP_ADMIN_PASSWORD) console.log(`One-time bootstrap password: ${bootstrapPassword}`);
  }

  const documentTypes = [
    {
      name: 'Bonafide Certificate',
      category: 'Certificates',
      description: 'Proof of current enrollment for scholarships, travel, and other official purposes.',
      customFields: [
        { fieldName: 'purpose', label: 'Purpose', fieldType: 'text', required: true },
      ],
      approvalChain: [
        { stage: 1, stageName: 'Class advisor', role: 'class_advisor' },
        { stage: 2, stageName: 'Head of department', role: 'hod' },
        { stage: 3, stageName: 'Academic office', role: 'admin_staff', department: 'Administration' },
      ],
    },
    {
      name: 'Transcript Request',
      category: 'Academic records',
      description: 'Request an official transcript of completed coursework and grades.',
      customFields: [
        { fieldName: 'numberOfCopies', label: 'Number of copies', fieldType: 'number', required: true },
        { fieldName: 'deliveryInstructions', label: 'Delivery instructions', fieldType: 'textarea', required: false },
      ],
      approvalChain: [
        { stage: 1, stageName: 'Class advisor', role: 'class_advisor' },
        { stage: 2, stageName: 'Head of department', role: 'hod' },
        { stage: 3, stageName: 'Academic office', role: 'admin_staff', department: 'Administration' },
      ],
    },
    {
      name: 'Internship No Objection Certificate',
      category: 'Certificates',
      description: 'Request an institutional NOC for an internship or approved project.',
      customFields: [
        { fieldName: 'organization', label: 'Organization', fieldType: 'text', required: true },
        { fieldName: 'internshipDates', label: 'Internship dates', fieldType: 'text', required: true },
      ],
      approvalChain: [
        { stage: 1, stageName: 'Class advisor', role: 'class_advisor' },
        { stage: 2, stageName: 'Head of department', role: 'hod' },
      ],
    },
    {
      name: 'Recommendation Letter',
      category: 'Letters',
      description: 'Request an academic recommendation for further study or a scholarship.',
      customFields: [
        { fieldName: 'institution', label: 'Institution', fieldType: 'text', required: true },
        { fieldName: 'program', label: 'Program or opportunity', fieldType: 'text', required: true },
        { fieldName: 'submissionDeadline', label: 'Submission deadline', fieldType: 'date', required: false },
      ],
      approvalChain: [
        { stage: 1, stageName: 'Class advisor', role: 'class_advisor' },
        { stage: 2, stageName: 'Head of department', role: 'hod' },
        { stage: 3, stageName: 'Dean', role: 'dean' },
      ],
    },
  ];

  for (const definition of documentTypes) {
    let stored = await DocumentType.collection.findOne({ name: definition.name });
    if (!stored) {
      await DocumentType.create({ ...definition, createdBy: admin._id, isActive: true });
      continue;
    }

    // Migrate the earlier UI's `name`/`type` field keys and approval sequence values in place.
    const customFields = (stored.customFields || definition.customFields).map((field) => {
      const label = field.label || field.fieldName || field.name || 'Details';
      const candidateType = field.fieldType || field.type;
      const allowedTypes = ['text', 'number', 'date', 'select', 'textarea', 'file'];
      return {
        fieldName: field.fieldName || field.name || label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
        label,
        fieldType: allowedTypes.includes(candidateType) ? candidateType : 'text',
        required: Boolean(field.required),
        options: Array.isArray(field.options) ? field.options : [],
      };
    });
    const validRoles = ['student', 'class_advisor', 'hod', 'dean', 'admin_staff', 'super_admin'];
    const rawStages = stored.approvalChain?.length ? stored.approvalChain : definition.approvalChain;
    const approvalChain = rawStages.map((stage, index) => ({
      stage: Number(stage.stage ?? stage.sequence ?? index + 1),
      stageName: stage.stageName || `Approval stage ${index + 1}`,
      role: validRoles.includes(stage.role) ? stage.role : 'admin_staff',
      ...(stage.department ? { department: stage.department } : stage.departmentSpecific ? { department: 'student' } : {}),
    }));
    await DocumentType.collection.updateOne(
      { _id: stored._id },
      { $set: { customFields, approvalChain } }
    );
  }

  console.log(`Academic workspace initialized with ${documentTypes.length} document types.`);
  return { admin, documentTypes };
};

module.exports = seedDatabase;

if (require.main === module) {
  require('dotenv').config();
  let localMongoServer;
  connectDB()
    .then(async (database) => {
      localMongoServer = database.localMongoServer;
      await seedDatabase();
      await mongoose.disconnect();
      if (localMongoServer) await localMongoServer.stop({ doCleanup: false });
    })
    .then(() => process.exit(0))
    .catch(async (error) => {
      console.error('Workspace initialization failed:', error);
      if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
      if (localMongoServer) await localMongoServer.stop({ doCleanup: false });
      process.exit(1);
    });
}
