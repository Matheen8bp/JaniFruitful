"use client"

export const dynamic = "force-dynamic";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/config";
import { Check, Minus, Plus, Search, ShoppingCart, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface MenuItem {
  _id: string
  name: string
  category: string
  price: number
  image: string
  isActive: boolean
}

interface CartItem extends MenuItem {
  quantity: number
}

const categories = ["Mojito", "Ice Cream", "Milkshake", "Waffle"]

export default function ShopPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name")
  const { toast } = useToast()

  useEffect(() => {
    fetchMenuItems()
  }, [])

  useEffect(() => {
    filterAndSortItems()
  }, [menuItems, searchTerm, selectedCategory, sortBy])

  const filterAndSortItems = () => {
    let filtered = [...menuItems]

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "category":
          return a.category.localeCompare(b.category)
        default:
          return 0
      }
    })

    setFilteredItems(filtered)
  }

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(getApiUrl('api/menu'))
      if (response.ok) {
        const data = await response.json()
        setMenuItems(data)
      } else {
        console.error("Failed to fetch menu items")
      }
    } catch (err) {
      console.error("Error fetching menu items:", err)
    }
  }

  const addToCart = (item: MenuItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem._id === item._id)
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem._id === item._id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        )
      } else {
        return [...prevCart, { ...item, quantity: 1 }]
      }
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem._id === itemId)
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((cartItem) =>
          cartItem._id === itemId ? { ...cartItem, quantity: cartItem.quantity - 1 } : cartItem,
        )
      } else {
        return prevCart.filter((cartItem) => cartItem._id !== itemId)
      }
    })
  }

  const clearCart = () => {
    setCart([])
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const getItemQuantity = (itemId: string) => {
    const item = cart.find((cartItem) => cartItem._id === itemId)
    return item ? item.quantity : 0
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to cart before checkout",
        variant: "destructive",
      })
      return
    }
    setShowCheckout(true)
  }

  const handlePurchase = async (item: MenuItem) => {
    try {
      const response = await fetch(getApiUrl('api/customers/purchase'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          customerPhone,
          drinkType: item.category,
          itemId: item._id,
          itemName: item.name,
          price: item.price,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to process order")
      }
    } catch (err) {
      console.error("Error processing order:", err)
      toast({
        title: "Error",
        description: "Failed to process order. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSubmitOrder = async () => {
    if (!customerName || !customerPhone) {
      toast({
        title: "Missing information",
        description: "Please fill in customer name and phone number",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Process each item in the cart
      for (const cartItem of cart) {
        for (let i = 0; i < cartItem.quantity; i++) {
          await handlePurchase(cartItem)
        }
      }

      toast({
        title: "Order processed successfully!",
        description: `${getTotalItems()} items added for ${customerName}`,
      })

      // Reset form and cart
      setCustomerName("")
      setCustomerPhone("")
      clearCart()
      setShowCheckout(false)
    } catch {
      toast({
        title: "Error",
        description: "Failed to process order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const groupedItems = categories.reduce(
    (acc, category) => {
      const categoryItems = filteredItems.filter((item) => item.category === category)
      if (categoryItems.length > 0) {
        acc[category] = categoryItems
      }
      return acc
    },
    {} as Record<string, MenuItem[]>,
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shop</h1>
          <p className="text-gray-600">Browse and purchase menu items</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCheckout} disabled={cart.length === 0} className="bg-emerald-600 hover:bg-emerald-700">
            Checkout ({getTotalItems()})
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="price-low">Price (Low to High)</SelectItem>
                <SelectItem value="price-high">Price (High to Low)</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Summary */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredItems.length} of {menuItems.length} items
            {searchTerm && ` for "${searchTerm}"`}
            {selectedCategory !== "all" && ` in ${selectedCategory}`}
          </div>
        </CardContent>
      </Card>

      {/* No Results Message */}
      {filteredItems.length === 0 && menuItems.length > 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSortBy("name");
              }}
            >
              Clear all filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Cart Items Preview */}
      {cart.length > 0 && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-emerald-800">Cart Items</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={clearCart}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Cart
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {cart.map((item) => (
                <div key={item._id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-600">
                      {item.category} • ₹{item.price}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFromCart(item._id)}
                      className="h-6 w-6 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                    <Button size="sm" variant="outline" onClick={() => addToCart(item)} className="h-6 w-6 p-0">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Menu Items */}
      {categories.map((category) => (
        <div key={category} className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-800">{category}s</h2>
            <Badge variant="secondary">{groupedItems[category]?.length || 0} items</Badge>
          </div>

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {groupedItems[category]?.map((item) => {
              const quantity = getItemQuantity(item._id)
              const isDisabled = !item.isActive
              
              return (
                <Card 
                  key={item._id} 
                  className={`overflow-hidden transition-all duration-200 group ${
                    isDisabled 
                      ? 'opacity-50 grayscale cursor-not-allowed' 
                      : 'hover:shadow-lg'
                  }`}
                >
                  <div className="aspect-square bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center relative">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      width={150}
                      height={150}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = `/placeholder.svg?height=150&width=150`
                      }}
                    />
                    {quantity > 0 && !isDisabled && (
                      <div className="absolute top-2 right-2 bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        {quantity}
                      </div>
                    )}
                    {isDisabled && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white rounded-full px-2 py-1 text-xs font-bold">
                        Unavailable
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-sm leading-tight ${isDisabled ? 'text-gray-500' : ''}`}>
                      {item.name}
                    </CardTitle>
                    <CardDescription className={`font-semibold ${isDisabled ? 'text-gray-400' : 'text-emerald-600'}`}>
                      ₹{item.price}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {isDisabled ? (
                      <Button
                        size="sm"
                        className="w-full bg-gray-400 text-gray-600 cursor-not-allowed"
                        disabled
                      >
                        Unavailable
                      </Button>
                    ) : quantity === 0 ? (
                      <Button
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs"
                        onClick={() => addToCart(item)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    ) : (
                      <div className="flex items-center justify-between">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromCart(item._id)}
                          className="h-7 w-7 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-semibold px-2">{quantity}</span>
                        <Button size="sm" variant="outline" onClick={() => addToCart(item)} className="h-7 w-7 p-0">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}

      {/* Checkout Modal */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Complete Order
            </DialogTitle>
            <DialogDescription>Enter customer details to process the order</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Order Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">Order Summary</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item._id} className="flex justify-between text-sm">
                    <span>
                      {item.name} x{item.quantity}
                    </span>
                    <span className="font-medium">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total ({getTotalItems()} items)</span>
                  <span className="text-emerald-600">₹{getTotalPrice()}</span>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="customerPhone">Customer Phone</Label>
                <Input
                  id="customerPhone"
                  placeholder="Enter phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCheckout(false)}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitOrder}
                disabled={isProcessing || !customerName || !customerPhone}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {isProcessing ? (
                  "Processing..."
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Complete Order
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
