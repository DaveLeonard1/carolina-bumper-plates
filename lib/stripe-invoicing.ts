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
  order_items: OrderItem[]
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
 * Creates or retrieves a Stripe customer for the order
 */
async function ensureStripeCustomer(order: OrderForInvoicing): Promise<string> {
  const stripe = await getStripe()

  // If customer already exists, return it
  if (order.stripe_customer_id) {
    try {
      await stripe.customers.retrieve(order.stripe_customer_id)
      return order.stripe_customer_id
    } catch (error) {
      console.warn("Existing Stripe customer not found, creating new one:", error)
    }
  }

  // Create new Stripe customer
  const customerData: Stripe.CustomerCreateParams = {
    email: order.customer_email,
    name: order.customer_name,
    phone: order.customer_phone || undefined,
    metadata: {
      order_number: order.order_number,
      source: "carolina-bumper-plates",
    },
  }

  // Add billing address if available
  if (order.street_address && order.city && order.state && order.zip_code) {
    customerData.address = {
      line1: order.street_address,
      city: order.city,
      state: order.state,
      postal_code: order.zip_code,
      country: "US",
    }
  }

  const customer = await stripe.customers.create(customerData)
  return customer.id
}

/**
 * Maps order items to Stripe products and creates invoice items
 */
async function createInvoiceItems(
  stripe: Stripe,
  customerId: string,
  order: OrderForInvoicing,
): Promise<{ success: boolean; error?: string }> {
  const supabaseAdmin = createSupabaseAdmin()

  try {
    // Get unique weights from order items
    const weights = [...new Set(order.order_items.map((item) => item.weight))]

    // Fetch products with Stripe information
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("weight, title, stripe_product_id, stripe_price_id, selling_price")
      .in("weight", weights)
      .eq("available", true)

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`)
    }

    // Create a weight-to-product mapping
    const productMap = new Map()
    if (products) {
      products.forEach((product) => {
        productMap.set(product.weight, product)
      })
    }

    // Create invoice items for each order item
    for (const orderItem of order.order_items) {
      const product = productMap.get(orderItem.weight)

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
      if (product?.stripe_price_id) {
        invoiceItemData.price = product.stripe_price_id
        invoiceItemData.description = `${product.title || `${orderItem.weight}lb Bumper Plate`} (${orderItem.quantity}x)`
      } else {
        // Fallback to unit amount if no Stripe price exists
        const unitAmount = Math.round((orderItem.price / orderItem.quantity) * 100) // Convert to cents
        invoiceItemData.unit_amount = unitAmount
        invoiceItemData.description = `${orderItem.product_title || `${orderItem.weight}lb Bumper Plate`} (${orderItem.quantity}x)`

        console.warn(`No Stripe price found for ${orderItem.weight}lb product, using unit amount: $${unitAmount / 100}`)
      }

      await stripe.invoiceItems.create(invoiceItemData)
    }

    return { success: true }
  } catch (error) {
    console.error("Error creating invoice items:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Creates a Stripe invoice for an order
 */
export async function createStripeInvoiceForOrder(
  order: OrderForInvoicing,
  isReinvoice = false,
): Promise<InvoiceResult> {
  try {
    const stripe = await getStripe()

    // Ensure Stripe customer exists
    const customerId = await ensureStripeCustomer(order)

    // Create invoice items
    const itemsResult = await createInvoiceItems(stripe, customerId, order)
    if (!itemsResult.success) {
      return {
        success: false,
        error: `Failed to create invoice items: ${itemsResult.error}`,
      }
    }

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

    const invoice = await stripe.invoices.create(invoiceData)

    // Finalize and send the invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id, {
      auto_advance: true,
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
 * Re-invoices an unpaid order
 */
export async function reinvoiceOrder(orderId: string): Promise<InvoiceResult> {
  const supabaseAdmin = createSupabaseAdmin()

  try {
    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin.from("orders").select("*").eq("id", orderId).single()

    if (orderError || !order) {
      return {
        success: false,
        error: "Order not found",
      }
    }

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

/**
 * Gets invoice history for an order
 */
export async function getOrderInvoiceHistory(orderId: string) {
  const supabaseAdmin = createSupabaseAdmin()

  try {
    const { data: timeline, error } = await supabaseAdmin
      .from("order_timeline")
      .select("*")
      .eq("order_id", orderId)
      .in("event_type", ["invoice_sent", "invoice_resent", "payment_received"])
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return { success: true, history: timeline || [] }
  } catch (error) {
    console.error("Error fetching invoice history:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      history: [],
    }
  }
}
