const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
// const User = require('./models/User');
const cartSchema = require('./models/Cart');
const products = require('./data/products');


dotenv.config();
mongoose.connect(process.env.MONGO_URI)

// Function to seed data

const seedData = async () => {
    try {
        // clear existing data
        await Product.deleteMany();
        await User.deleteMany();
        await Cart.deleteMany();
        // create a default admin user
        const createdUser = await User.create({
            name: 'Admin User',
            email: 'Admin@example.com',
            password: '123456',
            role: 'admin'
        })
        // assing the default user to the products
        const userID = createdUser._id;
        const sampleProducts = products.map((product) => {
            return { ...product, user: userID }
        })
        // insert the products into the database
        await Product.insertMany(sampleProducts);
        console.log('Data seeded successfully');
        process.exit();
    } catch (error) {
        console.error(`Error seeding data: ${error.message}`);
        process.exit(1);

    }
}

seedData();