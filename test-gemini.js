// Test Gemini API connection
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  console.log('🔑 Testing Gemini API...');
  console.log('   Key prefix:', process.env.GEMINI_API_KEY?.substring(0, 10) + '...');

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent('Say "Cryzo API working!" in one line');
    const response = await result.response;
    const text = await response.text();

    console.log('✅ Gemini Response:', text.trim());
    console.log('\n🎉 API is working!');
  } catch (error) {
    console.error('❌ Gemini Error:', error.message);

    if (error.message.includes('API_KEY')) {
      console.log('\n💡 Your API key might be invalid. Get a new one at:');
      console.log('   https://aistudio.google.com/app/apikey');
    }
  }
}

testGemini();
