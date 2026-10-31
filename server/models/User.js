const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['customer', 'host', 'admin'], default: 'customer' },
  verificationStatus: {
    type: String,
    enum: ['not_uploaded', 'pending', 'verified', 'rejected'],
    default: 'not_uploaded'
  },
  accountStatus: { type: String, enum: ['active', 'suspended'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);