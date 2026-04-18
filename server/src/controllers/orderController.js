const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const Razorpay = require('razorpay');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { isCodEligible, getShippingFee } = require('../services/pinCodeService');
const notificationService = require('../services/notificationService');

// Cookie config for guest session (mirrors cartController)
const SESSION_COOKIE = 'sessionId';
const COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const GST_RATE = 0.18;

/**
 * Lazily initialise Razorpay SDK so the server can start without the env vars
 * being set (useful in test environments).
 */
function getRazorpayInstance() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

/**
 * Generate a human-readable order ID in the format MZB-YYYYMMDD-XXXX.
 */
function generateOrderId() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const xxxx = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `MZB-${yyyy}${mm}${dd}-${xxxx}`;
}

/**
 * Resolve the cart for the current request.
 * Authenticated users → by userId; guests → by sessionId cookie.
 * Returns { cart, sessionId }.
 */
async function resolveCart(req, res) {
  if (req.user) {
    const cart = await Cart.findOne({ userId: req.user._id });
    return { cart: cart || null, sessionId: null };
  }

  let sessionId = req.cookies && req.cookies[SESSION_COOKIE];
  if (!sessionId) {
    sessionId = uuidv4();
    res.cookie(SESSION_COOKIE, sessionId, COOKIE_OPTIONS);
  }

  const cart = await Cart.findOne({ sessionId });
  return { cart: cart || null, sessionId };
}

/**
 * Atomically decrement stock for a single cart item.
 * Uses findOneAndUpdate with a stock >= qty guard to prevent overselling.
 *
 * Returns true on success, false if stock is insufficient.
 */
