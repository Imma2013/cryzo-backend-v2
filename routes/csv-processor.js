import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import Product from '../models/Product.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for CSV file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// POST /api/csv/process - Process multiple wholesaler CSVs with Claude intelligence
router.post('/process', upload.array('csvFiles', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No CSV files uploaded' });
    }

    console.log(`📦 Processing ${req.files.length} CSV files...`);

    // Initialize Claude
    const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });

    const allProducts = [];
    const processingLogs = [];

    // Process each CSV file
    for (const file of req.files) {
      const csvText = file.buffer.toString('utf-8');
      processingLogs.push(`Reading ${file.originalname}...`);

      // Use Claude to intelligently parse the CSV
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `You are a CSV parser for wholesale phone inventory. Parse this CSV and extract product data.

CSV Content:
${csvText}

Return ONLY a valid JSON array (no markdown, no explanation) with this structure:
[
  {
    "brand": "Apple" or "Samsung",
    "model": "iPhone 14 Pro Max" (full model name),
    "storage": "128GB" or "256GB" etc,
    "grade": "Brand New" or "Refurb A" or "Refurb B" or "Refurb C" or "Refurb D",
    "phoneOrigin": "USA" or "Hong Kong" or "Japan" or "Europe" or "Australia",
    "wholesalerRegion": "USA" or "Hong Kong" or "China",
    "retailPrice": number (wholesale price in USD),
    "units": number (stock quantity),
    "sku": "unique identifier",
    "carrier": "Unlocked" or carrier name,
    "simType": "Physical SIM" or "Dual SIM" or "eSIM"
  }
]

Rules:
- Extract ALL products from the CSV
- Convert prices to numbers (remove $ symbols)
- Normalize grade names (A → Refurb A, New → Brand New)
- If origin is "HK", convert to "Hong Kong"
- If data is missing, use sensible defaults
- Return ONLY the JSON array`
        }]
      });

      try {
        const responseText = message.content[0].text.trim();
        const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const products = JSON.parse(cleanJson);
        
        allProducts.push(...products.map(p => ({
          ...p,
          wholesalerSource: file.originalname,
          inStock: p.units > 0
        })));

        processingLogs.push(`✓ Parsed ${products.length} products from ${file.originalname}`);
      } catch (parseError) {
        console.error(`❌ Failed to parse ${file.originalname}:`, parseError);
        processingLogs.push(`✗ Failed to parse ${file.originalname}`);
      }
    }

    // Price War Logic: Find lowest price for each unique product
    const consolidatedMap = new Map();

    allProducts.forEach(product => {
      const key = `${product.brand}-${product.model}-${product.storage}-${product.grade}-${product.phoneOrigin}`.toLowerCase();
      const existing = consolidatedMap.get(key);

      if (!existing) {
        consolidatedMap.set(key, product);
      } else {
        // Keep the lowest price
        if (product.retailPrice < existing.retailPrice) {
          existing.retailPrice = product.retailPrice;
          existing.wholesalerSource = product.wholesalerSource;
        }
        // Combine stock
        existing.units += product.units;
        consolidatedMap.set(key, existing);
      }
    });

    const finalProducts = Array.from(consolidatedMap.values());
    processingLogs.push(`🎯 Consolidated to ${finalProducts.length} unique best-price products`);

    // Save to database (upsert logic)
    let created = 0;
    let updated = 0;

    for (const productData of finalProducts) {
      try {
        const existing = await Product.findOne({ sku: productData.sku });
        
        if (existing) {
          // Update existing product
          Object.assign(existing, productData);
          await existing.save();
          updated++;
        } else {
          // Create new product
          const newProduct = new Product(productData);
          await newProduct.save();
          created++;
        }
      } catch (dbError) {
        console.error(`❌ DB error for ${productData.sku}:`, dbError.message);
      }
    }

    processingLogs.push(`✅ Database: ${created} created, ${updated} updated`);

    res.json({
      success: true,
      filesProcessed: req.files.length,
      totalProductsParsed: allProducts.length,
      uniqueProducts: finalProducts.length,
      databaseStats: { created, updated },
      logs: processingLogs,
      products: finalProducts
    });

  } catch (error) {
    console.error('❌ CSV processing error:', error);
    res.status(500).json({ 
      error: 'CSV processing failed',
      message: error.message 
    });
  }
});

// POST /api/csv/chatbot - Chatbot for price list queries
router.post('/chatbot', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });

    // Get all products from database
    const allProducts = await Product.find({ inStock: true }).limit(1000);

    // Create a summary for Claude
    const productSummary = allProducts.map(p => 
      `${p.brand} ${p.model} ${p.storage} ${p.grade} - $${p.retailPrice} (${p.units} units)`
    ).join('\n');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `You are a wholesale inventory assistant. Answer this query based on the inventory data.

User Query: "${query}"

Inventory Data:
${productSummary}

Provide a helpful response. If they ask for a price list, format it as a markdown table.
If they ask for export, tell them the data is ready and provide a summary.`
      }]
    });

    const response = message.content[0].text;

    // Check if user wants export
    const wantsExport = query.toLowerCase().includes('export') || 
                        query.toLowerCase().includes('excel') ||
                        query.toLowerCase().includes('download');

    res.json({
      query,
      response,
      exportReady: wantsExport,
      productCount: allProducts.length,
      products: wantsExport ? allProducts : []
    });

  } catch (error) {
    console.error('❌ Chatbot error:', error);
    res.status(500).json({ 
      error: 'Chatbot failed',
      message: error.message 
    });
  }
});

export default router;
