const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for auth endpoints.
 * Allows 15 requests per 15-minute window per IP.
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests, please try again later',
      details: [],
    },
  },
});

/**
 * Rate limiter for checkout endpoints.
 * Allows 20 requests per 10-minute window per IP.
 */
const checkoutRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many checkout attempts, please try again later',
      details: [],
    },
  },
});

/**
 * General API rate limiter.
 * Allows 200 requests per minute per IP.
 */
const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests, please slow down',
      details: [],
    },
  },
});

module.exports = { authRateLimiter, checkoutRateLimiter, generalRateLimiter };
