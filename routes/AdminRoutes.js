const express = require('express');
const User = require('../models/User')
const { protect, admin } = require('../middlewares/authMiddleware')

const router = express.Router();

//@route GET /api/admin/user
//@desc get all users (admin only)
//@access private
router.get("/", protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password')
        res.json(users)
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }

})

//@route POST /api/admin/user/
//@desc create a new user (admin only)
//@access private

router.post("/", protect, admin, async (req, res) => {
    const { name, email, password, role } = req.body

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Please fill all fields" })
    }

    try {
        const userExists = await User.findOne({ email })
        if (userExists) {
            return res.status(400).json({ message: "User already exists" })
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'customer'
        })
        user.save()
        res.status(201).json({ message: "User created successfully", user })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

//@route PUT /api/admin/user/:id
//@desc update a user (admin only) Name, email, role
//@access private

router.put("/:id", protect, admin, async (req, res) => {
    // const { name, email, password, role } = req.body

    // if (!name || !email || !password) {
    //     return res.status(400).json({ message: "Please fill all fields" })
    // }

    try {
        const user = await User.findById(req.params.id)
        if (user) {
            user.name = req.body.name || user.name
            user.email = req.body.email || user.email
            user.role = req.body.role || user.role
        }
        const updatedUser = await user.save()
        res.status(200).json({ message: "User updated successfully", user: updatedUser })



    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
)

//@route DELETE /api/admin/user/:id
//@desc delete a user (admin only)  
//@access private

router.delete("/:id", protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (user) {
            await user.deleteOne()
            res.status(200).json({ message: "User removed successfully" })
        }
        else {
            res.status(404).json({ message: "User not found" })
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
});


module.exports = router;