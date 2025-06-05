const express = require('express');
const Product = require('../models/Product');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const products = require('../data/products');

// @route   POST /api/products
// @desc    Create a new product 
// @access  Protected/Admin
router.post('/', protect, admin, async (req, res) => {
    try {
        const {
            name, description, price, discountPrice, countinStock, category, brand,
            sizes, colors, collections, material, gender, images, isFeatured,
            isPublished, tags, dimensions, weight, sku
        } = req.body;

        const product = new Product({
            name, description, price, discountPrice, countinStock, category, brand,
            sizes, colors, collections, material, gender, images, isFeatured,
            isPublished, tags, dimensions, weight, sku, user: req.user._id
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (err) {
        if (err.code === 11000 && err.keyPattern && err.keyPattern.sku) {
            return res.status(400).json({ message: 'SKU already exists' });
        }
        console.error(err);
        res.status(500).send("Server error");
    }
});

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Protected/Admin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const {
            name, description, price, discountPrice, countinStock, category, brand,
            sizes, colors, collections, material, gender, images, isFeatured,
            isPublished, tags, dimensions, weight, sku
        } = req.body;

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Update fields
        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price || product.price;
        product.discountPrice = discountPrice || product.discountPrice;
        product.countinStock = countinStock || product.countinStock;
        product.category = category || product.category;
        product.brand = brand || product.brand;
        product.sizes = sizes || product.sizes;
        product.colors = colors || product.colors;
        product.collections = collections || product.collections;
        product.material = material || product.material;
        product.gender = gender || product.gender;
        product.images = images || product.images;
        product.isFeatured = isFeatured ?? product.isFeatured;
        product.isPublished = isPublished ?? product.isPublished;
        product.tags = tags || product.tags;
        product.dimensions = dimensions || product.dimensions;
        product.weight = weight || product.weight;
        product.sku = sku || product.sku;

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Protected/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        await product.deleteOne();
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});


// @route   GET /api/products
// @desc    Get all products  with optional query filters 
// @access  Public

router.get('/', async (req, res) => {
    try {
        const { collection, size, color, gender, minPrice, maxPrice, sortBy, search, category, material, brand, limit } = req.query;
        let query = {}
        //filter logic
        if (collection && collection.toLocaleLowerCase() !== 'all') {
            query.collections = collection;
        }
        if (category && category.toLocaleLowerCase() !== 'all') {
            query.category = category;
        }
        if (material) {
            query.material = { $in: material.split(',') }
        }
        if (brand) {
            query.brand = { $in: brand.split(',') }
        }
        if (size) {
            query.sizes = { $in: size.split(',') }
        }
        if (color) {
            query.colors = { $in: [color] }
        }
        if (gender) {
            query.gender = gender;
        }
        if (minPrice || maxPrice) {
            query.price = {}
            if (minPrice) query.price.$gte = Number(minPrice)
            if (maxPrice) query.price.$lte = Number(maxPrice)
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ]
        }
        let sort = {};
        if (sortBy) {
            switch (sortBy) {
                case 'priceAsc':
                    sort = { price: 1 }
                    break;
                case 'priceDsc':
                    sort = { price: -1 }
                    break;
                case 'popularity':
                    sort = { rating: -1 }
                    break;
                default:
                    break;

            }
        }

        //fetch products from the database apply sorting and limit
        let products = await Product.find(query).sort().limit(Number(limit) || 0);
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server error' });

    }
})

// @route GET /api/products/best-seller
// @desc Get best-selling products with highest rating 
// @access Public
// router.get('/best-seller', async (req, res) => {
//     try {
//         const bestSellers = await Product.find({}).sort({ rating: -1 });
//         res.json(bestSellers);
//         if (!bestSellers) return res.status(404).json({ message: 'No best sellers found' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Internal Server error' });

//     }
// })

// @route GET /api/products/new-arrivals
// @desc retrive latest 8 products -creation date
// @access Public
router.get('/new-arrivals', async (req, res) => {
    try {
        const newArrivals = await Product.find().sort({ createdAt: -1 }).limit(8);
        res.json(newArrivals);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server error' });

    }
})
// @route GET /api/products/best-seller
// @desc Get best-selling products with highest rating 
// @access Public
router.get('/best-seller', async (req, res) => {
    try {
        const bestSeller = await Product.findOne().sort({ rating: -1 })
        if (bestSeller) {
            res.json(bestSeller)
        }
        else {
            res.status(404).json({ message: 'No best seller found' })
        }
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Internal Server error' })

    }


})

// @route Get /api/products/:id
// @desc Get a single product by ID
// @access Public

router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server error' });
    }
})

// @route GET /api/products/similar/:id
// @desc Get similar products based on the current products gender and the category
// @access Public 
const mongoose = require('mongoose');

router.get('/similar/:id', async (req, res) => {
    const { id } = req.params;


    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid product ID' });
    }

    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const similarProducts = await Product.find({
            _id: { $ne: id },
            gender: product.gender,
            category: product.category,
        }).limit(4);

        res.json(similarProducts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server error' });
    }
});





module.exports = router;
