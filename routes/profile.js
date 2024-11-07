const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { auth } = require('../middleware/auth');
const Profile = require('../models/Profile');
const User = require('../models/User');

// Create new profile
router.post('/create', auth, async (req, res) => {
  try {
    console.log('Received profile creation request:', req.body); // Debug log
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    // Get user details from auth middleware
    const userId = req.user.id;
    console.log('User ID from token:', userId); // Debug log

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if username exists
    const existingProfile = await Profile.findOne({ username });
    if (existingProfile) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new profile
    const profile = new Profile({
      userId: user._id,
      username,
      password: hashedPassword,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic || ''
    });

    await profile.save();
    console.log('Profile created:', profile._id); // Debug log

    res.status(201).json({
      message: 'Profile created successfully',
      profile: {
        username: profile.username,
        name: profile.name,
        email: profile.email
      }
    });
  } catch (error) {
    console.error('Profile creation error:', error);
    res.status(500).json({ 
      message: 'Error creating profile', 
      error: error.message 
    });
  }
});

// Get user's profiles
router.get('/my-profiles', auth, async (req, res) => {
  try {
    const profiles = await Profile.find({ userId: req.user.id })
      .select('-password')
      .sort('-createdAt');
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ message: 'Error fetching profiles' });
  }
});

module.exports = router; 