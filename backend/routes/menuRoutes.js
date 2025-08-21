const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { v2: cloudinary } = require('cloudinary');

const MenuItem = require('../models/MenuItem');
const auth = require('../middleware/auth');

// GET (public) — supports simple sorting via query (?sort=name&dir=asc)
router.get('/', async (req, res) => {
  try {
    const { sort = 'createdAt', dir = 'desc' } = req.query;
    const sortSpec = { [sort]: dir === 'asc' ? 1 : -1 };
    const items = await MenuItem.find().sort(sortSpec);
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// CREATE (admin)
router.post('/', auth, async (req, res) => {
  try {
    const item = new MenuItem(req.body);
    const saved = await item.save();
    res.status(201).json(saved);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// UPDATE (admin) — delete Cloudinary image if replaced or cleared
router.put('/:id', auth, async (req, res) => {
  try {
    const existing = await MenuItem.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Not found' });

    const oldPublicId = existing.imagePublicId || null;
    const newPublicId = req.body.imagePublicId || null;
    const clearingImage =
      (!newPublicId && (req.body.image === '' || req.body.image == null));

    const updated = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    // Replaced with a different image
    if (oldPublicId && newPublicId && oldPublicId !== newPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (err) {
        console.error('Cloudinary destroy (replace) failed:', err?.message || err);
      }
    }

    // Cleared the image entirely
    if (oldPublicId && clearingImage) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (err) {
        console.error('Cloudinary destroy (clear) failed:', err?.message || err);
      }
    }

    res.json(updated);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// DELETE (admin) — delete Cloudinary image too
router.delete('/:id', auth, async (req, res) => {
  try {
    const existing = await MenuItem.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Not found' });

    const publicId = existing.imagePublicId;
    await existing.deleteOne();

    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error('Cloudinary destroy (delete) failed:', err?.message || err);
      }
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// BULK DELETE (admin) — validates ids, cleans Cloudinary
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const raw = Array.isArray(req.body.ids) ? req.body.ids : [];
    const ids = raw.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (ids.length === 0) {
      return res.status(400).json({ message: 'No valid ids provided' });
    }

    // Collect public_ids first
    const items = await MenuItem.find(
      { _id: { $in: ids } },
      { imagePublicId: 1 }
    ).lean();

    // Delete DB records
    const result = await MenuItem.deleteMany({ _id: { $in: ids } });

    // Best-effort Cloudinary cleanup
    const publicIds = items.map((i) => i.imagePublicId).filter(Boolean);
    await Promise.allSettled(
      publicIds.map((pid) => cloudinary.uploader.destroy(pid))
    );

    res.json({
      ok: true,
      requested: raw.length,
      valid: ids.length,
      deleted: result.deletedCount || 0,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

module.exports = router;