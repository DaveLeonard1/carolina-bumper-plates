import type { Product } from "@/hooks/use-products"

const CART_STORAGE_KEY = "carolina-bumper-plates-cart"

export interface CartItem {
  productId: number
  name: string
  weight: number
  quantity: number
  pricePerUnit: number
  totalPrice: number
  totalWeight: number
  yourContribution: number
}

export interface CartData {
  items: CartItem[]
  subtotal: number
  totalWeight: number
  totalContribution: number
  createdAt: string
}

export function saveCartToStorage(products: Product[], quantities: Record<number, number>): boolean {
  try {
    console.log("💾 saveCartToStorage: Starting save process...")
    console.log("📦 Products:", products.length)
    console.log("🔢 Quantities:", quantities)

    const items: CartItem[] = []

    products.forEach((product) => {
      const quantity = quantities[product.id] || 0
      console.log(`🔍 Product ${product.id} (${product.name}): quantity=${quantity}, hasQuantity=${quantity > 0}`)

      if (quantity > 0) {
        const productWeight = Number.parseFloat(product.name.split("lb")[0])
        const pricePerUnit = product.price / 100
        const totalPrice = quantity * pricePerUnit
        const totalWeight = quantity * productWeight * 2
        const yourContribution = quantity * 12.5

        console.log(`✅ Created cart item:`, {
          productId: product.id,
          name: product.name,
          weight: productWeight,
          quantity,
          pricePerUnit,
          totalPrice,
          totalWeight,
          yourContribution,
        })

        items.push({
          productId: product.id,
          name: product.name,
          weight: productWeight,
          quantity,
          pricePerUnit,
          totalPrice,
          totalWeight,
          yourContribution,
        })
      }
    })

    console.log("🛒 Cart items created:", items.length)

    const subtotal = items.reduce((sum, item) => {
      console.log(`💰 Item ${item.productId}: ${item.quantity} × $${item.pricePerUnit} = $${item.totalPrice}`)
      return sum + item.totalPrice
    }, 0)

    const totalWeight = items.reduce((sum, item) => {
      console.log(`⚖️ Item ${item.productId}: ${item.quantity} × ${item.weight} × 2 = ${item.totalWeight} lbs`)
      return sum + item.totalWeight
    }, 0)

    const totalContribution = items.reduce((sum, item) => {
      console.log(`💚 Item ${item.productId}: ${item.quantity} × $12.5 = $${item.yourContribution}`)
      return sum + item.yourContribution
    }, 0)

    const cartData: CartData = {
      items,
      subtotal,
      totalWeight,
      totalContribution,
      createdAt: new Date().toISOString(),
    }

    console.log("📊 Final cart data:", cartData)

    // Use sessionStorage instead of localStorage for iframe/sandboxed environments
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData))
    console.log("✅ Cart saved to sessionStorage successfully")

    // Verify the save
    const verification = sessionStorage.getItem(CART_STORAGE_KEY)
    console.log("🔍 Verification - Data in sessionStorage:", verification ? "YES" : "NO")

    return true
  } catch (error) {
    console.error("❌ Error saving cart to sessionStorage:", error)
    return false
  }
}

export function getCartFromStorage(): CartData | null {
  try {
    console.log("📖 getCartFromStorage: Loading cart...")
    const cartJson = sessionStorage.getItem(CART_STORAGE_KEY)

    if (!cartJson) {
      console.log("ℹ️ No cart data found in sessionStorage")
      return null
    }

    console.log("📦 Raw cart JSON:", cartJson.substring(0, 100) + "...")

    const cartData = JSON.parse(cartJson) as CartData
    console.log("✅ Cart loaded successfully:", {
      itemCount: cartData.items.length,
      subtotal: cartData.subtotal,
      totalWeight: cartData.totalWeight,
    })

    return cartData
  } catch (error) {
    console.error("❌ Error loading cart from sessionStorage:", error)
    return null
  }
}

export function clearCartFromStorage(): void {
  try {
    sessionStorage.removeItem(CART_STORAGE_KEY)
    console.log("🗑️ Cart cleared from sessionStorage")
  } catch (error) {
    console.error("❌ Error clearing cart from sessionStorage:", error)
  }
}
