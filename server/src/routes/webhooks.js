/**
 * Razorpay Webhook Handler
 * POST /api/webhooks/razorpay
 *
 * Verifies HMAC-SHA256 signature and handles payment events.
 * Requirements: 5.4
 */

const express = require('express');
const crypto = require('crypto');
const Order = require('../models/Order');
const { sendOrderConfirmation, sendStatusUpdate } = require('../services/notificationService');

const router = express.Router();

/**
 * Verify Razorpay webhook signature.
 * @param {Buffer} rawBody - Raw request body buffer
 * @param {string} signature - X-Razorpay-Signature header value
 * @returns {boolean}
 */
function verifySignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

// POST /razorpay
router.post('/razorpay', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body; // Buffer (express.raw middleware applied in app.js)

  // Verify HMAC signature
  if (!verifySignature(rawBody, signature)) {
    return res.status(400).json({ success: false, error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid JSON body' });
  }

  const eventType = event.event;
  const paymentEntity = event?.payload?.payment?.entity;

  if (eventType === 'payment.captured') {
    // Find order by razorpayOrderId
    const razorpayOrderId = paymentEntity?.order_id;
    if (razorpayOrderId) {
      try {
        const order = await Order.findOne({ razorpayOrderId });
        if (order) {
          order.paymentStatus = 'paid';
          order.status = 'Confirmed';
          if (paymentEntity.id) {
            order.razorpayPaymentId = paymentEntity.id;
          }
          order.statusHistory.push({
            status: 'Confirmed',
            changedAt: new Date(),
            note: 'Payment captured via webhook',
          });
          await order.save();

          // Fire-and-forget: send order confirmation email
          const customerEmail =
            order.guestEmail ||
            (order.userId ? await getCustomerEmail(order.userId) : null);
          if (customerEmail) {
            sendOrderConfirmation(customerEmail, order).catch(() => {});
          }
        }
      } catch (err) {
        console.error('[Webhook] payment.captured handler error:', err.message);
      }
    }
  } else if (eventType === 'payment.failed') {
    const razorpayOrderId = paymentEntity?.order_id;
    if (razorpayOrderId) {
      try {
        const order = await Order.findOne({ razorpayOrderId });
        if (order) {
          order.paymentStatus = 'failed';
          order.statusHistory.push({
            status: order.status,
            changedAt: new Date(),
            note: 'Payment failed via webhook',
          });
          await order.save();

          // Fire-and-forget: notify admin
          const adminEmail = process.env.ADMIN_EMAIL;
          if (adminEmail) {
            sendStatusUpdate(adminEmail, order, 'Payment Failed').catch(() => {});
          }
        }
      } catch (err) {
        console.error('[Webhook] payment.failed handler error:', err.message);
      }
    }
  }
  // All events (handled or not) return 200 for idempotency
  return res.status(200).json({ success: true });
});

/**
 * Helper: fetch customer email from User model by userId.
 */
async function getCustomerEmail(userId) {
  try {
    const User = require('../models/User');
    const user = await User.findById(userId).select('email').lean();
    return user?.email || null;
  } catch {
    return null;
  }
}

module.exports = router;
