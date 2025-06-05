const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/ProductRoutes');
const cartRoutes = require('./routes/CartRoutes');
const CheckoutRoutes = require('./routes/CheckoutRoutes');
const OrderRoutes = require('./routes/OrderRoutes');
const UploadRoute = require('./routes/UploadRoute');
const SubscribeRoute = require('./routes/SubscribeRoute'); // Import the new route
const adminRoutes = require('./routes/AdminRoutes'); // Import the admin routes
const ProductAdminRoutes = require('./routes/ProductAdminRoutes'); // Import the product admin routes  
const AdminOrderRoutes = require('./routes/AdminOrderRoutes'); // Import the admin order routes 

dotenv.config();

const app = express();

// Middleware
app.use(cors())
app.use(express.json()); // ✅ Needed to parse JSON request body

// Connect to MongoDB
(async () => {
    try {
        await connectDB();
    } catch (err) {
        console.error("❌ DB connection error at startup:", err.message);
        // Don't crash
    }
})();

// Routes
app.get('/', (req, res) => {
    res.send('Hello from rabbitclothing');
});

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', CheckoutRoutes);
app.use('/api/orders', OrderRoutes);
app.use('/api/upload', UploadRoute);
app.use('/api', SubscribeRoute);
app.use('/api/admin/users', adminRoutes); // Use the admin routes
app.use('/api/admin/products', ProductAdminRoutes); // Use the product admin routes
app.use('/api/admin/orders', AdminOrderRoutes); // Use the admin order routes

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


