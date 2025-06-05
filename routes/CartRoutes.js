const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// ✅ Utility: Get cart based on user or guest
const getCart = async (userId, guestId) => {
    if (userId) {
        return await Cart.findOne({ user: userId });
    } else if (guestId) {
        return await Cart.findOne({ guestId: guestId });
    }
    return null;
};

// @route   POST /api/cart
// @desc    Add product to the cart
// @access  Public
router.post('/', async (req, res) => {
    const { productId, size, color, quantity, guestId, userId } = req.body;

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const quantityNum = Number(quantity);
        if (isNaN(quantityNum) || quantityNum <= 0) {
            return res.status(400).json({ message: 'Quantity must be a positive number' });
        }

        let cart = await getCart(userId, guestId);

        if (cart) {
            const productIndex = cart.products.findIndex(
                (p) =>
                    p.productId.toString() === productId &&
                    p.size === size &&
                    p.color === color
            );

            if (productIndex !== -1) {
                cart.products[productIndex].quantity += quantityNum;
            } else {
                cart.products.push({
                    productId: product._id,
                    name: product.name,
                    image: product.images[0].url,
                    price: product.price,
                    size,
                    color,
                    quantity: quantityNum,
                });
            }

            // Recalculate total price
            cart.totalPrice = cart.products.reduce(
                (acc, item) => acc + item.price * item.quantity,
                0
            );

            await cart.save();
            return res.status(201).json(cart);
        } else {
            const newCart = await Cart.create({
                user: userId || undefined,
                guestId: guestId || 'guest_' + Date.now(),
                products: [
                    {
                        productId: product._id,
                        name: product.name,
                        image: product.images[0].url,
                        price: product.price,
                        size,
                        color,
                        quantity: quantityNum,
                    },
                ],
                totalPrice: product.price * quantityNum,
            });

            return res.status(201).json(newCart);
        }
    } catch (error) {
        console.error('POST /api/cart error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/cart
// @desc    Update product quantity in the cart
// @access  Public
router.put('/', async (req, res) => {
    const { productId, size, color, quantity, guestId, userId } = req.body;

    try {
        const quantityNum = Number(quantity);
        if (isNaN(quantityNum) || quantityNum < 0) {
            return res.status(400).json({ message: 'Quantity must be a non-negative number' });
        }

        let cart = await getCart(userId, guestId);
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const productIndex = cart.products.findIndex(
            (p) =>
                p.productId.toString() === productId &&
                p.size === size &&
                p.color === color
        );

        if (productIndex !== -1) {
            if (quantityNum === 0) {
                cart.products.splice(productIndex, 1); // Remove item
            } else {
                cart.products[productIndex].quantity = quantityNum; // Replace quantity
            }

            // Recalculate total price
            cart.totalPrice = cart.products.reduce(
                (acc, item) => acc + item.price * item.quantity,
                0
            );

            await cart.save();
            return res.status(200).json(cart);
        } else {
            return res.status(404).json({ message: 'Product not found in cart' });
        }
    } catch (error) {
        console.error('PUT /api/cart error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/cart
// @desc    Remove product from the cart
// @access  Public

router.delete('/', async (req, res) => {
    const { productId, size, color, guestId, userId } = req.body;
    console.log('Delete request:', { productId, size, color, guestId, userId });

    try {
        let cart = await getCart(userId, guestId);
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const productIndex = cart.products.findIndex(
            (p) =>
                p.productId.toString() === productId &&
                p.size === size &&
                p.color === color
        );

        if (productIndex !== -1) {
            cart.products.splice(productIndex, 1); // Remove item

            // Recalculate total price
            cart.totalPrice = cart.products.reduce(
                (acc, item) => acc + item.price * item.quantity,
                0
            );

            await cart.save();
            return res.status(200).json(cart);
        } else {
            return res.status(404).json({ message: 'Product not found in cart' });
        }
    } catch (error) {
        console.error('DELETE /api/cart error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/cart
// @desc    Get cart details
// @access  Public
router.get('/', async (req, res) => {
    const { guestId, userId } = req.query;
    console.log('Query params:', { userId, guestId });

    try {
        let cart = await getCart(userId, guestId);
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        return res.status(200).json(cart);
    } catch (error) {
        console.error('GET /api/cart error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route  POST /api/cart/merge
// @desc   Merge guest cart with user cart
// @access Public


router.post('/merge', protect, async (req, res) => {
    const { guestId } = req.body;

    try {
        const guestCart = await Cart.findOne({ guestId: guestId?.trim() }); // optional trim
        const userCart = await Cart.findOne({ user: req.user._id });

        // If no guest cart found
        if (!guestCart || guestCart.products.length === 0) {
            return res.status(404).json({ message: 'No guest cart found' });
        }

        // If user cart exists → merge carts
        if (userCart) {
            guestCart.products.forEach((guestItem) => {
                const existingIndex = userCart.products.findIndex(
                    (item) =>
                        item.productId.toString() === guestItem.productId.toString() &&
                        item.size === guestItem.size &&
                        item.color === guestItem.color
                );

                if (existingIndex !== -1) {
                    userCart.products[existingIndex].quantity += guestItem.quantity;
                } else {
                    userCart.products.push(guestItem);
                }
            });

            userCart.totalPrice = userCart.products.reduce(
                (acc, item) => acc + item.price * item.quantity,
                0
            );

            await userCart.save();
            await Cart.findByIdAndDelete(guestCart._id);

            return res.status(200).json(userCart);
        }

        // If user has no cart, reassign guest cart to the user
        guestCart.user = req.user._id;
        guestCart.guestId = undefined;
        await guestCart.save();

        res.status(200).json(guestCart);

    } catch (error) {
        console.error('POST /api/cart/merge error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;
