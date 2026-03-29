const Resource = require('../models/Resource');
const User = require('../models/User');

// POST /api/resources
const uploadResource = async (req, res) => {
  try {
    const { title, description, fileUrl, type, sharedWith } = req.body;

    const user = await User.findOne({ uid: req.user.uid });
    if (!user || user.role !== 'counselor') {
      return res.status(403).json({ message: 'Only counselors can upload resources' });
    }

    const resource = new Resource({
      title,
      description,
      fileUrl,
      type,
      uploadedBy: user._id,
      sharedWith
    });

    await resource.save();
    res.status(201).json(resource);
  } catch (err) {
    res.status(500).json({ message: 'Error uploading resource', error: err.message });
  }
};

// GET /api/resources
const getResourcesForUser = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resources = await Resource.find({
      $or: [
        { uploadedBy: user._id },
        { sharedWith: user._id }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json(resources);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving resources', error: err.message });
  }
};

// GET /api/resources/:id
const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    res.status(200).json(resource);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving resource', error: err.message });
  }
};

// DELETE /api/resources/:id
const deleteResource = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    const resource = await Resource.findById(req.params.id);

    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    if (resource.uploadedBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'You are not the uploader of this resource' });
    }

    await resource.deleteOne();
    res.status(200).json({ message: 'Resource deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting resource', error: err.message });
  }
};

module.exports = {
  uploadResource,
  getResourcesForUser,
  getResourceById,
  deleteResource
};
