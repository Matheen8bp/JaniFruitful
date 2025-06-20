const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./lib/mongodb');

const app = express();
const port = parseInt(process.env.PORT, 10) || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Import models
const Admin = require('./models/Admin');
const Customer = require('./models/Customer');
const MenuItem = require('./models/MenuItem');
const Shop = require('./models/Shop');

// Import cloudinary
const cloudinary = require('./cloudinary');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'JaniFruitful Backend is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'JaniFruitful Backend API',
    version: '1.0.0',
    endpoints: {
      admin: '/api/admin',
      customers: '/api/customers',
      menu: '/api/menu',
      dashboard: '/api/dashboard',
      rewards: '/api/rewards'
    }
  });
});

// Admin routes
app.post('/api/admin/login', async (req, res) => {
  try {
    await connectDB();
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
    const token = jwt.sign({ adminId: admin._id, email: admin.email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: admin._id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
      },
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Menu routes
app.get('/api/menu', async (req, res) => {
  try {
    await connectDB();
    const menuItems = await MenuItem.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(menuItems);
  } catch (error) {
    console.error("Error fetching menu:", error);
    res.status(500).json({ error: "Failed to fetch menu items" });
  }
});

// Customer routes
app.get('/api/customers', async (req, res) => {
  try {
    await connectDB();
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

app.post('/api/customers/purchase', async (req, res) => {
  try {
    await connectDB();
    const { customerName, customerPhone, drinkType, itemId, itemName, price } = req.body;

    if (!customerName || !customerPhone || !drinkType || !itemId || !itemName || !price) {
      return res.status(400).json({ error: "All fields are required" });
    }

    let customer = await Customer.findOne({ phone: customerPhone });

    if (!customer) {
      customer = new Customer({
        name: customerName,
        phone: customerPhone,
        orders: []
      });
    }

    const order = {
      drinkType,
      itemName,
      itemId,
      price,
      date: new Date(),
      isReward: false
    };

    customer.orders.push(order);
    await customer.save();

    res.json({ success: true, message: "Purchase recorded successfully", customer });
  } catch (error) {
    console.error("Error recording purchase:", error);
    res.status(500).json({ error: "Failed to record purchase" });
  }
});

// Dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    await connectDB();
    
    const totalCustomers = await Customer.countDocuments();
    const customers = await Customer.find();
    
    const totalDrinksSold = customers.reduce((total, customer) => total + customer.totalOrders, 0);
    
    const upcomingRewards = customers.filter(customer => {
      const regularOrders = customer.orders.filter(order => !order.isReward).length;
      return regularOrders >= 5 && regularOrders % 6 === 5;
    }).length;
    
    const rewardsEarned = customers.reduce((total, customer) => total + customer.rewardsEarned, 0);
    
    const recentCustomers = await Customer.find()
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('name phone totalOrders');

    res.json({
      totalCustomers,
      totalDrinksSold,
      upcomingRewards,
      rewardsEarned,
      recentCustomers
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

// Rewards route
app.get('/api/rewards', async (req, res) => {
  try {
    await connectDB();
    const customers = await Customer.find().sort({ updatedAt: -1 });
    
    const rewardsData = customers.map(customer => {
      const regularOrders = customer.orders.filter(order => !order.isReward).length;
      const drinksUntilReward = regularOrders % 6 === 0 ? 6 : 6 - (regularOrders % 6);
      
      return {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        totalOrders: customer.totalOrders,
        drinksUntilReward,
        canClaimReward: drinksUntilReward === 6,
        lastOrder: customer.orders.length > 0 ? customer.orders[customer.orders.length - 1].date : null
      };
    });

    res.json(rewardsData);
  } catch (error) {
    console.error("Error fetching rewards:", error);
    res.status(500).json({ error: "Failed to fetch rewards data" });
  }
});

// Start server
async function startServer() {
  try {
    await connectDB();
    console.log('MongoDB connected');
    
    app.listen(port, () => {
      console.log(`> Backend server ready on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

startServer(); 