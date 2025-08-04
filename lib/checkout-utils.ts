import type { Product } from "@/lib/supabase"

export interface CheckoutItem {
  productId: number
  weight: number
  title: string
  quantity: number
  price: number
  regularPrice: number
}

export interface OrderData {
  customerName: string
  customerEmail: string
  customerPhone: string
  streetAddress: string
  city: string
  state: string
  zipCode: string
  deliveryInstructions: string
  deliveryOption: string
  additionalNotes: string
  orderItems: CheckoutItem[]
  subtotal: number
  totalWeight: number
}

export function calculateOrderTotals(items: CheckoutItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  const totalWeight = items.reduce((sum, item) => sum + item.quantity * item.weight * 2, 0) // pairs
  const totalSavings = items.reduce((sum, item) => sum + item.quantity * (item.regularPrice - item.price), 0)

  return {
    subtotal,
    totalWeight,
    totalSavings,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  }
}

export function transformProductsToCheckoutItems(
  products: Product[],
  quantities: Record<number, number>,
): CheckoutItem[] {
  return products
    .filter((product) => quantities[product.id] && quantities[product.id] > 0)
    .map((product) => ({
      productId: product.id,
      weight: product.weight,
      title: product.title,
      quantity: quantities[product.id] || 0,
      price: product.selling_price,
      regularPrice: product.regular_price,
    }))
}
