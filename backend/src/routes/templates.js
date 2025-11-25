const express = require('express');
const router = express.Router();
const templatesController = require('../controllers/templatesController');
const { requireAuth } = require('../middleware/auth');

// All routes require authentication
router.use(requireAuth);

// Get all templates for user
router.get('/', templatesController.getTemplates);

// Create new template
router.post('/', templatesController.createTemplate);

// Update template
router.put('/:id', templatesController.updateTemplate);

// Delete template
router.delete('/:id', templatesController.deleteTemplate);

module.exports = router;
