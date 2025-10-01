import { getStripe } from "./stripe"
import { createSupabaseAdmin } from "@/lib/supabase"
import type Stripe from "stripe"

interface DebugLog {
  step: string
  timestamp: string
  success: boolean
  data?: any
  error?: string
  details?: any
}

interface InvoiceCreationResult {
  success: boolean
  invoice?: Stripe.Invoice
  customer?: Stripe.Customer
  logs: DebugLog[]
  error?: string
  debug_summary: {
    order_analysis: any
    product_sync_status: any
    stripe_integration: any
    recommendations: string[]
  }
}

export class StripeInvoiceDebugger {
  private logs: DebugLog[] = []
  private stripe: Stripe
  private supabase: any

  constructor() {
    this.supabase = createSupabaseAdmin()
  }

  private async initializeStripe() {
    try {
      this.stripe = await getStripe()
      this.log("stripe_initialization", true, { message: "Stripe client initialized successfully" })
    } catch (error) {
      this.log("stripe_initialization", false, null, `Failed to initialize Stripe: ${error}`)
      throw error
    }
  }

  private log(step: string, success: boolean, data?: any, error?: string, details?: any) {
    const logEntry: DebugLog = {
      step,
      timestamp: new Date().toISOString(),
      success,
      data,
      error,
      details,
    }
    this.logs.push(logEntry)

    // Console logging with emojis for visibility
    const emoji = success ? "✅" : "❌"
    console.log(`${emoji} [${step.toUpperCase()}] ${success ? "SUCCESS" : "FAILED"}`)
    if (data) console.log("   📊 Data:", data)
    if (error) console.log("   🚨 Error:", error)
    if (details) console.log("   🔍 Details:", details)
  }

  async createInvoiceWithComprehensiveDebug(orderId: string): Promise<InvoiceCreationResult> {
    try {
      await this.initializeStripe()

      // PHASE 1: ORDER ANALYSIS
      console.log("\n🔍 PHASE 1: COMPREHENSIVE ORDER ANALYSIS")
      const orderAnalysis = await this.analyzeOrder(orderId)

      // PHASE 2: PRODUCT SYNCHRONIZATION VERIFICATION
      console.log("\n🔄 PHASE 2: PRODUCT SYNCHRONIZATION VERIFICATION")
      const productSyncStatus = await this.verifyProductSync(orderAnalysis.parsed_items)

      // PHASE 3: STRIPE INTEGRATION TESTING
      console.log("\n💳 PHASE 3: STRIPE INTEGRATION TESTING")
      const stripeIntegration = await this.testStripeIntegration(orderAnalysis.order, productSyncStatus.products)

      // PHASE 4: INVOICE CREATION WITH DETAILED TRACKING
      console.log("\n📄 PHASE 4: INVOICE CREATION WITH DETAILED TRACKING")
      const invoiceResult = await this.createInvoiceWithTracking(
        orderAnalysis.order,
        orderAnalysis.parsed_items,
        productSyncStatus.products,
        stripeIntegration.customer,
      )

      // Generate comprehensive recommendations
      const recommendations = this.generateRecommendations(
        orderAnalysis,
        productSyncStatus,
        stripeIntegration,
        invoiceResult,
      )

      return {
        success: invoiceResult.success,
        invoice: invoiceResult.invoice,
        customer: stripeIntegration.customer,
        logs: this.logs,
        error: invoiceResult.error,
        debug_summary: {
          order_analysis: orderAnalysis,
          product_sync_status: productSyncStatus,
          stripe_integration: stripeIntegration,
          recommendations,
        },
      }
    } catch (error) {
      this.log("comprehensive_debug", false, null, `Critical failure: ${error}`)
      return {
        success: false,
        logs: this.logs,
        error: error instanceof Error ? error.message : String(error),
        debug_summary: {
          order_analysis: null,
          product_sync_status: null,
          stripe_integration: null,
          recommendations: ["Critical error occurred - check logs for details"],
        },
      }
    }
  }

