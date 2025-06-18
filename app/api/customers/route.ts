import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Customer from "@/models/Customer"

export async function GET() {
  try {
    await connectDB()

    const customers = await Customer.find({}).populate("orders.itemId", "name category price").sort({ updatedAt: -1 })

    return NextResponse.json(customers)
  } catch (error) {
    console.error("Failed to fetch customers:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch customers" }, { status: 500 })
  }
}
