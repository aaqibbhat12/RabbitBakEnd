const express = require('express');
const { protect, admin } = require('../middlewares/authMiddleware');
const Order = require('../models/Order');
const router = express.Router();


// @route GET /api/admin/orders
// @desc Get all orders (admin only)
// @access Private


router.get('/', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({}).populate('user', 'name email');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route Put /api/admin/orders/:id
// @desc Get order by ID (admin only)
// @access Private

router.put('/:id', protect, admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name');

        if (order) {
            order.status = req.body.status || order.status;
            order.isDelivered = req.body.status === "Delivered" ? true : order.isDelivered;
            order.deliveredAt = req.body.status === "Delivered" ? Date.now() : order.deliveredAt;
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }


    } catch (error) {
        console.error('Error updating order:', error); // <--- LOG THE ACTUAL ERROR
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}
);


// @route DELETE /api/admin/orders/:id
// @desc Delete order by ID (admin only)    
// @access Private


router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            await order.deleteOne();
            res.json({ message: 'Order removed' });
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error('Error deleting order:', error); // <--- LOG THE ACTUAL ERROR
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
module.exports = router;