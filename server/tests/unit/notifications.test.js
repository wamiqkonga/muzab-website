/**
 * Unit tests for notificationService.js
 * Uses nodemailer's createTransport mock to avoid real SMTP calls.
 */

jest.mock('nodemailer', () => {
  const sendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
  return {
    createTransport: jest.fn(() => ({ sendMail })),
    __sendMail: sendMail,
  };
});

const nodemailer = require('nodemailer');
const {
  sendOrderConfirmation,
  sendStatusUpdate,
  sendWelcomeEmail,
  sendLowStockAlert,
  sendPasswordResetEmail,
} = require('../../src/services/notificationService');

function getSendMail() {
  return nodemailer.__sendMail;
}

beforeEach(() => {
  getSendMail().mockClear();
  nodemailer.createTransport.mockClear();
  process.env.EMAIL_HOST = 'smtp.example.com';
  process.env.EMAIL_PORT = '587';
  process.env.EMAIL_USER = 'user@example.com';
  process.env.EMAIL_PASS = 'secret';
  process.env.EMAIL_FROM = 'Muzab <noreply@muzab.in>';
  process.env.CLIENT_URL = 'https://muzab.in';
});

const sampleOrder = {
  _id: 'order123',
  orderId: 'MZB-20240101-0001',
  items: [
    { name: 'Saffron 1g', variantLabel: '1g', quantity: 2, unitPrice: 500, lineTotal: 1000 },
  ],
  grandTotal: 1100,
};

describe('sendOrderConfirmation', () => {
  it('sends an email with order ID and grand total', async () => {
    await sendOrderConfirmation('customer@example.com', sampleOrder);
    expect(getSendMail()).toHaveBeenCalledTimes(1);
    const call = getSendMail().mock.calls[0][0];
    expect(call.to).toBe('customer@example.com');
    expect(call.subject).toContain(sampleOrder.orderId);
    expect(call.html).toContain(sampleOrder.orderId);
    expect(call.html).toContain('1100');
  });

  it('does not throw when sendMail rejects', async () => {
    getSendMail().mockRejectedValueOnce(new Error('SMTP error'));
    await expect(sendOrderConfirmation('x@x.com', sampleOrder)).resolves.toBeUndefined();
  });
});

describe('sendStatusUpdate', () => {
  it('sends an email with order ID and new status', async () => {
    await sendStatusUpdate('customer@example.com', sampleOrder, 'Shipped');
    expect(getSendMail()).toHaveBeenCalledTimes(1);
    const call = getSendMail().mock.calls[0][0];
    expect(call.to).toBe('customer@example.com');
    expect(call.subject).toContain('Shipped');
    expect(call.html).toContain('Shipped');
    expect(call.html).toContain(sampleOrder.orderId);
  });

  it('does not throw when sendMail rejects', async () => {
    getSendMail().mockRejectedValueOnce(new Error('SMTP error'));
    await expect(sendStatusUpdate('x@x.com', sampleOrder, 'Delivered')).resolves.toBeUndefined();
  });
});

describe('sendWelcomeEmail', () => {
  it('sends a welcome email with brand details and catalog link', async () => {
    await sendWelcomeEmail('new@example.com', 'Aisha');
    expect(getSendMail()).toHaveBeenCalledTimes(1);
    const call = getSendMail().mock.calls[0][0];
    expect(call.to).toBe('new@example.com');
    expect(call.subject).toContain('Muzab');
    expect(call.html).toContain('Aisha');
    expect(call.html).toContain('https://muzab.in/catalog');
    expect(call.html).toContain('+91-9086660267');
    expect(call.html).toContain('Srinagar');
  });

  it('does not throw when sendMail rejects', async () => {
    getSendMail().mockRejectedValueOnce(new Error('SMTP error'));
    await expect(sendWelcomeEmail('x@x.com', 'Test')).resolves.toBeUndefined();
  });
});

describe('sendLowStockAlert', () => {
  it('sends an alert email with product name and stock', async () => {
    const product = { name: 'Saffron 5g', stock: 3 };
    await sendLowStockAlert('admin@muzab.in', product);
    expect(getSendMail()).toHaveBeenCalledTimes(1);
    const call = getSendMail().mock.calls[0][0];
    expect(call.to).toBe('admin@muzab.in');
    expect(call.subject).toContain('Saffron 5g');
    expect(call.html).toContain('Saffron 5g');
    expect(call.html).toContain('3');
  });

  it('does not throw when sendMail rejects', async () => {
    getSendMail().mockRejectedValueOnce(new Error('SMTP error'));
    await expect(sendLowStockAlert('admin@muzab.in', { name: 'X', stock: 1 })).resolves.toBeUndefined();
  });
});

describe('sendPasswordResetEmail', () => {
  it('sends a reset email with a link containing the token', async () => {
    await sendPasswordResetEmail('user@example.com', 'reset-token-abc');
    expect(getSendMail()).toHaveBeenCalledTimes(1);
    const call = getSendMail().mock.calls[0][0];
    expect(call.to).toBe('user@example.com');
    expect(call.html).toContain('reset-token-abc');
    expect(call.html).toContain('https://muzab.in/reset-password/reset-token-abc');
  });

  it('does not throw when sendMail rejects', async () => {
    getSendMail().mockRejectedValueOnce(new Error('SMTP error'));
    await expect(sendPasswordResetEmail('x@x.com', 'tok')).resolves.toBeUndefined();
  });
});
