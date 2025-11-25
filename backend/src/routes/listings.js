const express = require('express');
const router = express.Router();
const listingsController = require('../controllers/listingsController');
const { requireGoogleAuth, requireEtsyAuth } = require('../middleware/auth');

// Generate listing content from mockup (requires Google auth for image access)
router.post('/generate', requireGoogleAuth, listingsController.generateListingContent);

// Create Etsy listing (requires both Google and Etsy auth)
router.post('/create', requireGoogleAuth, requireEtsyAuth, listingsController.createEtsyListing);

// Get user's created listings
router.get('/', listingsController.getUserListings);

// Get specific listing
router.get('/:id', listingsController.getListingById);

module.exports = router;
