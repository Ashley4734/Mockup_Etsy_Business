const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Google OAuth routes
router.get('/google', authController.initiateGoogleAuth);
router.get('/google/callback', authController.handleGoogleCallback);

// Check auth status
router.get('/status', authController.getAuthStatus);

// Logout
router.post('/logout', authController.logout);

module.exports = router;
