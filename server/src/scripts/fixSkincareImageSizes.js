/**
 * Append a resize param to oversized Pexels product images so they don't
 * serve full-resolution originals on the storefront.
 * Usage: node src/scripts/fixSkincareImageSizes.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const products = await Product.find({ category: 'Skincare' });
  let updated = 0;

  for (const product of products) {
    let changed = false;
    product.images = product.images.map((url) => {
      if (url.includes('images.pexels.com') && !url.includes('w=')) {
        changed = true;
        return `${url}&w=800`;
      }
      return url;
    });
    if (changed) {
      await product.save();
      updated += 1;
      console.log(`Updated: ${product.name}`);
    }
  }

  console.log(`Done. ${updated} product(s) updated.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
