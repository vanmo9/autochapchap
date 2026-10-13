const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  make: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
  year: { type: Number, required: true, min: 1990 },
  vehicleType: { type: String, enum: ['sedan', 'suv', 'hatchback', 'van', 'pickup'], required: true },
  fuelType: { type: String, enum: ['petrol', 'diesel', 'hybrid', 'electric'], required: true },
  seats: { type: Number, required: true, min: 1 },
  location: { type: String, required: true, trim: true },
  dailyPrice: { type: Number, required: true, min: 1 },
  description: { type: String, default: '' },
  photos: { type: [String], default: [] },
  listingStatus: { type: String, enum: ['active', 'paused', 'removed'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);