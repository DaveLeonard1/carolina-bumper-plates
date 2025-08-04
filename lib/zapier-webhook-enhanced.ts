import { createSupabaseAdmin } from "@/lib/supabase"
import { webhookDebugger } from "@/lib/zapier-webhook-debug"

export class EnhancedZapierWebhookManager {
  private supabase = createSupabaseAdmin()

  async triggerPaymentLinkWebhookWithDiagnostics(
    orderId: string,
    metadata: {
      source: string
      created_via: string
      batch_id?: string
    },
  ): Promise<{
    success: boolean
    sessionId?: string
    error?: string
    diagnostics?: any
  }> {
    let sessionId: string | null = null

    try {
      console.log(`🔗 Enhanced webhook trigger for order ${orderId}`)

      // Start debug session
      sessionId = await webhookDebugger.startDebugSession(orderId)

      await webhookDebugger.logDebugStep(sessionId, "webhook_trigger_started", "started", {
        orderId,
        metadata,
        timestamp: new Date().toISOString(),
      })

      // Step 1: Check webhook configuration
      await webhookDebugger.logDebugStep(sessionId, "check_webhook_settings", "started")
      const { data: settings, error: settingsError } = await this.supabase.from("zapier_settings").select("*").single()

      if (settingsError || !settings) {
        await webhookDebugger.logDebugStep(sessionId, "check_webhook_settings", "failed", null, {
          message: "Webhook settings not found",
          error: settingsError,
        })
        return { success: false, sessionId, error: "Webhook settings not configured" }
      }

      if (!settings.webhook_enabled) {
        await webhookDebugger.logDebugStep(sessionId, "check_webhook_settings", "completed", settings, {
          message: "Webhook integration is disabled",
        })
        return { success: true, sessionId, error: "Webhook integration disabled (not an error)" }
      }

      if (!settings.webhook_url) {
        await webhookDebugger.logDebugStep(sessionId, "check_webhook_settings", "failed", settings, {
          message: "Webhook URL not configured",
        })
        return { success: false, sessionId, error: "Webhook URL not configured" }
      }

      await webhookDebugger.logDebugStep(sessionId, "check_webhook_settings", "completed", {
        webhook_enabled: settings.webhook_enabled,
        webhook_url: settings.webhook_url.substring(0, 50) + "...",
        webhook_timeout: settings.webhook_timeout,
      })

      // Step 2: Get order data
      await webhookDebugger.logDebugStep(sessionId, "fetch_order_data", "started")
      const orderData = await this.getOrderDataWithValidation(orderId, sessionId)

      if (!orderData) {
        await webhookDebugger.logDebugStep(sessionId, "fetch_order_data", "failed", null, {
          message: "Failed to fetch order data",
        })
        return { success: false, sessionId, error: "Failed to fetch order data" }
      }

      await webhookDebugger.logDebugStep(sessionId, "fetch_order_data", "completed", {
        order_id: orderData.order.id,
        order_number: orderData.order.order_number,
        has_customer_data: !!orderData.order.customers,
        has_payment_link: !!orderData.order.payment_link_url,
      })

      // Step 3: Build webhook payload
      await webhookDebugger.logDebugStep(sessionId, "build_webhook_payload", "started")
      const payload = await this.buildWebhookPayload(orderData, settings, metadata, sessionId)

      if (!payload) {
        await webhookDebugger.logDebugStep(sessionId, "build_webhook_payload", "failed", null, {
          message: "Failed to build webhook payload",
        })
        return { success: false, sessionId, error: "Failed to build webhook payload" }
      }

      await webhookDebugger.logDebugStep(sessionId, "build_webhook_payload", "completed", {
        payload_size: JSON.stringify(payload).length,
        event_type: payload.event_type,
        has_customer_data: !!payload.customer,
        has_order_items: !!(payload.order as any).items,
      })

      // Step 4: Queue webhook for delivery
      await webhookDebugger.logDebugStep(sessionId, "queue_webhook", "started")
      await this.queueWebhookWithDiagnostics(orderId, settings.webhook_url, payload, settings, sessionId)
      await webhookDebugger.logDebugStep(sessionId, "queue_webhook", "completed")

      await webhookDebugger.logDebugStep(sessionId, "webhook_trigger_completed", "completed", {
        success: true,
        queued_for_delivery: true,
      })

      console.log(`✅ Enhanced webhook trigger completed for order ${orderId}`)
      return { success: true, sessionId }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error(`❌ Enhanced webhook trigger failed for order ${orderId}:`, error)

      if (sessionId) {
        await webhookDebugger.logDebugStep(sessionId, "webhook_trigger_failed", "failed", null, {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        })
      }

      return { success: false, sessionId, error: errorMessage }
    }
  }

