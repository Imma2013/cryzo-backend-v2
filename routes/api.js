const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Model selection - Use Pro for complex queries, Flash for simple
// Gemini 2.0 Flash for quick tasks, Gemini 1.5 Pro for complex reasoning
const selectModel = (userQuery) => {
  const query = userQuery.toLowerCase();

  // Complex queries need Pro model (better reasoning)
  if (
    query.includes("compare") ||
    query.includes("best") ||
    query.includes("recommend") ||
    query.includes("analyze") ||
    query.includes("which") ||
    query.includes("should i") ||
    query.includes("difference") ||
    query.includes("why") ||
    query.includes("explain") ||
    query.includes("help me") ||
    query.includes("what do you think") ||
    query.split(' ').length > 12
  ) {
    return { name: "gemini-1.5-pro-latest", type: "Pro" };
  }

  // Default to Flash 2.0 for speed
  return { name: "gemini-2.0-flash", type: "Flash" };
};

// Contact endpoint
router.get('/contact', (req, res) => {
  res.json({
    email: "sales@cryzo.co.in",
    phone: "+1 940-400-9316"
  });
});

// Get all products
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({ inStock: true }).limit(50);

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
  const { query, image } = req.body;
  const startTime = Date.now();

  if (!query && !image) {
    return res.status(400).json({ error: 'Query or image is required' });
  }

  try {
    // Fetch all products from database
    const products = await Product.find({ inStock: true });

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

    // Flatten products for AI processing
    const flatInventory = [];
    products.forEach(p => {
      if (p.variations && p.variations.length > 0) {
        p.variations.forEach(v => {
          flatInventory.push({
            productId: p._id.toString(),
            name: p.name,
            model: p.model,
            category: p.category,
            storage: v.storage,
            grade: v.grade,
            color: v.color,
            wholesalePrice: v.price,
            retailPrice: p.price,
            stock: v.stock,
            origin: v.origin
          });
        });
      } else {
        flatInventory.push({
          productId: p._id.toString(),
          name: p.name,
          model: p.model,
          category: p.category,
          storage: p.storage,
          grade: 'Brand New',
          color: 'Black',
          wholesalePrice: p.wholesalePrice,
          retailPrice: p.price,
          stock: 100,
          origin: 'US'
        });
      }
    });

    // Select appropriate Gemini model
    const selectedModel = image
      ? { name: "gemini-2.0-flash", type: "Flash" }
      : selectModel(query);

    const model = genAI.getGenerativeModel({ model: selectedModel.name });

    console.log(`\n🤖 AI Search: "${query}" using Gemini ${selectedModel.type}`);
    console.log(`📦 Inventory: ${flatInventory.length} variations from ${products.length} products`);

    // Build the prompt for Gemini
    const systemPrompt = `You are Cryzo AI, a wholesale phone marketplace search assistant.

YOUR ROLE:
- Help wholesalers find iPhones and iPads from our inventory
- Parse natural language queries into structured filters
- Only return products that exist in our database

INVENTORY DATABASE (${flatInventory.length} items):
${JSON.stringify(flatInventory, null, 2)}

USER QUERY: "${query}"

INSTRUCTIONS:
1. Understand what the user is looking for
2. Find ALL matching products from the inventory above
3. Consider: model names, storage, grades (Brand New, Refurb A/B/C), colors, origins (US, HK, JP, EU, AU), prices

RESPOND WITH VALID JSON ONLY (no markdown, no code blocks):
{
  "intent": "search",
  "message": "Found X products matching your query...",
  "matchingProductIds": ["id1", "id2"],
  "filters": {
    "category": "iPhone" or "iPad" or null,
    "models": ["iPhone 15", "iPhone 14"] or null,
    "storage": "256GB" or null (if user specified a storage size),
    "grades": ["A2", "B1"] or null,
    "colors": ["Black", "Blue"] or null,
    "origins": ["US", "JP"] or null,
    "maxPrice": number or null,
    "minPrice": number or null
  },
  "preselect": {
    "storage": "256GB" or null (exact storage to preselect in dropdown),
    "grade": "A2" or null,
    "color": "Black" or null
  },
  "suggestion": "Try also searching for..."
}`;

    let result;
    if (image) {
      // Handle image upload (price list screenshot)
      const imagePart = {
        inlineData: {
          data: image.replace(/^data:image\/\w+;base64,/, ''),
          mimeType: 'image/jpeg'
        }
      };
      result = await model.generateContent([
        systemPrompt + "\n\nThe user uploaded an image. If it's a price list, extract the products they're interested in.",
        imagePart
      ]);
    } else {
      result = await model.generateContent(systemPrompt);
    }

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

    res.json({
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
    });

  } catch (error) {
    console.error('❌ AI Search Error:', error);

    // Graceful fallback - basic search
    try {
      const products = await Product.find({ inStock: true });
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

// Quick search (no AI, just filters)
router.get('/search/quick', async (req, res) => {
  const { category, model, grade, storage, origin, minPrice, maxPrice } = req.query;

  try {
    const query = { inStock: true };

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

  try {
    // Fetch inventory for context
    const products = await Product.find({ inStock: true });

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

    // Use Pro model for better understanding
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

    const systemPrompt = `You are Cryzo Copilot, the AI assistant for Cryzo - a wholesale iPhone and iPad marketplace.

ABOUT CRYZO:
- We sell wholesale refurbished and graded iPhones/iPads
- Target customers: Phone resellers, repair shops, retailers
- Minimum order: 10 units OR $2,500
- Payment: Stripe (cards), Wire Transfer
- Shipping: DHL/FedEx worldwide, 2-5 business days
- Contact: sales@cryzo.co.in | +1 940-400-9316
- Website: cryzo.me

GRADING SYSTEM:
- A2: Excellent condition, minimal signs of use
- B1: Good condition, light scratches, may have low battery
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

    res.json({
      success: true,
      response: text,
      intent
    });

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
