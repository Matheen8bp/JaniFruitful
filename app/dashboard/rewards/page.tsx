"use client";

export const dynamic = "force-dynamic";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Award,
    Gift,
    MessageCircle,
    Target,
    TrendingUp,
    Users,
} from "lucide-react";
import { useEffect, useState } from "react";

interface RewardCustomer {
  _id: string;
  name: string;
  phone: string;
  totalOrders: number;
  rewardsEarned: number;
  status: "earned" | "upcoming" | "progress";
  drinksToReward: number;
}

export default function RewardsPage() {
  const [rewardCustomers, setRewardCustomers] = useState<RewardCustomer[]>([]);
  const [stats, setStats] = useState({
    totalRewardsGiven: 0,
    customersWithRewards: 0,
    upcomingRewards: 0,
  });

  useEffect(() => {
    fetchRewardData();
  }, []);

  const fetchRewardData = async () => {
    try {
      const response = await fetch("/api/rewards");
      const data = await response.json();
  
      const enrichedCustomers = data.customers.map((customer: RewardCustomer) => {
        const mod = customer.totalOrders % 6;
        const status =
          customer.totalOrders > 0 && mod === 0
            ? "earned"
            : mod === 5
            ? "upcoming"
            : "progress";
        const drinksToReward = mod === 0 && customer.totalOrders > 0 ? 0 : 6 - mod;
  
        return { ...customer, status, drinksToReward };
      });
  
      setRewardCustomers(enrichedCustomers);
      setStats(data.stats);
    } catch (error) {
      console.error("Failed to fetch reward data:", error);
    }
  };
  
  
  

  const sendWhatsAppReminder = (customer: RewardCustomer) => {
    const message = `Hi ${customer.name}, You're just ${
      customer.drinksToReward
    } drink${
      customer.drinksToReward > 1 ? "s" : ""
    } away from a free reward! Visit us soon.`;
    const whatsappUrl = `https://api.whatsapp.com/send?phone=91${
      customer.phone
    }&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const earnedRewards = rewardCustomers.filter((c) => c.status === "earned");
  const upcomingRewards = rewardCustomers.filter(
    (c) => c.status === "upcoming"
  );
  const progressCustomers = rewardCustomers.filter(
    (c) => c.status === "progress"
  );

  const getCardStyle = (status: string) => {
    switch (status) {
      case "earned":
        return "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-green-100";
      case "upcoming":
        return "bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 hover:shadow-yellow-100";
      default:
        return "bg-gradient-to-br from-red-50 to-rose-50 border-red-200 hover:shadow-red-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "earned":
        return <Award className="h-5 w-5 text-green-600" />;
      case "upcoming":
        return <Target className="h-5 w-5 text-yellow-600" />;
      default:
        return <Users className="h-5 w-5 text-red-600" />;
    }
  };

  // const getStatusBadge = (status: string, drinksToReward: number) => {
  //   switch (status) {
  //     case "earned":
  //       return (
  //         <Badge className="bg-green-600 hover:bg-green-700">
  //           🎉 Reward Ready
  //         </Badge>
  //       );
  //     case "upcoming":
  //       return (
  //         <Badge className="bg-yellow-600 hover:bg-yellow-700">
  //           ⚡ Almost There
  //         </Badge>
  //       );
  //     default:
  //       return (
  //         <Badge className="bg-red-600 hover:bg-red-700">
  //           {drinksToReward} drinks needed
  //         </Badge>
  //       );
  //   }
  // };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rewards Management</h1>
        <p className="text-gray-600">
          Track customer rewards with visual progress indicators
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">
              Total Rewards Given
            </CardTitle>
            <Gift className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              {stats.totalRewardsGiven}
            </div>
            <p className="text-xs text-purple-600">Free drinks distributed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">
              Customers with Rewards
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              {stats.customersWithRewards}
            </div>
            <p className="text-xs text-emerald-600">Have earned rewards</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">
              Upcoming Rewards
            </CardTitle>
            <MessageCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              {stats.upcomingRewards}
            </div>
            <p className="text-xs text-orange-600">Close to earning rewards</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Headers with Counts */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Award className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800">
              Reward Ready
            </h3>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {earnedRewards.length}
          </p>
          <p className="text-sm text-green-600">customers</p>
        </div>

        <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Target className="h-6 w-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-800">
              Almost There
            </h3>
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            {upcomingRewards.length}
          </p>
          <p className="text-sm text-yellow-600">customers</p>
        </div>

        <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800">In Progress</h3>
          </div>
          <p className="text-2xl font-bold text-red-600">
            {progressCustomers.length}
          </p>
          <p className="text-sm text-red-600">customers</p>
        </div>
      </div>

      {/* All Customers in One Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          All Customers by Reward Status
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rewardCustomers.map((customer) => (
            <Card
              key={customer._id}
              className={`transition-all duration-200 hover:shadow-lg ${getCardStyle(
                customer.status
              )}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(customer.status)}
                    <div>
                      <CardTitle className="text-base">
                        {customer.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {customer.phone}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sendWhatsAppReminder(customer)}
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <MessageCircle className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Drinks Purchased</span>
                  <Badge variant="secondary" className="font-bold">
                    {customer.totalOrders}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Progress</span>
                    <span className="text-xs text-gray-500">
                      {customer.status === "earned"
                        ? "6/6"
                        : `${customer.totalOrders % 6}/6`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        customer.status === "earned"
                          ? "bg-green-600"
                          : customer.status === "upcoming"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width:
                          customer.status === "earned"
                            ? "100%"
                            : `${((customer.totalOrders % 6) / 6) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* <div className="pt-2">
                  {getStatusBadge(customer.status, customer.drinksToReward)}
                </div> */}

                {/* {customer.status === "earned" && (
                  <div className="text-center p-2 bg-green-100 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      🎉 Free drink available!
                    </p>
                  </div>
                )}

                {customer.status === "upcoming" && (
                  <div className="text-center p-2 bg-yellow-100 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">
                      Just {customer.drinksToReward} more drink
                      {customer.drinksToReward > 1 ? "s" : ""}!
                    </p>
                  </div>
                )}

                {customer.status === "progress" && (
                  <div className="text-center p-2 bg-red-100 rounded-lg">
                    <p className="text-sm font-medium text-red-800">
                      {customer.drinksToReward} drinks to go
                    </p>
                  </div>
                )} */}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
