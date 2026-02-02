// Seed script with REAL inventory data from screenshots
// Run: node seed-real-data.js

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const MONGODB_URI = process.env.MONGODB_URI;

// 10% markup for retail
const markup = (price) => Math.round(price * 1.10);

// Real inventory data from screenshots (100 total units)
// All prices have 10% markup applied
const products = [
  // === IPHONES (60 units) ===
  {
    name: 'iPhone 13 mini',
    model: 'iPhone 13 mini',
    storage: '128GB',
    price: markup(243),
    wholesalePrice: markup(243), // $267
    category: 'iPhone',
    inStock: true,
    variations: [
      { storage: '128GB', grade: 'A2', color: 'Red', price: markup(243), stock: 8, origin: 'US' },
      { storage: '128GB', grade: 'A2', color: 'Black', price: markup(243), stock: 4, origin: 'US' },
      { storage: '128GB', grade: 'A2', color: 'White', price: markup(243), stock: 4, origin: 'US' },
      { storage: '128GB', grade: 'A2', color: 'Blue', price: markup(243), stock: 3, origin: 'US' },
      { storage: '128GB', grade: 'A2', color: 'Pink', price: markup(243), stock: 3, origin: 'US' },
      { storage: '128GB', grade: 'A2', color: 'Green', price: markup(243), stock: 1, origin: 'US' },
    ]
  },
  {
    name: 'iPhone 13',
    model: 'iPhone 13',
    storage: '256GB',
    price: markup(290),
    wholesalePrice: markup(290), // $319
    category: 'iPhone',
    inStock: true,
    variations: [
      { storage: '256GB', grade: 'B1 (Low Batt)', color: 'Green', price: markup(280), stock: 9, origin: 'US' }, // $308
      { storage: '256GB', grade: 'B1 (Low Batt)', color: 'Red', price: markup(300), stock: 5, origin: 'US' }, // $330
    ]
  },
  {
    name: 'iPhone 14 Pro',
    model: 'iPhone 14 Pro',
    storage: '128GB',
    price: markup(330),
    wholesalePrice: markup(330), // $363
    category: 'iPhone',
    inStock: true,
    variations: [
      { storage: '128GB', grade: 'B1', color: 'Black', price: markup(330), stock: 10, origin: 'US' },
    ]
  },
  {
    name: 'iPhone 15',
    model: 'iPhone 15',
    storage: '128GB',
    price: markup(395),
    wholesalePrice: markup(395), // $435
    category: 'iPhone',
    inStock: true,
    variations: [
      { storage: '128GB', grade: 'A2', color: 'Blue', price: markup(395), stock: 10, origin: 'US' },
    ]
  },
  {
    name: 'iPhone 16 Pro',
    model: 'iPhone 16 Pro',
    storage: '128GB',
    price: markup(665),
    wholesalePrice: markup(665), // $732
    category: 'iPhone',
    inStock: true,
    variations: [
      { storage: '128GB', grade: 'A2', color: 'Black', price: markup(665), stock: 3, origin: 'US' },
    ]
  },

  // === IPADS (40 units) ===
  {
    name: 'iPad Air 3 (2019)',
    model: 'iPad Air 3',
    storage: '64GB',
    price: markup(70),
    wholesalePrice: markup(70), // $77
    category: 'iPad',
    inStock: true,
    variations: [
      { storage: '64GB', grade: 'B1', color: 'Gold', price: markup(70), stock: 1, origin: 'US' },
    ]
  },
  {
    name: 'iPad 9th Gen (2021)',
    model: 'iPad 9th Gen',
    storage: '64GB',
    price: markup(185),
    wholesalePrice: markup(185), // $204
    category: 'iPad',
    inStock: true,
    variations: [
      { storage: '64GB', grade: 'B2', color: 'Space Gray', price: markup(185), stock: 33, origin: 'US' },
    ]
  },
  {
    name: 'iPad 6th Gen (2018)',
    model: 'iPad 6th Gen',
    storage: '32GB',
    price: markup(125),
    wholesalePrice: markup(125), // $138
    category: 'iPad',
    inStock: true,
    variations: [
      { storage: '32GB', grade: 'B2', color: 'Space Gray', price: markup(125), stock: 6, origin: 'US' },
    ]
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Insert new products
    const result = await Product.insertMany(products);
    console.log(`✅ Inserted ${result.length} products`);

    // Count total units
    let totalUnits = 0;
    products.forEach(p => {
      p.variations.forEach(v => {
        totalUnits += v.stock;
      });
    });
    console.log(`📦 Total units in inventory: ${totalUnits}`);

    // Summary
    console.log('\n📋 INVENTORY SUMMARY:');
    products.forEach(p => {
      const units = p.variations.reduce((sum, v) => sum + v.stock, 0);
      console.log(`   ${p.name}: ${units} units @ $${p.wholesalePrice} wholesale / $${p.price} retail`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seedDatabase();
