import Tree from '../models/Tree.js';
import User from '../models/User.js';

// @desc    Get user family tree
// @route   GET /api/tree
export const getTree = async (req, res) => {
  try {
    let tree = await Tree.findOne({ user: req.user._id });

    if (!tree) {
      // Create empty/starter tree if none exists yet
      tree = await Tree.create({
        user: req.user._id,
        name: req.user.treeName || 'My Family Heritage Tree',
        members: [
          {
            id: 'me',
            name: req.user.name,
            relationToMe: 'Me (Progenitor)',
            gender: req.user.gender || 'male',
            birthYear: req.user.birthYear || '1998',
            photo: req.user.photo || '',
            generation: 0,
            fatherId: null,
            motherId: null,
            spouseId: null,
            childrenIds: [],
            siblingIds: []
          }
        ]
      });
    }

    res.json({
      treeName: tree.name,
      members: tree.members
    });
  } catch (error) {
    console.error('getTree error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch family tree' });
  }
};

// @desc    Save/Update user family tree
// @route   PUT /api/tree
export const saveTree = async (req, res) => {
  try {
    const { members, treeName } = req.body;

    if (!Array.isArray(members)) {
      return res.status(400).json({ message: 'Members array is required' });
    }

    const updateData = { members };
    if (treeName && treeName.trim()) {
      updateData.name = treeName.trim();
    }

    const tree = await Tree.findOneAndUpdate(
      { user: req.user._id },
      { $set: updateData },
      { new: true, upsert: true }
    );

    if (treeName && treeName.trim()) {
      await User.findByIdAndUpdate(req.user._id, { treeName: treeName.trim() });
    }

    res.json({
      message: 'Family tree saved successfully to MongoDB',
      treeName: tree.name,
      count: tree.members.length
    });
  } catch (error) {
    console.error('saveTree error:', error);
    res.status(500).json({ message: error.message || 'Failed to save family tree' });
  }
};

// @desc    Update tree name
// @route   PATCH /api/tree/name
export const updateTreeName = async (req, res) => {
  try {
    const { treeName } = req.body;

    if (!treeName || !treeName.trim()) {
      return res.status(400).json({ message: 'Tree name cannot be empty' });
    }

    const trimmed = treeName.trim();

    await Tree.findOneAndUpdate({ user: req.user._id }, { $set: { name: trimmed } }, { upsert: true });
    await User.findByIdAndUpdate(req.user._id, { treeName: trimmed });

    res.json({
      message: 'Tree name updated successfully',
      treeName: trimmed
    });
  } catch (error) {
    console.error('updateTreeName error:', error);
    res.status(500).json({ message: error.message || 'Failed to update tree name' });
  }
};
