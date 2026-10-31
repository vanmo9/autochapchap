const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Not logged in' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('role accountStatus');
    if (!user) return res.status(401).json({ message: 'Account no longer exists' });
    if (user.accountStatus === 'suspended')
      return res.status(403).json({ message: 'Your account has been suspended' });
    req.user = { id: String(user._id), role: user.role };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

const allowRoles = (...roles) => (req, res, next) =>
  roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ message: 'Not allowed for your role' });

module.exports = { protect, allowRoles };