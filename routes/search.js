import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Product from '../models/Product.js';

const router = express.Router();

// POST /api/search - AI-Powered Natural Language Search
router.post('/', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Search query is required'
      });
    }

    // Initialize Gemini API
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found in environment');
      return res.status(500).json({
        success: false,
        model: 'fallback',
        error: 'API key not configured',
        hint: 'Set GEMINI_API_KEY in .env file',
        products: []
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    console.log(`🔍 Search query: "${query}"`);

    // Step 1: Use Gemini to parse the natural language query
    const prompt = `You are a search query parser for a wholesale phone marketplace.

Parse this search query and extract structured parameters: "${query}"

Return ONLY a valid JSON object (no markdown, no explanation) with these fields:
{
  "brand": "Apple" or "Samsung" or null,
  "model": "iPhone 14 Pro" or "Galaxy S23" or null (include model number/name),
  "storage": "128GB" or "256GB" or null,
  "grade": "A" or "B" or "C" or "D" or "New" or "Like New" or "Good" or null,
  "priceMin": number or null,
  "priceMax": number or null,
  "phoneOrigin": "USA" or "Hong Kong" or "Japan" or "Australia" or "Europe" or "Canada" or null,
  "wholesalerRegion": "USA" or "Hong Kong" or null,
  "carrier": "Unlocked" or "AT&T" or "Verizon" or "T-Mobile" or null,
  "region": "Nigeria" or "Dubai" or "Kenya" or "Pakistan" or null (for profit calculation)
}

Examples:
- "iPhone 14 A-grade Nigeria under $250" → {"brand":"Apple","model":"iPhone 14","grade":"A","priceMax":250,"region":"Nigeria"}
- "Samsung bulk cheap" → {"brand":"Samsung","priceMax":300}
- "Best profit iPhones Japan origin" → {"brand":"Apple","phoneOrigin":"Japan"}
- "iPhone 17 Like New" → {"brand":"Apple","model":"iPhone 17","grade":"Like New"}

Return ONLY the JSON object.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    // Extract JSON from Gemini's response
    let searchParams;
    try {
      const responseText = response.text().trim();
      // Remove markdown code blocks if present
      const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      searchParams = JSON.parse(cleanJson);
      console.log('📊 Parsed params:', searchParams);
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response:', parseError);
      return res.status(500).json({
        success: false,
        model: 'fallback',
        error: 'Failed to parse search query',
        details: parseError.message,
        products: []
      });
    }

    // Step 2: Build MongoDB query from parsed parameters
    const mongoQuery = { inStock: true }; // Only show in-stock items

    if (searchParams.brand) {
      mongoQuery.brand = new RegExp(searchParams.brand, 'i');
    }
    if (searchParams.model) {
      mongoQuery.model = new RegExp(searchParams.model, 'i');
    }
    if (searchParams.storage) {
      mongoQuery.storage = searchParams.storage;
    }
    if (searchParams.grade) {
      mongoQuery.grade = searchParams.grade;
    }
    if (searchParams.phoneOrigin) {
      mongoQuery.phoneOrigin = searchParams.phoneOrigin;
    }
    if (searchParams.wholesalerRegion) {
      mongoQuery.wholesalerRegion = searchParams.wholesalerRegion;
    }
    if (searchParams.carrier) {
      mongoQuery.carrier = new RegExp(searchParams.carrier, 'i');
    }
    if (searchParams.priceMin || searchParams.priceMax) {
      mongoQuery.retailPrice = {};
      if (searchParams.priceMin) mongoQuery.retailPrice.$gte = searchParams.priceMin;
      if (searchParams.priceMax) mongoQuery.retailPrice.$lte = searchParams.priceMax;
    }

    console.log('🔎 MongoDB query:', mongoQuery);

    // Step 3: Query database
    const products = await Product.find(mongoQuery)
      .sort({ retailPrice: 1 }) // Sort by price ascending
      .limit(50); // Max 50 results

    console.log(`✅ Found ${products.length} products`);

    // Step 4: Calculate profit margins if region specified
    if (searchParams.region && products.length > 0) {
      // Profit multipliers by region (hardcoded for MVP)
      const profitMultipliers = {
        'Nigeria': 1.40,
        'Dubai': 1.35,
        'Kenya': 1.38,
        'Pakistan': 1.42,
        'Ghana': 1.39,
        'South Africa': 1.33
      };

      const multiplier = profitMultipliers[searchParams.region] || 1.30;

      products.forEach(product => {
        const resalePrice = Math.round(product.retailPrice * multiplier);
        const profit = resalePrice - product.retailPrice;
        const margin = ((profit / product.retailPrice) * 100).toFixed(1);

        product._doc.profitAnalysis = {
          region: searchParams.region,
          yourCost: product.retailPrice,
          resalePrice: resalePrice,
          profitPerUnit: profit,
          marginPercent: parseFloat(margin)
        };
      });
    }

    // Step 5: Return results in format frontend expects
    res.json({
      success: true,
      query: query,
      model: 'Flash',
      message: `Found ${products.length} products`,
      parsedParams: searchParams,
      products: products
    });

  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({
      success: false,
      model: 'fallback',
      error: 'Search failed',
      message: error.message,
      products: []
    });
  }
});

export default router;