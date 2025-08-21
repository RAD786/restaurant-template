// backend/models/MenuItem.js
const mongoose = require('mongoose');
const { v2: cloudinary } = require('cloudinary');

// Safe to call multiple times; uses your backend .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, trim: true },          // Cloudinary secure_url (or external)
    imagePublicId: { type: String, trim: true },  // Cloudinary public_id (for deletion)
    category: { type: String, required: true, trim: true },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/* ---------- Indexes for faster filtering/search/sort ---------- */
menuItemSchema.index({ name: 'text', description: 'text', category: 'text' });
menuItemSchema.index({ category: 1, available: 1 });
menuItemSchema.index({ price: 1 });
menuItemSchema.index({ createdAt: -1 });

/* ---------- Helper: safe Cloudinary destroy ---------- */
async function destroyPublicId(publicId, label) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error(`Cloudinary destroy (${label}) failed:`, err?.message || err);
  }
}

/* ---------- UPDATE: delete old image if replaced or cleared ----------
   We capture the "old" doc in pre(), then compare with the updated result in post().
--------------------------------------------------------------------- */
menuItemSchema.pre('findOneAndUpdate', async function () {
  const oldDoc = await this.model.findOne(this.getQuery()).lean();
  this._oldPublicId = oldDoc?.imagePublicId || null;
});

menuItemSchema.post('findOneAndUpdate', async function (result) {
  if (!result) return;
  const oldPublicId = this._oldPublicId || null;
  const newPublicId = result.imagePublicId || null;
  const cleared = !newPublicId && (!result.image || result.image === '');

  // If the image was replaced with a different public_id, or cleared entirely, remove old asset
  if (oldPublicId && ((newPublicId && newPublicId !== oldPublicId) || cleared)) {
    await destroyPublicId(oldPublicId, 'update');
  }
});

/* ---------- DELETE (single): auto-clean image ----------
   Works for findOneAndDelete() and document.deleteOne()
--------------------------------------------------------------------- */
menuItemSchema.post('findOneAndDelete', async function (doc) {
  if (!doc) return;
  await destroyPublicId(doc.imagePublicId, 'findOneAndDelete');
});

menuItemSchema.post('deleteOne', { document: true, query: false }, async function () {
  await destroyPublicId(this.imagePublicId, 'document.deleteOne');
});

module.exports = mongoose.model('MenuItem', menuItemSchema);