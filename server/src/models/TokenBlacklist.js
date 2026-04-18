const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema({
  jti: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});

// TTL index — MongoDB auto-deletes documents once expiresAt is reached
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);
