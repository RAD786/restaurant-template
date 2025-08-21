// backend/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const auth = require('../middleware/auth'); // protect uploads
const streamifier = require('streamifier');

// Multer: keep file in memory
const upload = multer({ storage: multer.memoryStorage() });

// Cloudinary config from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadBufferToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });

// POST /api/upload
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const result = await uploadBufferToCloudinary(req.file.buffer, {
    folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'restaurant-uploads',
    resource_type: 'image',
    // keep original, but cap huge images so you don’t accidentally store 10MB photos
    transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
    });

    res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (e) {
    console.error('Cloudinary upload error:', e);
    res.status(500).json({ message: 'Image upload failed' });
  }
});

module.exports = router;