const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const auth = require('../middleware/auth');

// @route   GET api/clients
// @desc    Get all clients for a counselor
// @access  Private
router.get('/', auth, clientController.getClients);

// @route   GET api/clients/:id
// @desc    Get client by ID
// @access  Private
router.get('/:id', auth, clientController.getClientById);

// @route   POST api/clients
// @desc    Create a client
// @access  Private
router.post('/', auth, clientController.createClient);

// @route   PUT api/clients/:id
// @desc    Update client
// @access  Private
router.put('/:id', auth, clientController.updateClient);

// @route   PATCH api/clients/:id/notes
// @desc    Update client notes
// @access  Private
router.patch('/:id/notes', auth, clientController.updateClientNotes);

// @route   DELETE api/clients/:id
// @desc    Delete client
// @access  Private
router.delete('/:id', auth, clientController.deleteClient);

module.exports = router;