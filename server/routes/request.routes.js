const express = require('express');
const router = express.Router();
const {
  createRequest,
  getAvailableDocumentTypes,
  getMyRequests,
  getRequestById,
  getPendingApprovals,
  getRequestStats,
  getAllRequests
} = require('../controllers/request.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('student'), createRequest);
router.get('/document-types', authorize('student'), getAvailableDocumentTypes);
router.get('/my', authorize('student'), getMyRequests);
router.get('/pending', authorize('class_advisor', 'hod', 'dean', 'admin_staff', 'super_admin'), getPendingApprovals);
router.get('/stats', getRequestStats);
router.get('/all', authorize('admin_staff', 'super_admin'), getAllRequests);
router.get('/:id', getRequestById);

module.exports = router;
