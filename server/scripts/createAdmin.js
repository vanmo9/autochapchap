require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const [email, password, fullName = 'System Admin'] = process.argv.slice(2);

async function main() {
  if (!email || !password) {
    console.log('Usage: node scripts/createAdmin.js <email> <password> [full name]');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const passwordHash = await bcrypt.hash(password, 10);
  await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { fullName, email: email.toLowerCase(), phone: '0700000000', passwordHash, role: 'admin', verificationStatus: 'verified' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`Admin ready: ${email}`);
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err.message); process.exit(1); });