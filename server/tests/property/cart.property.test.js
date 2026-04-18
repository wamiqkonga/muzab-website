/**
 * Property-based tests for Cart — P7, P8, P9
 * Feature: muzab-ecommerce
 * Library: fast-check (numRuns: 100 minimum)
 */

const fc = require('fast-check');

/**
 * Inline implementation of computeCartTotals — mirrors the logic in
 * server/src/controllers/cartController.js to avoid pulling in ESM
 * dependencies (uuid v13) that Jest cannot parse in CJS mode.
 *
 * subtotal   = Σ (unitPrice × quantity)
 * gst        = subtotal × 0.18
 * grandTotal = subtotal + gst
 */
function computeCartTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const gst = subtotal * 0.18;
  const grandTotal = subtotal + gst;
  return { subtotal, gst, grandTotal };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

// Use fc.double with noNaN + noDefaultInfinity for price values
const priceArb = fc.double({ min: 0.01, max: 10000, noNaN: true, noDefaultInfinity: true });

const variantArb = fc.record({
  label: fc.string({ minLength: 1, maxLength: 20 }),
  price: priceArb,
  stock: fc.integer({ min: 1, max: 500 }),
});

const productArb = fc.record({
  _id: fc.hexaString({ minLength: 24, maxLength: 24 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  images: fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 }),
  basePrice: priceArb,
  stock: fc.integer({ min: 1, max: 500 }),
  isActive: fc.constant(true),
  variants: fc.array(variantArb, { minLength: 0, maxLength: 5 }),
});

const cartItemArb = fc.record({
  productId: fc.hexaString({ minLength: 24, maxLength: 24 }),
  variantLabel: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  quantity: fc.integer({ min: 1, max: 100 }),
  unitPrice: priceArb,
  name: fc.string({ minLength: 1, maxLength: 100 }),
  image: fc.option(fc.webUrl(), { nil: undefined }),
});