  private async getOrderDataWithValidation(orderId: string, sessionId: string) {
    try {
      const { data: order, error: orderError } = await this.supabase
        .from("orders")
        .select(`
          *,
          customers (
            id,
            email,
            first_name,
            last_name,
            phone,
            stripe_customer_id
          )
        `)
        .eq("id", orderId)
        .single()

      if (orderError || !order) {
        await webhookDebugger.logDebugStep(sessionId, "order_data_validation", "failed", null, {
          message: "Order not found",
          error: orderError,
        })
        return null
      }

      // Validate required fields
      const validationErrors: string[] = []
      if (!order.order_number) validationErrors.push("Missing order number")
      if (!order.customer_email) validationErrors.push("Missing customer email")
      if (!order.payment_link_url) validationErrors.push("Missing payment link URL")

      if (validationErrors.length > 0) {
        await webhookDebugger.logDebugStep(sessionId, "order_data_validation", "failed", order, {
          message: "Order data validation failed",
          validation_errors: validationErrors,
        })
        return null
      }

      // Get products data if needed
      let products = null
      if (order.order_items) {
        const orderItems = typeof order.order_items === "string" ? JSON.parse(order.order_items) : order.order_items

        if (Array.isArray(orderItems) && orderItems.length > 0) {
          const weights = orderItems.map((item: any) => item.weight)
          const { data: productsData } = await this.supabase
            .from("products")
            .select("weight, title, selling_price")
            .in("weight", weights)

          products = productsData || []
        }
      }

      await webhookDebugger.logDebugStep(sessionId, "order_data_validation", "completed", {
        order_id: order.id,
        has_customer: !!order.customers,
        has_items: !!order.order_items,
        products_loaded: products?.length || 0,
      })

      return { order, products }
    } catch (error) {
      await webhookDebugger.logDebugStep(sessionId, "order_data_validation", "failed", null, {
        message: "Exception during order data fetch",
        error: error instanceof Error ? error.message : "Unknown error",
      })
      return null
    }
  }

  private async buildWebhookPayload(orderData: any, settings: any, metadata: any, sessionId: string) {
    try {
      const { order, products } = orderData

      // Parse order items
      let orderItems = []
      if (order.order_items) {
        try {
          orderItems =
            typeof order.order_items === "string"
              ? JSON.parse(order.order_items)
              : Array.isArray(order.order_items)
                ? order.order_items
                : [order.order_items]
        } catch (parseError) {
          await webhookDebugger.logDebugStep(sessionId, "parse_order_items", "failed", null, {
            message: "Failed to parse order items",
            error: parseError instanceof Error ? parseError.message : "Parse error",
          })
          return null
        }
      }

      // Build base payload
      const payload: any = {
        event_type: "payment_link_created",
        timestamp: new Date().toISOString(),
        order: {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          payment_status: order.payment_status,
          payment_link_url: order.payment_link_url,
          total_amount: order.total_amount || 0,
          currency: "USD",
          created_at: order.created_at,
        },
        metadata,
      }

      // Add customer data if enabled
      if (settings.include_customer_data) {
        const customer = order.customers || {}
        payload.customer = {
          id: customer.id || null,
          email: order.customer_email,
          first_name: customer.first_name || null,
          last_name: customer.last_name || null,
          full_name: order.customer_name || null,
          phone: order.customer_phone || customer.phone || null,
          stripe_customer_id: customer.stripe_customer_id || null,
        }
      }

      // Add order items if enabled
      if (settings.include_order_items && orderItems.length > 0) {
        payload.order.items = orderItems.map((item: any) => {
          const product = products?.find((p: any) => p.weight === item.weight)
          return {
            weight: item.weight,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
            product_title: product?.title || `${item.weight}lb Bumper Plate`,
          }
        })
      }

      // Add shipping data if enabled
      if (settings.include_shipping_data) {
        payload.order.shipping = {
          address: order.shipping_address || "",
          city: order.shipping_city || "",
          state: order.shipping_state || "",
          zip_code: order.shipping_zip || "",
          phone: order.customer_phone || null,
        }
      }

      // Add pricing data if enabled
      if (settings.include_pricing_data) {
        const subtotal = orderItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
        const taxAmount = order.tax_amount || 0
        const shippingCost = order.shipping_cost || 0

        payload.order.pricing = {
          subtotal,
          tax_amount: taxAmount,
          shipping_cost: shippingCost,
          total: subtotal + taxAmount + shippingCost,
        }
      }

      return payload
    } catch (error) {
      await webhookDebugger.logDebugStep(sessionId, "build_payload_error", "failed", null, {
        message: "Exception during payload building",
        error: error instanceof Error ? error.message : "Unknown error",
      })
      return null
    }
  }

  private async queueWebhookWithDiagnostics(
    orderId: string,
    webhookUrl: string,
    payload: any,
    settings: any,
    sessionId: string,
  ) {
    try {
      await this.supabase.from("webhook_queue").insert({
        order_id: orderId,
        webhook_url: webhookUrl,
        payload,
        max_attempts: settings.webhook_retry_attempts,
        status: "pending",
        debug_session_id: sessionId,
      })

      await webhookDebugger.logDebugStep(sessionId, "webhook_queued", "completed", {
        webhook_url: webhookUrl.substring(0, 50) + "...",
        payload_size: JSON.stringify(payload).length,
        max_attempts: settings.webhook_retry_attempts,
      })
    } catch (error) {
      await webhookDebugger.logDebugStep(sessionId, "webhook_queue_failed", "failed", null, {
        message: "Failed to queue webhook",
        error: error instanceof Error ? error.message : "Unknown error",
      })
      throw error
    }
  }
}

// Export singleton instance
export const enhancedZapierWebhook = new EnhancedZapierWebhookManager()
