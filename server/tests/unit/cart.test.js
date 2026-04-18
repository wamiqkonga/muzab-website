/**
 * Unit tests for Cart Service
 * Tests: add/update/remove items, total recalculation, guest vs auth cart, out-of-stock flag
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */

// Mock uuid (ESM module) before any imports
jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-uuid-1234') }));

// Mock mongoose models
jest.mock('../../src/models/Cart');
jest.mock('../../src/models/Product');

const Cart = require('../../src/models/Cart');
const Product = require('../../src/models/Product');
const cartController = require('../../src/controllers/cartController');
const { computeCartTotals } = cartController;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCartItem(overrides = {}) {
  const id = overrides._id || '507f1f77bcf86cd799439099';
  return {
    _id: { toString: () => id },
    productId: { toString: () => '507f1f77bcf86cd799439011' },
    variantLabel: undefined,
    quantity: 2,
    unitPrice: 500,
    name: 'Saffron Oil',
    image: 'https://example.com/img.jpg',
    ...overrides,
  };
}

function makeCart(items = [], overrides = {}) {
  return {
    _id: '507f1f77bcf86cd799439000',
    userId: null,
    sessionId: 'test-session-id',
    items,
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

function makeProduct(overrides = {}) {
  return {
    _id: { toString: () => '507f1f77bcf86cd799439011' },
    name: 'Saffron Oil',
    basePrice: 500,
    stock: 10,
    isActive: true,
    images: ['https://example.com/img.jpg'],
    variants: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Cart Service Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {}, params: {}, cookies: {}, user: null };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  // =========================================================================
  // computeCartTotals — Requirements 2.3, 2.7
  // =========================================================================

  describe('computeCartTotals', () => {
    test('calculates subtotal as sum of (unitPrice * quantity)', () => {
      const items = [
        { unitPrice: 100, quantity: 2 },
        { unitPrice: 50, quantity: 3 },
      ];
      expect(computeCartTotals(items).subtotal).toBe(350);
    });

    test('calculates GST as 18% of subtotal', () => {
      const items = [{ unitPrice: 1000, quantity: 1 }];
      expect(computeCartTotals(items).gst).toBe(180);
    });

    test('calculates grandTotal as subtotal + GST', () => {
      const items = [{ unitPrice: 1000, quantity: 1 }];
      const { subtotal, gst, grandTotal } = computeCartTotals(items);
      expect(grandTotal).toBe(subtotal + gst);
      expect(grandTotal).toBe(1180);
    });

    test('returns zeros for empty cart', () => {
      const { subtotal, gst, grandTotal } = computeCartTotals([]);
      expect(subtotal).toBe(0);
      expect(gst).toBe(0);
      expect(grandTotal).toBe(0);
    });

    test('handles decimal prices correctly', () => {
      const items = [
        { unitPrice: 99.99, quantity: 2 },
        { unitPrice: 49.50, quantity: 1 },
      ];
      const { subtotal, gst, grandTotal } = computeCartTotals(items);
      expect(subtotal).toBeCloseTo(249.48, 2);
      expect(gst).toBeCloseTo(44.91, 2);
      expect(grandTotal).toBeCloseTo(294.39, 2);
    });

    test('recalculates correctly after quantity update', () => {
      const before = computeCartTotals([{ unitPrice: 200, quantity: 1 }]);
      const after = computeCartTotals([{ unitPrice: 200, quantity: 3 }]);
      expect(after.subtotal).toBe(600);
      expect(after.subtotal).toBe(before.subtotal * 3);
    });

    test('recalculates correctly after item removal', () => {
      const items = [
        { unitPrice: 100, quantity: 2 },
        { unitPrice: 300, quantity: 1 },
      ];
      const full = computeCartTotals(items);
      const reduced = computeCartTotals([items[1]]);
      expect(reduced.subtotal).toBe(full.subtotal - 200);
    });
  });

  // =========================================================================
  // getCart — Requirements 2.2, 2.5, 2.6
  // =========================================================================

  describe('getCart', () => {
    test('resolves cart by userId for authenticated users (Req 2.5)', async () => {
      req.user = { _id: '507f1f77bcf86cd799439001' };
      Cart.findOne.mockResolvedValue(makeCart());

      await cartController.getCart(req, res, next);

      expect(Cart.findOne).toHaveBeenCalledWith({ userId: req.user._id });
    });

    test('resolves cart by sessionId for guest users (Req 2.5)', async () => {
      req.cookies = { sessionId: 'guest-session-123' };
      Cart.findOne.mockResolvedValue(makeCart());

      await cartController.getCart(req, res, next);

      expect(Cart.findOne).toHaveBeenCalledWith({ sessionId: 'guest-session-123' });
    });

    test('creates new cart if none exists for guest', async () => {
      req.cookies = { sessionId: 'new-session-id' };
      Cart.findOne.mockResolvedValue(null);
      Cart.create.mockResolvedValue(makeCart([], { sessionId: 'new-session-id' }));

      await cartController.getCart(req, res, next);

      expect(Cart.create).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: 'new-session-id' })
      );
    });

    test('creates new cart if none exists for authenticated user', async () => {
      req.user = { _id: '507f1f77bcf86cd799439001' };
      Cart.findOne.mockResolvedValue(null);
      Cart.create.mockResolvedValue(makeCart([], { userId: req.user._id }));

      await cartController.getCart(req, res, next);

      expect(Cart.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: req.user._id, items: [] })
      );
    });

    test('returns outOfStock: false for in-stock items (Req 2.2)', async () => {
      req.cookies = { sessionId: 'test-session-id' };
      Cart.findOne.mockResolvedValue(makeCart([makeCartItem()]));
      Product.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(makeProduct()),
      });

      await cartController.getCart(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          cart: expect.objectContaining({
            items: expect.arrayContaining([
              expect.objectContaining({ outOfStock: false }),
            ]),
          }),
        })
      );
    });

    test('flags item outOfStock: true when product stock is 0 (Req 2.6)', async () => {
      req.cookies = { sessionId: 'test-session-id' };
      Cart.findOne.mockResolvedValue(makeCart([makeCartItem()]));
      Product.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(makeProduct({ stock: 0 })),
      });

      await cartController.getCart(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          cart: expect.objectContaining({
            items: expect.arrayContaining([
              expect.objectContaining({ outOfStock: true }),
            ]),
          }),
        })
      );
    });

    test('flags item outOfStock: true when product not found (Req 2.6)', async () => {
      req.cookies = { sessionId: 'test-session-id' };
      Cart.findOne.mockResolvedValue(makeCart([makeCartItem()]));
      Product.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

      await cartController.getCart(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          cart: expect.objectContaining({
            items: expect.arrayContaining([
              expect.objectContaining({ outOfStock: true }),
            ]),
          }),
        })
      );
    });

    test('flags variant item outOfStock: true when variant stock is 0 (Req 2.6)', async () => {
      req.cookies = { sessionId: 'test-session-id' };
      Cart.findOne.mockResolvedValue(makeCart([makeCartItem({ variantLabel: '5g' })]));
      Product.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(
          makeProduct({ variants: [{ label: '5g', stock: 0 }] })
        ),
      });

      await cartController.getCart(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          cart: expect.objectContaining({
            items: expect.arrayContaining([
              expect.objectContaining({ outOfStock: true }),
            ]),
          }),
        })
      );
    });

    test('returns subtotal, gst, and grandTotal in response (Req 2.7)', async () => {
      req.cookies = { sessionId: 'test-session-id' };
      Cart.findOne.mockResolvedValue(
        makeCart([makeCartItem({ unitPrice: 1000, quantity: 1 })])
      );
      Product.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(makeProduct()),
      });

      await cartController.getCart(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          cart: expect.objectContaining({
            subtotal: 1000,
            gst: 180,
            grandTotal: 1180,
          }),
        })
      );
    });

    test('calls next with error on exception', async () => {
      req.cookies = { sessionId: 'test-session-id' };
      Cart.findOne.mockRejectedValue(new Error('DB error'));

      await cartController.getCart(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // =========================================================================
  // addItem — Requirements 2.1, 2.2
  // =========================================================================

  describe('addItem', () => {
    const productId = '507f1f77bcf86cd799439011';

    test('returns 400 when productId is missing', async () => {
      req.body = { quantity: 1 };

      await cartController.addItem(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
        })
      );
    });

    test('returns 400 when quantity is 0 or invalid', async () => {
      req.body = { productId, quantity: 0 };

      await cartController.addItem(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
        })
      );
    });

    test('returns 404 when product not found', async () => {
      req.body = { productId, quantity: 1 };
      Product.findById.mockResolvedValue(null);

      await cartController.addItem(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: 'NOT_FOUND' }),
        })
      );
    });

    test('returns 404 when product is inactive', async () => {
      req.body = { productId, quantity: 1 };
      Product.findById.mockResolvedValue(makeProduct({ isActive: false }));

      await cartController.addItem(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('returns 422 OUT_OF_STOCK when product stock is 0 (Req 2.1)', async () => {
      req.body = { productId, quantity: 1 };
      Product.findById.mockResolvedValue(makeProduct({ stock: 0 }));

      await cartController.addItem(req, res, next);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: 'OUT_OF_STOCK' }),
        })
      );
    });

    test('returns 404 when variant not found', async () => {
      req.body = { productId, variantLabel: 'nonexistent', quantity: 1 };
      Product.findById.mockResolvedValue(makeProduct({ variants: [] }));

      await cartController.addItem(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: 'NOT_FOUND' }),
        })
      );
    });

    test('returns 422 OUT_OF_STOCK when variant stock is 0', async () => {
      req.body = { productId, variantLabel: '5g', quantity: 1 };
      Product.findById.mockResolvedValue(
        makeProduct({ variants: [{ label: '5g', price: 300, stock: 0 }] })
      );

      await cartController.addItem(req, res, next);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: 'OUT_OF_STOCK' }),
        })
      );
    });

    test('returns 422 when requested quantity exceeds available stock', async () => {
      req.body = { productId, quantity: 20 };
      req.cookies = { sessionId: 'test-session-id' };
      Product.findById.mockResolvedValue(makeProduct({ stock: 5 }));
      Cart.findOne.mockResolvedValue(makeCart());

      await cartController.addItem(req, res, next);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: 'OUT_OF_STOCK' }),
        })
      );
    });

    test('adds item successfully and returns updated cart (Req 2.1)', async () => {
      req.cookies = { sessionId: 'test-session-id' };
      req.body = { productId, quantity: 2 };

      const product = makeProduct({ basePrice: 500 });
      Product.findById.mockResolvedValue(product);

      const cart = makeCart();
      Cart.findOne.mockResolvedValue(cart);

      await cartController.addItem(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    test('snapshots unitPrice, name, and image from product at time of add (Req 2.2)', async () => {
      req.cookies = { sessionId: 'test-session-id' };
      req.body = { productId, quantity: 1 };

      const product = makeProduct({
        basePrice: 750,
        name: 'Pure Saffron',
        images: ['https://img.com/saffron.jpg'],
      });
      Product.findById.mockResolvedValue(product);

      const pushedItems = [];
      const cart = makeCart();
      // Override items array with a spy-able push
      cart.items = [];
      const originalPush = Array.prototype.push.bind(cart.items);
      cart.items.push = jest.fn((...args) => {
        pushedItems.push(...args);
        return originalPush(...args);
      });
      cart.items.findIndex = jest.fn().mockReturnValue(-1);
      Cart.findOne.mockResolvedValue(cart);

      await cartController.addItem(req, res, next);

      expect(pushedItems[0]).toMatchObject({
        unitPrice: 750,
        name: 'Pure Saffron',
        image: 'https://img.com/saffron.jpg',
      });
    });

    test('calls next with error on exception', async () => {
      req.body = { productId, quantity: 1 };
      Product.findById.mockRejectedValue(new Error('DB error'));

      await cartController.addItem(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // =========================================================================
  // updateItem — Requirements 2.3
  // =========================================================================

  describe('updateItem', () => {
    const itemId = '507f1f77bcf86cd799439099';

    function makeCartWithItem(itemOverrides = {}) {
      const item = makeCartItem({ ...itemOverrides, _id: itemId });
      item._id = { toString: () => itemId };
      return makeCart([item]);
    }

    test('updates quantity and returns recalculated totals (Req 2.3)', async () => {
      req.params = { itemId };
      req.body = { quantity: 5 };
      req.cookies = { sessionId: 'test-session-id' };

      const cart = makeCartWithItem({ unitPrice: 200 });
      Cart.findOne.mockResolvedValue(cart);
      Product.findById.mockResolvedValue(makeProduct({ stock: 10 }));

      await cartController.updateItem(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          cart: expect.objectContaining({
            subtotal: 1000,
            gst: 180,
            grandTotal: 1180,
          }),
        })
      );
    });

    test('returns 400 when quantity is 0 or invalid', async () => {
      req.params = { itemId };
      req.body = { quantity: 0 };

      await cartController.updateItem(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
        })
      );
    });

    test('returns 404 when cart item not found', async () => {
      req.params = { itemId: 'nonexistent-id' };
      req.body = { quantity: 2 };
      req.cookies = { sessionId: 'test-session-id' };

      Cart.findOne.mockResolvedValue(makeCart([]));

      await cartController.updateItem(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: 'NOT_FOUND' }),
        })
      );
    });

    test('returns 422 OUT_OF_STOCK when product is out of stock', async () => {
      req.params = { itemId };
      req.body = { quantity: 2 };
      req.cookies = { sessionId: 'test-session-id' };

      Cart.findOne.mockResolvedValue(makeCartWithItem());
      Product.findById.mockResolvedValue(makeProduct({ stock: 0 }));

      await cartController.updateItem(req, res, next);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: 'OUT_OF_STOCK' }),
        })
      );
    });

    test('returns 422 when new quantity exceeds available stock', async () => {
      req.params = { itemId };
      req.body = { quantity: 50 };
      req.cookies = { sessionId: 'test-session-id' };

      Cart.findOne.mockResolvedValue(makeCartWithItem());
      Product.findById.mockResolvedValue(makeProduct({ stock: 5 }));

      await cartController.updateItem(req, res, next);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: 'OUT_OF_STOCK' }),
        })
      );
    });

    test('returns 404 when product not found during update', async () => {
      req.params = { itemId };
      req.body = { quantity: 2 };
      req.cookies = { sessionId: 'test-session-id' };

      Cart.findOne.mockResolvedValue(makeCartWithItem());
      Product.findById.mockResolvedValue(null);

      await cartController.updateItem(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('calls next with error on exception', async () => {
      req.params = { itemId };
      req.body = { quantity: 2 };
      req.cookies = { sessionId: 'test-session-id' };
      Cart.findOne.mockRejectedValue(new Error('DB error'));

      await cartController.updateItem(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // =========================================================================
  // removeItem — Requirements 2.4
  // =========================================================================

  describe('removeItem', () => {
    const itemId = '507f1f77bcf86cd799439099';

    function makeCartWithItem(itemOverrides = {}) {
      const item = makeCartItem({ ...itemOverrides, _id: itemId });
      item._id = { toString: () => itemId };
      return makeCart([item]);
    }

    test('removes item and returns recalculated subtotal (Req 2.4)', async () => {
      req.params = { itemId };
      req.cookies = { sessionId: 'test-session-id' };

      Cart.findOne.mockResolvedValue(makeCartWithItem({ unitPrice: 500, quantity: 2 }));

      await cartController.removeItem(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          cart: expect.objectContaining({
            subtotal: 0,
            gst: 0,
            grandTotal: 0,
          }),
        })
      );
    });

    test('returns 404 when item not found in cart', async () => {
      req.params = { itemId: 'nonexistent-id' };
      req.cookies = { sessionId: 'test-session-id' };

      Cart.findOne.mockResolvedValue(makeCart([]));

      await cartController.removeItem(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: 'NOT_FOUND' }),
        })
      );
    });

    test('recalculates subtotal correctly after removing one of multiple items (Req 2.4)', async () => {
      req.params = { itemId };
      req.cookies = { sessionId: 'test-session-id' };

      const item1 = makeCartItem({ unitPrice: 300, quantity: 1 });
      item1._id = { toString: () => itemId };
      const item2 = makeCartItem({ unitPrice: 200, quantity: 2 });
      item2._id = { toString: () => 'other-item-id' };

      Cart.findOne.mockResolvedValue(makeCart([item1, item2]));

      await cartController.removeItem(req, res, next);

      // After removing item1 (300*1=300), only item2 (200*2=400) remains
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          cart: expect.objectContaining({
            subtotal: 400,
            gst: 72,
            grandTotal: 472,
          }),
        })
      );
    });

    test('calls next with error on exception', async () => {
      req.params = { itemId };
      req.cookies = { sessionId: 'test-session-id' };
      Cart.findOne.mockRejectedValue(new Error('DB error'));

      await cartController.removeItem(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
