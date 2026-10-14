import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Tree from '../models/Tree.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'family_tree_jwt_secret', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, gender = 'male', birthYear = '', treeName = '', photo = '' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const assignedTreeName = treeName?.trim() || `${name.trim()}'s Family Tree`;

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      gender,
      birthYear,
      treeName: assignedTreeName,
      photo: photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      authProvider: 'local'
    });

    // Create default root "me" node in Tree collection
    const starterMember = {
      id: 'me',
      name: user.name,
      relationToMe: 'Me (Progenitor)',
      gender: user.gender,
      birthYear: user.birthYear || '1998',
      photo: user.photo,
      generation: 0,
      fatherId: null,
      motherId: null,
      spouseId: null,
      childrenIds: [],
      siblingIds: []
    };

    await Tree.create({
      user: user._id,
      name: assignedTreeName,
      members: [starterMember]
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        gender: user.gender,
        photo: user.photo,
        birthYear: user.birthYear,
        treeName: user.treeName,
        authProvider: user.authProvider
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        gender: user.gender,
        photo: user.photo,
        birthYear: user.birthYear,
        treeName: user.treeName,
        authProvider: user.authProvider
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server error during login' });
  }
};

// @desc    Google OAuth Login / Register
// @route   POST /api/auth/google
export const googleAuth = async (req, res) => {
  try {
    const { email, name, photo, googleId } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required for Google login' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // Update googleId and photo if missing
      user.authProvider = 'google';
      if (googleId) user.googleId = googleId;
      if (photo && (!user.photo || user.photo.includes('unsplash'))) {
        user.photo = photo;
      }
      await user.save();
    } else {
      // Create new user
      const treeName = `${(name || email.split('@')[0]).trim()}'s Family Tree`;
      user = await User.create({
        name: name?.trim() || email.split('@')[0],
        email: normalizedEmail,
        googleId: googleId || null,
        photo: photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
        gender: 'other',
        birthYear: '1998',
        treeName,
        authProvider: 'google'
      });

      // Initialize starter tree
      const starterMember = {
        id: 'me',
        name: user.name,
        relationToMe: 'Me (Progenitor)',
        gender: user.gender,
        birthYear: user.birthYear,
        photo: user.photo,
        generation: 0,
        fatherId: null,
        motherId: null,
        spouseId: null,
        childrenIds: [],
        siblingIds: []
      };

      await Tree.create({
        user: user._id,
        name: treeName,
        members: [starterMember]
      });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        gender: user.gender,
        photo: user.photo,
        birthYear: user.birthYear,
        treeName: user.treeName,
        authProvider: user.authProvider
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: error.message || 'Server error during Google auth' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        gender: user.gender,
        photo: user.photo,
        birthYear: user.birthYear,
        treeName: user.treeName,
        authProvider: user.authProvider
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};
