const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String, // Optional for Google OAuth users
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  weak_subjects: [{
    type: String,
    ref: 'Subject'
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
