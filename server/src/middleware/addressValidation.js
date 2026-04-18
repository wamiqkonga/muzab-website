const { isServiceable } = require('../services/pinCodeService');

const REQUIRED_FIELDS = ['name', 'line1', 'city', 'state', 'pinCode', 'phone'];
const PIN_REGEX = /^\d{6}$/;

/**
 * Validates a delivery address on the request body.
 *
 * Checks:
 *  1. All required fields are present and non-empty.
 *  2. pinCode is exactly 6 digits.
 *  3. pinCode is serviceable (queries PinCode collection).
 *
 * On failure returns the standard error envelope used across the API.
 * On success calls next().
 */
async function validateAddress(req, res, next) {
  const address = req.body.deliveryAddress || req.body;

  // 1. Required fields
  const missing = REQUIRED_FIELDS.filter(
    (f) => !address[f] || String(address[f]).trim() === ''
  );
  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Missing required address fields: ${missing.join(', ')}`,
        details: missing.map((f) => ({ field: f, message: `${f} is required` })),
      },
    });
  }

  // 2. PIN code format
  const pin = String(address.pinCode).trim();
  if (!PIN_REGEX.test(pin)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'PIN code must be exactly 6 digits',
        details: [{ field: 'pinCode', message: 'PIN code must be exactly 6 digits' }],
      },
    });
  }

  // 3. Serviceability
  try {
    const serviceable = await isServiceable(pin);
    if (!serviceable) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'UNSERVICEABLE_PIN',
          message: 'Delivery is not available to this PIN code',
          details: [{ field: 'pinCode', message: `PIN code ${pin} is outside the serviceable delivery area` }],
        },
      });
    }
  } catch (err) {
    return next(err);
  }

  next();
}

module.exports = validateAddress;
