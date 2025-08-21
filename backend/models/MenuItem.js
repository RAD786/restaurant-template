const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    image: String,            // Cloudinary secure_url
    imagePublicId: String,    // Cloudinary public_id (for deletes)
    category: { type: String, required: true },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MenuItem', menuItemSchema);