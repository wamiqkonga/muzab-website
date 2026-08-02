const express = require('express');
const optionalAuth = require('../middleware/optionalAuth');
const authMiddleware = require('../middleware/authMiddleware');
const validateAddress = require('../middleware/addressValidation');
const { checkout, verifyPayment, listOrders, getOrder, cancelOrder, lookupGuestOrders, getOrderByToken } = require('../controllers/orderController');

const router = express.Router();

// ── Checkout ──────────────────────────────────────────────────────────────
router.post('/checkout', optionalAuth, validateAddress, checkout);

// ── Payment verification ──────────────────────────────────────────────────
router.post('/verify-payment', optionalAuth, verifyPayment);

// ── Guest order lookup (by email) — must come before /:id ─────────────────
router.get('/lookup', lookupGuestOrders);

// ── COD eligibility check ─────────────────────────────────────────────────
router.get('/cod-eligibility', async (req, res) => {
  const { pin } = req.query;
  if (!pin || !/^\d{6}$/.test(pin)) {
    return res.json({ eligible: false });
  }
  const { isCodEligible } = require('../services/pinCodeService');
  const eligible = await isCodEligible(pin);
  return res.json({ eligible });
});

// ── Order confirmation by token (guest-friendly, no auth) ─────────────────
router.get('/confirmation/:token', getOrderByToken);

// ── Customer order list & detail (authenticated) ──────────────────────────
router.get('/', authMiddleware, listOrders);
router.get('/:id', authMiddleware, getOrder);

// ── Cancellation ──────────────────────────────────────────────────────────
router.post('/:id/cancel', authMiddleware, cancelOrder);

module.exports = router;