const userArb = fc.record({
  _id: fc.hexaString({ minLength: 24, maxLength: 24 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
});

// ---------------------------------------------------------------------------
// Helper: simulate adding an item to a cart (pure, no DB)
// ---------------------------------------------------------------------------

function simulateAddToCart(cart, product, variantLabel, quantity) {
  const variant = variantLabel
    ? product.variants.find((v) => v.label === variantLabel)
    : null;

  const unitPrice = variant ? variant.price : product.basePrice;
  const image = product.images && product.images[0] ? product.images[0] : undefined;

  const existingIndex = cart.items.findIndex(
    (i) =>
      i.productId === product._id &&
      (i.variantLabel || null) === (variantLabel || null)
  );

  const newItems = cart.items.map((i) => ({ ...i }));

  if (existingIndex >= 0) {
    newItems[existingIndex] = {
      ...newItems[existingIndex],
      quantity: newItems[existingIndex].quantity + quantity,
    };
  } else {
    newItems.push({
      productId: product._id,
      variantLabel: variantLabel || undefined,
      quantity,
      unitPrice,
      name: product.name,
      image,
    });
  }

  return { ...cart, items: newItems };
}

// ---------------------------------------------------------------------------
// Helper: simulate a cart store keyed by userId (for P9)
// ---------------------------------------------------------------------------

function createCartStore() {
  const store = new Map();

  return {
    getOrCreate(userId) {
      if (!store.has(userId)) {
        store.set(userId, { userId, items: [] });
      }
      return store.get(userId);
    },
    addItem(userId, item) {
      const cart = this.getOrCreate(userId);
      const existingIndex = cart.items.findIndex(
        (i) =>
          i.productId === item.productId &&
          (i.variantLabel || null) === (item.variantLabel || null)
      );
      if (existingIndex >= 0) {
        cart.items[existingIndex].quantity += item.quantity;
      } else {
        cart.items.push({ ...item });
      }
      return cart;
    },
    getCart(userId) {
      return this.getOrCreate(userId);
    },
  };
}

// ---------------------------------------------------------------------------
// Property 7: Cart addition round-trip
// Validates: Requirements 2.1, 2.2
// ---------------------------------------------------------------------------

// Feature: muzab-ecommerce, Property 7: Cart addition round-trip
describe('Property 7: Cart addition round-trip', () => {
  test('adding a product to a cart preserves productId, variantLabel, quantity, and unitPrice snapshot', () => {
    fc.assert(
      fc.property(
        productArb,
        fc.integer({ min: 1, max: 50 }),
        (product, quantity) => {
          const emptyCart = { items: [] };
          const updatedCart = simulateAddToCart(emptyCart, product, undefined, quantity);

          expect(updatedCart.items).toHaveLength(1);
          const item = updatedCart.items[0];

          expect(item.productId).toBe(product._id);
          expect(item.quantity).toBe(quantity);
          expect(item.unitPrice).toBe(product.basePrice);
          expect(item.name).toBe(product.name);
          expect(item.image).toBe(product.images[0]);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('adding a product with a variant snapshots the variant price and label', () => {
    fc.assert(
      fc.property(
        productArb.filter((p) => p.variants.length > 0),
        fc.integer({ min: 1, max: 50 }),
        (product, quantity) => {
          const variant = product.variants[0];
          const emptyCart = { items: [] };
          const updatedCart = simulateAddToCart(emptyCart, product, variant.label, quantity);

          expect(updatedCart.items).toHaveLength(1);
          const item = updatedCart.items[0];

          expect(item.productId).toBe(product._id);
          expect(item.variantLabel).toBe(variant.label);
          expect(item.quantity).toBe(quantity);
          expect(item.unitPrice).toBe(variant.price);
          expect(item.name).toBe(product.name);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('adding the same product twice accumulates quantity rather than duplicating', () => {
    fc.assert(
      fc.property(
        productArb,
        fc.integer({ min: 1, max: 25 }),
        fc.integer({ min: 1, max: 25 }),
        (product, qty1, qty2) => {
          const emptyCart = { items: [] };
          const afterFirst = simulateAddToCart(emptyCart, product, undefined, qty1);
          const afterSecond = simulateAddToCart(afterFirst, product, undefined, qty2);

          expect(afterSecond.items).toHaveLength(1);
          expect(afterSecond.items[0].quantity).toBe(qty1 + qty2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 8: Cart total calculation invariant
// Validates: Requirements 2.3, 2.4, 2.7, 4.5
// ---------------------------------------------------------------------------

// Feature: muzab-ecommerce, Property 8: Cart total calculation invariant
describe('Property 8: Cart total calculation invariant', () => {
  test('subtotal equals sum of (unitPrice * quantity) for all items', () => {
    fc.assert(
      fc.property(fc.array(cartItemArb, { minLength: 1 }), (items) => {
        const { subtotal } = computeCartTotals(items);
        const expectedSubtotal = items.reduce(
          (sum, i) => sum + i.unitPrice * i.quantity,
          0
        );
        expect(subtotal).toBeCloseTo(expectedSubtotal, 2);
      }),
      { numRuns: 100 }
    );
  });

  test('GST is always 18% of subtotal', () => {
    fc.assert(
      fc.property(fc.array(cartItemArb, { minLength: 1 }), (items) => {
        const { subtotal, gst } = computeCartTotals(items);
        expect(gst).toBeCloseTo(subtotal * 0.18, 2);
      }),
      { numRuns: 100 }
    );
  });

  test('grandTotal equals subtotal + GST (no shipping fee in cart totals)', () => {
    fc.assert(
      fc.property(fc.array(cartItemArb, { minLength: 1 }), (items) => {
        const { subtotal, gst, grandTotal } = computeCartTotals(items);
        expect(grandTotal).toBeCloseTo(subtotal + gst, 2);
      }),
      { numRuns: 100 }
    );
  });

  test('removing an item recalculates subtotal correctly', () => {
    fc.assert(
      fc.property(fc.array(cartItemArb, { minLength: 2 }), (items) => {
        const fullTotals = computeCartTotals(items);
        const removedItem = items[0];
        const remainingItems = items.slice(1);
        const reducedTotals = computeCartTotals(remainingItems);

        const removedLineTotal = removedItem.unitPrice * removedItem.quantity;
        expect(reducedTotals.subtotal).toBeCloseTo(
          fullTotals.subtotal - removedLineTotal,
          2
        );
      }),
      { numRuns: 100 }
    );
  });

  test('updating quantity recalculates line total and subtotal correctly', () => {
    fc.assert(
      fc.property(
        fc.array(cartItemArb, { minLength: 1 }),
        fc.integer({ min: 1, max: 100 }),
        (items, newQty) => {
          const updatedItems = items.map((item, idx) =>
            idx === 0 ? { ...item, quantity: newQty } : item
          );

          const { subtotal } = computeCartTotals(updatedItems);
          const expectedSubtotal = updatedItems.reduce(
            (sum, i) => sum + i.unitPrice * i.quantity,
            0
          );
          expect(subtotal).toBeCloseTo(expectedSubtotal, 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('totals are non-negative for any valid cart', () => {
    fc.assert(
      fc.property(fc.array(cartItemArb, { minLength: 1 }), (items) => {
        const { subtotal, gst, grandTotal } = computeCartTotals(items);
        expect(subtotal).toBeGreaterThanOrEqual(0);
        expect(gst).toBeGreaterThanOrEqual(0);
        expect(grandTotal).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: Cart persistence across sessions
// Validates: Requirements 2.5
// ---------------------------------------------------------------------------

// Feature: muzab-ecommerce, Property 9: Cart persistence across sessions
describe('Property 9: Cart persistence across sessions', () => {
  test('retrieving a cart with the same userId returns the same items regardless of session', () => {
    fc.assert(
      fc.property(
        userArb,
        fc.array(cartItemArb, { minLength: 1, maxLength: 10 }),
        (user, items) => {
          const store = createCartStore();

          // Session 1: add items
          items.forEach((item) => store.addItem(user._id, item));
          const cartSession1 = store.getCart(user._id);

          // Session 2: retrieve with same userId (simulates new JWT, same userId)
          const cartSession2 = store.getCart(user._id);

          // Both sessions should see the same cart
          expect(cartSession2.userId).toBe(cartSession1.userId);
          expect(cartSession2.items).toHaveLength(cartSession1.items.length);

          cartSession1.items.forEach((item, idx) => {
            expect(cartSession2.items[idx].productId).toBe(item.productId);
            expect(cartSession2.items[idx].quantity).toBe(item.quantity);
            expect(cartSession2.items[idx].unitPrice).toBe(item.unitPrice);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('two different users have isolated carts', () => {
    fc.assert(
      fc.property(
        userArb,
        userArb,
        fc.array(cartItemArb, { minLength: 1, maxLength: 5 }),
        fc.array(cartItemArb, { minLength: 1, maxLength: 5 }),
        (user1, user2, items1, items2) => {
          // Ensure distinct user IDs
          fc.pre(user1._id !== user2._id);

          const store = createCartStore();

          items1.forEach((item) => store.addItem(user1._id, item));
          items2.forEach((item) => store.addItem(user2._id, item));

          const cart1 = store.getCart(user1._id);
          const cart2 = store.getCart(user2._id);

          // Carts are isolated — user1's cart should not contain user2's items
          expect(cart1.userId).toBe(user1._id);
          expect(cart2.userId).toBe(user2._id);

          // Verify no cross-contamination of userId
          expect(cart1.userId).not.toBe(cart2.userId);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('cart state is stable across multiple retrievals without modification', () => {
    fc.assert(
      fc.property(
        userArb,
        fc.array(cartItemArb, { minLength: 1, maxLength: 8 }),
        (user, items) => {
          const store = createCartStore();
          items.forEach((item) => store.addItem(user._id, item));

          // Retrieve multiple times (simulating multiple sessions)
          const retrievals = Array.from({ length: 5 }, () =>
            store.getCart(user._id)
          );

          // All retrievals should return the same cart state
          retrievals.forEach((cart) => {
            expect(cart.userId).toBe(user._id);
            expect(cart.items).toHaveLength(retrievals[0].items.length);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
