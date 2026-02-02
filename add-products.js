// Add your real product data to MongoDB
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

// Your pasted data - parsed
const rawProducts = [
  { model: 'iPhone 13', grade: 'Refurb A', storage: '256GB', color: 'White', stock: 1, price: 295 },
  { model: 'iPhone 13', grade: 'Refurb A', storage: '256GB', color: 'Pink', stock: 2, price: 285, note: 'Low Battery' },
  { model: 'iPhone 13', grade: 'Refurb A', storage: '128GB', color: 'Red', stock: 1, price: 245, note: 'Low Battery' },
  { model: 'iPhone 13', grade: 'Refurb B', storage: '256GB', color: 'Red', stock: 1, price: 290 },
  { model: 'iPhone 13', grade: 'Refurb B', storage: '256GB', color: 'Green', stock: 9, price: 280, note: 'Low Battery' },
  { model: 'iPhone 13', grade: 'Refurb B', storage: '256GB', color: 'Red', stock: 5, price: 300, note: 'Low Battery' },
  { model: 'iPhone 13 mini', grade: 'Refurb A', storage: '256GB', color: 'White', stock: 1, price: 343 },
  { model: 'iPhone 13 mini', grade: 'Refurb A', storage: '128GB', color: 'Red', stock: 8, price: 243 },
  { model: 'iPhone 13 mini', grade: 'Refurb A', storage: '128GB', color: 'Black', stock: 11, price: 243 },
  { model: 'iPhone 13 mini', grade: 'Refurb A', storage: '128GB', color: 'White', stock: 4, price: 243 },
  { model: 'iPhone 13 mini', grade: 'Refurb A', storage: '256GB', color: 'Blue', stock: 11, price: 328 },
  { model: 'iPhone 13 mini', grade: 'Refurb A', storage: '256GB', color: 'White', stock: 5, price: 328 },
  { model: 'iPhone 13 mini', grade: 'Refurb A', storage: '256GB', color: 'Red', stock: 3, price: 328 },
  { model: 'iPhone 13 mini', grade: 'Refurb A', storage: '256GB', color: 'Pink', stock: 4, price: 328 },
  { model: 'iPhone 13 mini', grade: 'Refurb A', storage: '256GB', color: 'Green', stock: 1, price: 328 },
  { model: 'iPhone 13 mini', grade: 'Refurb A', storage: '128GB', color: 'Blue', stock: 3, price: 243 },
  { model: 'iPhone 13 mini', grade: 'Refurb A', storage: '128GB', color: 'Pink', stock: 3, price: 243 },
  { model: 'iPhone 13 mini', grade: 'Refurb A', storage: '128GB', color: 'Green', stock: 1, price: 243 },
  { model: 'iPhone 13 mini', grade: 'Refurb A', storage: '256GB', color: 'Red', stock: 4, price: 318, note: 'Low Battery' },
  { model: 'iPhone 13 mini', grade: 'Refurb A', storage: '256GB', color: 'Pink', stock: 16, price: 255, note: 'Low Battery' },
  { model: 'iPhone 13 mini', grade: 'Refurb A', storage: '256GB', color: 'White', stock: 15, price: 255, note: 'Low Battery' },
  { model: 'iPhone 13 mini', grade: 'Refurb A', storage: '128GB', color: 'White', stock: 3, price: 190, note: 'Low Battery' },
  { model: 'iPhone 13 mini', grade: 'Refurb A', storage: '256GB', color: 'Blue', stock: 7, price: 318, note: 'Low Battery' },
  { model: 'iPhone 13 mini', grade: 'Refurb A', storage: '128GB', color: 'Green', stock: 1, price: 233, note: 'Low Battery' },
  { model: 'iPhone 13 mini', grade: 'Refurb A', storage: '128GB', color: 'Pink', stock: 2, price: 233, note: 'Low Battery' },
  { model: 'iPhone 13 mini', grade: 'Refurb A', storage: '128GB', color: 'Black', stock: 2, price: 211, note: 'Low Battery' },
  { model: 'iPhone 13 mini', grade: 'Refurb A', storage: '128GB', color: 'Blue', stock: 3, price: 233, note: 'Low Battery' },
  { model: 'iPhone 13 mini', grade: 'Refurb B', storage: '128GB', color: 'Pink', stock: 3, price: 238 },
  { model: 'iPhone 13 mini', grade: 'Refurb B', storage: '512GB', color: 'Green', stock: 1, price: 353 },
  { model: 'iPhone 13 mini', grade: 'Refurb B', storage: '256GB', color: 'Blue', stock: 3, price: 323 },
  { model: 'iPhone 13 mini', grade: 'Refurb B', storage: '128GB', color: 'Red', stock: 2, price: 238 },
  { model: 'iPhone 13 mini', grade: 'Refurb B', storage: '128GB', color: 'Black', stock: 3, price: 238 },
  { model: 'iPhone 13 mini', grade: 'Refurb B', storage: '128GB', color: 'Blue', stock: 2, price: 238 },
  { model: 'iPhone 13 mini', grade: 'Refurb B', storage: '128GB', color: 'Green', stock: 2, price: 238 },
  { model: 'iPhone 13 mini', grade: 'Refurb B', storage: '128GB', color: 'White', stock: 1, price: 238 },
  { model: 'iPhone 13 mini', grade: 'Refurb B', storage: '256GB', color: 'Blue', stock: 3, price: 313, note: 'Low Battery' },
  { model: 'iPhone 13 mini', grade: 'Refurb B', storage: '128GB', color: 'White', stock: 3, price: 228, note: 'Low Battery' },
  { model: 'iPhone 13 mini', grade: 'Refurb B', storage: '128GB', color: 'Green', stock: 4, price: 228, note: 'Low Battery' },
  { model: 'iPhone 13 mini', grade: 'Refurb B', storage: '128GB', color: 'Black', stock: 3, price: 228, note: 'Low Battery' },
  { model: 'iPhone 13 mini', grade: 'Refurb B', storage: '128GB', color: 'Pink', stock: 2, price: 228, note: 'Low Battery' },
  { model: 'iPhone 13 mini', grade: 'Refurb B', storage: '128GB', color: 'Blue', stock: 2, price: 185, note: 'Low Battery' },
  { model: 'iPhone 13 mini', grade: 'Refurb B', storage: '256GB', color: 'White', stock: 2, price: 215, note: 'Low Battery' },
  { model: 'iPhone 13 mini', grade: 'Refurb B', storage: '256GB', color: 'Pink', stock: 2, price: 313, note: 'Low Battery' },
  { model: 'iPhone 13 mini', grade: 'Refurb B', storage: '128GB', color: 'Blue', stock: 1, price: 213, note: 'Low Battery' },
  { model: 'iPhone 13 mini', grade: 'Refurb C', storage: '256GB', color: 'White', stock: 1, price: 293 },
  { model: 'iPhone 13 mini', grade: 'Refurb C', storage: '128GB', color: 'Red', stock: 2, price: 198 },
  { model: 'iPhone 13 mini', grade: 'Refurb C', storage: '128GB', color: 'Blue', stock: 2, price: 198 },
  { model: 'iPhone 13 mini', grade: 'Refurb C', storage: '128GB', color: 'Red', stock: 1, price: 208, note: 'Low Battery' },
  { model: 'iPhone 13 mini', grade: 'Refurb D', storage: '256GB', color: 'Black', stock: 1, price: 170, note: 'Cracked' },
  { model: 'iPhone 13 mini', grade: 'Refurb D', storage: '128GB', color: 'Pink', stock: 1, price: 190, note: 'Non Genuine Parts' },
  { model: 'iPhone 14', grade: 'Refurb A', storage: '128GB', color: 'Yellow', stock: 2, price: 290 },
  { model: 'iPhone 14', grade: 'Refurb A', storage: '128GB', color: 'Blue', stock: 2, price: 290 },
  { model: 'iPhone 14', grade: 'Refurb A', storage: '128GB', color: 'Red', stock: 1, price: 280, note: 'Low Battery' },
  { model: 'iPhone 14', grade: 'Refurb B', storage: '128GB', color: 'Black', stock: 1, price: 260 },
  { model: 'iPhone 14', grade: 'Refurb B', storage: '128GB', color: 'Yellow', stock: 2, price: 260 },
  { model: 'iPhone 14', grade: 'Refurb B', storage: '128GB', color: 'Blue', stock: 1, price: 260 },
  { model: 'iPhone 14', grade: 'Refurb B', storage: '128GB', color: 'Yellow', stock: 1, price: 240, note: 'Low Battery' },
  { model: 'iPhone 14', grade: 'Refurb B', storage: '128GB', color: 'Yellow', stock: 1, price: 260, note: 'Low Battery' },
  { model: 'iPhone 14', grade: 'Refurb B', storage: '128GB', color: 'Purple', stock: 2, price: 270 },
  { model: 'iPhone 14 Plus', grade: 'Refurb B', storage: '128GB', color: 'Yellow', stock: 2, price: 295 },
  { model: 'iPhone 14 Pro', grade: 'Refurb A', storage: '128GB', color: 'Black', stock: 3, price: 375 },
  { model: 'iPhone 14 Pro', grade: 'Refurb B', storage: '128GB', color: 'Black', stock: 14, price: 330 },
  { model: 'iPhone 14 Pro', grade: 'Refurb B', storage: '128GB', color: 'Purple', stock: 10, price: 330 },
  { model: 'iPhone 15', grade: 'Brand New', storage: '128GB', color: 'Black', stock: 2, price: 460 },
  { model: 'iPhone 15', grade: 'Refurb A', storage: '128GB', color: 'Blue', stock: 1, price: 445 },
  { model: 'iPhone 15', grade: 'Refurb A', storage: '128GB', color: 'Pink', stock: 1, price: 445 },
  { model: 'iPhone 15', grade: 'Refurb A', storage: '128GB', color: 'Black', stock: 1, price: 445 },
  { model: 'iPhone 15', grade: 'Refurb A', storage: '128GB', color: 'Green', stock: 1, price: 445 },
  { model: 'iPhone 15', grade: 'Refurb A', storage: '128GB', color: 'Green', stock: 3, price: 395 },
  { model: 'iPhone 15', grade: 'Refurb A', storage: '128GB', color: 'Blue', stock: 51, price: 395 },
  { model: 'iPhone 15', grade: 'Refurb A', storage: '128GB', color: 'Yellow', stock: 1, price: 395 },
  { model: 'iPhone 15', grade: 'Refurb A', storage: '128GB', color: 'Black', stock: 2, price: 395 },
  { model: 'iPhone 15', grade: 'Refurb A', storage: '128GB', color: 'Blue', stock: 3, price: 400, note: 'Low Battery' },
  { model: 'iPhone 15', grade: 'Refurb A', storage: '128GB', color: 'Pink', stock: 4, price: 400, note: 'Low Battery' },
  { model: 'iPhone 15', grade: 'Refurb A', storage: '128GB', color: 'Yellow', stock: 2, price: 385, note: 'Low Battery' },
  { model: 'iPhone 15', grade: 'Refurb A', storage: '128GB', color: 'Green', stock: 3, price: 385, note: 'Low Battery' },
  { model: 'iPhone 15', grade: 'Refurb A', storage: '128GB', color: 'Black', stock: 1, price: 385, note: 'Low Battery' },
  { model: 'iPhone 15', grade: 'Refurb A', storage: '128GB', color: 'Blue', stock: 2, price: 385, note: 'Low Battery' },
  { model: 'iPhone 15', grade: 'Refurb B', storage: '128GB', color: 'Blue', stock: 11, price: 390 },
  { model: 'iPhone 15', grade: 'Refurb B', storage: '128GB', color: 'Green', stock: 3, price: 390 },
  { model: 'iPhone 15', grade: 'Refurb B', storage: '128GB', color: 'Black', stock: 4, price: 390 },
  { model: 'iPhone 15', grade: 'Refurb B', storage: '128GB', color: 'Yellow', stock: 3, price: 390 },
  { model: 'iPhone 15', grade: 'Refurb B', storage: '128GB', color: 'Pink', stock: 11, price: 390 },
  { model: 'iPhone 15', grade: 'Refurb B', storage: '128GB', color: 'Black', stock: 1, price: 380, note: 'Low Battery' },
  { model: 'iPhone 15', grade: 'Refurb B', storage: '128GB', color: 'Blue', stock: 1, price: 370 },
  { model: 'iPhone 15', grade: 'Refurb C', storage: '128GB', color: 'Blue', stock: 3, price: 365 },
  { model: 'iPhone 15', grade: 'Refurb C', storage: '128GB', color: 'Pink', stock: 2, price: 365 },
  { model: 'iPhone 15 Plus', grade: 'Refurb A', storage: '128GB', color: 'Pink', stock: 1, price: 475 },
  { model: 'iPhone 15 Plus', grade: 'Refurb A', storage: '256GB', color: 'Blue', stock: 2, price: 500 },
  { model: 'iPhone 15 Plus', grade: 'Refurb A', storage: '128GB', color: 'Pink', stock: 3, price: 420 },
  { model: 'iPhone 15 Plus', grade: 'Refurb A', storage: '256GB', color: 'Green', stock: 2, price: 482 },
];

