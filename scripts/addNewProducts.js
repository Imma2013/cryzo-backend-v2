// Run this script to add iPhone 16 Pro Max, iPhone 16e, and iPhone 17 products
// Usage: node scripts/addNewProducts.js

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const MONGO_URI = process.env.MONGO_URI;

// Helper to map grades
const mapGrade = (grade) => {
  if (grade.includes('Grade 1')) return 'Like New';
  if (grade.includes('Grade 2')) return 'Like New';
  if (grade.includes('Grade 3')) return 'Good';
  return 'Good';
};

// 10% markup on prices
const markup = (price) => Math.round(price * 1.10);

const newProducts = [
  // iPhone 16 Pro Max
  {
    name: 'iPhone 16 Pro Max',
    model: 'iPhone 16 Pro Max',
    category: 'iPhone',
    inStock: true,
    variations: [
      // Grade 1 (A) - 256GB
      { storage: '256GB', grade: 'Like New', color: 'Black Titanium', stock: 24, price: markup(808), origin: 'US' },
      { storage: '256GB', grade: 'Like New', color: 'Desert Titanium', stock: 42, price: markup(808), origin: 'US' },
      { storage: '256GB', grade: 'Like New', color: 'Natural Titanium', stock: 14, price: markup(808), origin: 'US' },
      { storage: '256GB', grade: 'Like New', color: 'White Titanium', stock: 11, price: markup(808), origin: 'US' },
      // Grade 1 (A) - 512GB
      { storage: '512GB', grade: 'Like New', color: 'Black Titanium', stock: 50, price: markup(938), origin: 'US' },
      { storage: '512GB', grade: 'Like New', color: 'Desert Titanium', stock: 9, price: markup(938), origin: 'US' },
      { storage: '512GB', grade: 'Like New', color: 'Natural Titanium', stock: 4, price: markup(938), origin: 'US' },
      { storage: '512GB', grade: 'Like New', color: 'White Titanium', stock: 1, price: markup(938), origin: 'US' },
      // Grade 1 (A) - 1TB
      { storage: '1TB', grade: 'Like New', color: 'Black Titanium', stock: 4, price: markup(1000), origin: 'US' },
      { storage: '1TB', grade: 'Like New', color: 'Desert Titanium', stock: 1, price: markup(1000), origin: 'US' },
      // Grade 2 (A) - 256GB
      { storage: '256GB', grade: 'Like New', color: 'Black Titanium', stock: 26, price: markup(799), origin: 'US' },
      { storage: '256GB', grade: 'Like New', color: 'Desert Titanium', stock: 18, price: markup(799), origin: 'US' },
      { storage: '256GB', grade: 'Like New', color: 'Natural Titanium', stock: 18, price: markup(799), origin: 'US' },
      { storage: '256GB', grade: 'Like New', color: 'White Titanium', stock: 7, price: markup(799), origin: 'US' },
      // Grade 2 (A) - 512GB
      { storage: '512GB', grade: 'Like New', color: 'Black Titanium', stock: 24, price: markup(928), origin: 'US' },
      { storage: '512GB', grade: 'Like New', color: 'Desert Titanium', stock: 3, price: markup(928), origin: 'US' },
      { storage: '512GB', grade: 'Like New', color: 'Natural Titanium', stock: 2, price: markup(928), origin: 'US' },
      { storage: '512GB', grade: 'Like New', color: 'White Titanium', stock: 1, price: markup(928), origin: 'US' },
      // Grade 2 (A) - 1TB
      { storage: '1TB', grade: 'Like New', color: 'Black Titanium', stock: 12, price: markup(989), origin: 'US' },
      // Grade 3 (B) - 256GB
      { storage: '256GB', grade: 'Good', color: 'Black Titanium', stock: 34, price: markup(775), origin: 'US' },
      { storage: '256GB', grade: 'Good', color: 'Desert Titanium', stock: 42, price: markup(775), origin: 'US' },
      { storage: '256GB', grade: 'Good', color: 'Natural Titanium', stock: 17, price: markup(775), origin: 'US' },
      // Grade 3 (B) - 512GB
      { storage: '512GB', grade: 'Good', color: 'Black Titanium', stock: 20, price: markup(901), origin: 'US' },
      { storage: '512GB', grade: 'Good', color: 'Desert Titanium', stock: 8, price: markup(901), origin: 'US' },
      { storage: '512GB', grade: 'Good', color: 'Natural Titanium', stock: 1, price: markup(901), origin: 'US' },
      { storage: '512GB', grade: 'Good', color: 'White Titanium', stock: 4, price: markup(901), origin: 'US' },
      // Grade 3 (B) - 1TB
      { storage: '1TB', grade: 'Good', color: 'Black Titanium', stock: 26, price: markup(961), origin: 'US' },
      { storage: '1TB', grade: 'Good', color: 'White Titanium', stock: 11, price: markup(961), origin: 'US' },
    ]
  },
  // iPhone 16e
  {
    name: 'iPhone 16e',
    model: 'iPhone 16e',
    category: 'iPhone',
    inStock: true,
    variations: [
      { storage: '128GB', grade: 'Like New', color: 'Black', stock: 8, price: markup(358), origin: 'US' },
      { storage: '128GB', grade: 'Like New', color: 'White', stock: 7, price: markup(358), origin: 'US' },
    ]
  },
  // iPhone 17
  {
    name: 'iPhone 17',
    model: 'iPhone 17',
    category: 'iPhone',
    inStock: true,
    variations: [
      // 256GB
      { storage: '256GB', grade: 'Like New', color: 'Black', stock: 29, price: markup(759), origin: 'US' },
      { storage: '256GB', grade: 'Like New', color: 'Lavender', stock: 21, price: markup(759), origin: 'US' },
      { storage: '256GB', grade: 'Like New', color: 'Mist Blue', stock: 42, price: markup(759), origin: 'US' },
      { storage: '256GB', grade: 'Like New', color: 'Sage', stock: 7, price: markup(759), origin: 'US' },
      { storage: '256GB', grade: 'Like New', color: 'White', stock: 11, price: markup(759), origin: 'US' },
      // 512GB
      { storage: '512GB', grade: 'Like New', color: 'Black', stock: 4, price: markup(838), origin: 'US' },
      { storage: '512GB', grade: 'Like New', color: 'Lavender', stock: 1, price: markup(838), origin: 'US' },
      { storage: '512GB', grade: 'Like New', color: 'Mist Blue', stock: 1, price: markup(838), origin: 'US' },
      { storage: '512GB', grade: 'Like New', color: 'Sage', stock: 1, price: markup(838), origin: 'US' },
      { storage: '512GB', grade: 'Like New', color: 'White', stock: 2, price: markup(838), origin: 'US' },
    ]
  }
];

async function addProducts() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    for (const product of newProducts) {
      // Check if product already exists
      const existing = await Product.findOne({ model: product.model });
      if (existing) {
        // Update existing product - merge variations
        console.log(`Updating ${product.model}...`);
        existing.variations = product.variations;
        existing.inStock = true;
        await existing.save();
        console.log(`✓ Updated ${product.model}`);
      } else {
        // Create new product
        console.log(`Creating ${product.model}...`);
        await Product.create(product);
        console.log(`✓ Created ${product.model}`);
      }
    }

    console.log('\n✅ All products added successfully!');
    console.log('New products:');
    console.log('- iPhone 16 Pro Max (28 variations)');
    console.log('- iPhone 16e (2 variations)');
    console.log('- iPhone 17 (10 variations)');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addProducts();
