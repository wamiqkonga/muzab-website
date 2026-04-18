/**
 * One-time script to create an admin user.
 * Usage: node src/scripts/createAdmin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN = {
  name: 'Muzab Admin',
  email: 'admin@muzab.com',
  passwordHash: 'Admin@1234',   // change this after first login
  phone: '9086660267',
  role: 'admin',
  isEmailVerified: true,
};

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email: ADMIN.email });
  if (existing) {
    console.log(`Admin already exists: ${ADMIN.email}`);
    process.exit(0);
  }

  const user = new User(ADMIN);
  await user.save();           // pre-save hook hashes the password
  console.log(`✅ Admin created — email: ${ADMIN.email}  password: Admin@1234`);
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