async function decrementStock(item) {
  const { productId, variantLabel, quantity } = item;

  if (variantLabel) {
    // Variant stock: update the matching variant subdocument
    const result = await Product.findOneAndUpdate(
      {
        _id: productId,
        'variants.label': variantLabel,
        'variants.stock': { $gte: quantity },
      },
      { $inc: { 'variants.$.stock': -quantity } },
      { new: true }
    );
    return result !== null;
  } else {
    // Top-level stock
    const result = await Product.findOneAndUpdate(
      { _id: productId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { new: true }
    );
    return result !== null;
  }
}

/**
 * Restore stock for items that were already decremented (rollback on partial failure).
 */
async function restoreStock(items) {
  await Promise.all(
    items.map((item) => {
      const { productId, variantLabel, quantity } = item;
      if (variantLabel) {
        return Product.findOneAndUpdate(
          { _id: productId, 'variants.label': variantLabel },
          { $inc: { 'variants.$.stock': quantity } }
        );
      }
      return Product.findOneAndUpdate(
        { _id: productId },
        { $inc: { stock: quantity } }
      );
    })
  );
}

/**
 * POST /api/orders/checkout
 *
 * Flow:
 *  1. Resolve cart; reject if empty.
 *  2. Read deliveryAddress from req.body (already validated by addressValidation middleware).
 *  3. Get shipping fee from pinCodeService.
 *  4. Calculate subtotal, GST (18%), grandTotal.
 *  5a. Razorpay path: atomically decrement stock → create Razorpay order → return { razorpayOrderId, key, amount }.
 *  5b. COD path: check isCodEligible → atomically decrement stock → create Order → clear cart → return order.
 */
async function checkout(req, res, next) {
  try {
    // ── 1. Resolve cart ──────────────────────────────────────────────────
    const { cart } = await resolveCart(req, res);

    if (!cart || cart.items.length === 0) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'CART_EMPTY',
          message: 'Your cart is empty',
          details: [],
        },
      });
    }

    // ── 2. Delivery address (validated by middleware) ────────────────────
    const deliveryAddress = req.body.deliveryAddress || req.body;
    const pin = String(deliveryAddress.pinCode).trim();

    // ── 3. Shipping fee ──────────────────────────────────────────────────
    const shippingFee = (await getShippingFee(pin)) || 0;

    // ── 4. Pricing ───────────────────────────────────────────────────────
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const gst = parseFloat((subtotal * GST_RATE).toFixed(2));
    const grandTotal = parseFloat((subtotal + shippingFee + gst).toFixed(2));

    // Build order items array
    const orderItems = cart.items.map((item) => ({
      productId: item.productId,
      variantLabel: item.variantLabel,
      name: item.name,
      image: item.image,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: parseFloat((item.unitPrice * item.quantity).toFixed(2)),
    }));

    const paymentMethod = req.body.paymentMethod;

    // ── 5b. COD path ─────────────────────────────────────────────────────
    if (paymentMethod === 'cod') {
      const eligible = await isCodEligible(pin);
      if (!eligible) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'COD_NOT_ELIGIBLE',
            message: 'Cash on Delivery is not available for this PIN code',
            details: [],
          },
        });
      }

      // Atomically decrement stock for each item
      const decremented = [];
      for (const item of cart.items) {
        const ok = await decrementStock(item);
        if (!ok) {
          // Rollback already-decremented items
          await restoreStock(decremented);
          return res.status(422).json({
            success: false,
            error: {
              code: 'OUT_OF_STOCK',
              message: `"${item.name}" is out of stock or has insufficient quantity`,
              details: [{ productId: item.productId, variantLabel: item.variantLabel }],
            },
          });
        }
        decremented.push(item);
      }

      // Create Order
      const order = await Order.create({
        orderId: generateOrderId(),
        userId: req.user ? req.user._id : null,
        guestEmail: req.body.guestEmail || null,
        items: orderItems,
        deliveryAddress,
        subtotal,
        shippingFee,
        gst,
        grandTotal,
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        status: 'Confirmed',
        statusHistory: [{ status: 'Confirmed', changedAt: new Date(), note: 'Order placed via COD' }],
      });

      // Clear cart
      cart.items = [];
      await cart.save();

      return res.status(201).json({
        success: true,
        order: {
          orderId: order.orderId,
          _id: order._id,
          status: order.status,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          subtotal: order.subtotal,
          shippingFee: order.shippingFee,
          gst: order.gst,
          grandTotal: order.grandTotal,
          items: order.items,
          deliveryAddress: order.deliveryAddress,
          createdAt: order.createdAt,
        },
      });
    }

    // ── 5a. Razorpay path ─────────────────────────────────────────────────
    // Atomically decrement stock for each item
    const decremented = [];
    for (const item of cart.items) {
      const ok = await decrementStock(item);
      if (!ok) {
        await restoreStock(decremented);
        return res.status(422).json({
          success: false,
          error: {
            code: 'OUT_OF_STOCK',
            message: `"${item.name}" is out of stock or has insufficient quantity`,
            details: [{ productId: item.productId, variantLabel: item.variantLabel }],
          },
        });
      }
      decremented.push(item);
    }

    // Create Razorpay order (amount in paise)
    let razorpayOrder;
    try {
      const razorpay = getRazorpayInstance();
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(grandTotal * 100), // INR → paise
        currency: 'INR',
        receipt: generateOrderId(),
      });
    } catch (rzpErr) {
      // Rollback stock on Razorpay failure
      await restoreStock(decremented);
      return next(rzpErr);
    }

    return res.status(200).json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      // Pass pricing context so the client can display the order summary
      orderSummary: {
        subtotal,
        shippingFee,
        gst,
        grandTotal,
        items: orderItems,
        deliveryAddress,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/orders/verify-payment
 *
 * Flow:
 *  1. Extract razorpayOrderId, razorpayPaymentId, razorpaySignature, orderSummary from body.
 *  2. Verify HMAC-SHA256 signature: hmac(razorpayOrderId + '|' + razorpayPaymentId, RAZORPAY_KEY_SECRET).
 *  3. On mismatch → 422 PAYMENT_FAILED.
 *  4. On success → create Order (status: Confirmed, paymentStatus: paid), clear cart.
 *  5. Fire-and-forget notification (email + SMS).
 *  6. Return created order.
 *
 * NOTE: Raw card data is never stored — only razorpayPaymentId, razorpayOrderId, razorpaySignature.
 */
async function verifyPayment(req, res, next) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderSummary } = req.body;

    // ── 1. Validate required fields ──────────────────────────────────────
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderSummary) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'razorpayOrderId, razorpayPaymentId, razorpaySignature, and orderSummary are required',
          details: [],
        },
      });
    }

    // ── 2. Verify HMAC-SHA256 signature ──────────────────────────────────
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'PAYMENT_FAILED',
          message: 'Payment verification failed: invalid signature',
          details: [],
        },
      });
    }

    // ── 3. Build order data from orderSummary ────────────────────────────
    const { subtotal, shippingFee, gst, grandTotal, items, deliveryAddress } = orderSummary;

    // Determine email for notification
    let customerEmail = null;
    if (req.user) {
      customerEmail = req.user.email;
    } else if (req.body.guestEmail) {
      customerEmail = req.body.guestEmail;
    }

    // ── 4. Create Order ──────────────────────────────────────────────────
    const order = await Order.create({
      orderId: generateOrderId(),
      userId: req.user ? req.user._id : null,
      guestEmail: req.body.guestEmail || null,
      items,
      deliveryAddress,
      subtotal,
      shippingFee,
      gst,
      grandTotal,
      paymentMethod: 'razorpay',
      paymentStatus: 'paid',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      status: 'Confirmed',
      statusHistory: [{ status: 'Confirmed', changedAt: new Date(), note: 'Payment verified via Razorpay' }],
    });

    // ── 5. Clear cart (fire-and-forget, don't block response) ────────────
    (async () => {
      try {
        if (req.user) {
          await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [] });
        } else {
          const sessionId = req.cookies && req.cookies['sessionId'];
          if (sessionId) {
            await Cart.findOneAndUpdate({ sessionId }, { items: [] });
          }
        }
      } catch (err) {
        console.error('[verifyPayment] Failed to clear cart:', err.message);
      }
    })();

    // ── 6. Send notifications (fire-and-forget) ──────────────────────────
    if (customerEmail) {
      notificationService.sendOrderConfirmation(customerEmail, order).catch((err) => {
        console.error('[verifyPayment] Notification error:', err.message);
      });
    }

    // ── 7. Return created order ──────────────────────────────────────────
    return res.status(201).json({
      success: true,
      order: {
        orderId: order.orderId,
        _id: order._id,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId: order.razorpayPaymentId,
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        gst: order.gst,
        grandTotal: order.grandTotal,
        items: order.items,
        deliveryAddress: order.deliveryAddress,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders
 *
 * Returns a paginated list of orders belonging to the authenticated customer.
 * Never returns orders from other users.
 *
 * Query params:
 *   page  (default 1)
 *   limit (default 10)
 */
async function listOrders(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { userId: req.user._id };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('orderId createdAt status grandTotal items'),
      Order.countDocuments(filter),
    ]);

    const data = orders.map((o) => ({
      orderId: o.orderId,
      _id: o._id,
      date: o.createdAt,
      status: o.status,
      grandTotal: o.grandTotal,
      itemsCount: o.items.length,
    }));

    return res.status(200).json({
      success: true,
      orders: data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders/:id
 *
 * Returns the full detail of a single order.
 * Ownership is enforced by filtering on both _id AND userId — a customer
 * can never retrieve another customer's order.
 * Returns 404 if the order does not exist or does not belong to the user.
 */
async function getOrder(req, res, next) {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Order not found',
          details: [],
        },
      });
    }

    return res.status(200).json({
      success: true,
      order: {
        orderId: order.orderId,
        _id: order._id,
        date: order.createdAt,
        status: order.status,
        statusHistory: order.statusHistory,
        items: order.items,
        deliveryAddress: order.deliveryAddress,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        gst: order.gst,
        grandTotal: order.grandTotal,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/orders/:id/cancel
 *
 * Cancels an order if it is in a cancellable state (Confirmed or Processing).
 *
 * Flow:
 *  1. Find order by _id AND userId (ownership check); 404 if not found.
 *  2. If status is Shipped, Delivered, Cancelled, or Refunded → 422 CANCELLATION_DENIED.
 *  3. If paymentStatus is 'paid' → initiate Razorpay refund, set paymentStatus: 'refunded', status: 'Refunded'.
 *  4. Otherwise → set status: 'Cancelled'.
 *  5. Append to statusHistory.
 *  6. Fire-and-forget notification.
 *  7. Return updated order.
 */
async function cancelOrder(req, res, next) {
  try {
    // ── 1. Find order with ownership check ───────────────────────────────
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Order not found',
          details: [],
        },
      });
    }

    // ── 2. Check cancellable state ───────────────────────────────────────
    const nonCancellableStatuses = ['Shipped', 'Delivered', 'Cancelled', 'Refunded'];
    if (nonCancellableStatuses.includes(order.status)) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'CANCELLATION_DENIED',
          message: `Order cannot be cancelled because it is already ${order.status}. For assistance, contact +91-9086660267.`,
          details: [],
        },
      });
    }

    // ── 3 & 4. Determine new status and handle refund ────────────────────
    let newStatus;

    if (order.paymentStatus === 'paid') {
      // Initiate Razorpay refund
      try {
        const razorpay = getRazorpayInstance();
        await razorpay.payments.refund(order.razorpayPaymentId, {
          amount: Math.round(order.grandTotal * 100), // INR → paise
        });
      } catch (rzpErr) {
        console.error('[cancelOrder] Razorpay refund error:', rzpErr.message);
        return next(rzpErr);
      }

      order.paymentStatus = 'refunded';
      newStatus = 'Refunded';
    } else {
      newStatus = 'Cancelled';
    }

    order.status = newStatus;

    // ── 5. Append to statusHistory ───────────────────────────────────────
    order.statusHistory.push({
      status: newStatus,
      changedAt: new Date(),
      note: newStatus === 'Refunded' ? 'Order cancelled and refund initiated' : 'Order cancelled by customer',
    });

    await order.save();

    // ── 6. Fire-and-forget notification ─────────────────────────────────
    const customerEmail = req.user.email;
    if (customerEmail) {
      notificationService.sendStatusUpdate(customerEmail, order, newStatus).catch((err) => {
        console.error('[cancelOrder] Notification error:', err.message);
      });
    }

    // ── 7. Return updated order ──────────────────────────────────────────
    return res.status(200).json({
      success: true,
      order: {
        orderId: order.orderId,
        _id: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        statusHistory: order.statusHistory,
        items: order.items,
        deliveryAddress: order.deliveryAddress,
        paymentMethod: order.paymentMethod,
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        gst: order.gst,
        grandTotal: order.grandTotal,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { checkout, verifyPayment, listOrders, getOrder, cancelOrder };
