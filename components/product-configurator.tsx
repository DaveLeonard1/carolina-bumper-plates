"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Minus, Plus, RefreshCw } from "lucide-react"
import { colorUsage } from "@/lib/colors"
import { useProducts } from "@/hooks/use-products"
import { saveCartToStorage } from "@/lib/cart-storage"

export default function ProductConfigurator() {
  const { products, loading, error, refresh, lastFetch } = useProducts()
  const [quantities, setQuantities] = useState<Record<number, number>>({})

  // Initialize quantities when products load
  useEffect(() => {
    if (products.length > 0) {
      const initialQuantities: Record<number, number> = {}
      products.forEach((product) => {
        initialQuantities[product.id] = 0
      })
      setQuantities(initialQuantities)
    }
  }, [products])

  const updateQuantity = (productId: number, change: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + change),
    }))
  }

  const selectedProducts = products.filter((product) => quantities[product.id] && quantities[product.id] > 0)
  const totalWeight = selectedProducts.reduce((sum, product) => sum + product.weight * quantities[product.id] * 2, 0)
  const totalCost = selectedProducts.reduce((sum, product) => sum + product.selling_price * quantities[product.id], 0)
  const totalSavings = selectedProducts.reduce(
    (sum, product) => sum + (product.regular_price - product.selling_price) * quantities[product.id],
    0,
  )

  const handleCheckout = () => {
    if (selectedProducts.length === 0) return

    // Save cart data to localStorage
    saveCartToStorage(products, quantities)

    // Navigate to checkout
    window.location.href = "/checkout"
  }

  if (loading) {
    return (
      <section id="configurator" className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-black text-center mb-12"
            style={{ fontFamily: "Oswald, sans-serif" }}
          >
            BUILD YOUR PREORDER
          </h2>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p style={{ color: colorUsage.textMuted }}>Loading products...</p>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section id="configurator" className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-black text-center mb-12"
            style={{ fontFamily: "Oswald, sans-serif" }}
          >
            BUILD YOUR PREORDER
          </h2>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Error loading products: {error}</p>
            <Button onClick={refresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return (
      <section id="configurator" className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-black text-center mb-12"
            style={{ fontFamily: "Oswald, sans-serif" }}
          >
            BUILD YOUR PREORDER
          </h2>
          <div className="text-center py-8">
            <p style={{ color: colorUsage.textMuted }}>No products available at the moment.</p>
            <Button onClick={refresh} variant="outline" className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="configurator" className="px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-black text-center mb-12" style={{ fontFamily: "Oswald, sans-serif" }}>
          BUILD YOUR PREORDER
        </h2>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Product Configurator - Left Side */}
          <div className="lg:col-span-2">
            <Card className="p-6 rounded-lg border">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Available Products</h3>
                  <div className="flex items-center gap-2">
                    <Button onClick={refresh} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                    {lastFetch && (
                      <span className="text-xs" style={{ color: colorUsage.textMuted }}>
                        Updated: {lastFetch.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div
                    className="grid grid-cols-4 gap-4 font-semibold text-sm border-b pb-2"
                    style={{ color: colorUsage.textMuted }}
                  >
                    <span>PRODUCT</span>
                    <span>PRICE</span>
                    <span>SAVINGS</span>
                    <span>QUANTITY</span>
                  </div>
                  {products
                    .filter((product) => product.available)
                    .map((product) => {
                      const savings = product.regular_price - product.selling_price
                      const savingsPercent = Math.round((savings / product.regular_price) * 100)
                      const itemQuantity = quantities[product.id] || 0
                      return (
                        <div key={product.id} className="grid grid-cols-4 gap-4 items-center py-2">
                          <div>
                            <span className="font-semibold">{product.title}</span>
                          </div>
                          <div>
                            <span className="font-semibold" style={{ color: colorUsage.textOnLight }}>
                              ${product.selling_price}
                            </span>
                            <div className="text-sm line-through" style={{ color: colorUsage.textDisabled }}>
                              ${product.regular_price}
                            </div>
                          </div>
                          <div>
                            <span className="font-semibold text-green-600">${savings.toFixed(2)}</span>
                            <div className="text-sm text-green-600">({savingsPercent}% off)</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(product.id, -1)}
                              disabled={itemQuantity === 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold">{itemQuantity}</span>
                            <Button variant="outline" size="sm" onClick={() => updateQuantity(product.id, 1)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary - Right Side */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4 rounded-lg border">
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-6">Your Custom Set</h3>

                {/* Selected Items */}
                <div className="space-y-4 mb-6">
                  {selectedProducts.length > 0 ? (
                    selectedProducts.map((product) => {
                      const itemQuantity = quantities[product.id]
                      const itemSavings = (product.regular_price - product.selling_price) * itemQuantity
                      return (
                        <div key={product.id} className="flex justify-between items-start">
                          <div>
                            <span className="font-semibold">
                              {itemQuantity}x {product.title}
                            </span>
                            <div className="text-sm font-medium" style={{ color: colorUsage.textOnLight }}>
                              Save ${itemSavings.toFixed(2)}
                            </div>
                          </div>
                          <span className="font-semibold">${product.selling_price * itemQuantity}</span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8" style={{ color: colorUsage.textDisabled }}>
                      No products selected yet
                    </div>
                  )}
                </div>

                {/* Totals */}
                {totalWeight > 0 && (
                  <>
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-semibold">${totalCost}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Total Savings</span>
                        <span className="font-semibold">${totalSavings.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-bold">Total</span>
                        <div className="text-right">
                          <span className="text-lg font-bold" style={{ color: colorUsage.textOnLight }}>
                            ${totalCost}
                          </span>
                          <div className="text-sm line-through" style={{ color: colorUsage.textDisabled }}>
                            ${totalCost + totalSavings}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm mb-4" style={{ color: colorUsage.textMuted }}>
                        Total Weight: {totalWeight} lbs
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className="w-full font-bold text-lg py-4"
                      onClick={handleCheckout}
                      style={{
                        backgroundColor: colorUsage.buttonSecondary,
                        color: colorUsage.textOnDark,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colorUsage.buttonSecondaryHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colorUsage.buttonSecondary)}
                    >
                      Reserve Your Preorder
                    </Button>
                  </>
                )}

                {totalWeight === 0 && (
                  <Button
                    size="lg"
                    className="w-full font-bold text-lg py-4"
                    disabled
                    style={{
                      backgroundColor: colorUsage.textDisabled,
                      color: colorUsage.textOnDark,
                    }}
                  >
                    Select Products to Continue
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
