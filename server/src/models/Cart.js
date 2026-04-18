const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantLabel: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true }, // snapshot at time of add
    name: { type: String, required: true },       // snapshot
    image: { type: String },                      // snapshot
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    sessionId: { type: String },
    items: [cartItemSchema],
  },
  {
    timestamps: { createdAt: false, updatedAt: 'updatedAt' },
  }
);

module.exports = mongoose.model('Cart', cartSchema);
