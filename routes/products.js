import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

// GET /api/products - List all products with filters
router.get('/', async (req, res) => {
  try {
    const { 
      brand, 
      grade, 
      phoneOrigin, 
      wholesalerRegion,
      minPrice,
      maxPrice,
      inStock,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};
    if (brand) query.brand = new RegExp(brand, 'i');
    if (grade) query.grade = grade;
    if (phoneOrigin) query.phoneOrigin = phoneOrigin;
    if (wholesalerRegion) query.wholesalerRegion = wholesalerRegion;
    if (inStock !== undefined) query.inStock = inStock === 'true';
    
    if (minPrice || maxPrice) {
      query.retailPrice = {};
      if (minPrice) query.retailPrice.$gte = parseInt(minPrice);
      if (maxPrice) query.retailPrice.$lte = parseInt(maxPrice);
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('❌ Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products - Create product (admin only - add auth later)
router.post('/', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    
    console.log('✅ Product created:', product.sku);
    res.status(201).json(product);
  } catch (error) {
    console.error('❌ Create product error:', error);
    res.status(400).json({ 
      error: 'Failed to create product',
      details: error.message 
    });
  }
});

// GET /api/products/:id/profit - Calculate profit for region
router.get('/:id/profit', async (req, res) => {
  try {
    const { region = 'Nigeria' } = req.query;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Profit multipliers by region
    const profitMultipliers = {
      'Nigeria': 1.40,
      'Dubai': 1.35,
      'Kenya': 1.38,
      'Pakistan': 1.42,
      'Ghana': 1.39,
      'South Africa': 1.33
    };

    const multiplier = profitMultipliers[region] || 1.30;
    const resalePrice = Math.round(product.retailPrice * multiplier);
    const profit = resalePrice - product.retailPrice;
    const margin = ((profit / product.retailPrice) * 100).toFixed(1);

    res.json({
      product: {
        id: product._id,
        sku: product.sku,
        brand: product.brand,
        model: product.model
      },
      region,
      yourCost: product.retailPrice,
      resalePrice,
      profitPerUnit: profit,
      marginPercent: parseFloat(margin)
    });
  } catch (error) {
    console.error('❌ Profit calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate profit' });
  }
});

export default router;