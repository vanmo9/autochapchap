const express = require('express');
const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();
router.use(protect, allowRoles('admin')); // every route below is Admin-only

// All listings, including paused and removed ones
router.get('/vehicles', async (req, res) => {
  const vehicles = await Vehicle.find()
    .populate('hostId', 'fullName email accountStatus')
    .sort({ createdAt: -1 });
  res.json(vehicles);
});

// Remove or restore a listing
router.patch('/vehicles/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: 'Invalid car id' });
    const { action } = req.body;
    if (!['remove', 'restore'].includes(action))
      return res.status(400).json({ message: 'Action must be remove or restore' });

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Car not found' });

    if (action === 'remove') {
      if (vehicle.listingStatus === 'removed')
        return res.status(409).json({ message: 'This listing is already removed' });
      vehicle.listingStatus = 'removed';
      await vehicle.save();

      // cancel open future bookings and refund their payments
      const open = await Booking.find({
        vehicleId: vehicle._id,
        status: { $in: ['requested', 'confirmed'] },
        endDate: { $gt: new Date() }
      }).select('_id');
      const ids = open.map((b) => b._id);
      if (ids.length > 0) {
        await Booking.updateMany({ _id: { $in: ids } }, { status: 'cancelled' });
        await Payment.updateMany(
          { bookingId: { $in: ids }, status: 'paid' },
          { status: 'refunded', refundedAt: new Date() }
        );
      }
      return res.json({ vehicle, cancelledBookings: ids.length });
    }

    if (vehicle.listingStatus !== 'removed')
      return res.status(409).json({ message: 'Only removed listings can be restored' });
    vehicle.listingStatus = 'active';
    await vehicle.save();
    res.json({ vehicle, cancelledBookings: 0 });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// All customers and hosts
router.get('/users', async (req, res) => {
  const users = await User.find({ role: { $ne: 'admin' } })
    .select('-passwordHash')
    .sort({ createdAt: -1 });
  res.json(users);
});

// Suspend or reactivate a user
router.patch('/users/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: 'Invalid user id' });
    const { action } = req.body;
    if (!['suspend', 'reactivate'].includes(action))
      return res.status(400).json({ message: 'Action must be suspend or reactivate' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin')
      return res.status(403).json({ message: 'Admin accounts cannot be suspended' });

    user.accountStatus = action === 'suspend' ? 'suspended' : 'active';
    await user.save();
    res.json({ id: user._id, accountStatus: user.accountStatus });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;