const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for auth endpoints.
 * Allows 15 requests per 15-minute window per IP.
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,  // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Too many requests, please try again later',
      details: [],
    },
  },
});

module.exports = { authRateLimiter };
