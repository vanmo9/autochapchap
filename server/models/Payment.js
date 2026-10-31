const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0 },
  method: { type: String, enum: ['mpesa_simulated'], default: 'mpesa_simulated' },
  phoneLast4: { type: String, required: true },
  reference: { type: String, required: true, unique: true },
  status: { type: String, enum: ['paid', 'refunded'], default: 'paid' },
  paidAt: { type: Date, default: Date.now },
  refundedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);