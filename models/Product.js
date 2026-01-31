const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  model: { type: String, required: true },
  storage: { type: String, required: true },
  price: { type: Number, required: true },
  wholesalePrice: { type: Number, required: true },
  category: { type: String, required: true, enum: ['iPhone', 'iPad'] },
  image: { type: String },
  inStock: { type: Boolean, default: true },
  variations: { type: Array }
});

module.exports = mongoose.model('Product', ProductSchema);
