const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    label: { type: String }, // e.g. "1g", "5g", "10ml"
    price: { type: Number },
    stock: { type: Number, default: 0 },
    sku: { type: String },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    category: { type: String, trim: true },
    description: { type: String },
    ingredients: { type: String },
    images: [{ type: String }],
    basePrice: { type: Number },
    variants: [variantSchema],
    stock: { type: Number, default: 0 }, // total / default stock (no variants)
    isActive: { type: Boolean, default: true },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

/**
 * Generate a URL-friendly slug from a string.
 * Lowercases, replaces spaces with hyphens, removes non-alphanumeric chars (except hyphens).
 */
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Pre-save hook: generate slug from name if not already set or if name changed.
 * If the generated slug already exists in the DB, append a short unique suffix.
 */
productSchema.pre('save', async function (next) {
  if (!this.isModified('name') && this.slug) {
    return next();
  }

  const baseSlug = generateSlug(this.name);

  // Check for existing slug (exclude current document on updates)
  const existing = await mongoose.model('Product').findOne({
    slug: baseSlug,
    _id: { $ne: this._id },
  });

  if (!existing) {
    this.slug = baseSlug;
  } else {
    // Append a short random hex suffix to ensure uniqueness
    const suffix = Math.random().toString(36).substring(2, 7);
    this.slug = `${baseSlug}-${suffix}`;
  }

  next();
});

// Index for fast slug lookups and catalog queries
productSchema.index({ slug: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
