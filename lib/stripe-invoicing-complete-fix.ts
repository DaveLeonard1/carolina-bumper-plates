import type Stripe from "stripe"
import { getStripe } from "./stripe"
import { createSupabaseAdmin } from "./supabase"

export interface OrderItem {
  weight: number
  quantity: number
  price: number
  product_title?: string
}

export interface OrderForInvoicing {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  street_address?: string
  city?: string
  state?: string
  zip_code?: string
  order_items: OrderItem[] | string
  subtotal: number
  total_weight: number
  stripe_customer_id?: string
}

export interface InvoiceResult {
  success: boolean
  invoice?: Stripe.Invoice
  error?: string
  details?: {
    invoice_id: string
    invoice_url: string
    invoice_pdf?: string
    customer_id: string
  }
}

/**
 * Parses order items from various formats
 */
function parseOrderItems(orderItems: OrderItem[] | string): OrderItem[] {
  try {
    if (typeof orderItems === "string") {
      const parsed = JSON.parse(orderItems)
      return Array.isArray(parsed) ? parsed : []
    }
    return Array.isArray(orderItems) ? orderItems : []
  } catch (error) {
    console.error("Failed to parse order items:", error)
    return []
  }
}

/**
 * Creates or retrieves a Stripe customer for the order - FIXED VERSION
 */
async function ensureStripeCustomer(order: OrderForInvoicing): Promise<string> {
  const stripe = await getStripe()

  // If customer already exists, try to retrieve and update if needed
  if (order.stripe_customer_id) {
    try {
      const existingCustomer = await stripe.customers.retrieve(order.stripe_customer_id)

      // Update customer if address is missing but we have it in the order
      if (order.street_address && order.city && order.state && order.zip_code) {
        const hasAddress = existingCustomer.address?.line1

        if (!hasAddress) {
          await stripe.customers.update(order.stripe_customer_id, {
            address: {
              line1: order.street_address,
              city: order.city,
              state: order.state,
              postal_code: order.zip_code,
              country: "US",
            },
          })
          console.log("Updated existing customer with billing address")
        }
      }

      return order.stripe_customer_id
    } catch (error) {
      console.warn("Existing Stripe customer not found, creating new one:", error)
    }
  }

  // Create new Stripe customer - FIXED: Removed shipping parameter
  const customerData: Stripe.CustomerCreateParams = {
    email: order.customer_email,
    name: order.customer_name,
    phone: order.customer_phone || undefined,
    metadata: {
      order_number: order.order_number,
      source: "carolina-bumper-plates",
    },
  }

  // Add billing address if available - NO SHIPPING PARAMETER
  if (order.street_address && order.city && order.state && order.zip_code) {
    customerData.address = {
      line1: order.street_address,
      city: order.city,
      state: order.state,
      postal_code: order.zip_code,
      country: "US",
    }
    console.log("Adding billing address to new customer:", customerData.address)
  } else {
    console.warn("Missing billing address data:", {
      street_address: order.street_address,
      city: order.city,
      state: order.state,
      zip_code: order.zip_code,
    })
  }

  const customer = await stripe.customers.create(customerData)
  console.log("Created new Stripe customer:", customer.id)
  return customer.id
}

/**
 * Maps order items to Stripe products and creates invoice items - FIXED VERSION
 */
