const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  createDocumentType,
  updateDocumentType,
  getDocumentTypes,
  getDocumentTypeById,
  toggleDocumentTypeStatus,
  getDashboardStats
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin_staff', 'super_admin'));

// User Routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.put('/users/:id/toggle-status', toggleUserStatus);

// Document Type Routes
router.get('/document-types', getDocumentTypes);
router.get('/document-types/:id', getDocumentTypeById);
router.post('/document-types', createDocumentType);
router.put('/document-types/:id', updateDocumentType);
router.put('/document-types/:id/toggle-status', toggleDocumentTypeStatus);

// Dashboard
router.get('/dashboard-stats', getDashboardStats);

module.exports = router;
