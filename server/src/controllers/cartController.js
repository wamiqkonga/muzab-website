const { v4: uuidv4 } = require('uuid');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Cookie config for guest session
const SESSION_COOKIE = 'sessionId';
const COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

/**
 * Compute cart totals from items array.
 * subtotal = sum(unitPrice * quantity)
 * gst      = subtotal * 0.18
 * grandTotal = subtotal + gst
 */
function computeCartTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const gst = subtotal * 0.18;
  const grandTotal = subtotal + gst;
  return { subtotal, gst, grandTotal };
}

/**
 * Resolve (or create) a cart for the current request.
 * Authenticated users: resolved by userId.
 * Guests: resolved by sessionId cookie; generates one if absent.
 * Returns { cart, sessionId } — sessionId may be newly generated.
 */
async function resolveCart(req, res) {
  if (req.user) {
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }
    return { cart, sessionId: null };
  }

  let sessionId = req.cookies && req.cookies[SESSION_COOKIE];
  if (!sessionId) {
    sessionId = uuidv4();
    res.cookie(SESSION_COOKIE, sessionId, COOKIE_OPTIONS);
  }

  let cart = await Cart.findOne({ sessionId });
  if (!cart) {
    cart = await Cart.create({ sessionId, items: [] });
  }
  return { cart, sessionId };
}

/**
 * Build the cart response payload with totals and optional outOfStock flags.
 */
function buildCartResponse(cart, totals, items) {
  return {
    _id: cart._id,
    userId: cart.userId,
    sessionId: cart.sessionId,
    items,
    ...totals,
  };
}

/**
 * GET /api/cart
 * Return the cart with computed totals and outOfStock flags per item.
 */
async function getCart(req, res, next) {
  try {
    const { cart } = await resolveCart(req, res);

    // Cross-check current stock for each item
    const itemsWithStockFlag = await Promise.all(
      cart.items.map(async (item) => {
        const product = await Product.findById(item.productId).lean();
        let outOfStock = false;

        if (!product) {
          outOfStock = true;
        } else if (item.variantLabel) {
          const variant = product.variants.find((v) => v.label === item.variantLabel);
          outOfStock = !variant || variant.stock === 0;
        } else {
          outOfStock = product.stock === 0;
        }

        return {
          _id: item._id,
          productId: item.productId,
          variantLabel: item.variantLabel,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          name: item.name,
          image: item.image,
          outOfStock,
        };
      })
    );

    const totals = computeCartTotals(cart.items);

    return res.json({
      success: true,
      cart: buildCartResponse(cart, totals, itemsWithStockFlag),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/cart/items
 * Add an item to the cart.
 * Body: { productId, variantLabel?, quantity }
 */
async function addItem(req, res, next) {
  try {
    const { productId, variantLabel, quantity } = req.body;

    // Validate required fields
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'productId is required', details: [] },
      });
    }

    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'quantity must be >= 1', details: [] },
      });
    }

    // Look up product
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found', details: [] },
      });
    }

    // Determine stock and price
    let availableStock;
    let unitPrice;

    if (variantLabel) {
      const variant = product.variants.find((v) => v.label === variantLabel);
      if (!variant) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Variant "${variantLabel}" not found`, details: [] },
        });
      }
      availableStock = variant.stock;
      unitPrice = variant.price;
    } else {
      availableStock = product.stock;
      unitPrice = product.basePrice;
    }

    if (availableStock === 0) {
      return res.status(422).json({
        success: false,
        error: { code: 'OUT_OF_STOCK', message: 'Product is out of stock', details: [] },
      });
    }

    const { cart } = await resolveCart(req, res);

    // Check if item already exists in cart (same productId + variantLabel)
    const existingIndex = cart.items.findIndex(
      (i) =>
        i.productId.toString() === productId.toString() &&
        (i.variantLabel || null) === (variantLabel || null)
    );

    if (existingIndex >= 0) {
      const newQty = cart.items[existingIndex].quantity + qty;
      if (newQty > availableStock) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'OUT_OF_STOCK',
            message: `Only ${availableStock} unit(s) available`,
            details: [],
          },
        });
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
      if (qty > availableStock) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'OUT_OF_STOCK',
            message: `Only ${availableStock} unit(s) available`,
            details: [],
          },
        });
      }
      cart.items.push({
        productId: product._id,
        variantLabel: variantLabel || undefined,
        quantity: qty,
        unitPrice,
        name: product.name,
        image: product.images && product.images[0] ? product.images[0] : undefined,
      });
    }

    await cart.save();

    const totals = computeCartTotals(cart.items);

    return res.status(200).json({
      success: true,
      cart: buildCartResponse(cart, totals, cart.items),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/cart/items/:itemId
 * Update quantity of a cart item.
 * Body: { quantity } (must be >= 1)
 */
async function updateItem(req, res, next) {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'quantity must be >= 1', details: [] },
      });
    }

    const { cart } = await resolveCart(req, res);

    const itemIndex = cart.items.findIndex((i) => i._id.toString() === itemId);
    if (itemIndex < 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Cart item not found', details: [] },
      });
    }

    const item = cart.items[itemIndex];

    // Validate stock availability for new quantity
    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found', details: [] },
      });
    }

    let availableStock;
    if (item.variantLabel) {
      const variant = product.variants.find((v) => v.label === item.variantLabel);
      availableStock = variant ? variant.stock : 0;
    } else {
      availableStock = product.stock;
    }

    if (availableStock === 0) {
      return res.status(422).json({
        success: false,
        error: { code: 'OUT_OF_STOCK', message: 'Product is out of stock', details: [] },
      });
    }

    if (qty > availableStock) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'OUT_OF_STOCK',
          message: `Only ${availableStock} unit(s) available`,
          details: [],
        },
      });
    }

    cart.items[itemIndex].quantity = qty;
    await cart.save();

    const totals = computeCartTotals(cart.items);

    return res.json({
      success: true,
      cart: buildCartResponse(cart, totals, cart.items),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/cart/items/:itemId
 * Remove an item from the cart.
 */
async function removeItem(req, res, next) {
  try {
    const { itemId } = req.params;

    const { cart } = await resolveCart(req, res);

    const itemIndex = cart.items.findIndex((i) => i._id.toString() === itemId);
    if (itemIndex < 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Cart item not found', details: [] },
      });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    const totals = computeCartTotals(cart.items);

    return res.json({
      success: true,
      cart: buildCartResponse(cart, totals, cart.items),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCart, addItem, updateItem, removeItem, computeCartTotals };
