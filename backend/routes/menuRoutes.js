const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { v2: cloudinary } = require('cloudinary'); // needed for bulk-delete only

const MenuItem = require('../models/MenuItem');
const auth = require('../middleware/auth');

/**
 * GET /api/menu
 * Query params:
 *  q, category, available, minPrice, maxPrice
 *  sort=name|price|category|createdAt (default createdAt)
 *  dir=asc|desc (default desc)
 *  page (1-based, default 1)
 *  limit (default 20, max 100)
 */
router.get('/', async (req, res) => {
  try {
    const {
      q,
      category,
      available,
      minPrice,
      maxPrice,
      sort = 'createdAt',
      dir = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    // q: search in name/description/category
    if (q && String(q).trim()) {
      const rx = new RegExp(String(q).trim(), 'i');
      filter.$or = [{ name: rx }, { description: rx }, { category: rx }];
    }

    if (category && String(category).trim()) {
      filter.category = String(category).trim();
    }

    if (available === 'true' || available === 'false') {
      filter.available = available === 'true';
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const allowedSort = new Set(['name', 'price', 'category', 'createdAt']);
    const sortField = allowedSort.has(String(sort)) ? String(sort) : 'createdAt';
    const sortDir = String(dir) === 'asc' ? 1 : -1;
    const sortSpec = { [sortField]: sortDir };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, data] = await Promise.all([
      MenuItem.countDocuments(filter),
      MenuItem.find(filter).sort(sortSpec).skip(skip).limit(limitNum).lean(),
    ]);

    const pages = Math.max(1, Math.ceil(total / limitNum));
    res.json({ data, total, page: pageNum, pages, limit: limitNum });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/** CREATE (admin) */
router.post('/', auth, async (req, res) => {
  try {
    const item = new MenuItem(req.body);
    const saved = await item.save();
    res.status(201).json(saved);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

/** UPDATE (admin)
 *  Auto image cleanup is handled by the MenuItem model middleware.
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const updated = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

/** DELETE (admin)
 *  Auto image cleanup is handled by the MenuItem model middleware.
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await MenuItem.findOneAndDelete({ _id: req.params.id });
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

/** BULK DELETE (admin)
 *  Middleware can't auto-clean images for deleteMany, so:
 *   1) fetch public_ids, 2) delete DB docs, 3) best-effort Cloudinary cleanup
 */
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const raw = Array.isArray(req.body.ids) ? req.body.ids : [];
    const ids = raw.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (ids.length === 0) {
      return res.status(400).json({ message: 'No valid ids provided' });
    }

    // Collect public_ids first
    const items = await MenuItem.find({ _id: { $in: ids } }, { imagePublicId: 1 }).lean();

    // Delete DB records
    const result = await MenuItem.deleteMany({ _id: { $in: ids } });

    // Best-effort Cloudinary cleanup
    const publicIds = items.map((i) => i.imagePublicId).filter(Boolean);
    await Promise.allSettled(publicIds.map((pid) => cloudinary.uploader.destroy(pid)));

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