  private async analyzeOrder(orderId: string) {
    this.log("order_fetch_start", true, { orderId })

    // Fetch order with comprehensive error handling
    const { data: order, error: orderError } = await this.supabase.from("orders").select("*").eq("id", orderId).single()

    if (orderError || !order) {
      this.log("order_fetch", false, null, `Order not found: ${orderError?.message}`)
      throw new Error(`Order ${orderId} not found`)
    }

    this.log("order_fetch", true, {
      id: order.id,
      order_number: order.order_number,
      customer_email: order.customer_email,
      subtotal: order.subtotal,
      status: order.status,
      order_items_type: typeof order.order_items,
      order_items_length: order.order_items ? JSON.stringify(order.order_items).length : 0,
    })

    // Parse order items with multiple strategies
    let parsed_items = []
    let parse_method = "unknown"
    let parse_error = null

    try {
      if (typeof order.order_items === "string") {
        parsed_items = JSON.parse(order.order_items)
        parse_method = "json_string_parse"
      } else if (Array.isArray(order.order_items)) {
        parsed_items = order.order_items
        parse_method = "direct_array"
      } else if (order.order_items && typeof order.order_items === "object") {
        parsed_items = [order.order_items]
        parse_method = "single_object_wrap"
      } else {
        throw new Error("Order items is null or invalid type")
      }
    } catch (error) {
      parse_error = error instanceof Error ? error.message : String(error)
      this.log("order_items_parse", false, null, parse_error)
    }

    if (parsed_items.length > 0) {
      this.log("order_items_parse", true, {
        method: parse_method,
        items_count: parsed_items.length,
        items: parsed_items,
        weights_found: parsed_items.map((item) => item.weight).filter(Boolean),
        quantities_found: parsed_items.map((item) => item.quantity).filter(Boolean),
      })
    }

    return {
      order,
      parsed_items,
      parse_method,
      parse_error,
      weights_needed: parsed_items.map((item) => item.weight).filter(Boolean),
    }
  }

  private async verifyProductSync(orderItems: any[]) {
    const weights = orderItems.map((item) => item.weight).filter(Boolean)

    if (weights.length === 0) {
      this.log("product_sync_check", false, null, "No weights found in order items")
      return { products: [], sync_status: "no_weights" }
    }

    this.log("product_weights_extraction", true, { weights })

    // Fetch products from database
    const { data: products, error: productsError } = await this.supabase
      .from("products")
      .select("*")
      .in("weight", weights)

    if (productsError) {
      this.log("products_fetch", false, null, `Database error: ${productsError.message}`)
      return { products: [], sync_status: "database_error" }
    }

    this.log("products_fetch", true, {
      products_found: products?.length || 0,
      weights_requested: weights,
      products: products?.map((p) => ({
        id: p.id,
        title: p.title,
        weight: p.weight,
        selling_price: p.selling_price,
        available: p.available,
        stripe_product_id: p.stripe_product_id,
        stripe_price_id: p.stripe_price_id,
        stripe_active: p.stripe_active,
      })),
    })

    // Analyze sync status for each product
    const syncAnalysis =
      products?.map((product) => ({
        ...product,
        sync_status: this.analyzeProductSyncStatus(product),
      })) || []

    const syncSummary = {
      total_products: products?.length || 0,
      fully_synced: syncAnalysis.filter((p) => p.sync_status === "fully_synced").length,
      partially_synced: syncAnalysis.filter((p) => p.sync_status === "partially_synced").length,
      not_synced: syncAnalysis.filter((p) => p.sync_status === "not_synced").length,
      unavailable: syncAnalysis.filter((p) => !p.available).length,
    }

    this.log("product_sync_analysis", true, { syncSummary, syncAnalysis })

    return {
      products: syncAnalysis,
      sync_status: syncSummary,
      missing_weights: weights.filter((w) => !products?.some((p) => p.weight === w)),
    }
  }

  private analyzeProductSyncStatus(product: any): string {
    if (!product.available) return "unavailable"
    if (product.stripe_product_id && product.stripe_price_id && product.stripe_active) return "fully_synced"
    if (product.stripe_product_id || product.stripe_price_id) return "partially_synced"
    return "not_synced"
  }

