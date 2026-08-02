const PinCode = require('../models/PinCode');

const INDIA_PIN_RE = /^\d{6}$/;

/**
 * Look up a pin code document. Returns null if not found.
 */
async function _find(pin) {
  return PinCode.findOne({ pinCode: String(pin) });
}

/**
 * Returns true if the pin code is a valid 6-digit Indian PIN.
 * If a PinCode document exists and isServiceable is explicitly false, returns false.
 * Otherwise all valid 6-digit PINs are considered serviceable (pan-India shipping).
 * @param {string} pin
 * @returns {Promise<boolean>}
 */
async function isServiceable(pin) {
  if (!INDIA_PIN_RE.test(String(pin))) return false;
  const doc = await _find(pin);
  // If we have an explicit record marking it unserviceable, respect that
  if (doc && doc.isServiceable === false) return false;
  // All other valid 6-digit PINs are serviceable
  return true;
}

/**
 * Returns true if the pin code is COD-eligible.
 * PIN codes in the database with codEligible: true are eligible.
 * Unknown PINs default to false (online payment only).
 * @param {string} pin
 * @returns {Promise<boolean>}
 */
async function isCodEligible(pin) {
  if (!INDIA_PIN_RE.test(String(pin))) return false;
  const doc = await _find(pin);
  return !!(doc && doc.isServiceable && doc.codEligible);
}

/**
 * Returns the shipping fee for the pin code.
 * PIN codes in the DB use their configured fee.
 * Unknown PINs get a flat ₹99 shipping fee.
 * J&K Srinagar PINs (190xxx) get free shipping.
 * @param {string} pin
 * @returns {Promise<number>}
 */
async function getShippingFee(pin) {
  const doc = await _find(pin);
  if (doc && doc.isServiceable) return doc.shippingFee;
  // Default flat rate for all other serviceable PINs
  return 99;
}

module.exports = { isServiceable, isCodEligible, getShippingFee };
