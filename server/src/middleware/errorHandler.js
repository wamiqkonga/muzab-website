// HTTP status map for known error codes
const STATUS_MAP = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNSERVICEABLE_PIN: 422,
  OUT_OF_STOCK: 422,
  PAYMENT_FAILED: 422,
  CANCELLATION_DENIED: 422,
  PAYMENT_PENDING: 202,
  INTERNAL_ERROR: 500,
};

/**
 * Centralised Express error handler.
 * Attach errors to next(err) with optional .code, .message, .details, .status.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const code = err.code || 'INTERNAL_ERROR';
  const status = err.status || STATUS_MAP[code] || 500;
  const message = err.message || 'An unexpected error occurred';
  const details = err.details || [];

  // Don't leak stack traces in production
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack);
  }

  res.status(status).json({
    success: false,
    error: { code, message, details },
  });
}

module.exports = errorHandler;
