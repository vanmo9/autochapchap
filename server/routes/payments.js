const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();

// Customer pays for a confirmed booking (simulated, no real money)
router.post('/', protect, allowRoles('customer'), async (req, res) => {
  try {
    const { bookingId, phone } = req.body;
    if (!mongoose.isValidObjectId(bookingId))
      return res.status(400).json({ message: 'Invalid booking id' });

    const digits = String(phone || '').replace(/[\s-]/g, '');
    if (!/^(?:\+?254|0)[17]\d{8}$/.test(digits))
      return res.status(400).json({ message: 'Enter a valid Kenyan phone number, e.g. 0712345678' });

    const booking = await Booking.findOne({ _id: bookingId, customerId: req.user.id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'confirmed')
      return res.status(409).json({ message: `Only confirmed bookings can be paid (this one is ${booking.status})` });

    const payment = await Payment.create({
      bookingId: booking._id,
      customerId: req.user.id,
      hostId: booking.hostId,
      amount: booking.totalPrice,
      phoneLast4: digits.slice(-4),
      reference: 'ACC' + crypto.randomBytes(4).toString('hex').toUpperCase()
    });
    res.status(201).json(payment);
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: 'This booking is already paid' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Customer sees their own payments
router.get('/mine', protect, allowRoles('customer'), async (req, res) => {
  res.json(await Payment.find({ customerId: req.user.id }));
});

// Host sees payments for their cars
router.get('/host', protect, allowRoles('host'), async (req, res) => {
  res.json(await Payment.find({ hostId: req.user.id }));
});

module.exports = router;