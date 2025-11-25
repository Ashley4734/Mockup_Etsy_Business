const express = require('express');
const router = express.Router();
const listingsController = require('../controllers/listingsController');
const { requireGoogleAuth } = require('../middleware/auth');

// Generate listing content from mockup (requires Google auth for image access)
router.post('/generate', requireGoogleAuth, listingsController.generateListingContent);

// Create listing with PDF download (requires Google auth)
router.post('/create', requireGoogleAuth, listingsController.createListing);

// Get user's created listings
router.get('/', listingsController.getUserListings);

// Get specific listing
router.get('/:id', listingsController.getListingById);

// Download PDF for a listing
router.get('/:id/download-pdf', listingsController.downloadPDF);

module.exports = router;
