const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TokenBlacklist = require('../models/TokenBlacklist');

/**
 * Verifies the Bearer JWT from the Authorization header,
 * checks the jti against the token blacklist, and attaches
 * the full User document to req.user.
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token is required',
        details: [],
      },
    });
  }

  const token = authHeader.slice(7); // strip "Bearer "

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
        details: [],
      },
    });
  }

  // Check token blacklist (logout invalidation)
  if (payload.jti) {
    const blacklisted = await TokenBlacklist.findOne({ jti: payload.jti });
    if (blacklisted) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token has been invalidated',
          details: [],
        },
      });
    }
  }

  // Attach the full user document
  const user = await User.findById(payload.sub || payload.id).select('-passwordHash');
  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'User not found',
        details: [],
      },
    });
  }

  req.user = user;
  next();
}

module.exports = authMiddleware;
