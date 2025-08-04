import Stripe from "stripe"
import { getStripeConfig } from "./stripe-config"

let stripeInstance: Stripe | null = null
let currentMode: string | null = null

export async function getStripe(): Promise<Stripe> {
  const config = await getStripeConfig()

  // Recreate Stripe instance if mode changed
  if (!stripeInstance || currentMode !== config.mode) {
    if (!config.secretKey) {
      throw new Error(`Stripe secret key not configured for ${config.mode} mode`)
    }

    stripeInstance = new Stripe(config.secretKey, {
      apiVersion: "2024-06-20",
    })
    currentMode = config.mode
  }

  return stripeInstance
}

export const createStripeCustomer = async (
  email: string,
  name: string,
  phone?: string,
  address?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
  },
) => {
  try {
    const stripe = await getStripe()
    const config = await getStripeConfig()

    const customerData: Stripe.CustomerCreateParams = {
      email,
      name,
      phone,
      metadata: {
        source: "carolina-bumper-plates",
        mode: config.mode,
      },
    }

    // Add address if provided
    if (address && address.line1) {
      customerData.address = {
        line1: address.line1,
        line2: address.line2 || undefined,
        city: address.city || undefined,
        state: address.state || undefined,
        postal_code: address.postal_code || undefined,
        country: address.country || "US",
      }
    }

    const customer = await stripe.customers.create(customerData)
    return customer
  } catch (error) {
    console.error("Error creating Stripe customer:", error)
    throw error
  }
}

export const createStripeInvoice = async (
  customerId: string,
  orderNumber: string,
  items: Array<{
    description: string
    quantity: number
    unit_amount?: number // in cents
    price_id?: string // Stripe price ID for products
  }>,
  metadata: Record<string, string> = {},
  shippingAddress?: {
    name: string
    address: {
      line1: string
      line2?: string
      city: string
      state: string
      postal_code: string
      country: string
    }
  },
) => {
  try {
    const stripe = await getStripe()
    const config = await getStripeConfig()

    // Create invoice items
    for (const item of items) {
      const invoiceItemData: Stripe.InvoiceItemCreateParams = {
        customer: customerId,
        description: item.description,
        quantity: item.quantity,
        currency: "usd",
        metadata: {
          order_number: orderNumber,
          mode: config.mode,
          ...metadata,
        },
      }

      // Use Stripe price ID if available, otherwise use unit_amount
      if (item.price_id) {
        invoiceItemData.price = item.price_id
      } else if (item.unit_amount) {
        invoiceItemData.unit_amount = item.unit_amount
      } else {
        throw new Error("Either price_id or unit_amount must be provided for invoice item")
      }

      await stripe.invoiceItems.create(invoiceItemData)
    }

    // Create the invoice
    const invoiceData: Stripe.InvoiceCreateParams = {
      customer: customerId,
      auto_advance: true,
      collection_method: "send_invoice",
      days_until_due: 30,
      currency: "usd",
      metadata: {
        order_number: orderNumber,
        source: "carolina-bumper-plates",
        mode: config.mode,
        ...metadata,
      },
      description: `Invoice for Order #${orderNumber} - Carolina Bumper Plates ${config.mode === "sandbox" ? "(TEST)" : ""}`,
      footer: `Thank you for your business! Questions? Contact us at support@carolinabumperplates.com ${config.mode === "sandbox" ? "(TEST MODE)" : ""}`,
    }

    // Add shipping address if provided
    if (shippingAddress) {
      invoiceData.shipping = {
        name: shippingAddress.name,
        address: shippingAddress.address,
      }
    }

    const invoice = await stripe.invoices.create(invoiceData)

    // Finalize and send the invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id, {
      auto_advance: true,
    })

    return finalizedInvoice
  } catch (error) {
    console.error("Error creating Stripe invoice:", error)
    throw error
  }
}

export const getStripeInvoice = async (invoiceId: string) => {
  try {
    const stripe = await getStripe()
    return await stripe.invoices.retrieve(invoiceId)
  } catch (error) {
    console.error("Error retrieving Stripe invoice:", error)
    throw error
  }
}
