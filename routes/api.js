const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Contact endpoint
router.get('/contact', (req, res) => {
  res.json({
    email: "sales@cryzo.co.in",
    phone: "+1 940-400-9316"
  });
});

// Get single product
router.get('/products/:id', async (req, res) => {
    // TODO: Add authorization check
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

// AI Search endpoint
router.post('/search', async (req, res) => {
    const { query, image } = req.body;

    try {
        const products = await Product.find();

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        const selectModel = (userQuery) => {
            if (userQuery.includes("compare") || userQuery.includes("best") || userQuery.includes("recommend") || (userQuery.split(' ').length > 5)) {
                return "gemini-2.5-pro-exp-03-25";
            }
            return "gemini-2.0-flash-exp";
        }

        const modelName = image ? "gemini-2.0-flash-exp" : selectModel(query);
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `
            You are Cryzo AI assistant. You ONLY help with iPhone and iPad wholesale inquiries.
            Your ONLY data source is the MongoDB inventory provided below. You CANNOT search the web or provide information about products not in this inventory.

            Available products:
            ${JSON.stringify(products)}

            User query: ${query}

            Tasks:
            1. Find products that match the user's query from the inventory above
            2. Return ONLY products from this inventory
            3. If no match found, say 'We don't have that product in stock'
            4. For contact questions, provide: sales@cryzo.co.in | +1 940-400-9316
            5. Refuse any non-product questions (sports, news, etc.)

            Return matching products in JSON format.
        `;
        
        let result;
        if (image) {
            const imagePart = {
                inlineData: {
                    data: image,
                    mimeType: 'image/jpeg' 
                }
            };
            result = await model.generateContent([prompt, imagePart]);
        } else {
            result = await model.generateContent(prompt);
        }

        const response = await result.response;
        const text = await response.text();
        
        res.json(JSON.parse(text));

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error processing AI search' });
    }
});


module.exports = router;
