/**
 * Seed sample saffron products into the database.
 * Usage: node src/scripts/seedProducts.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const products = [
  {
    name: 'Kashmiri Mongra Saffron',
    category: 'Saffron',
    description: 'The finest grade of Kashmiri saffron — deep red threads with an intense aroma and rich golden colour. Handpicked from the Pampore fields of Kashmir.',
    ingredients: '100% pure Crocus sativus stigmas',
    images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600'],
    basePrice: 599,
    variants: [
      { label: '1g', price: 599, stock: 50, sku: 'MNG-1G' },
      { label: '2g', price: 1099, stock: 30, sku: 'MNG-2G' },
      { label: '5g', price: 2499, stock: 20, sku: 'MNG-5G' },
    ],
    stock: 100,
    isActive: true,
    tags: ['saffron', 'mongra', 'premium', 'kashmiri'],
  },
  {
    name: 'Kashmiri Lacha Saffron',
    category: 'Saffron',
    description: 'Premium Lacha saffron with long, intact threads. Perfect for biryanis, desserts, and traditional Kashmiri recipes.',
    ingredients: '100% pure Crocus sativus stigmas',
    images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600'],
    basePrice: 499,
    variants: [
      { label: '1g', price: 499, stock: 60, sku: 'LCH-1G' },
      { label: '2g', price: 899, stock: 40, sku: 'LCH-2G' },
      { label: '5g', price: 1999, stock: 25, sku: 'LCH-5G' },
    ],
    stock: 125,
    isActive: true,
    tags: ['saffron', 'lacha', 'kashmiri'],
  },
  {
    name: 'Saffron Powder',
    category: 'Saffron',
    description: 'Pure saffron ground to a fine powder for easy use in cooking, skincare, and beverages. No additives or fillers.',
    ingredients: '100% pure Crocus sativus',
    images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600'],
    basePrice: 449,
    variants: [
      { label: '1g', price: 449, stock: 80, sku: 'PWD-1G' },
      { label: '3g', price: 1199, stock: 50, sku: 'PWD-3G' },
    ],
    stock: 130,
    isActive: true,
    tags: ['saffron', 'powder', 'ground'],
  },
  {
    name: 'Saffron Infused Almond Oil',
    category: 'Oils',
    description: 'Cold-pressed almond oil infused with pure Kashmiri saffron. Ideal for skin brightening, hair nourishment, and massage.',
    ingredients: 'Cold-pressed almond oil, Kashmiri saffron extract',
    images: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600'],
    basePrice: 349,
    variants: [
      { label: '30ml', price: 349, stock: 40, sku: 'OIL-30' },
      { label: '60ml', price: 599, stock: 30, sku: 'OIL-60' },
    ],
    stock: 70,
    isActive: true,
    tags: ['oil', 'almond', 'saffron', 'skincare'],
  },
  {
    name: 'Saffron Face Cream',
    category: 'Skincare',
    description: 'Luxurious saffron-enriched face cream that brightens skin tone, reduces dark spots, and provides deep hydration.',
    ingredients: 'Saffron extract, shea butter, aloe vera, vitamin E',
    images: ['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600'],
    basePrice: 499,
    variants: [
      { label: '50g', price: 499, stock: 35, sku: 'CRM-50' },
    ],
    stock: 35,
    isActive: true,
    tags: ['skincare', 'face cream', 'saffron', 'brightening'],
  },
  {
    name: 'Kashmiri Kahwa Mix',
    category: 'Spices',
    description: 'Traditional Kashmiri Kahwa blend with saffron, cardamom, cinnamon, and rose petals. Just add hot water for an authentic cup.',
    ingredients: 'Green tea, saffron, cardamom, cinnamon, rose petals, almonds',
    images: ['https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600'],
    basePrice: 299,
    variants: [
      { label: '50g', price: 299, stock: 60, sku: 'KHW-50' },
      { label: '100g', price: 549, stock: 40, sku: 'KHW-100' },
    ],
    stock: 100,
    isActive: true,
    tags: ['kahwa', 'tea', 'spices', 'kashmiri'],
  },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await Product.countDocuments();
  if (existing > 0) {
    console.log(`${existing} products already exist. Skipping seed.`);
    console.log('To re-seed, run: node src/scripts/seedProducts.js --force');
    if (!process.argv.includes('--force')) {
      process.exit(0);
    }
    await Product.deleteMany({});
    console.log('Cleared existing products.');
  }

  const created = await Product.insertMany(products);
  console.log(`✅ Seeded ${created.length} products successfully.`);
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
