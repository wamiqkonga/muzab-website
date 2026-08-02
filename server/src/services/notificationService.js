/**
 * Notification Service
 * Sends transactional emails via Nodemailer (SMTP).
 * All functions are fire-and-forget — they catch and log errors, never throw.
 */

const nodemailer = require('nodemailer');

const BRAND_NAME = 'Muzab Organics';
const BRAND_CONTACT = '+91-9086660267';
const BRAND_ADDRESS = 'Srinagar, J&K, India';

function getCatalogLink() {
  const base = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
  return base + '/catalog';
}

function getClientBase() {
  return (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: parseInt(process.env.EMAIL_PORT || '587', 10) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

const brandFooter = `
  <hr style="border:none;border-top:1px solid #e0d8cc;margin:24px 0"/>
  <p style="color:#6B7280;font-size:13px;margin:0">
    ${BRAND_NAME} &bull; ${BRAND_ADDRESS} &bull; ${BRAND_CONTACT}
  </p>
`;

async function sendOrderConfirmation(email, order) {
  try {
    const transporter = createTransporter();
    const itemRows = (order.items || [])
      .map(
        (item) =>
          `<tr>
            <td style="padding:6px 8px">${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ''}</td>
            <td style="padding:6px 8px;text-align:center">${item.quantity}</td>
            <td style="padding:6px 8px;text-align:right">₹${item.lineTotal ?? item.unitPrice * item.quantity}</td>
          </tr>`
      )
      .join('');

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#3B1F6E">
        <h2 style="background:#3B1F6E;color:#F5F0E8;padding:16px 24px;margin:0">
          ${BRAND_NAME} — Order Confirmed
        </h2>
        <div style="padding:24px">
          <p>Thank you for your order! Here's a summary:</p>
          <p><strong>Order ID:</strong> ${order.orderId || order._id}</p>
          <table style="width:100%;border-collapse:collapse;margin-top:12px">
            <thead>
              <tr style="background:#F5F0E8">
                <th style="padding:6px 8px;text-align:left">Item</th>
                <th style="padding:6px 8px;text-align:center">Qty</th>
                <th style="padding:6px 8px;text-align:right">Total</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
            <tfoot>
              <tr style="font-weight:bold;border-top:2px solid #D4A017">
                <td colspan="2" style="padding:8px">Grand Total</td>
                <td style="padding:8px;text-align:right">₹${order.grandTotal}</td>
              </tr>
            </tfoot>
          </table>
          <p style="margin-top:16px">We'll notify you when your order ships.</p>
        </div>
        ${brandFooter}
      </div>`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `${BRAND_NAME} <noreply@muzab.in>`,
      to: email,
      subject: `Order Confirmed — ${order.orderId || order._id}`,
      html,
    });
  } catch (err) {
    console.error('[NotificationService] sendOrderConfirmation error:', err.message);
  }
}

async function sendStatusUpdate(email, order, newStatus) {
  try {
    const transporter = createTransporter();
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#3B1F6E">
        <h2 style="background:#3B1F6E;color:#F5F0E8;padding:16px 24px;margin:0">
          ${BRAND_NAME} — Order Update
        </h2>
        <div style="padding:24px">
          <p>Your order status has been updated.</p>
          <p><strong>Order ID:</strong> ${order.orderId || order._id}</p>
          <p>
            <strong>New Status:</strong>
            <span style="color:#C0392B;font-weight:bold">${newStatus}</span>
          </p>
          <p>If you have any questions, contact us at ${BRAND_CONTACT}.</p>
        </div>
        ${brandFooter}
      </div>`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `${BRAND_NAME} <noreply@muzab.in>`,
      to: email,
      subject: `Order ${order.orderId || order._id} — Status: ${newStatus}`,
      html,
    });
  } catch (err) {
    console.error('[NotificationService] sendStatusUpdate error:', err.message);
  }
}

async function sendWelcomeEmail(email, name) {
  try {
    const transporter = createTransporter();
    const catalogLink = getCatalogLink();
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#3B1F6E">
        <h2 style="background:#3B1F6E;color:#F5F0E8;padding:16px 24px;margin:0">
          Welcome to ${BRAND_NAME}!
        </h2>
        <div style="padding:24px">
          <p>Hi ${name},</p>
          <p>
            We're thrilled to have you join the ${BRAND_NAME} family — your trusted source for
            premium saffron and natural products from ${BRAND_ADDRESS}.
          </p>
          <p>
            <a href="${catalogLink}"
               style="display:inline-block;background:#C0392B;color:#fff;padding:12px 24px;
                      border-radius:4px;text-decoration:none;font-weight:bold">
              Browse Our Catalog
            </a>
          </p>
          <p>Have questions? Reach us at <strong>${BRAND_CONTACT}</strong>.</p>
        </div>
        ${brandFooter}
      </div>`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `${BRAND_NAME} <noreply@muzab.in>`,
      to: email,
      subject: `Welcome to ${BRAND_NAME}!`,
      html,
    });
  } catch (err) {
    console.error('[NotificationService] sendWelcomeEmail error:', err.message);
  }
}

async function sendLowStockAlert(adminEmail, product) {
  try {
    const transporter = createTransporter();
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#3B1F6E">
        <h2 style="background:#C0392B;color:#fff;padding:16px 24px;margin:0">
          ⚠️ Low Stock Alert — ${BRAND_NAME}
        </h2>
        <div style="padding:24px">
          <p>The following product is running low on stock:</p>
          <table style="width:100%;border-collapse:collapse">
            <tr style="background:#F5F0E8">
              <th style="padding:8px;text-align:left">Product</th>
              <th style="padding:8px;text-align:right">Current Stock</th>
            </tr>
            <tr>
              <td style="padding:8px">${product.name}</td>
              <td style="padding:8px;text-align:right;color:#C0392B;font-weight:bold">
                ${product.stock ?? product.variants?.reduce((s, v) => s + v.stock, 0) ?? 'N/A'}
              </td>
            </tr>
          </table>
          <p style="margin-top:16px">Please restock soon to avoid lost sales.</p>
        </div>
        ${brandFooter}
      </div>`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `${BRAND_NAME} <noreply@muzab.in>`,
      to: adminEmail,
      subject: `Low Stock Alert: ${product.name}`,
      html,
    });
  } catch (err) {
    console.error('[NotificationService] sendLowStockAlert error:', err.message);
  }
}

async function sendPasswordResetEmail(email, token) {
  try {
    const transporter = createTransporter();
    const resetLink = `${getClientBase()}/reset-password/${token}`;
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#3B1F6E">
        <h2 style="background:#3B1F6E;color:#F5F0E8;padding:16px 24px;margin:0">
          ${BRAND_NAME} — Password Reset
        </h2>
        <div style="padding:24px">
          <p>You requested a password reset. Click the link below to set a new password.</p>
          <p>This link is valid for <strong>1 hour</strong>.</p>
          <p>
            <a href="${resetLink}"
               style="display:inline-block;background:#C0392B;color:#fff;padding:12px 24px;
                      border-radius:4px;text-decoration:none;font-weight:bold">
              Reset Password
            </a>
          </p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
        ${brandFooter}
      </div>`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `${BRAND_NAME} <noreply@muzab.in>`,
      to: email,
      subject: `${BRAND_NAME} — Password Reset Request`,
      html,
    });
  } catch (err) {
    console.error('[NotificationService] sendPasswordResetEmail error:', err.message);
  }
}

module.exports = {
  sendOrderConfirmation,
  sendStatusUpdate,
  sendWelcomeEmail,
  sendLowStockAlert,
  sendPasswordResetEmail,
};
