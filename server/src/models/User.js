const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema(
  {
    label: { type: String },       // "Home", "Work"
    line1: { type: String },
    line2: { type: String },
    city: { type: String },
    state: { type: String },
    pinCode: { type: String },
    phone: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: null }, // null for OAuth-only users
    phone: { type: String, trim: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    googleId: { type: String, default: null },     // OAuth sub
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null },
    passwordResetToken: { type: String, default: null },
    passwordResetExpiry: { type: Date, default: null },
    addresses: { type: [addressSchema], default: [] },
  },
  { timestamps: true }
);

// Pre-save hook: only hash passwordHash when it has been modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method: compare a plain-text password against the stored hash
userSchema.methods.comparePassword = async function (plainPassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plainPassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
