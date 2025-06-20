const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const MONGODB_URI = process.env.MONGODB_URI

// Define schemas directly in the script
const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "admin" },
  createdAt: { type: Date, default: Date.now },
})

const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: "/placeholder.svg?height=200&width=200" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
})

const ShopSchema = new mongoose.Schema({
  name: { type: String, default: "Mojito Paradise" },
  phone: { type: String, default: "+91 98765 43210" },
  email: { type: String, default: "contact@mojitoparadise.com" },
  address: { type: String, default: "123 Beach Road, Goa 403001, India" },
  established: { type: String, default: "2023" },
  license: { type: String, default: "FSSAI-12345678901234" },
  createdAt: { type: Date, default: Date.now },
})

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log("Connected to MongoDB Atlas")

    const Admin = mongoose.model("Admin", AdminSchema)
    const MenuItem = mongoose.model("MenuItem", MenuItemSchema)
    const Shop = mongoose.model("Shop", ShopSchema)

    // Clear existing data
    await Admin.deleteMany({})
    await MenuItem.deleteMany({})
    await Shop.deleteMany({})

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 12)
    const admin = new Admin({
      username: "admin",
      email: "admin@drinks.com",
      password: hashedPassword,
      role: "super_admin",
    })
    await admin.save()
    console.log("Admin user created")

    // Create menu items
    const menuItems = [
      // Mojitos
      { name: "Sunrise mojitos", category: "Mojito", price: 70 },
      { name: "Blue curaco", category: "Mojito", price: 70 },
      { name: "Orange", category: "Mojito", price: 70 },
      { name: "Virgin mojito", category: "Mojito", price: 70 },
      { name: "Watermelon pudhina", category: "Mojito", price: 70 },
      { name: "Rainbow mojito", category: "Mojito", price: 70 },
      { name: "Black current", category: "Mojito", price: 70 },
      { name: "Pine apple", category: "Mojito", price: 70 },
      { name: "Cinderella mocktail", category: "Mojito", price: 70 },
      { name: "Strawberry", category: "Mojito", price: 70 },
      { name: "Rose sharbat", category: "Mojito", price: 70 },
      { name: "Lychee", category: "Mojito", price: 70 },
      { name: "Kiwi", category: "Mojito", price: 70 },
      { name: "Citrus special", category: "Mojito", price: 70 },
      { name: "Mango lemon", category: "Mojito", price: 70 },
      { name: "Lime mint", category: "Mojito", price: 70 },
      { name: "Rooh afza", category: "Mojito", price: 70 },
      { name: "Cucumber lemon", category: "Mojito", price: 70 },
      { name: "Natural orange", category: "Mojito", price: 70 },
    
      // Fruit Plates
      { name: "Watermelon", category: "Fruit Plate", price: 30 },
      { name: "Papaya", category: "Fruit Plate", price: 30 },
      { name: "Mixed fruit plate", category: "Fruit Plate", price: 50 },
      { name: "Pomegranate", category: "Fruit Plate", price: 70 },
      { name: "Pine apple", category: "Fruit Plate", price: 30 },
    
      // Ice Creams
      { name: "Venilla", category: "Ice Cream", price: 45 },
      { name: "Chocolate", category: "Ice Cream", price: 65 },
      { name: "Raj bhog", category: "Ice Cream", price: 85 },
      { name: "Kulfi pots", category: "Ice Cream", price: 85 },
      { name: "Tender coconut", category: "Ice Cream", price: 85 },
      { name: "Real caramel", category: "Ice Cream", price: 75 },
    
      // Juices
      { name: "Socked ground nuts and Banana", category: "Juice", price: 50 },
      { name: "Watermelon & Lime", category: "Juice", price: 40 },
      { name: "Pomegranate", category: "Juice", price: 60 },
      { name: "Orange / Mosambi", category: "Juice", price: 40 },
      { name: "Sapota", category: "Juice", price: 40 },
      { name: "Kiwi", category: "Juice", price: 70 },
      { name: "Pine apple", category: "Juice", price: 40 },
      { name: "Muskmelon", category: "Juice", price: 40 },
      { name: "Carrot", category: "Juice", price: 40 },
      { name: "ABC", category: "Juice", price: 50 },
      { name: "Banana", category: "Juice", price: 40 },
      { name: "Papaya", category: "Juice", price: 40 },
      { name: "Grapes", category: "Juice", price: 40 },
    
      // Milkshakes
      { name: "Banana and Mango with", category: "Milkshake", price: 88 },
      { name: "Mango", category: "Milkshake", price: 88 },
      { name: "Apple", category: "Milkshake", price: 88 },
      { name: "Dry fruit milk shake", category: "Milkshake", price: 88 },
      { name: "Strawberry", category: "Milkshake", price: 88 },
      { name: "Dragon fruit", category: "Milkshake", price: 88 },
      { name: "Dates", category: "Milkshake", price: 88 },
      { name: "Oreo milk shake", category: "Milkshake", price: 88 },
      { name: "Chocolate milk shak", category: "Milkshake", price: 88 },
      { name: "Sapota milk shake", category: "Milkshake", price: 88 },
      { name: "Papaya banana", category: "Milkshake", price: 88 },
    
      // Lassi
      { name: "Banana Lassi", category: "Lassi", price: 50 },
      { name: "Mango special lassi", category: "Lassi", price: 60 },

      // Waffles
      { name: "Classic Waffle", category: "Waffle", price: 200 },
      { name: "Chocolate Waffle", category: "Waffle", price: 250 },
      { name: "Fruit Waffle", category: "Waffle", price: 280 },
      { name: "Nutella Waffle", category: "Waffle", price: 300 },
    ];
    

    await MenuItem.insertMany(menuItems)
    console.log("Menu items created")

    // Create shop info
    const shop = new Shop({})
    await shop.save()
    console.log("Shop info created")

    console.log("Database seeded successfully!")
    console.log("Login credentials: admin@drinks.com / admin123")
  } catch (error) {
    console.error("Error seeding database:", error)
  } finally {
    await mongoose.disconnect()
  }
}

seedDatabase() 