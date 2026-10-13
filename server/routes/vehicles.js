const express = require('express');
const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Host adds a car
router.post('/', protect, allowRoles('host'), async (req, res) => {
  try {
    const { make, model, year, vehicleType, fuelType, seats, location, dailyPrice, description, photos } = req.body;
    const vehicle = await Vehicle.create({
      hostId: req.user.id, make, model, year, vehicleType, fuelType,
      seats, location, dailyPrice, description, photos
    });
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(400).json({ message: 'Could not create listing', error: err.message });
  }
});

// Host sees their own cars
router.get('/mine', protect, allowRoles('host'), async (req, res) => {
  const vehicles = await Vehicle.find({ hostId: req.user.id, listingStatus: { $ne: 'removed' } });
  res.json(vehicles);
});

// Anyone can search active cars
router.get('/', async (req, res) => {
  const { vehicleType, fuelType, location, minPrice, maxPrice } = req.query;
  const filter = { listingStatus: 'active' };
  if (vehicleType) filter.vehicleType = vehicleType;
  if (fuelType) filter.fuelType = fuelType;
  if (location) filter.location = new RegExp(escapeRegex(location), 'i');
  if (minPrice || maxPrice) {
    filter.dailyPrice = {};
    if (minPrice) filter.dailyPrice.$gte = Number(minPrice);
    if (maxPrice) filter.dailyPrice.$lte = Number(maxPrice);
  }
  const vehicles = await Vehicle.find(filter)
    .populate('hostId', 'fullName verificationStatus')
    .sort({ createdAt: -1 });
  res.json(vehicles);
});

// One car's details
router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: 'Invalid car id' });
  const vehicle = await Vehicle.findById(req.params.id).populate('hostId', 'fullName verificationStatus');
  if (!vehicle || vehicle.listingStatus === 'removed')
    return res.status(404).json({ message: 'Car not found' });
  res.json(vehicle);
});

// Host updates their own car
router.put('/:id', protect, allowRoles('host'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: 'Invalid car id' });
  const vehicle = await Vehicle.findOne({ _id: req.params.id, hostId: req.user.id });
  if (!vehicle) return res.status(404).json({ message: 'Car not found' });
  const allowed = ['dailyPrice', 'description', 'location', 'photos', 'listingStatus'];
  allowed.forEach((k) => { if (req.body[k] !== undefined) vehicle[k] = req.body[k]; });
  await vehicle.save();
  res.json(vehicle);
});

module.exports = router;