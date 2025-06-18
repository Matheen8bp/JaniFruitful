import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import MenuItem from "@/models/MenuItem"

export async function GET() {
  try {
    await connectDB()

    const menuItems = await MenuItem.find({ isActive: true }).sort({ category: 1, name: 1 })

    return NextResponse.json(menuItems)
  } catch (error) {
    console.error("Failed to fetch menu items:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch menu items" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await connectDB()

    const { name, category, price, image, description } = await request.json()

    if (!name || !category || !price) {
      return NextResponse.json({ success: false, message: "Name, category, and price are required" }, { status: 400 })
    }

    const menuItem = new MenuItem({
      name,
      category,
      price,
      image: image || "/placeholder.svg?height=200&width=200",
      description,
    })

    await menuItem.save()

    return NextResponse.json({
      success: true,
      message: "Menu item created successfully",
      menuItem,
    })
  } catch (error) {
    console.error("Failed to create menu item:", error)
    return NextResponse.json({ success: false, message: "Failed to create menu item" }, { status: 500 })
  }
}
