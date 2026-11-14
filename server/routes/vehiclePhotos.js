const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const Vehicle = require('../models/Vehicle');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();
const PHOTO_DIR = path.join(__dirname, '..', 'uploads', 'vehicles');
fs.mkdirSync(PHOTO_DIR, { recursive: true });

const MAX_PHOTOS = 5;
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const upload = multer({
  storage: multer.diskStorage({
    destination: PHOTO_DIR,
    filename: (req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex') + EXT[file.mimetype])
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: MAX_PHOTOS },
  fileFilter: (req, file, cb) =>
    EXT[file.mimetype] ? cb(null, true) : cb(new Error('Only JPG, PNG or WEBP images are allowed'))
});

const removeFile = (name) => fs.unlink(path.join(PHOTO_DIR, name), () => {});

// A host adds photos to one of their own cars
router.post('/:id/photos', protect, allowRoles('host'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: 'Invalid car id' });

  const vehicle = await Vehicle.findOne({ _id: req.params.id, hostId: req.user.id });
  if (!vehicle) return res.status(404).json({ message: 'Car not found' });

  upload.array('photos', MAX_PHOTOS)(req, res, async (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? 'Each photo must be 5 MB or smaller'
        : err.code === 'LIMIT_UNEXPECTED_FILE' ? `You can upload up to ${MAX_PHOTOS} photos`
        : err.message;
      return res.status(400).json({ message });
    }
    try {
      if (!req.files || req.files.length === 0)
        return res.status(400).json({ message: 'Please choose at least one photo' });

      if (vehicle.photos.length + req.files.length > MAX_PHOTOS) {
        req.files.forEach((f) => removeFile(f.filename));
        return res.status(400).json({ message: `A car can have at most ${MAX_PHOTOS} photos` });
      }

      vehicle.photos.push(...req.files.map((f) => `/uploads/vehicles/${f.filename}`));
      await vehicle.save();
      res.json(vehicle);
    } catch (e) {
      res.status(500).json({ message: 'Server error', error: e.message });
    }
  });
});

module.exports = router;