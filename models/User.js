const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password is required only if not a Google user
    }
  },
  profilePic: {
    type: String,
    default: ''
  },
  googleId: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema); 