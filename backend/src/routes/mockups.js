const express = require('express');
const router = express.Router();
const mockupsController = require('../controllers/mockupsController');
const { requireGoogleAuth } = require('../middleware/auth');

// All routes require Google authentication
router.use(requireGoogleAuth);

// Get mockup images from Google Drive
router.get('/', mockupsController.getMockups);

// Get specific mockup metadata
router.get('/:fileId', mockupsController.getMockupById);

module.exports = router;
