const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./lib/mongodb');

const app = express();
const port = parseInt(process.env.PORT, 10) || 5001;

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://janis-fruitful.vercel.app', // Your specific Vercel domain
    'https://janis-fruitful-git-main-janis-fruitful.vercel.app', // Preview deployments
    'https://janis-fruitful-git-develop-janis-fruitful.vercel.app', // Other possible preview URLs
    process.env.FRONTEND_URL // Allow custom frontend URL from environment
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
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

app.get('/api/admin/profile', async (req, res) => {
  try {
    await connectDB();

    // Get admin info (assuming single admin for now)
    const admin = await Admin.findOne({}).select("-password");

    // Get or create shop info
    let shop = await Shop.findOne({});
    if (!shop) {
      shop = new Shop({});
      await shop.save();
    }

    // Get business stats
    const customers = await Customer.find({});
    const totalCustomers = customers.length;
    const totalOrders = customers.reduce((sum, customer) => sum + customer.totalOrders, 0);
    const totalRevenue = customers.reduce((sum, customer) => {
      return (
        sum +
        customer.orders.reduce((orderSum, order) => {
          return orderSum + (order.isReward ? 0 : order.price);
        }, 0)
      );
    }, 0);
    const rewardsGiven = customers.reduce((sum, customer) => sum + customer.rewardsEarned, 0);

    res.json({
      admin: {
        name: admin?.username || "Admin User",
        email: admin?.email || "admin@drinks.com",
        role: admin?.role || "Super Admin",
        joinDate: admin?.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "January 1, 2024",
        lastLogin: admin?.lastLogin ? new Date(admin.lastLogin).toLocaleString() : "Today, 2:30 PM",
      },
      shop: {
        name: shop.name,
        phone: shop.phone,
        email: shop.email,
        address: shop.address,
        established: shop.established,
        license: shop.license,
      },
      stats: {
        totalCustomers,
        totalOrders,
        totalRevenue,
        rewardsGiven,
      },
    });
  } catch (error) {
    console.error("Failed to fetch profile data:", error);
    res.status(500).json({ success: false, message: "Failed to fetch profile data" });
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

// Menu items management routes
app.get('/api/menu-items', async (req, res) => {
  try {
    await connectDB();
    const menuItems = await MenuItem.find({}).sort({ createdAt: -1 });
    res.json(menuItems);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res.status(500).json({ error: "Failed to fetch menu items" });
  }
});

app.post('/api/menu-items', async (req, res) => {
  try {
    await connectDB();
    const { name, category, price, image, description } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ success: false, message: "Name, category, and price are required" });
    }

    const menuItem = new MenuItem({
      name,
      category,
      price,
      image: image || "/placeholder.svg?height=200&width=200",
      description,
    });

    await menuItem.save();

    res.json({
      success: true,
      message: "Menu item created successfully",
      menuItem,
    });
  } catch (error) {
    console.error("Failed to create menu item:", error);
    res.status(500).json({ success: false, message: "Failed to create menu item" });
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