  private async testStripeIntegration(order: any, products: any[]) {
    // Test customer creation/retrieval
    let customer: Stripe.Customer | null = null

    try {
      // Check if customer already exists
      if (order.stripe_customer_id) {
        this.log("customer_retrieval_attempt", true, { existing_customer_id: order.stripe_customer_id })
        try {
          customer = (await this.stripe.customers.retrieve(order.stripe_customer_id)) as Stripe.Customer
          this.log("customer_retrieval", true, { customer_id: customer.id, email: customer.email })
        } catch (error) {
          this.log("customer_retrieval", false, null, `Failed to retrieve existing customer: ${error}`)
        }
      }

      // Create new customer if needed
      if (!customer) {
        this.log("customer_creation_attempt", true, {
          email: order.customer_email,
          name: order.customer_name,
        })

        const customerData: Stripe.CustomerCreateParams = {
          email: order.customer_email,
          name: order.customer_name,
          phone: order.customer_phone || undefined,
          metadata: {
            order_id: order.id.toString(),
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
          this.log("customer_address_added", true, customerData.address)
        }

        customer = await this.stripe.customers.create(customerData)
        this.log("customer_creation", true, { customer_id: customer.id, email: customer.email })
      }
    } catch (error) {
      this.log("customer_integration", false, null, `Customer creation/retrieval failed: ${error}`)
      throw error
    }

    // Test product validation in Stripe
    const stripeProductTests = []
    for (const product of products) {
      if (product.stripe_product_id) {
        try {
          const stripeProduct = await this.stripe.products.retrieve(product.stripe_product_id)
          const stripePrice = product.stripe_price_id
            ? await this.stripe.prices.retrieve(product.stripe_price_id)
            : null

          stripeProductTests.push({
            product_id: product.id,
            weight: product.weight,
            stripe_product_exists: true,
            stripe_product_active: stripeProduct.active,
            stripe_price_exists: !!stripePrice,
            stripe_price_active: stripePrice?.active || false,
            unit_amount: stripePrice?.unit_amount || null,
          })

          this.log(`stripe_product_test_${product.weight}lb`, true, {
            product_active: stripeProduct.active,
            price_exists: !!stripePrice,
            price_active: stripePrice?.active,
            unit_amount: stripePrice?.unit_amount,
          })
        } catch (error) {
          stripeProductTests.push({
            product_id: product.id,
            weight: product.weight,
            stripe_product_exists: false,
            error: error instanceof Error ? error.message : String(error),
          })

          this.log(`stripe_product_test_${product.weight}lb`, false, null, `Stripe product test failed: ${error}`)
        }
      } else {
        stripeProductTests.push({
          product_id: product.id,
          weight: product.weight,
          stripe_product_exists: false,
          reason: "no_stripe_product_id",
        })
      }
    }

    return {
      customer,
      stripe_product_tests: stripeProductTests,
      integration_status: {
        customer_ready: !!customer,
        products_tested: stripeProductTests.length,
        products_valid: stripeProductTests.filter((t) => t.stripe_product_exists && t.stripe_price_exists).length,
      },
    }
  }

  private async createInvoiceWithTracking(order: any, orderItems: any[], products: any[], customer: Stripe.Customer) {
    try {
      // Create invoice items with detailed tracking
      const invoiceItems = []

      for (const orderItem of orderItems) {
        const matchingProduct = products.find((p) => p.weight === orderItem.weight)

        if (!matchingProduct) {
          this.log(`invoice_item_${orderItem.weight}lb`, false, null, "No matching product found")
          continue
        }

        if (matchingProduct.sync_status !== "fully_synced") {
          this.log(
            `invoice_item_${orderItem.weight}lb`,
            false,
            null,
            `Product not fully synced: ${matchingProduct.sync_status}`,
          )
          continue
        }

        try {
          const invoiceItemData: Stripe.InvoiceItemCreateParams = {
            customer: customer.id,
            price: matchingProduct.stripe_price_id,
            quantity: orderItem.quantity || 1,
            metadata: {
              order_id: order.id.toString(),
              order_number: order.order_number,
              product_id: matchingProduct.id.toString(),
              weight: matchingProduct.weight.toString(),
            },
          }

          this.log(`invoice_item_creation_${orderItem.weight}lb`, true, {
            price_id: matchingProduct.stripe_price_id,
            quantity: orderItem.quantity || 1,
            customer_id: customer.id,
          })

          const invoiceItem = await this.stripe.invoiceItems.create(invoiceItemData)
          invoiceItems.push(invoiceItem)

          this.log(`invoice_item_created_${orderItem.weight}lb`, true, {
            invoice_item_id: invoiceItem.id,
            amount: invoiceItem.amount,
            description: invoiceItem.description,
          })
        } catch (error) {
          this.log(
            `invoice_item_creation_${orderItem.weight}lb`,
            false,
            null,
            `Failed to create invoice item: ${error}`,
          )
        }
      }

      if (invoiceItems.length === 0) {
        throw new Error("No invoice items could be created")
      }

      // Create the invoice
      const invoiceData: Stripe.InvoiceCreateParams = {
        customer: customer.id,
        auto_advance: false, // Don't auto-finalize for debugging
        collection_method: "send_invoice",
        days_until_due: 30,
        description: `Invoice for Order ${order.order_number} - The Plate Yard`,
        metadata: {
          order_id: order.id.toString(),
          order_number: order.order_number,
          source: "carolina-bumper-plates",
          debug_session: new Date().toISOString(),
        },
      }

      this.log("invoice_creation_attempt", true, {
        customer_id: customer.id,
        items_count: invoiceItems.length,
        metadata: invoiceData.metadata,
      })

      const invoice = await this.stripe.invoices.create(invoiceData)

      this.log("invoice_created", true, {
        invoice_id: invoice.id,
        amount_due: invoice.amount_due,
        status: invoice.status,
        line_items_count: invoice.lines?.data?.length || 0,
      })

      // Finalize the invoice
      const finalizedInvoice = await this.stripe.invoices.finalizeInvoice(invoice.id)

      this.log("invoice_finalized", true, {
        invoice_id: finalizedInvoice.id,
        status: finalizedInvoice.status,
        hosted_invoice_url: finalizedInvoice.hosted_invoice_url,
        invoice_pdf: finalizedInvoice.invoice_pdf,
      })

      return {
        success: true,
        invoice: finalizedInvoice,
        invoice_items: invoiceItems,
      }
    } catch (error) {
      this.log("invoice_creation", false, null, `Invoice creation failed: ${error}`)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  private generateRecommendations(
    orderAnalysis: any,
    productSyncStatus: any,
    stripeIntegration: any,
    invoiceResult: any,
  ): string[] {
    const recommendations = []

    // Order analysis recommendations
    if (orderAnalysis.parse_error) {
      recommendations.push("❌ CRITICAL: Fix order items parsing - " + orderAnalysis.parse_error)
    } else if (orderAnalysis.parsed_items.length === 0) {
      recommendations.push("❌ CRITICAL: Order contains no items")
    } else {
      recommendations.push("✅ Order items parsed successfully")
    }

    // Product sync recommendations
    if (productSyncStatus.sync_status.fully_synced === 0) {
      recommendations.push("❌ CRITICAL: No products are fully synced with Stripe - run product sync")
    } else if (productSyncStatus.sync_status.fully_synced < productSyncStatus.sync_status.total_products) {
      recommendations.push(
        `⚠️ WARNING: Only ${productSyncStatus.sync_status.fully_synced}/${productSyncStatus.sync_status.total_products} products fully synced`,
      )
    } else {
      recommendations.push("✅ All products are fully synced with Stripe")
    }

    // Stripe integration recommendations
    if (!stripeIntegration.customer) {
      recommendations.push("❌ CRITICAL: Customer creation failed")
    } else {
      recommendations.push("✅ Customer created/retrieved successfully")
    }

    // Invoice creation recommendations
    if (!invoiceResult.success) {
      recommendations.push("❌ CRITICAL: Invoice creation failed - " + (invoiceResult.error || "Unknown error"))
    } else {
      recommendations.push("✅ Invoice created successfully")
    }

    // Missing weights
    if (productSyncStatus.missing_weights?.length > 0) {
      recommendations.push(`❌ MISSING: Products needed for weights: ${productSyncStatus.missing_weights.join(", ")}`)
    }

    return recommendations
  }
}

// Main function to create invoice with comprehensive debugging
export async function createInvoiceWithComprehensiveDebug(orderId: string): Promise<InvoiceCreationResult> {
  const stripeInvoiceDebugger = new StripeInvoiceDebugger()
  return await stripeInvoiceDebugger.createInvoiceWithComprehensiveDebug(orderId)
}