// Group products by model to create product documents with variations
function groupProducts(products) {
  const grouped = {};

  products.forEach(p => {
    const key = p.model;
    if (!grouped[key]) {
      grouped[key] = {
        name: p.model,
        model: p.model,
        category: 'iPhone',
        inStock: true,
        variations: []
      };
    }

    // Add 10% markup for retail price
    const retailPrice = Math.round(p.price * 1.10);

    grouped[key].variations.push({
      storage: p.storage,
      grade: p.grade,
      color: p.color,
      price: p.price, // wholesale price
      retailPrice: retailPrice,
      stock: p.stock,
      origin: 'US',
      note: p.note || null
    });
  });

  // Set base prices from first variation
  Object.values(grouped).forEach(product => {
    const firstVar = product.variations[0];
    product.storage = firstVar.storage;
    product.price = Math.round(firstVar.price * 1.10); // retail
    product.wholesalePrice = firstVar.price;
  });

  return Object.values(grouped);
}

async function addProducts() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected');

    // Clear existing and add new
    console.log('🗑️  Clearing old products...');
    await Product.deleteMany({});

    const groupedProducts = groupProducts(rawProducts);
    console.log(`📦 Adding ${groupedProducts.length} product models with ${rawProducts.length} variations...`);

    const result = await Product.insertMany(groupedProducts);
    console.log(`✅ Added ${result.length} products`);

    // Summary
    const totalVariations = result.reduce((sum, p) => sum + p.variations.length, 0);
    const totalStock = rawProducts.reduce((sum, p) => sum + p.stock, 0);

    console.log(`\n📊 Summary:`);
    console.log(`   - Products: ${result.length}`);
    console.log(`   - Variations: ${totalVariations}`);
    console.log(`   - Total Units: ${totalStock}`);

    console.log('\n🎉 Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addProducts();
