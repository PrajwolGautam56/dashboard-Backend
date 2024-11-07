const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { JWT_SECRET } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');

// Debug log to verify imports
console.log('Models loaded:', {
  User: !!User,
  Profile: !!Profile
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send response
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Error registering user', 
      error: error.message 
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User does not exist' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Verify token
router.get('/verify-token', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ valid: false });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ valid: false });
    }

    res.json({
      valid: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

// Google Sign In
router.post('/google', async (req, res) => {
  try {
    const { token, user: googleUser } = req.body;

    if (!token || !googleUser) {
      return res.status(400).json({ message: 'Invalid Google token or user data' });
    }

    // Check if user exists
    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        name: googleUser.name,
        email: googleUser.email,
        profilePic: googleUser.picture,
        googleId: googleUser.sub
      });
      
      try {
        await user.save();
      } catch (saveError) {
        console.error('Error saving user:', saveError);
        return res.status(500).json({ 
          message: 'Error creating user account',
          error: saveError.message 
        });
      }
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic || googleUser.picture
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ 
      message: 'Error processing Google sign in', 
      error: error.message 
    });
  }
});

// Profile Login
router.post('/profile-login', async (req, res) => {
  try {
    console.log('Profile login request received:', req.body);
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Debug log to verify Profile model
    console.log('Looking for profile with username:', username);
    
    const profile = await Profile.findOne({ username });
    console.log('Profile found:', profile ? 'Yes' : 'No');

    if (!profile) {
      return res.status(400).json({ message: 'Profile not found' });
    }

    try {
      // Validate password
      const isMatch = await bcrypt.compare(password, profile.password);
      console.log('Password match:', isMatch);

      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
    } catch (bcryptError) {
      console.error('Password comparison error:', bcryptError);
      return res.status(500).json({ message: 'Error validating credentials' });
    }

    try {
      // Get user details
      const user = await User.findById(profile.userId).exec();
      console.log('Associated user found:', user ? 'Yes' : 'No');

      if (!user) {
        return res.status(400).json({ message: 'Associated user not found' });
      }

      // Generate JWT
      const token = jwt.sign(
        { 
          id: profile.userId,
          profileId: profile._id,
          email: profile.email 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('Token generated successfully');

      // Send response
      return res.json({
        token,
        user: {
          id: profile.userId,
          name: profile.name,
          email: profile.email,
          profilePic: profile.profilePic,
          username: profile.username
        }
      });
    } catch (userError) {
      console.error('User lookup or token generation error:', userError);
      return res.status(500).json({ message: 'Error processing user details' });
    }
  } catch (error) {
    console.error('Profile login error:', error);
    return res.status(500).json({ 
      message: 'Error logging in with profile',
      error: error.message
    });
  }
});

module.exports = router; 