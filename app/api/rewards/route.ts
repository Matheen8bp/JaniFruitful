import connectDB from "@/backend/lib/mongodb"
import Customer from "@/backend/models/Customer"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    await connectDB()

    const customers = await Customer.find({})

    // Process customers for reward status
    const rewardCustomers = customers.map((customer) => {
      const ordersAfterLastReward = customer.totalOrders % 6
      let status: "earned" | "upcoming" | "progress"
      let drinksToReward: number

      if (ordersAfterLastReward === 0 && customer.totalOrders > 0) {
        status = "earned"
        drinksToReward = 0
      } else if (ordersAfterLastReward >= 5) {
        status = "upcoming"
        drinksToReward = 6 - ordersAfterLastReward
      } else {
        status = "progress"
        drinksToReward = 6 - ordersAfterLastReward
      }

      return {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
        totalOrders: customer.totalOrders,
        rewardsEarned: customer.rewardsEarned,
        status,
        drinksToReward,
      }
    })

    // Calculate stats
    const totalRewardsGiven = customers.reduce((sum, customer) => sum + customer.rewardsEarned, 0)
    const customersWithRewards = customers.filter((customer) => customer.rewardsEarned > 0).length
    const upcomingRewards = rewardCustomers.filter((customer) => customer.status === "upcoming").length

    return NextResponse.json({
      customers: rewardCustomers,
      stats: {
        totalRewardsGiven,
        customersWithRewards,
        upcomingRewards,
      },
    })
  } catch (error) {
    console.error("Failed to fetch reward data:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch reward data" }, { status: 500 })
  }
}
