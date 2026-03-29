const Client = require('../models/Client');

// Get all clients for a counselor
exports.getClients = async (req, res) => {
  try {
    const clients = await Client.find({ counselorId: req.user.id })
                               .sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get single client by ID
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findOne({ 
      _id: req.params.id,
      counselorId: req.user.id 
    });
    
    if (!client) {
      return res.status(404).json({ msg: 'Client not found' });
    }
    
    res.json(client);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Client not found' });
    }
    res.status(500).send('Server Error');
  }
};

// Create a new client
exports.createClient = async (req, res) => {
  try {
    const {
      name,
      age,
      gender,
      education,
      maritalStatus,
      profession,
      issues,
      symptoms,
      wantsGrowth,
      swot
    } = req.body;

    const newClient = new Client({
      counselorId: req.user.id,
      name,
      age,
      gender,
      education,
      maritalStatus,
      profession,
      issues,
      symptoms,
      wantsGrowth,
      swot
    });

    const client = await newClient.save();
    res.json(client);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Update client
exports.updateClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, counselorId: req.user.id },
      { $set: req.body },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ msg: 'Client not found' });
    }

    res.json(client);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Update client notes
exports.updateClientNotes = async (req, res) => {
  try {
    const { notes } = req.body;
    
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, counselorId: req.user.id },
      { $set: { notes } },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ msg: 'Client not found' });
    }

    res.json(client);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Delete client
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({ 
      _id: req.params.id,
      counselorId: req.user.id 
    });

    if (!client) {
      return res.status(404).json({ msg: 'Client not found' });
    }

    res.json({ msg: 'Client removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};