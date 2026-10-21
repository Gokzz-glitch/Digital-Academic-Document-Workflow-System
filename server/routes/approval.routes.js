const express = require('express');
const router = express.Router();
const {
  approveRequest,
  rejectRequest,
  requestRevision,
  resubmitRequest
} = require('../controllers/approval.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.put('/:requestId/approve', authorize('class_advisor', 'hod', 'dean', 'admin_staff', 'super_admin'), approveRequest);
router.put('/:requestId/reject', authorize('class_advisor', 'hod', 'dean', 'admin_staff', 'super_admin'), rejectRequest);
router.put('/:requestId/revision', authorize('class_advisor', 'hod', 'dean', 'admin_staff', 'super_admin'), requestRevision);
router.put('/:requestId/resubmit', authorize('student'), resubmitRequest);

module.exports = router;
