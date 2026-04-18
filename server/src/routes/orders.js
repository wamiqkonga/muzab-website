const express = require('express');
const optionalAuth = require('../middleware/optionalAuth');
const authMiddleware = require('../middleware/authMiddleware');
const validateAddress = require('../middleware/addressValidation');
const { checkout, verifyPayment, listOrders, getOrder, cancelOrder } = require('../controllers/orderController');

const router = express.Router();

// ── Checkout ──────────────────────────────────────────────────────────────
// validateAddress runs before the checkout handler to ensure the delivery
// address is complete, correctly formatted, and within the serviceable area.
router.post('/checkout', optionalAuth, validateAddress, checkout);

// ── Payment verification ──────────────────────────────────────────────────
router.post('/verify-payment', optionalAuth, verifyPayment);

// ── Customer order list & detail ──────────────────────────────────────────
router.get('/', authMiddleware, listOrders);

router.get('/:id', authMiddleware, getOrder);

// ── Cancellation ──────────────────────────────────────────────────────────
router.post('/:id/cancel', authMiddleware, cancelOrder);

module.exports = router;
