const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

const VALID_ORDER_STATUSES = ['Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];

/**
 * GET /api/admin/dashboard
 */
async function getDashboard(req, res, next) {
  try {
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const [totalOrdersToday, revenueResult, lowStockProducts, newCustomersToday] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } },
      ]),
      Product.find(
        { isActive: true, $expr: { $lt: ['$stock', '$lowStockThreshold'] } },
        { name: 1, stock: 1, lowStockThreshold: 1 }
      ).lean(),
      User.countDocuments({ role: 'customer', createdAt: { $gte: startOfToday } }),
    ]);

    const totalRevenueToday = revenueResult.length > 0 ? revenueResult[0].total : 0;

    return res.json({
      success: true,
      data: { totalOrdersToday, totalRevenueToday, lowStockProducts, newCustomersToday },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/orders
 */
async function listAdminOrders(req, res, next) {
  try {
    const { status, dateFrom, dateTo, customer, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setUTCHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }

    if (customer) {
      const regex = new RegExp(customer, 'i');
      const matchingUsers = await User.find({ $or: [{ name: regex }, { email: regex }] }, { _id: 1 }).lean();
      // Also match guest orders by guestEmail
      filter.$or = [
        { userId: { $in: matchingUsers.map((u) => u._id) } },
        { guestEmail: { $regex: regex } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const limitNum = parseInt(limit, 10);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('userId', 'name email')
        .select('orderId status grandTotal createdAt userId guestEmail paymentMethod paymentStatus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        orders,
        pagination: { total, page: parseInt(page, 10), limit: limitNum, pages: Math.ceil(total / limitNum) },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/orders/:id/status
 */
async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!status || !VALID_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `status must be one of: ${VALID_ORDER_STATUSES.join(', ')}` },
      });
    }

    const order = await Order.findById(id).populate('userId', 'email');
    if (!order) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
    }

    order.status = status;
    order.statusHistory.push({ status, changedAt: new Date(), note: note || '' });
    await order.save();

    const customerEmail = order.userId?.email || order.guestEmail;
    if (customerEmail) {
      notificationService.sendStatusUpdate(customerEmail, order, status).catch((err) => {
        console.error('[AdminController] sendStatusUpdate error:', err);
      });
    }

    return res.json({ success: true, data: { order } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/orders/:id/refund
 */
async function refundOrder(req, res, next) {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate('userId', 'email');

    if (!order) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
    }
    if (order.paymentStatus !== 'paid') {
      return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Order is not in a paid state' } });
    }
    if (order.paymentMethod !== 'razorpay') {
      return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Refund is only supported for Razorpay payments' } });
    }

    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    await razorpay.payments.refund(order.razorpayPaymentId, { amount: Math.round(order.grandTotal * 100) });

    order.paymentStatus = 'refunded';
    order.status = 'Refunded';
    order.statusHistory.push({ status: 'Refunded', changedAt: new Date(), note: 'Admin-initiated refund' });
    await order.save();

    const customerEmail = order.userId?.email || order.guestEmail;
    if (customerEmail) {
      notificationService.sendStatusUpdate(customerEmail, order, 'Refunded').catch((err) => {
        console.error('[AdminController] sendStatusUpdate error (refund):', err);
      });
    }

    return res.json({ success: true, data: { order } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/customers
 */
async function listCustomers(req, res, next) {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = { role: 'customer' };

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const limitNum = parseInt(limit, 10);

    const [customers, total] = await Promise.all([
      User.find(filter, { name: 1, email: 1, phone: 1, createdAt: 1 })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);

    const data = customers.map(({ createdAt, ...rest }) => ({ ...rest, registeredAt: createdAt }));

    return res.json({
      success: true,
      data: {
        customers: data,
        pagination: { total, page: parseInt(page, 10), limit: limitNum, pages: Math.ceil(total / limitNum) },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/customers/export
 */
async function exportCustomers(req, res, next) {
  try {
    const customers = await User.find({ role: 'customer' }, { name: 1, email: 1, phone: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .lean();

    const orderCounts = await Order.aggregate([
      { $match: { userId: { $ne: null } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    for (const row of orderCounts) {
      countMap[row._id.toString()] = row.count;
    }

    const escape = (val) => {
      if (val == null) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header = 'name,email,phone,registeredAt,orderCount\n';
    const rows = customers.map((c) => {
      const orderCount = countMap[c._id.toString()] || 0;
      const registeredAt = c.createdAt ? c.createdAt.toISOString() : '';
      return [c.name, c.email, c.phone, registeredAt, orderCount].map(escape).join(',');
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="customers.csv"');
    return res.send(header + rows.join('\n'));
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard, listAdminOrders, updateOrderStatus, refundOrder, listCustomers, exportCustomers };
