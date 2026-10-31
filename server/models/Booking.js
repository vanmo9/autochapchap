const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  days: { type: Number, required: true, min: 1 },
  totalPrice: { type: Number, required: true, min: 0 },
  respondedAt: { type: Date },
  status: {
    type: String,
    enum: ['requested', 'confirmed', 'declined', 'cancelled', 'completed'],
    default: 'requested'
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);