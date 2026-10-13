const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const makeToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

const publicUser = (u) => ({
  id: u._id, fullName: u.fullName, email: u.email, phone: u.phone,
  role: u.role, verificationStatus: u.verificationStatus
});

router.post('/register', async (req, res) => {
  try {
    const { fullName, phone, password, role } = req.body;
    const email = (req.body.email || '').toLowerCase().trim();
    if (!fullName || !email || !phone || !password)
      return res.status(400).json({ message: 'All fields are required' });
    if (password.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    if (await User.findOne({ email }))
      return res.status(409).json({ message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const safeRole = role === 'host' ? 'host' : 'customer';
    const user = await User.create({ fullName, email, phone, passwordHash, role: safeRole });

    res.status(201).json({ token: makeToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    const { password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ message: 'Invalid email or password' });

    res.json({ token: makeToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  res.json(user);
});

module.exports = router;