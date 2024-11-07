const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  profilePic: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Debug log to verify model creation
console.log('Creating Profile model');

const Profile = mongoose.model('Profile', profileSchema);

// Debug log to verify model export
console.log('Profile model created successfully');

module.exports = Profile; 