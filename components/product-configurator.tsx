"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Minus, Plus, RefreshCw, ChevronDown, ChevronUp, ShoppingCart } from "lucide-react"
import { colorUsage } from "@/lib/colors"
import { useProducts } from "@/hooks/use-products"
import { saveCartToStorage } from "@/lib/cart-storage"
import { ProductCard } from "@/components/ui/product-card"

export default function ProductConfigurator() {
  const { products, loading, error, refresh, lastFetch } = useProducts()
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [isCartExpanded, setIsCartExpanded] = useState(false)

  // Initialize quantities when products load
  useEffect(() => {
    if (products.length > 0) {
      const initialQuantities: Record<number, number> = {}
      products.forEach((product) => {
        initialQuantities[product.id] = 0
      })
      setQuantities(initialQuantities)
      console.log("🔢 Initialized quantities for", products.length, "products")
    }
  }, [products])

  const updateQuantity = (productId: number, change: number) => {
    setQuantities((prev) => {
      const newQuantity = Math.max(0, (prev[productId] || 0) + change)
      console.log(`📝 Updated quantity for product ${productId}: ${prev[productId] || 0} → ${newQuantity}`)
      return {
        ...prev,
        [productId]: newQuantity,
      }
    })
  }

  const selectedProducts = products.filter((product) => quantities[product.id] && quantities[product.id] > 0)
  const totalWeight = selectedProducts.reduce((sum, product) => sum + product.weight * quantities[product.id] * 2, 0)
  const totalCost = selectedProducts.reduce((sum, product) => sum + product.selling_price * quantities[product.id], 0)
  const totalSavings = selectedProducts.reduce(
    (sum, product) => sum + (product.regular_price - product.selling_price) * quantities[product.id],
    0,
  )

  const handleCheckout = () => {
    console.log("🛒 Checkout button clicked")
    console.log("📦 Total products:", products.length)
    console.log("🔢 Current quantities:", quantities)
    console.log("✅ Selected products:", selectedProducts.length)
    console.log("💰 Total cost:", totalCost)

    if (selectedProducts.length === 0) {
      console.warn("⚠️ No products selected")
      alert("Please select at least one product before checking out")
      return
    }

    try {
      // Save cart data to localStorage
      console.log("💾 Saving cart to localStorage...")
      saveCartToStorage(products, quantities)
      console.log("✅ Cart saved successfully, redirecting to checkout...")

      // Navigate to checkout
      window.location.href = "/checkout"
    } catch (error) {
      console.error("❌ Error during checkout:", error)
      alert("There was an error processing your cart. Please try again.")
    }
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
            <p style={{ color: colorUsage.textMuted }}>Failed to load products. Please try again.</p>
            <Button onClick={refresh} variant="outline" className="mt-4 bg-transparent">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
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
            <Button onClick={refresh} variant="outline" className="mt-4 bg-transparent">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="configurator" className="w-full px-4 py-12 md:py-16 bg-background">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-4xl md:text-5xl font-black text-center mb-12" style={{ fontFamily: "Oswald, sans-serif" }}>
          BUILD YOUR PREORDER
        </h2>

        {/* Mobile Cart - Sticky at top when items selected */}
        {selectedProducts.length > 0 && (
          <div className="lg:hidden fixed top-0 left-0 right-0 z-50 mb-4">
            <Card className="p-0 overflow-hidden shadow-lg rounded-none border-0">
              <button
                onClick={() => setIsCartExpanded(!isCartExpanded)}
                className="w-full bg-[#B9FF16] text-black px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-bold text-sm">
                      {selectedProducts.length} {selectedProducts.length === 1 ? "Item" : "Items"} • {totalWeight} lbs
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-base">${totalCost.toFixed(0)}</div>
                  </div>
                  {isCartExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isCartExpanded && (
                <div className="bg-white p-4 border-t border-gray-200">
                  <div className="space-y-3 mb-4">
                    {selectedProducts.map((product) => {
                      const itemQuantity = quantities[product.id]
                      const itemSavings = (product.regular_price - product.selling_price) * itemQuantity
                      return (
                        <div key={product.id} className="flex justify-between items-start text-sm">
                          <div className="flex-1">
                            <div className="font-medium">
                              {itemQuantity}x {product.title}
                            </div>
                            <div className="text-xs text-gray-400">
                              Save ${itemSavings.toFixed(2)}
                            </div>
                          </div>
                          <div className="font-semibold">${(product.selling_price * itemQuantity).toFixed(0)}</div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span className="font-semibold">${totalCost.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Total Savings</span>
                      <span className="font-semibold">${totalSavings.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold pt-2 border-t">
                      <span>Total</span>
                      <span>${totalCost.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        <div className={`grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 ${selectedProducts.length > 0 ? 'lg:mt-0 mt-16' : ''}`}>
          <div className="md:p-6 md:border md:rounded-lg md:bg-card">
            {/* Desktop Table Header */}
            <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1.5fr] gap-4 pb-4 border-b mb-4">
              <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Product</div>
              <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Price</div>
              <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Savings</div>
              <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground text-center">
                Quantity
              </div>
            </div>

            <div className="space-y-4 md:space-y-3 md:px-0">
              {products
                .filter((product) => product.available)
                .map((product) => {
                  const savings = product.regular_price - product.selling_price
                  const savingsPercent = Math.round((savings / product.regular_price) * 100)
                  const itemQuantity = quantities[product.id] || 0
                  return (
                    <div key={product.id}>
                      {/* Mobile Card Layout */}
                      <ProductCard
                        title={product.title}
                        price={product.selling_price}
                        regularPrice={product.regular_price}
                        quantity={itemQuantity}
                        onDecrease={() => updateQuantity(product.id, -1)}
                        onIncrease={() => updateQuantity(product.id, 1)}
                        decreaseDisabled={itemQuantity === 0}
                        imageUrl={product.image_url}
                        metadata={`Save $${savings.toFixed(2)} (${savingsPercent}% off)`}
                      />

                      {/* Desktop Table Row */}
                      <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1.5fr] gap-4 md:items-center pb-3 border-b last:border-b-0">
                        <div className="font-semibold">{product.title}</div>
                        <div>
                          <span className="text-lg font-bold">${product.selling_price}</span>
                          <span className="text-sm text-muted-foreground line-through ml-2">${product.regular_price}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-semibold">${savings.toFixed(2)}</span>
                          <span className="text-sm text-muted-foreground ml-1">({savingsPercent}% off)</span>
                        </div>
                        <div className="flex items-center justify-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-md bg-transparent"
                            onClick={() => updateQuantity(product.id, -1)}
                            disabled={itemQuantity === 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-lg font-semibold w-8 text-center">{itemQuantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-md bg-white hover:bg-[#B9FF16] border-gray-300 hover:border-[#B9FF16]"
                            onClick={() => updateQuantity(product.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Desktop Order Summary Sidebar */}
          <div className="hidden lg:block lg:sticky lg:top-4 lg:self-start">
            <Card className="p-0 overflow-hidden">
              <div className="bg-black text-white px-6 py-4 md:bg-transparent md:text-foreground md:px-6 md:pt-6 md:pb-0">
                <h2 className="text-xl md:text-2xl font-bold uppercase md:normal-case tracking-wide md:tracking-normal md:mb-6">
                  Your Custom Set
                </h2>
              </div>

              <div className="p-6 md:pt-0">
                {selectedProducts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">Add plates to see your custom set</p>
                ) : (
                  <>
                    <div className="space-y-3 mb-6 pb-6 border-b">
                      {selectedProducts.map((product) => {
                        const itemQuantity = quantities[product.id]
                        const itemSavings = (product.regular_price - product.selling_price) * itemQuantity
                        return (
                          <div key={product.id} className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium">
                                {itemQuantity}x {product.title}
                              </div>
                              <div className="text-sm text-gray-400">
                                Save ${itemSavings.toFixed(2)}
                              </div>
                            </div>
                            <div className="font-semibold">${(product.selling_price * itemQuantity).toFixed(0)}</div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-base">
                        <span>Subtotal</span>
                        <span className="font-semibold">${totalCost.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-base text-gray-400">
                        <span>Total Savings</span>
                        <span className="font-semibold">${totalSavings.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold pt-3 border-t">
                        <span>Total</span>
                        <span>${totalCost.toFixed(0)}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">Total Weight: {totalWeight} lbs</div>
                    </div>

                    <Button 
                      className="w-full bg-[#B9FF16] hover:bg-[#A3E600] text-black font-bold text-base h-12 uppercase tracking-wide"
                      onClick={handleCheckout}
                    >
                      Reserve Your Preorder
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Mobile Fixed Bottom Checkout Button */}
        {selectedProducts.length > 0 && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
            <Button 
              className="w-full bg-[#B9FF16] hover:bg-[#A3E600] text-black font-bold text-base h-12 uppercase tracking-wide shadow-lg"
              onClick={handleCheckout}
            >
              Reserve Preorder • ${totalCost.toFixed(0)}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
