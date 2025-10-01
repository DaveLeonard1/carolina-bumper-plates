"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Minus, Plus } from "lucide-react"
import { useProducts } from "@/hooks/use-products"
import { saveCartToStorage } from "@/lib/cart-storage"
import { useRouter } from "next/navigation"
import { TopBar } from "@/components/top-bar"
import { Header } from "@/components/header"

export default function HomePage() {
  const { products: dbProducts, loading: productsLoading } = useProducts()
  const router = useRouter()

  // Product configurator state
  const [quantities, setQuantities] = useState<Record<number, number>>({})

  // Initialize quantities when products load
  useEffect(() => {
    if (dbProducts.length > 0) {
      const initialQuantities: Record<number, number> = {}
      dbProducts.forEach((product) => {
        initialQuantities[product.id] = 0
      })
      setQuantities(initialQuantities)
      console.log("🔢 HomePage: Initialized quantities for", dbProducts.length, "products")
    }
  }, [dbProducts])

  const updateQuantity = (productId: number, change: number) => {
    setQuantities((prev) => {
      const newQuantity = Math.max(0, (prev[productId] || 0) + change)
      console.log(`📝 HomePage: Updated quantity for product ${productId}: ${prev[productId] || 0} → ${newQuantity}`)
      return {
        ...prev,
        [productId]: newQuantity,
      }
    })
  }

  const calculateTotals = () => {
    let subtotal = 0
    let totalSavings = 0
    let totalWeight = 0
    const customSet = []

    dbProducts.forEach((product) => {
      const qty = quantities[product.id] || 0
      if (qty > 0) {
        subtotal += product.selling_price * qty
        totalSavings += (product.regular_price - product.selling_price) * qty
        totalWeight += product.weight * qty * 2 // pairs
        customSet.push({
          id: product.id,
          weight: product.weight,
          title: product.title,
          quantity: qty,
          price: product.selling_price,
          regularPrice: product.regular_price,
          total: product.selling_price * qty,
          savings: (product.regular_price - product.selling_price) * qty,
        })
      }
    })

    return { subtotal, totalSavings, totalWeight, customSet }
  }

  const { subtotal, totalSavings, totalWeight, customSet } = calculateTotals()

  const handleReservePreorder = () => {
    console.log("🛒 HomePage: Reserve Preorder clicked")
    console.log("📦 HomePage: Products available:", dbProducts.length)
    console.log("🔢 HomePage: Current quantities:", quantities)
    console.log("💰 HomePage: Subtotal:", subtotal)
    console.log("⚖️ HomePage: Total weight:", totalWeight)

    if (subtotal === 0) {
      console.log("⚠️ HomePage: No items selected")
      alert("Please select at least one product before proceeding to checkout")
      return
    }

    try {
      console.log("💾 HomePage: About to save cart with products:", dbProducts.length)
      console.log("💾 HomePage: About to save cart with quantities:", quantities)

      // Save cart to localStorage
      saveCartToStorage(dbProducts, quantities)

      // Verify the save worked
      const savedData = localStorage.getItem("carolina_bumper_plates_cart")
      console.log("✅ HomePage: Cart saved, verification:", savedData ? "Data exists" : "No data!")
      if (savedData) {
        const parsed = JSON.parse(savedData)
        console.log("✅ HomePage: Saved cart has", parsed.items?.length || 0, "items")
      }

      // Small delay to ensure localStorage write completes
      setTimeout(() => {
        console.log("🔄 HomePage: Redirecting to checkout...")
        router.push("/checkout")
      }, 100)
    } catch (error) {
      console.error("❌ HomePage: Error saving cart:", error)
      alert("There was an error processing your cart. Please try again.")
    }
  }

  const currentProgress = 8320
  const targetWeight = 10000
  const progressPercentage = (currentProgress / targetWeight) * 100

  if (productsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <TopBar />

      {/* Hero Section with Transparent Header */}
      <section
        className="relative min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/leonardd623_A_crossfit_gym_with_a_pile_of_rubber_bumper_plates__1f8a2f9c-db53-4057-b738-867222a79209.png-t4MLv5CT4WycwSqGRtxF7JmpvsoHMG.jpeg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Transparent Header */}
        <Header transparent />

        <div className="px-[27px] md:px-[52px] w-full">
          <div className="max-w-[1440px] mx-auto text-center text-white">
            <h1 className="text-6xl lg:text-8xl font-black mb-6 leading-tight">OFFICIAL HI-TEMP PLATES.</h1>
            <h2 className="text-3xl lg:text-4xl font-bold mb-12 opacity-90">MINOR BLEMISHES. MAJOR SAVINGS.</h2>
            <a href="#configurator">
              <Button
                size="lg"
                className="font-bold text-xl px-12 py-6 text-black hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#cfff5e" }}
              >
                Build Your Set →
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ backgroundColor: "#1a1a1a" }}>
        <div className="px-[27px] md:px-[52px] py-[60px] md:py-[80px]">
          <div className="max-w-[1440px] mx-auto">
            <h2 className="text-4xl lg:text-5xl font-black text-center mb-12 text-white">HOW IT WORKS</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-white rounded-3xl p-8">
                <CardContent className="pt-6">
                  <h3 className="text-2xl font-black mb-4 text-gray-900 flex items-center gap-3">
                    <span className="text-4xl">🏋🏽</span>
                    BUILD YOUR PREORDER
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    Choose your plates and set up your preorder. No payment yet — just reserve your spot.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-3xl p-8">
                <CardContent className="pt-6">
                  <h3 className="text-2xl font-black mb-4 text-gray-900 flex items-center gap-3">
                    <span className="text-4xl">💳</span>
                    PAY WHEN READY
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    Once we hit the weight goal, you'll receive a secure Stripe payment link. Only pay when your
                    preorder is confirmed.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-3xl p-8">
                <CardContent className="pt-6">
                  <h3 className="text-2xl font-black mb-4 text-gray-900 flex items-center gap-3">
                    <span className="text-4xl">📦</span>
                    DELIVERED TO YOU
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    We deliver your plates straight to you. Fast, local delivery once production is complete.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Product Configurator */}
      <section id="configurator" className="bg-white">
        <div className="px-[27px] md:px-[52px] py-[60px] md:py-[80px]">
          <div className="max-w-[1440px] mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl lg:text-5xl font-black mb-6 text-gray-900">BUILD YOUR PREORDER</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We sell official Hi-Temp bumper plates with visual imperfections at discounted prices. These aren't
                knockoffs
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-12">
              {/* Product Table */}
              <div className="lg:col-span-2">
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 font-semibold text-sm text-gray-700">
                    <div>PRODUCT</div>
                    <div>PRICE</div>
                    <div>SAVINGS</div>
                    <div>QUANTITY</div>
                    <div></div>
                  </div>

                  {dbProducts
                    .filter((product) => product.available)
                    .map((product) => {
                      const savings = product.regular_price - product.selling_price
                      const savingsPercent = Math.round((savings / product.regular_price) * 100)
                      const qty = quantities[product.id] || 0

                      return (
                        <div
                          key={product.id}
                          className="grid grid-cols-5 gap-4 p-4 border-t border-gray-100 items-center"
                        >
                          <div>
                            <div className="font-semibold">{product.title}</div>
                            <div className="text-sm text-gray-500 line-through">${product.regular_price}</div>
                          </div>
                          <div className="font-bold text-lg">${product.selling_price}</div>
                          <div>
                            <div className="font-semibold" style={{ color: "#6EBA5E" }}>
                              ${savings.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500">({savingsPercent}% off)</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(product.id, -1)}
                              className="w-8 h-8 p-0"
                              disabled={qty === 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold">{qty}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(product.id, 1)}
                              className="w-8 h-8 p-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div></div>
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="bg-gray-50 border border-gray-200 sticky top-4">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-6">Your Custom Set</h3>

                    {customSet.length > 0 ? (
                      <div className="space-y-3 mb-6">
                        {customSet.map((item) => (
                          <div key={item.id} className="flex justify-between">
                            <div>
                              <div className="text-sm font-medium">
                                {item.quantity}x {item.title}
                              </div>
                              <div className="text-xs" style={{ color: "#6EBA5E" }}>
                                Save ${item.savings.toFixed(2)}
                              </div>
                            </div>
                            <span className="font-semibold">${item.total}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center py-8">Add plates to see your custom set</div>
                    )}

                    {customSet.length > 0 && (
                      <>
                        <div className="border-t border-gray-300 pt-4 space-y-2">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="font-semibold">${subtotal}</span>
                          </div>
                          <div className="flex justify-between" style={{ color: "#6EBA5E" }}>
                            <span>Total Savings</span>
                            <span className="font-semibold">${totalSavings.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                            <span>Total</span>
                            <span>${subtotal}</span>
                          </div>
                          <div className="text-sm text-gray-500">Total Weight: {totalWeight} lbs</div>
                        </div>

                        <Button
                          onClick={handleReservePreorder}
                          className="w-full mt-6 py-3 font-bold hover:opacity-90 transition-opacity border-2"
                          style={{ backgroundColor: "#B9FF16", color: "#1a1a1a", borderColor: "#B9FF16" }}
                        >
                          Reserve Your Preorder
                        </Button>
                      </>
                    )}

                    {customSet.length === 0 && (
                      <Button
                        disabled
                        className="w-full mt-6 py-3 font-bold text-white"
                        style={{ backgroundColor: "#d1d1d1" }}
                      >
                        Select Products to Continue
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Batch Progress */}
      <section style={{ backgroundColor: "#1a1a1a" }}>
        <div className="px-[27px] md:px-[52px] py-[60px] md:py-[80px]">
          <div className="max-w-[1440px] mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-black mb-12 text-white">BATCH PROGRESS</h2>

            <div className="bg-gray-800 rounded-2xl p-8">
              <div className="flex justify-between items-center mb-6 text-white">
                <div className="text-3xl font-bold">{currentProgress.toLocaleString()} lbs</div>
                <div className="text-3xl font-bold">{targetWeight.toLocaleString()} lbs</div>
              </div>

              <div className="w-full bg-gray-700 rounded-full h-4 mb-6">
                <div
                  className="h-4 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: "#cfff5e",
                    width: `${progressPercentage}%`,
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-center gap-2 text-white">
                <span className="text-2xl">⚠️</span>
                <p className="text-xl font-semibold" style={{ color: "#cfff5e" }}>
                  Only {(targetWeight - currentProgress).toLocaleString()} lbs to go before the next batch is fulfilled!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="px-[27px] md:px-[52px] py-[40px] md:py-12">
          <div className="max-w-[1440px] mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div>
                <div className="text-2xl font-bold">THE PLATE YARD</div>
                <div className="text-sm opacity-80 -mt-1">FACTORY SECONDS. FIRST CLASS GAINS.</div>
              </div>
            </div>
            <p className="text-gray-400">Official Hi-Temp factory seconds. USA-made quality at wholesale prices.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
