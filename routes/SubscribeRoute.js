const express=require('express');
const Subscriber=require('../models/Subscriber')
const router=express.Router()



//POST /api/subscribe
// Subscribe a user to the newsletter
// access public
router.post('/subscribe', async (req, res) => {
    const { email } = req.body;
    if(!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        // Check if the email is already subscribed
        const existingSubscriber = await Subscriber.findOne({ email });
        if (existingSubscriber) {
            return res.status(400).json({ message: 'Email already subscribed' });
        }

        // Create a new subscriber
        const newSubscriber = new Subscriber({ email });
        await newSubscriber.save();

        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports=router   