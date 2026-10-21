const User = require('../models/User');

exports.getNextApprover = async (request, documentType) => {
  const stageConfig = documentType.approvalChain.find((stage) => stage.stage === request.currentStage);

  if (!stageConfig) {
    return null; // Workflow complete
  }

  // Find a user with the required role and optionally department
  const query = { role: stageConfig.role, isActive: true };
  
  const isDepartmentRole = ['class_advisor', 'hod'].includes(stageConfig.role);
  let student;
  if (stageConfig.department === 'student' || (isDepartmentRole && !stageConfig.department)) {
      student = await User.findById(request.student);
      if (!student) return null;
      query.department = student.department;
      if (stageConfig.role === 'class_advisor') {
        const unassigned = (field) => [{ [field]: { $exists: false } }, { [field]: null }, { [field]: '' }];
        query.$and = [
          { $or: [{ year: student.year }, ...unassigned('year')] },
          { $or: [{ section: student.section }, ...unassigned('section')] },
        ];
      }
  } else if (stageConfig.department) {
      query.department = stageConfig.department;
  } else if (stageConfig.role !== 'dean' && stageConfig.role !== 'super_admin' && stageConfig.role !== 'admin_staff') {
      // By default, match the student's department unless it's a higher level role that isn't dept specific
      student = await User.findById(request.student);
      if (!student) return null;
      query.department = student.department;
  }

  // Find first available approver matching criteria
  const approver = await User.findOne(query).sort('createdAt');
  return approver;
};

exports.advanceWorkflow = async (request, approverId, action, comments) => {
  request.history.push({
    action,
    performedBy: approverId,
    stage: request.currentStage,
    comments,
  });

  if (action === 'approve') {
    request.currentStage += 1;
  } else if (action === 'reject') {
    request.status = 'rejected';
    request.rejectionReason = comments;
    request.currentApprover = null;
  } else if (action === 'revision_requested') {
    request.status = 'revision_requested';
    request.currentApprover = null;
  }

  await request.save();
  return request;
};

exports.isWorkflowComplete = (request, documentType) => {
  const maxStage = Math.max(0, ...documentType.approvalChain.map((s) => s.stage));
  return request.currentStage > maxStage;
};
