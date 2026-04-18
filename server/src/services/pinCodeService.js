const PinCode = require('../models/PinCode');

/**
 * Look up a pin code document. Returns null if not found.
 */
async function _find(pin) {
  return PinCode.findOne({ pinCode: String(pin) });
}

/**
 * Returns true if the pin code exists and is marked serviceable.
 * @param {string} pin
 * @returns {Promise<boolean>}
 */
async function isServiceable(pin) {
  const doc = await _find(pin);
  return !!(doc && doc.isServiceable);
}

/**
 * Returns true if the pin code exists, is serviceable, and is COD-eligible.
 * @param {string} pin
 * @returns {Promise<boolean>}
 */
async function isCodEligible(pin) {
  const doc = await _find(pin);
  return !!(doc && doc.isServiceable && doc.codEligible);
}

/**
 * Returns the shipping fee for the pin code, or null if not found / not serviceable.
 * @param {string} pin
 * @returns {Promise<number|null>}
 */
async function getShippingFee(pin) {
  const doc = await _find(pin);
  if (!doc || !doc.isServiceable) return null;
  return doc.shippingFee;
}

module.exports = { isServiceable, isCodEligible, getShippingFee };
