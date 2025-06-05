const express = require('express');
const { protect, admin } = require('../middlewares/authMiddleware');
const Product = require('../models/Product');
const router = express.Router();



// @route GET /api/admin/products
// @desc Get all products (admin only)
// @access Private

router.get('/', protect, admin, async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
);

module.exports = router;