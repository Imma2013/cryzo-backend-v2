const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ============================================
// RESPONSE CACHE - For faster repeated queries
// ============================================
const searchCache = new Map();
const chatCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Model selection - Use Gemini Flash for everything (speed + quality)
const selectModel = (userQuery) => {
  // Use Gemini 3.0 Flash Preview for speed and great understanding
  return { name: "gemini-3-flash-preview", type: "Flash" };
};

// Contact endpoint
router.get('/contact', (req, res) => {
  res.json({
    email: "sales@cryzo.co.in",
    phone: "+1 940-400-9316"
  });
});

// Get all products - USA origin only
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({
      inStock: true,
      'variations.origin': 'US'
    }).limit(50);

    // Flatten products with variations for frontend
    const flattenedProducts = [];
    products.forEach(product => {
      if (product.variations && product.variations.length > 0) {
        // Use first variation as the default display
        const defaultVar = product.variations[0];
        flattenedProducts.push({
          _id: product._id,
          brand: product.category === 'iPhone' ? 'Apple' : 'Apple',
          model: product.model,
          name: product.name,
          storage: defaultVar.storage || product.storage,
          grade: defaultVar.grade || 'Brand New',
          color: defaultVar.color || 'Black',
          priceUsd: defaultVar.price || product.wholesalePrice,
          retailPrice: product.price,
          stock: defaultVar.stock || 100,
          origin: defaultVar.origin || 'US',
          category: product.category,
          image: product.image,
          inStock: product.inStock,
          variations: product.variations
        });
      } else {
        flattenedProducts.push({
          _id: product._id,
          brand: 'Apple',
          model: product.model,
          name: product.name,
          storage: product.storage,
          grade: 'Brand New',
          color: 'Black',
          priceUsd: product.wholesalePrice,
          retailPrice: product.price,
          stock: 100,
          origin: 'US',
          category: product.category,
          image: product.image,
          inStock: product.inStock,
          variations: []
        });
      }
    });

    res.json({ products: flattenedProducts, total: flattenedProducts.length });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get single product
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// AI Search endpoint - THE MOAT (Powered by Gemini)
router.post('/search', async (req, res) => {
  const { query } = req.body;
  const startTime = Date.now();

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  // ============================================
  // CHECK CACHE FIRST - Instant response
  // ============================================
  const cacheKey = query.toLowerCase().trim();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('🚀 Cache hit for:', query);
    return res.json({ ...cached.data, cached: true, processingTime: Date.now() - startTime });
  }

  try {
    // Fetch all products from database - USA origin only
    const products = await Product.find({
      inStock: true,
      'variations.origin': 'US'
    });

    if (products.length === 0) {
      return res.json({
        success: true,
        query,
        model: 'none',
        message: 'No products in inventory. Please add products to the database.',
        products: [],
        processingTime: Date.now() - startTime
      });
    }

    // ============================================
    // ALL SEARCHES GO TO AI (Gemini Flash)
    // ============================================
    console.log(`🤖 AI Search: "${query}"`);

    // Build compact inventory summary for AI (much faster than full inventory)
    const uniqueModels = [...new Set(products.map(p => p.model))];
    const uniqueStorages = [...new Set(products.flatMap(p => p.variations?.map(v => v.storage) || [p.storage]))];
    const uniqueGrades = [...new Set(products.flatMap(p => p.variations?.map(v => v.grade) || ['Brand New']))];
    const priceRange = products.reduce((acc, p) => {
      const prices = p.variations?.map(v => v.price) || [p.wholesalePrice];
      return { min: Math.min(acc.min, ...prices), max: Math.max(acc.max, ...prices) };
    }, { min: Infinity, max: 0 });

    const inventorySummary = `Models: ${uniqueModels.join(', ')}
Storages: ${uniqueStorages.join(', ')}
Conditions: ${uniqueGrades.join(', ')}
Price range: $${priceRange.min} - $${priceRange.max}`;

    // Select appropriate Gemini model
    const selectedModel = selectModel(query);
    const model = genAI.getGenerativeModel({ model: selectedModel.name });

    console.log(`\n🤖 AI Search: "${query}" using Gemini ${selectedModel.type}`);
    console.log(`📦 Inventory: ${products.length} products`);

    // Build compact prompt for Gemini (smaller = faster)
    const systemPrompt = `You are Cryzo AI search. Parse the user query into filters.

AVAILABLE INVENTORY:
${inventorySummary}

USER: "${query}"

Return JSON only:
{"message":"Brief response","filters":{"models":["iPhone 15"],"storage":"256GB","grades":["A2"],"maxPrice":800},"suggestion":"tip"}
}`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = await response.text();

    console.log(`📝 Gemini raw response (first 500 chars):`, text.substring(0, 500));

    // Parse AI response
    let aiResponse;
    try {
      // Clean up response - remove markdown code blocks if present
      const cleanText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      aiResponse = JSON.parse(cleanText);
      console.log(`✅ Parsed AI response:`, aiResponse);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError.message);
      console.log('Raw text:', text);

      // Fallback: basic text search
      const searchTerms = query.toLowerCase().split(' ').filter(t => t.length > 2);
      const matchingProducts = products.filter(p => {
        const searchText = `${p.name} ${p.model} ${p.category}`.toLowerCase();
        return searchTerms.some(term => searchText.includes(term));
      });

      return res.json({
        success: true,
        query,
        model: selectedModel.type,
        message: `Found ${matchingProducts.length} products (fallback search)`,
        products: formatProducts(matchingProducts),
        processingTime: Date.now() - startTime,
        fallback: true
      });
    }

    // Get matching products based on AI response
    let matchedProducts = [];

    if (aiResponse.matchingProductIds && aiResponse.matchingProductIds.length > 0) {
      // AI found specific product IDs
      matchedProducts = products.filter(p =>
        aiResponse.matchingProductIds.includes(p._id.toString())
      );
    }

    // If no direct matches, apply filters
    if (matchedProducts.length === 0 && aiResponse.filters) {
      const f = aiResponse.filters;
      matchedProducts = products.filter(p => {
        // Category filter
        if (f.category && p.category !== f.category) return false;

        // Model filter
        if (f.models && f.models.length > 0) {
          const modelMatch = f.models.some(m =>
            p.model.toLowerCase().includes(m.toLowerCase()) ||
            p.name.toLowerCase().includes(m.toLowerCase())
          );
          if (!modelMatch) return false;
        }

        // Price filter (check variations)
        if (f.maxPrice || f.minPrice) {
          const prices = p.variations?.map(v => v.price) || [p.wholesalePrice];
          const minVariationPrice = Math.min(...prices);
          if (f.maxPrice && minVariationPrice > f.maxPrice) return false;
          if (f.minPrice && minVariationPrice < f.minPrice) return false;
        }

        // Grade filter
        if (f.grades && f.grades.length > 0 && p.variations?.length > 0) {
          const hasMatchingGrade = p.variations.some(v =>
            f.grades.some(g => v.grade?.toLowerCase().includes(g.toLowerCase()))
          );
          if (!hasMatchingGrade) return false;
        }

        // Origin filter
        if (f.origins && f.origins.length > 0 && p.variations?.length > 0) {
          const hasMatchingOrigin = p.variations.some(v =>
            f.origins.includes(v.origin)
          );
          if (!hasMatchingOrigin) return false;
        }

        return true;
      });
    }

    // If still no matches, return all products with a message
    if (matchedProducts.length === 0) {
      matchedProducts = products;
      aiResponse.message = `No exact matches found for "${query}". Showing all ${products.length} products.`;
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ Found ${matchedProducts.length} products in ${processingTime}ms`);

    const responseData = {
      success: true,
      query,
      model: selectedModel.type,
      intent: aiResponse.intent,
      message: aiResponse.message,
      suggestion: aiResponse.suggestion,
      products: formatProducts(matchedProducts),
      filters: aiResponse.filters,
      preselect: aiResponse.preselect || null,
      processingTime
    };

    // Cache the response
    searchCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    res.json(responseData);

  } catch (error) {
    console.error('❌ AI Search Error:', error);

    // Graceful fallback - basic search (USA only)
    try {
      const products = await Product.find({
        inStock: true,
        'variations.origin': 'US'
      });
      const searchTerms = query.toLowerCase().split(' ').filter(t => t.length > 2);
      const filtered = products.filter(p => {
        const searchText = `${p.name} ${p.model} ${p.category}`.toLowerCase();
        return searchTerms.some(term => searchText.includes(term));
      });

      res.json({
        success: true,
        query,
        model: 'fallback',
        message: `Found ${filtered.length} products (AI unavailable)`,
        products: formatProducts(filtered.length > 0 ? filtered : products),
        error: error.message
      });
    } catch (fallbackError) {
      res.status(500).json({
        success: false,
        error: 'Search failed',
        message: error.message
      });
    }
  }
});

// Helper function to format products for frontend
function formatProducts(products) {
  return products.map(p => {
    const defaultVar = p.variations?.[0] || {};
    return {
      _id: p._id,
      brand: 'Apple',
      model: p.model,
      name: p.name,
      storage: defaultVar.storage || p.storage,
      grade: defaultVar.grade || 'Brand New',
      color: defaultVar.color || 'Black',
      priceUsd: defaultVar.price || p.wholesalePrice,
      retailPrice: p.price,
      stock: defaultVar.stock || 100,
      origin: defaultVar.origin || 'US',
      category: p.category,
      image: p.image,
      inStock: p.inStock,
      variations: p.variations
    };
  });
}

// Quick search (no AI, just filters) - USA only
router.get('/search/quick', async (req, res) => {
  const { category, model, grade, storage, minPrice, maxPrice } = req.query;

  try {
    const query = {
      inStock: true,
      'variations.origin': 'US'
    };

    if (category) query.category = category;
    if (model) query.model = new RegExp(model, 'i');

    const products = await Product.find(query).limit(50);
    res.json({ products: formatProducts(products), total: products.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Chat endpoint - Context-aware chatbot powered by Gemini
router.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Check cache first
  const cacheKey = message.toLowerCase().trim();
  const cached = chatCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('🚀 Chat cache hit for:', message);
    return res.json(cached.data);
  }

  try {
    // Fetch inventory for context - USA origin only
    const products = await Product.find({
      inStock: true,
      'variations.origin': 'US'
    });

    // Build detailed inventory summary
    let inventorySummary = '';
    let totalUnits = 0;
    products.forEach(p => {
      const variations = p.variations?.map(v => {
        totalUnits += v.stock;
        return `${v.color} (${v.stock} units) $${v.price}`;
      }).join(', ') || `${p.storage} $${p.wholesalePrice}`;
      inventorySummary += `• ${p.model} ${p.storage} ${p.variations?.[0]?.grade || ''}: ${variations}\n`;
    });

    // Use Gemini 3.0 Flash Preview for speed and great understanding
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    const systemPrompt = `You are Cryzo Copilot, the AI assistant for Cryzo - a premium iPhone and iPad marketplace.

ABOUT CRYZO:
- We sell refurbished and graded iPhones/iPads
- All devices ship from USA with fast worldwide delivery
- Payment: Secure checkout via Stripe (all major cards)
- Shipping: DHL/FedEx worldwide, 2-5 business days
- Contact: sales@cryzo.co.in | +1 940-400-9316
- Website: cryzo.me

GRADING SYSTEM:
- A2: Excellent condition, minimal signs of use
- B1: Good condition, light scratches
- B2: Fair condition, visible wear but fully functional

CURRENT INVENTORY (${totalUnits} total units):
${inventorySummary}

YOUR PERSONALITY:
- Friendly, professional, helpful
- You know EVERYTHING about Cryzo and our products
- Give concise answers (under 100 words unless asked for details)
- For greetings, be warm but brief - don't list capabilities unless asked
- Only search/mention inventory when the user asks about products
- If asked about competitors or unrelated topics, politely redirect to Cryzo

USER MESSAGE: "${message}"

Respond naturally as Cryzo Copilot:`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = await response.text();

    // Determine intent for analytics
    const lower = message.toLowerCase();
    let intent = 'general';
    if (/^(hi|hello|hey|sup|yo|good|greetings|what's up)/i.test(lower)) intent = 'greeting';
    else if (/(price|cost|how much|\$)/i.test(lower)) intent = 'pricing';
    else if (/(stock|available|have|got|inventory)/i.test(lower)) intent = 'stock_check';
    else if (/(ship|deliver|order|buy|purchase)/i.test(lower)) intent = 'order';
    else if (/(iphone|ipad|phone|model)/i.test(lower)) intent = 'product_query';

    const responseData = {
      success: true,
      response: text,
      intent
    };

    // Cache the response
    chatCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    res.json(responseData);

  } catch (error) {
    console.error('Chat error:', error);
    res.json({
      success: true,
      response: "I'm having a moment! Feel free to browse our inventory or reach out to sales@cryzo.co.in. How can I help you today?",
      intent: 'error'
    });
  }
});

// Stripe Checkout endpoint
router.post('/checkout', async (req, res) => {
  const { items, customerEmail } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Create line items for Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${item.brand} ${item.model}`,
          description: `${item.grade} - ${item.storage} - ${item.origin} Hub`,
        },
        unit_amount: Math.round(item.priceUsd * 100), // Stripe uses cents
      },
      quantity: item.quantity,
    }));

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}?success=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}?canceled=true`,
      customer_email: customerEmail || undefined,
      metadata: {
        order_type: 'wholesale',
        item_count: items.length,
        total_units: items.reduce((sum, i) => sum + i.quantity, 0),
      },
    });

    console.log('✅ Stripe session created:', session.id);

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({
      error: 'Checkout failed',
      message: error.message,
    });
  }
});

module.exports = router;
