const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TokenBlacklist = require('../models/TokenBlacklist');

/**
 * Optional authentication middleware.
 * If a valid Bearer JWT is present, attaches req.user (same as authMiddleware).
 * If no token is present (or token is invalid), continues without setting req.user.
 * Used for cart routes that support both authenticated and guest access.
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // no token — guest access
  }

  const token = authHeader.slice(7);

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (_) {
    return next(); // invalid/expired token — treat as guest
  }

  // Check blacklist
  if (payload.jti) {
    const blacklisted = await TokenBlacklist.findOne({ jti: payload.jti });
    if (blacklisted) {
      return next(); // blacklisted token — treat as guest
    }
  }

  const user = await User.findById(payload.sub || payload.id).select('-passwordHash');
  if (user) {
    req.user = user;
  }

  next();
}

module.exports = optionalAuth;
