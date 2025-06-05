const express = require('express');
const router = express.Router();
const Checkout = require('../models/Checkout');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect } = require('../middlewares/authMiddleware');



// @route POST /api/checkout
// @desc Create a new checkout session
// @access Private

router.post('/', protect, async (req, res) => {
    const { shippingAddress, paymentMethod, checkoutItems, totalPrice, } = req.body;

    if (!checkoutItems || checkoutItems.length === 0) {
        return res.status(400).json({ message: 'no items in checkout' });
    }

    try {
        const newCheckout = await Checkout.create({
            user: req.user._id,
            checkoutItems: checkoutItems,
            shippingAddress,
            paymentMethod,
            totalPrice,
            paymentStatus: 'pending',
            ispaid: false,
        });
        console.log(`Checkout created for user :${req.user._id} `);


        // await checkout.save();

        res.status(201).json(newCheckout);
    } catch (error) {
        console.error('Error creating checkout:', error); // <--- LOG THE ACTUAL ERROR
        res.status(500).json({ message: 'Server error', error: error.message });
    }

});

// @route Put /api/checkout/:id/pay
// @desc Update checkout status to paid after successful payment
// @access Private

router.put('/:id/pay', protect, async (req, res) => {
    const { paymentStatus, paymentDetails } = req.body;
    const checkoutId = req.params.id;

    try {
        const checkout = await Checkout.findById(req.params.id);

        if (!checkout) {
            return res.status(404).json({ message: 'Checkout not found' });
        }

        if (paymentStatus === 'paid') {
            checkout.isPaid = true;
            checkout.paidAt = Date.now();
            checkout.paymentStatus = paymentStatus;
            checkout.paymentDetails = paymentDetails; // Store the payment details in the checkout document
            await checkout.save();
            res.status(200).json({ message: 'Checkout updated successfully', checkout });
        } else {
            res.status(400).json({ message: 'invalid payment status ' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' + error });
        console.log('Error updating checkout:', error); // <--- LOG THE ACTUAL ERROR
    }
}
);


// @route Post /api/checkout/:id/finalize
// @desc Finalize the checkout and create an order after payment confirmation
// @access Private

router.post('/:id/finalize', protect, async (req, res) => {
    try {
        const checkout = await Checkout.findById(req.params.id)
        if (!checkout) {
            return res.status(404).json({ message: 'Checkout not found' });
        }

        if (checkout.isPaid && !checkout.isFinalized) {
            const finalOrder = await Order.create({
                user: checkout.user,
                orderItems: checkout.checkoutItems,
                shippingAddress: checkout.shippingAddress,
                paymentMethod: checkout.paymentMethod,
                totalPrice: checkout.totalPrice,
                isPaid: true,
                paidAt: checkout.paidAt,
                isDelivered: false,
                paymentStatus: 'Paid',
                paymentDetails: checkout.paymentDetails, // Store the payment details in the order document
            });

            checkout.isFinalized = true;
            checkout.finalizedAt = Date.now();
            await checkout.save();

            // delete the cart assosiated with the user
            await Cart.deleteMany({ user: checkout.user });
            res.status(201).json(finalOrder);
        }
        else if (checkout.isFinalized) {
            return res.status(400).json({ message: 'Checkout already finalized' });
        }
        else {
            return res.status(400).json({ message: 'Checkout not paid or already finalized' });
        }
    }

    catch (error) {
        res.status(500).json({ message: 'Server error' + error });
        console.log('Error finalizing checkout:', error); // <--- LOG THE ACTUAL ERROR
    }
});


module.exports = router;
// Compare this snippet from Backend/models/Checkout.js: