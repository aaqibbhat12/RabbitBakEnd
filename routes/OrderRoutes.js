const express = require('express');
const Order = require('../models/Order');
const {protect} = require('../middlewares/authMiddleware');


const router = express.Router();

//route Get /api/orders/myorders
//desc Get all orders of the logged in user
//access Private
router.get('/myorders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


//route Get /api/orders/:id
//desc Get a single order details by ID
//access Private

router.get('/:id', protect, async (req, res) => {   
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
);


module.exports = router;