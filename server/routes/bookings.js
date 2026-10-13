const express = require('express');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();
const DAY_MS = 24 * 60 * 60 * 1000;

// true if a CONFIRMED booking already covers any part of these dates
const hasOverlap = (vehicleId, start, end, excludeId) =>
  Booking.exists({
    vehicleId,
    status: 'confirmed',
    startDate: { $lt: end },
    endDate: { $gt: start },
    ...(excludeId ? { _id: { $ne: excludeId } } : {})
  });

// Customer requests a booking
router.post('/', protect, allowRoles('customer'), async (req, res) => {
  try {
    const { vehicleId, startDate, endDate } = req.body;
    if (!mongoose.isValidObjectId(vehicleId))
      return res.status(400).json({ message: 'Invalid car id' });

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end))
      return res.status(400).json({ message: 'Valid start and end dates are required' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today)
      return res.status(400).json({ message: 'Start date cannot be in the past' });
    if (end <= start)
      return res.status(400).json({ message: 'Return date must be after pick-up date' });

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle || vehicle.listingStatus !== 'active')
      return res.status(404).json({ message: 'Car not available' });

    if (await hasOverlap(vehicle._id, start, end))
      return res.status(409).json({ message: 'Car is not available on those dates' });

    const days = Math.ceil((end - start) / DAY_MS);
    const booking = await Booking.create({
      customerId: req.user.id,
      vehicleId: vehicle._id,
      hostId: vehicle.hostId,
      startDate: start,
      endDate: end,
      days,
      totalPrice: days * vehicle.dailyPrice
    });
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Customer sees their own bookings
router.get('/mine', protect, allowRoles('customer'), async (req, res) => {
  const bookings = await Booking.find({ customerId: req.user.id })
    .populate('vehicleId', 'make model location dailyPrice')
    .populate('hostId', 'fullName verificationStatus')
    .sort({ createdAt: -1 });
  res.json(bookings);
});

// Host sees requests for their cars
router.get('/requests', protect, allowRoles('host'), async (req, res) => {
  const bookings = await Booking.find({ hostId: req.user.id })
    .populate('vehicleId', 'make model location dailyPrice')
    .populate('customerId', 'fullName phone verificationStatus')
    .sort({ createdAt: -1 });
  res.json(bookings);
});

// Host confirms or declines a request
router.patch('/:id/respond', protect, allowRoles('host'), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: 'Invalid booking id' });

    const { action } = req.body;
    if (!['confirm', 'decline'].includes(action))
      return res.status(400).json({ message: 'Action must be confirm or decline' });

    const booking = await Booking.findOne({ _id: req.params.id, hostId: req.user.id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'requested')
      return res.status(409).json({ message: `Booking is already ${booking.status}` });

    if (action === 'confirm') {
      if (await hasOverlap(booking.vehicleId, booking.startDate, booking.endDate, booking._id))
        return res.status(409).json({ message: 'Another confirmed booking overlaps these dates' });
      booking.status = 'confirmed';
    } else {
      booking.status = 'declined';
    }
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;