async function createInvoiceItems(
  stripe: Stripe,
  customerId: string,
  order: OrderForInvoicing,
): Promise<{ success: boolean; error?: string; itemsCreated?: number }> {
  const supabaseAdmin = createSupabaseAdmin()

  try {
    // Parse order items
    const orderItems = parseOrderItems(order.order_items)
    console.log("Parsed order items:", orderItems)

    if (orderItems.length === 0) {
      return { success: false, error: "No order items found to create invoice items" }
    }

    // Get unique weights from order items
    const weights = [...new Set(orderItems.map((item) => item.weight))]
    console.log("Unique weights needed:", weights)

    // Fetch products using correct column names
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("weight, title, stripe_product_id, stripe_price_id, selling_price, available")
      .in("weight", weights)

    if (productsError) {
      console.error("Products fetch error:", productsError)
      throw new Error(`Failed to fetch products: ${productsError.message}`)
    }

    console.log("Found products:", products)

    // Create a weight-to-product mapping
    const productMap = new Map()
    if (products) {
      products.forEach((product) => {
        productMap.set(product.weight, product)
      })
    }

    let itemsCreated = 0

    // Create invoice items for each order item
    for (const orderItem of orderItems) {
      const product = productMap.get(orderItem.weight)
      console.log(`Processing order item ${orderItem.weight}lbs:`, { orderItem, product })

      if (orderItem.quantity <= 0 || orderItem.price <= 0) {
        console.warn(`Skipping invalid order item:`, orderItem)
        continue
      }

      const invoiceItemData: Stripe.InvoiceItemCreateParams = {
        customer: customerId,
        quantity: orderItem.quantity,
        currency: "usd",
        metadata: {
          order_number: order.order_number,
          weight: orderItem.weight.toString(),
          order_item_price: orderItem.price.toString(),
        },
      }

      // Use Stripe price if available, otherwise create ad-hoc pricing
      if (product?.stripe_price_id && product.available) {
        invoiceItemData.price = product.stripe_price_id
        invoiceItemData.description = `${product.title || `${orderItem.weight}lb Bumper Plate`} (${orderItem.quantity}x)`
        console.log(`Using Stripe price ${product.stripe_price_id} for ${orderItem.weight}lbs`)
      } else {
        // Fallback to unit amount if no Stripe price exists
        const unitAmount = Math.round((orderItem.price / orderItem.quantity) * 100) // Convert to cents
        invoiceItemData.unit_amount = unitAmount
        invoiceItemData.description = `${orderItem.product_title || product?.title || `${orderItem.weight}lb Bumper Plate`} (${orderItem.quantity}x)`

        console.log(`Using unit amount $${unitAmount / 100} for ${orderItem.weight}lbs (no Stripe price available)`)
      }

      try {
        const invoiceItem = await stripe.invoiceItems.create(invoiceItemData)
        console.log(`Created invoice item:`, invoiceItem.id)
        itemsCreated++
      } catch (itemError) {
        console.error(`Failed to create invoice item for ${orderItem.weight}lbs:`, itemError)
        // Continue with other items instead of failing completely
      }
    }

    if (itemsCreated === 0) {
      return { success: false, error: "No invoice items could be created" }
    }

    console.log(`Successfully created ${itemsCreated} invoice items`)
    return { success: true, itemsCreated }
  } catch (error) {
    console.error("Error creating invoice items:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Creates a Stripe invoice for an order - COMPLETE FIX
 */
export async function createStripeInvoiceForOrder(
  order: OrderForInvoicing,
  isReinvoice = false,
): Promise<InvoiceResult> {
  try {
    console.log("Creating Stripe invoice for order:", order.order_number)
    const stripe = await getStripe()

    // Ensure Stripe customer exists with proper billing address (NO SHIPPING)
    const customerId = await ensureStripeCustomer(order)
    console.log("Using Stripe customer:", customerId)

    // Create invoice items with detailed logging
    const itemsResult = await createInvoiceItems(stripe, customerId, order)
    if (!itemsResult.success) {
      console.error("Failed to create invoice items:", itemsResult.error)
      return {
        success: false,
        error: `Failed to create invoice items: ${itemsResult.error}`,
      }
    }

    console.log(`Created ${itemsResult.itemsCreated} invoice items, proceeding with invoice creation`)

    // Create the invoice
    const invoiceData: Stripe.InvoiceCreateParams = {
      customer: customerId,
      auto_advance: true,
      collection_method: "send_invoice",
      days_until_due: 30,
      currency: "usd",
      metadata: {
        order_number: order.order_number,
        order_id: order.id,
        source: "carolina-bumper-plates",
        is_reinvoice: isReinvoice.toString(),
        total_weight: order.total_weight.toString(),
      },
      description: `${isReinvoice ? "Re-invoice for" : "Invoice for"} Order #${order.order_number} - Carolina Bumper Plates`,
      footer: `Thank you for your business! Questions? Contact us at support@carolinabumperplates.com`,
    }

    console.log("Creating invoice with data:", invoiceData)
    const invoice = await stripe.invoices.create(invoiceData)
    console.log("Created invoice:", invoice.id)

    // Finalize and send the invoice
    console.log("Finalizing invoice...")
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id, {
      auto_advance: true,
    })

    console.log("Invoice finalized successfully:", {
      id: finalizedInvoice.id,
      status: finalizedInvoice.status,
      total: finalizedInvoice.total,
      url: finalizedInvoice.hosted_invoice_url,
    })

    return {
      success: true,
      invoice: finalizedInvoice,
      details: {
        invoice_id: finalizedInvoice.id,
        invoice_url: finalizedInvoice.hosted_invoice_url || "",
        invoice_pdf: finalizedInvoice.invoice_pdf || undefined,
        customer_id: customerId,
      },
    }
  } catch (error) {
    console.error("Error creating Stripe invoice:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error creating invoice",
    }
  }
}

/**
 * Re-invoices an unpaid order - COMPLETE FIX
 */
export async function reinvoiceOrder(orderId: string): Promise<InvoiceResult> {
  const supabaseAdmin = createSupabaseAdmin()

  try {
    console.log("Re-invoicing order:", orderId)

    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin.from("orders").select("*").eq("id", orderId).single()

    if (orderError || !order) {
      console.error("Order not found:", orderError)
      return {
        success: false,
        error: "Order not found",
      }
    }

    console.log("Found order for re-invoicing:", {
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      customer_email: order.customer_email,
      has_address: !!(order.street_address && order.city && order.state && order.zip_code),
    })

    // Validate order can be re-invoiced
    if (order.payment_status === "paid") {
      return {
        success: false,
        error: "Cannot re-invoice a paid order",
      }
    }

    if (order.status === "cancelled") {
      return {
        success: false,
        error: "Cannot re-invoice a cancelled order",
      }
    }

    // Create Stripe invoice
    const invoiceResult = await createStripeInvoiceForOrder(order, true)

    if (invoiceResult.success && invoiceResult.details) {
      console.log("Invoice created successfully, updating order...")

      // Update order with new invoice information
      const updateData = {
        stripe_customer_id: invoiceResult.details.customer_id,
        stripe_invoice_id: invoiceResult.details.invoice_id,
        stripe_invoice_url: invoiceResult.details.invoice_url,
        stripe_invoice_pdf: invoiceResult.details.invoice_pdf,
        invoice_status: "sent",
        invoice_sent_at: new Date().toISOString(),
        reinvoice_count: (order.reinvoice_count || 0) + 1,
        last_reinvoice_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabaseAdmin.from("orders").update(updateData).eq("id", orderId)

      if (updateError) {
        console.error("Failed to update order after re-invoicing:", updateError)
        // Don't fail the whole operation, invoice was created successfully
      } else {
        console.log("Order updated successfully after re-invoicing")
      }

      // Add timeline event
      const timelineEvent = {
        order_id: Number.parseInt(orderId),
        event_type: "invoice_resent",
        event_description: `Order re-invoiced (attempt #${(order.reinvoice_count || 0) + 1})`,
        event_data: {
          stripe_invoice_id: invoiceResult.details.invoice_id,
          invoice_url: invoiceResult.details.invoice_url,
          reinvoice_count: (order.reinvoice_count || 0) + 1,
        },
        created_by: "system",
        created_at: new Date().toISOString(),
      }

      const { error: timelineError } = await supabaseAdmin.from("order_timeline").insert([timelineEvent])

      if (timelineError) {
        console.error("Failed to add timeline event:", timelineError)
      } else {
        console.log("Timeline event added successfully")
      }
    }

    return invoiceResult
  } catch (error) {
    console.error("Error re-invoicing order:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during re-invoicing",
    }
  }
}
