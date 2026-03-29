const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');

// Upload a new resource (counselors only)
router.post('/', resourceController.uploadResource);

// Get all resources shared with the logged-in user
router.get('/', resourceController.getResourcesForUser);

// Optional: Get a specific resource
router.get('/:id', resourceController.getResourceById);

// Optional: Delete a resource (only by counselor who uploaded it)
router.delete('/:id', resourceController.deleteResource);

module.exports = router;
