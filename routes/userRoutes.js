const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require("jsonwebtoken");
const protect = require('../middlewares/authMiddleware').protect;

// Register route
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase(); // normalization
    try {
        let user = await User.findOne({ email: normalizedEmail });
        if (user) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        user = new User({ name, email: normalizedEmail, password });
        await user.save();

        const payload = { user: { id: user._id, role: user.role } };
        jwt.sign(payload, process.env.SECRET_KEY, {
            expiresIn: "24h"
        }, (err, token) => {
            if (err) throw err;
            res.status(201).json({
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                token
            });
        });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// ✅ Login route — OUTSIDE of /register
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const payload = { user: { id: user._id, role: user.role } };
        jwt.sign(payload, process.env.SECRET_KEY, {
            expiresIn: "24h"
        }, (err, token) => {
            if (err) throw err;
            res.status(200).json({
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                token
            });
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
});

//@Route GET /api/user/profile
//@desc Get logged in user profile (protected route)
//@access private

router.get('/profile', protect, async (req, res) => {
    res.json(req.user);
})

module.exports = router;
