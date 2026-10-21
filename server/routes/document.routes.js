const express = require('express');
const router = express.Router();
const { downloadDocument, verifyDocument } = require('../controllers/document.controller');
const { protect } = require('../middleware/auth');

router.get('/:requestId/download', protect, downloadDocument);
router.get('/verify/:uid', verifyDocument);

module.exports = router;
