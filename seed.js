// Seed script to populate MongoDB with sample wholesale phone inventory
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const sampleProducts = [
  // iPhone 16 Series
  {
    name: 'iPhone 16 Pro Max',
    model: 'iPhone 16 Pro Max',
    storage: '256GB',
    price: 1199,
    wholesalePrice: 1050,
    category: 'iPhone',
    image: '',
    inStock: true,
    variations: [
      { storage: '256GB', price: 1050, grade: 'Brand New', color: 'Desert Titanium', stock: 150, origin: 'US' },
      { storage: '512GB', price: 1180, grade: 'Brand New', color: 'Natural Titanium', stock: 100, origin: 'US' },
      { storage: '1TB', price: 1350, grade: 'Brand New', color: 'Black Titanium', stock: 50, origin: 'JP' },
    ]
  },
  {
    name: 'iPhone 16 Pro',
    model: 'iPhone 16 Pro',
    storage: '128GB',
    price: 999,
    wholesalePrice: 870,
    category: 'iPhone',
    image: '',
    inStock: true,
    variations: [
      { storage: '128GB', price: 870, grade: 'Brand New', color: 'Desert Titanium', stock: 200, origin: 'US' },
      { storage: '256GB', price: 950, grade: 'Brand New', color: 'Natural Titanium', stock: 180, origin: 'HK' },
      { storage: '512GB', price: 1080, grade: 'Brand New', color: 'White Titanium', stock: 80, origin: 'JP' },
    ]
  },
  {
    name: 'iPhone 16',
    model: 'iPhone 16',
    storage: '128GB',
    price: 799,
    wholesalePrice: 680,
    category: 'iPhone',
    image: '',
    inStock: true,
    variations: [
      { storage: '128GB', price: 680, grade: 'Brand New', color: 'Blue', stock: 300, origin: 'US' },
      { storage: '256GB', price: 750, grade: 'Brand New', color: 'Pink', stock: 250, origin: 'EU' },
      { storage: '512GB', price: 880, grade: 'Brand New', color: 'Black', stock: 120, origin: 'HK' },
    ]
  },
  // iPhone 15 Series
  {
    name: 'iPhone 15 Pro Max',
    model: 'iPhone 15 Pro Max',
    storage: '256GB',
    price: 1099,
    wholesalePrice: 920,
    category: 'iPhone',
    image: '',
    inStock: true,
    variations: [
      { storage: '256GB', price: 920, grade: 'Brand New', color: 'Natural Titanium', stock: 180, origin: 'US' },
      { storage: '256GB', price: 850, grade: 'Refurb A', color: 'Blue Titanium', stock: 90, origin: 'JP' },
      { storage: '512GB', price: 1020, grade: 'Brand New', color: 'Black Titanium', stock: 70, origin: 'HK' },
      { storage: '1TB', price: 1180, grade: 'Brand New', color: 'White Titanium', stock: 40, origin: 'AU' },
    ]
  },
  {
    name: 'iPhone 15 Pro',
    model: 'iPhone 15 Pro',
    storage: '128GB',
    price: 899,
    wholesalePrice: 750,
    category: 'iPhone',
    image: '',
    inStock: true,
    variations: [
      { storage: '128GB', price: 750, grade: 'Brand New', color: 'Natural Titanium', stock: 220, origin: 'US' },
      { storage: '128GB', price: 680, grade: 'Refurb A', color: 'Blue Titanium', stock: 150, origin: 'JP' },
      { storage: '256GB', price: 820, grade: 'Brand New', color: 'Black Titanium', stock: 100, origin: 'HK' },
      { storage: '256GB', price: 720, grade: 'Refurb A', color: 'White Titanium', stock: 80, origin: 'EU' },
    ]
  },
  {
    name: 'iPhone 15',
    model: 'iPhone 15',
    storage: '128GB',
    price: 699,
    wholesalePrice: 580,
    category: 'iPhone',
    image: '',
    inStock: true,
    variations: [
      { storage: '128GB', price: 580, grade: 'Brand New', color: 'Blue', stock: 350, origin: 'US' },
      { storage: '128GB', price: 520, grade: 'Refurb A', color: 'Pink', stock: 200, origin: 'HK' },
      { storage: '256GB', price: 650, grade: 'Brand New', color: 'Yellow', stock: 180, origin: 'EU' },
      { storage: '256GB', price: 580, grade: 'Refurb A', color: 'Green', stock: 120, origin: 'JP' },
    ]
  },
  {
    name: 'iPhone 15 Plus',
    model: 'iPhone 15 Plus',
    storage: '128GB',
    price: 799,
    wholesalePrice: 670,
    category: 'iPhone',
    image: '',
    inStock: true,
    variations: [
      { storage: '128GB', price: 670, grade: 'Brand New', color: 'Blue', stock: 150, origin: 'US' },
      { storage: '256GB', price: 740, grade: 'Brand New', color: 'Pink', stock: 100, origin: 'HK' },
    ]
  },
  // iPhone 14 Series
  {
    name: 'iPhone 14 Pro Max',
    model: 'iPhone 14 Pro Max',
    storage: '128GB',
    price: 899,
    wholesalePrice: 720,
    category: 'iPhone',
    image: '',
    inStock: true,
    variations: [
      { storage: '128GB', price: 720, grade: 'Brand New', color: 'Deep Purple', stock: 100, origin: 'US' },
      { storage: '128GB', price: 620, grade: 'Refurb A', color: 'Gold', stock: 180, origin: 'HK' },
      { storage: '128GB', price: 550, grade: 'Refurb B', color: 'Space Black', stock: 250, origin: 'JP' },
      { storage: '256GB', price: 780, grade: 'Brand New', color: 'Silver', stock: 80, origin: 'EU' },
      { storage: '256GB', price: 680, grade: 'Refurb A', color: 'Deep Purple', stock: 120, origin: 'AU' },
    ]
  },
  {
    name: 'iPhone 14 Pro',
    model: 'iPhone 14 Pro',
    storage: '128GB',
    price: 799,
    wholesalePrice: 620,
    category: 'iPhone',
    image: '',
    inStock: true,
    variations: [
      { storage: '128GB', price: 620, grade: 'Brand New', color: 'Space Black', stock: 150, origin: 'US' },
      { storage: '128GB', price: 540, grade: 'Refurb A', color: 'Deep Purple', stock: 200, origin: 'HK' },
      { storage: '128GB', price: 480, grade: 'Refurb B', color: 'Gold', stock: 180, origin: 'JP' },
      { storage: '256GB', price: 680, grade: 'Brand New', color: 'Silver', stock: 100, origin: 'EU' },
    ]
  },
  {
    name: 'iPhone 14',
    model: 'iPhone 14',
    storage: '128GB',
    price: 599,
    wholesalePrice: 480,
    category: 'iPhone',
    image: '',
    inStock: true,
    variations: [
      { storage: '128GB', price: 480, grade: 'Brand New', color: 'Blue', stock: 300, origin: 'US' },
      { storage: '128GB', price: 420, grade: 'Refurb A', color: 'Purple', stock: 250, origin: 'HK' },
      { storage: '128GB', price: 380, grade: 'Refurb B', color: 'Red', stock: 200, origin: 'JP' },
      { storage: '256GB', price: 540, grade: 'Brand New', color: 'Starlight', stock: 150, origin: 'EU' },
    ]
  },
  {
    name: 'iPhone 14 Plus',
    model: 'iPhone 14 Plus',
    storage: '128GB',
    price: 699,
    wholesalePrice: 560,
    category: 'iPhone',
    image: '',
    inStock: true,
    variations: [
      { storage: '128GB', price: 560, grade: 'Brand New', color: 'Blue', stock: 120, origin: 'US' },
      { storage: '128GB', price: 480, grade: 'Refurb A', color: 'Purple', stock: 100, origin: 'HK' },
    ]
  },
  // iPhone 13 Series
  {
    name: 'iPhone 13 Pro Max',
    model: 'iPhone 13 Pro Max',
    storage: '128GB',
    price: 699,
    wholesalePrice: 520,
    category: 'iPhone',
    image: '',
    inStock: true,
    variations: [
      { storage: '128GB', price: 520, grade: 'Refurb A', color: 'Sierra Blue', stock: 150, origin: 'US' },
      { storage: '128GB', price: 450, grade: 'Refurb B', color: 'Graphite', stock: 200, origin: 'HK' },
      { storage: '256GB', price: 580, grade: 'Refurb A', color: 'Gold', stock: 100, origin: 'JP' },
    ]
  },
  {
    name: 'iPhone 13 Pro',
    model: 'iPhone 13 Pro',
    storage: '128GB',
    price: 599,
    wholesalePrice: 450,
    category: 'iPhone',
    image: '',
    inStock: true,
    variations: [
      { storage: '128GB', price: 450, grade: 'Refurb A', color: 'Sierra Blue', stock: 180, origin: 'US' },
      { storage: '128GB', price: 380, grade: 'Refurb B', color: 'Graphite', stock: 220, origin: 'HK' },
      { storage: '256GB', price: 500, grade: 'Refurb A', color: 'Gold', stock: 120, origin: 'JP' },
    ]
  },
  {
    name: 'iPhone 13',
    model: 'iPhone 13',
    storage: '128GB',
    price: 499,
    wholesalePrice: 380,
    category: 'iPhone',
    image: '',
    inStock: true,
    variations: [
      { storage: '128GB', price: 380, grade: 'Brand New', color: 'Midnight', stock: 250, origin: 'US' },
      { storage: '128GB', price: 320, grade: 'Refurb A', color: 'Blue', stock: 300, origin: 'HK' },
      { storage: '128GB', price: 280, grade: 'Refurb B', color: 'Pink', stock: 350, origin: 'JP' },
    ]
  },
  // iPhone 12 Series
  {
    name: 'iPhone 12 Pro Max',
    model: 'iPhone 12 Pro Max',
    storage: '128GB',
    price: 549,
    wholesalePrice: 380,
    category: 'iPhone',
    image: '',
    inStock: true,
    variations: [
      { storage: '128GB', price: 380, grade: 'Refurb A', color: 'Pacific Blue', stock: 120, origin: 'US' },
      { storage: '128GB', price: 320, grade: 'Refurb B', color: 'Graphite', stock: 180, origin: 'HK' },
    ]
  },
  {
    name: 'iPhone 12',
    model: 'iPhone 12',
    storage: '64GB',
    price: 399,
    wholesalePrice: 280,
    category: 'iPhone',
    image: '',
    inStock: true,
    variations: [
      { storage: '64GB', price: 280, grade: 'Refurb A', color: 'Blue', stock: 250, origin: 'US' },
      { storage: '64GB', price: 240, grade: 'Refurb B', color: 'Black', stock: 300, origin: 'HK' },
      { storage: '128GB', price: 320, grade: 'Refurb A', color: 'White', stock: 180, origin: 'JP' },
    ]
  },
  // iPhone 11 Series
  {
    name: 'iPhone 11',
    model: 'iPhone 11',
    storage: '64GB',
    price: 299,
    wholesalePrice: 200,
    category: 'iPhone',
    image: '',
    inStock: true,
    variations: [
      { storage: '64GB', price: 200, grade: 'Refurb A', color: 'Black', stock: 300, origin: 'US' },
      { storage: '64GB', price: 170, grade: 'Refurb B', color: 'White', stock: 400, origin: 'HK' },
      { storage: '64GB', price: 140, grade: 'Refurb C', color: 'Red', stock: 250, origin: 'JP' },
    ]
  },
  // iPad Series
  {
    name: 'iPad Pro 12.9" (M4)',
    model: 'iPad Pro 12.9" M4',
    storage: '256GB',
    price: 1099,
    wholesalePrice: 950,
    category: 'iPad',
    image: '',
    inStock: true,
    variations: [
      { storage: '256GB', price: 950, grade: 'Brand New', color: 'Space Black', stock: 80, origin: 'US' },
      { storage: '512GB', price: 1100, grade: 'Brand New', color: 'Silver', stock: 50, origin: 'HK' },
    ]
  },
  {
    name: 'iPad Air (M2)',
    model: 'iPad Air M2',
    storage: '128GB',
    price: 599,
    wholesalePrice: 520,
    category: 'iPad',
    image: '',
    inStock: true,
    variations: [
      { storage: '128GB', price: 520, grade: 'Brand New', color: 'Space Gray', stock: 150, origin: 'US' },
      { storage: '256GB', price: 600, grade: 'Brand New', color: 'Blue', stock: 100, origin: 'HK' },
    ]
  },
  {
    name: 'iPad 10th Gen',
    model: 'iPad 10th Generation',
    storage: '64GB',
    price: 349,
    wholesalePrice: 290,
    category: 'iPad',
    image: '',
    inStock: true,
    variations: [
      { storage: '64GB', price: 290, grade: 'Brand New', color: 'Blue', stock: 200, origin: 'US' },
      { storage: '64GB', price: 250, grade: 'Refurb A', color: 'Pink', stock: 150, origin: 'HK' },
    ]
  },
];

async function seedDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Drop the problematic index if it exists
    try {
      await mongoose.connection.collection('products').dropIndex('sku_1');
      console.log('🔧 Dropped sku_1 index');
    } catch (e) {
      // Index might not exist, that's fine
    }

    // Clear existing products
    console.log('🗑️  Clearing existing products...');
    await Product.deleteMany({});
    console.log('✅ Cleared existing products');

    // Insert new products
    console.log('📦 Inserting sample products...');
    const result = await Product.insertMany(sampleProducts);
    console.log(`✅ Inserted ${result.length} products`);

    // Log summary
    const iphones = result.filter(p => p.category === 'iPhone').length;
    const ipads = result.filter(p => p.category === 'iPad').length;
    console.log(`\n📊 Summary:`);
    console.log(`   - iPhones: ${iphones}`);
    console.log(`   - iPads: ${ipads}`);
    console.log(`   - Total: ${result.length}`);

    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedDatabase();
