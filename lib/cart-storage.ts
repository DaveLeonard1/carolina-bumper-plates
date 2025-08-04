import type { Product } from "@/lib/supabase"

export interface CartItem {
  productId: number
  weight: number
  title: string
  description: string
  quantity: number
  sellingPrice: number
  regularPrice: number
  available: boolean
}

export interface CartData {
  items: CartItem[]
  subtotal: number
  totalWeight: number
  totalSavings: number
  timestamp: number
}

const CART_STORAGE_KEY = "carolina_bumper_plates_cart"

export function saveCartToStorage(products: Product[], quantities: Record<number, number>): void {
  try {
    console.log("💾 saveCartToStorage: Starting save process...")
    console.log("📦 Products:", products.length)
    console.log("🔢 Quantities:", quantities)

    const cartItems: CartItem[] = products
      .filter((product) => {
        const quantity = quantities[product.id]
        const hasQuantity = quantity && quantity > 0
        console.log(`🔍 Product ${product.id} (${product.title}): quantity=${quantity}, hasQuantity=${hasQuantity}`)
        return hasQuantity
      })
      .map((product) => {
        const item: CartItem = {
          productId: product.id,
          weight: product.weight,
          title: product.title,
          description: product.description || "",
          quantity: quantities[product.id] || 0,
          sellingPrice: product.selling_price,
          regularPrice: product.regular_price,
          available: product.available,
        }
        console.log(`✅ Created cart item:`, item)
        return item
      })

    console.log("🛒 Cart items created:", cartItems.length)

    const subtotal = cartItems.reduce((sum, item) => {
      const itemTotal = item.quantity * item.sellingPrice
      console.log(`💰 Item ${item.productId}: ${item.quantity} × $${item.sellingPrice} = $${itemTotal}`)
      return sum + itemTotal
    }, 0)

    const totalWeight = cartItems.reduce((sum, item) => {
      const itemWeight = item.quantity * item.weight * 2 // pairs
      console.log(`⚖️ Item ${item.productId}: ${item.quantity} × ${item.weight} × 2 = ${itemWeight} lbs`)
      return sum + itemWeight
    }, 0)

    const totalSavings = cartItems.reduce((sum, item) => {
      const itemSavings = item.quantity * (item.regularPrice - item.sellingPrice)
      console.log(
        `💚 Item ${item.productId}: ${item.quantity} × $${item.regularPrice - item.sellingPrice} = $${itemSavings}`,
      )
      return sum + itemSavings
    }, 0)

    const cartData: CartData = {
      items: cartItems,
      subtotal,
      totalWeight,
      totalSavings,
      timestamp: Date.now(),
    }

    console.log("📊 Final cart data:", {
      itemCount: cartData.items.length,
      subtotal: cartData.subtotal,
      totalWeight: cartData.totalWeight,
      totalSavings: cartData.totalSavings,
    })

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData))
    console.log("✅ Cart saved to localStorage successfully")
  } catch (error) {
    console.error("❌ Error saving cart to storage:", error)
    throw error
  }
}

export function getCartFromStorage(): CartData | null {
  try {
    console.log("📖 getCartFromStorage: Loading cart...")
    const stored = localStorage.getItem(CART_STORAGE_KEY)

    if (!stored) {
      console.log("ℹ️ No cart data found in localStorage")
      return null
    }

    const cartData: CartData = JSON.parse(stored)
    console.log("📦 Loaded cart data:", {
      itemCount: cartData.items?.length || 0,
      subtotal: cartData.subtotal,
      timestamp: new Date(cartData.timestamp).toLocaleString(),
    })

    // Check if cart is older than 24 hours
    const twentyFourHours = 24 * 60 * 60 * 1000
    const age = Date.now() - cartData.timestamp

    if (age > twentyFourHours) {
      console.log("⏰ Cart is older than 24 hours, clearing...")
      clearCartFromStorage()
      return null
    }

    // Validate cart data structure
    if (!cartData.items || !Array.isArray(cartData.items)) {
      console.warn("⚠️ Invalid cart data structure, clearing...")
      clearCartFromStorage()
      return null
    }

    // Validate each cart item
    const validItems = cartData.items.filter((item) => {
      const isValid =
        item.productId &&
        item.title &&
        typeof item.quantity === "number" &&
        item.quantity > 0 &&
        typeof item.sellingPrice === "number" &&
        item.sellingPrice > 0 &&
        typeof item.weight === "number" &&
        item.weight > 0

      if (!isValid) {
        console.warn("⚠️ Invalid cart item filtered out:", item)
      }

      return isValid
    })

    if (validItems.length !== cartData.items.length) {
      console.log(`🔧 Filtered cart: ${cartData.items.length} → ${validItems.length} items`)
      cartData.items = validItems
    }

    return cartData
  } catch (error) {
    console.error("❌ Error loading cart from storage:", error)
    clearCartFromStorage()
    return null
  }
}

export function clearCartFromStorage(): void {
  try {
    console.log("🗑️ Clearing cart from storage...")
    localStorage.removeItem(CART_STORAGE_KEY)
    console.log("✅ Cart cleared successfully")
  } catch (error) {
    console.error("❌ Error clearing cart from storage:", error)
  }
}

export function updateCartItemQuantity(productId: number, quantity: number): void {
  try {
    console.log(`🔄 Updating cart item ${productId} quantity to ${quantity}`)
    const cartData = getCartFromStorage()
    if (!cartData) {
      console.log("ℹ️ No cart data to update")
      return
    }

    const itemIndex = cartData.items.findIndex((item) => item.productId === productId)
    if (itemIndex === -1) {
      console.log(`ℹ️ Product ${productId} not found in cart`)
      return
    }

    if (quantity <= 0) {
      console.log(`🗑️ Removing product ${productId} from cart`)
      cartData.items.splice(itemIndex, 1)
    } else {
      console.log(`📝 Updating product ${productId} quantity: ${cartData.items[itemIndex].quantity} → ${quantity}`)
      cartData.items[itemIndex].quantity = quantity
    }

    // Recalculate totals
    cartData.subtotal = cartData.items.reduce((sum, item) => sum + item.quantity * item.sellingPrice, 0)
    cartData.totalWeight = cartData.items.reduce((sum, item) => sum + item.quantity * item.weight * 2, 0)
    cartData.totalSavings = cartData.items.reduce(
      (sum, item) => sum + item.quantity * (item.regularPrice - item.sellingPrice),
      0,
    )
    cartData.timestamp = Date.now()

    console.log("📊 Recalculated totals:", {
      subtotal: cartData.subtotal,
      totalWeight: cartData.totalWeight,
      totalSavings: cartData.totalSavings,
    })

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData))
    console.log("✅ Cart updated successfully")
  } catch (error) {
    console.error("❌ Error updating cart item:", error)
  }
}
