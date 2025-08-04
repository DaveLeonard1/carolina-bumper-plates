import { createSupabaseAdmin } from "@/lib/supabase"
import crypto from "crypto"

export interface ZapierSettings {
  id: number
  webhook_url: string | null
  webhook_enabled: boolean
  webhook_secret: string | null
  webhook_timeout: number
  webhook_retry_attempts: number
  webhook_retry_delay: number
  include_customer_data: boolean
  include_order_items: boolean
  include_pricing_data: boolean
  include_shipping_data: boolean
}

export interface PaymentLinkWebhookPayload {
  event_type: "payment_link_created"
  timestamp: string
  order: {
    id: string
    order_number: string
    status: string
    payment_link_url: string
    total_amount: number
    currency: string
    created_at: string
    items?: Array<{
      weight: number
      quantity: number
      price: number
      total: number
      product_title: string
    }>
    pricing?: {
      subtotal: number
      tax_amount: number
      shipping_cost: number
      total: number
    }
    shipping?: {
      address: string
      city: string
      state: string
      zip_code: string
      phone: string | null
    }
  }
  customer: {
    email: string
    first_name: string | null
    last_name: string | null
    full_name: string | null
    phone: string | null
  }
  metadata: {
    source: string
    created_via: string
    batch_id?: string
  }
}

export interface OrderCompletedWebhookPayload {
  event_type: "order_completed"
  timestamp: string
  order: {
    id: string
    order_number: string
    status: string
    payment_status: string
    paid_at: string
    total_amount: number
    currency: string
    created_at: string
    items?: Array<{
      weight: number
      quantity: number
      price: number
      total: number
      product_title: string
    }>
  }
  customer: {
    email: string
    first_name: string | null
    last_name: string | null
    full_name: string | null
    phone: string | null
  }
  payment: {
    method: string
    amount_paid: number
    paid_at: string
    stripe_payment_intent_id?: string
    stripe_invoice_id?: string
  }
  metadata: {
    source: string
    trigger: string
  }
}

export class ZapierWebhookCore {
  private supabase = createSupabaseAdmin()

  async getSettings(): Promise<ZapierSettings | null> {
    try {
      const { data, error } = await this.supabase.from("zapier_settings").select("*").single()

      if (error) {
        console.error("Failed to fetch Zapier settings:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error getting Zapier settings:", error)
      return null
    }
  }

  async updateSettings(settings: Partial<ZapierSettings>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("zapier_settings")
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1)

      if (error) {
        console.error("Failed to update Zapier settings:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error updating Zapier settings:", error)
      return false
    }
  }

  async triggerPaymentLinkWebhook(
    orderId: string,
    metadata: {
      source: string
      created_via: string
      batch_id?: string
    },
  ): Promise<{ success: boolean; error?: string; sessionId?: string }> {
    try {
      console.log(`🔗 Triggering payment link webhook for order ${orderId}`)

      // Get webhook settings
      const settings = await this.getSettings()
      if (!settings || !settings.webhook_enabled || !settings.webhook_url) {
        console.log("Zapier webhook not enabled or URL not configured")
        return { success: true } // Not an error, just not configured
      }

      // Get order data
      const orderData = await this.getOrderData(orderId)
      if (!orderData) {
        console.error("Failed to get order data for webhook")
        return { success: false, error: "Failed to get order data" }
      }

      // Validate required fields for payment link webhook
      if (!orderData.order.payment_link_url) {
        console.error("Order missing payment link URL")
        return { success: false, error: "Order missing payment link URL" }
      }

      // Build webhook payload
      const payload = this.buildPaymentLinkPayload(orderData, settings, metadata)

      // Queue webhook for reliable delivery
      await this.queueWebhook(orderId, settings.webhook_url, payload, settings, "payment_link_created")

      console.log(`✅ Payment link webhook queued for order ${orderId}`)
      return { success: true }
    } catch (error) {
      console.error("Error triggering payment link webhook:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  async triggerOrderCompletedWebhook(
    orderId: string,
    paymentData: {
      method: string
      amount_paid: number
      paid_at: string
      stripe_payment_intent_id?: string
      stripe_invoice_id?: string
    },
    metadata: {
      source: string
      trigger: string
    },
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🎉 Triggering order completed webhook for order ${orderId}`)

      // Get webhook settings
      const settings = await this.getSettings()
      if (!settings || !settings.webhook_enabled || !settings.webhook_url) {
        console.log("Zapier webhook not enabled or URL not configured")
        return { success: true } // Not an error, just not configured
      }

      // Get order data
      const orderData = await this.getOrderData(orderId)
      if (!orderData) {
        console.error("Failed to get order data for webhook")
        return { success: false, error: "Failed to get order data" }
      }

      // Validate order is actually paid
      if (orderData.order.payment_status !== "paid") {
        console.error("Order is not marked as paid")
        return { success: false, error: "Order is not marked as paid" }
      }

      // Build webhook payload
      const payload = this.buildOrderCompletedPayload(orderData, settings, paymentData, metadata)

      // Queue webhook for reliable delivery
      await this.queueWebhook(orderId, settings.webhook_url, payload, settings, "order_completed")

      console.log(`✅ Order completed webhook queued for order ${orderId}`)
      return { success: true }
    } catch (error) {
      console.error("Error triggering order completed webhook:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  private async getOrderData(orderId: string) {
    try {
      // Get order with customer data
      const { data: order, error: orderError } = await this.supabase
        .from("orders")
        .select(`
          *,
          customers (
            id,
            email,
            first_name,
            last_name,
            phone
          )
        `)
        .eq("id", orderId)
        .single()

      if (orderError || !order) {
        console.error("Failed to fetch order:", orderError)
        return null
      }

      // Get products data for order items
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

      return { order, products }
    } catch (error) {
      console.error("Error getting order data:", error)
      return null
    }
  }

  private buildPaymentLinkPayload(orderData: any, settings: ZapierSettings, metadata: any): PaymentLinkWebhookPayload {
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
      } catch (error) {
        console.error("Error parsing order items:", error)
        orderItems = []
      }
    }

    // Build base payload
    const payload: PaymentLinkWebhookPayload = {
      event_type: "payment_link_created",
      timestamp: new Date().toISOString(),
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_link_url: order.payment_link_url,
        total_amount: order.total_amount || 0,
        currency: "USD",
        created_at: order.created_at,
      },
      customer: {
        email: order.customer_email,
        first_name: order.customers?.first_name || null,
        last_name: order.customers?.last_name || null,
        full_name: order.customer_name || null,
        phone: order.customer_phone || order.customers?.phone || null,
      },
      metadata,
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
        address: order.street_address || "",
        city: order.city || "",
        state: order.state || "",
        zip_code: order.zip_code || "",
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
  }

  private buildOrderCompletedPayload(
    orderData: any,
    settings: ZapierSettings,
    paymentData: any,
    metadata: any,
  ): OrderCompletedWebhookPayload {
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
      } catch (error) {
        console.error("Error parsing order items:", error)
        orderItems = []
      }
    }

    // Build base payload
    const payload: OrderCompletedWebhookPayload = {
      event_type: "order_completed",
      timestamp: new Date().toISOString(),
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        paid_at: order.paid_at,
        total_amount: order.total_amount || 0,
        currency: "USD",
        created_at: order.created_at,
      },
      customer: {
        email: order.customer_email,
        first_name: order.customers?.first_name || null,
        last_name: order.customers?.last_name || null,
        full_name: order.customer_name || null,
        phone: order.customer_phone || order.customers?.phone || null,
      },
      payment: paymentData,
      metadata,
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

    return payload
  }

  private async queueWebhook(
    orderId: string,
    webhookUrl: string,
    payload: any,
    settings: ZapierSettings,
    eventType: string,
  ) {
    try {
      await this.supabase.from("webhook_queue").insert({
        order_id: orderId,
        webhook_url: webhookUrl,
        payload,
        event_type: eventType,
        max_attempts: settings.webhook_retry_attempts,
        status: "pending",
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error queueing webhook:", error)
      throw error
    }
  }

  async processWebhookQueue(): Promise<void> {
    try {
      console.log("🔄 Processing webhook queue...")

      // Get pending webhooks
      const { data: webhooks, error } = await this.supabase
        .from("webhook_queue")
        .select("*")
        .eq("status", "pending")
        .lte("next_retry_at", new Date().toISOString())
        .order("created_at", { ascending: true })
        .limit(10)

      if (error) {
        console.error("Error fetching webhook queue:", error)
        return
      }

      if (!webhooks || webhooks.length === 0) {
        return
      }

      console.log(`📤 Processing ${webhooks.length} queued webhooks`)

      for (const webhook of webhooks) {
        await this.processWebhook(webhook)
      }
    } catch (error) {
      console.error("Error processing webhook queue:", error)
    }
  }

  private async processWebhook(webhook: any) {
    const startTime = Date.now()

    try {
      // Mark as processing
      await this.supabase.from("webhook_queue").update({ status: "processing" }).eq("id", webhook.id)

      // Get current settings for timeout
      const settings = await this.getSettings()
      const timeout = settings?.webhook_timeout || 30

      // Send webhook
      const response = await this.sendWebhook(webhook.webhook_url, webhook.payload, timeout, settings?.webhook_secret)

      const responseTime = Date.now() - startTime

      if (response.success) {
        // Mark as completed
        await this.supabase
          .from("webhook_queue")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", webhook.id)

        // Log success
        await this.logWebhook(webhook, response, responseTime, true)

        console.log(`✅ Webhook delivered successfully for order ${webhook.order_id}`)
      } else {
        await this.handleWebhookFailure(webhook, response, responseTime)
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      await this.handleWebhookFailure(
        webhook,
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          status: 0,
          body: "",
        },
        responseTime,
      )
    }
  }

  private async sendWebhook(
    url: string,
    payload: any,
    timeoutSeconds: number,
    secret?: string | null,
  ): Promise<{
    success: boolean
    status: number
    body: string
    error?: string
  }> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "Carolina-Bumper-Plates-Webhook/1.0",
      }

      // Add signature if secret is provided
      if (secret) {
        const signature = crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex")
        headers["X-Webhook-Signature"] = `sha256=${signature}`
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000)

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const responseBody = await response.text()

      return {
        success: response.ok,
        status: response.status,
        body: responseBody,
      }
    } catch (error) {
      return {
        success: false,
        status: 0,
        body: "",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  private async handleWebhookFailure(webhook: any, response: any, responseTime: number) {
    const newAttempts = webhook.attempts + 1
    const settings = await this.getSettings()
    const maxAttempts = settings?.webhook_retry_attempts || 3
    const retryDelay = settings?.webhook_retry_delay || 5

    if (newAttempts >= maxAttempts) {
      // Mark as failed
      await this.supabase
        .from("webhook_queue")
        .update({
          status: "failed",
          attempts: newAttempts,
          error_message: response.error || `HTTP ${response.status}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", webhook.id)

      console.error(`❌ Webhook failed permanently for order ${webhook.order_id} after ${newAttempts} attempts`)
    } else {
      // Schedule retry
      const nextRetry = new Date(Date.now() + retryDelay * 1000 * Math.pow(2, newAttempts - 1))

      await this.supabase
        .from("webhook_queue")
        .update({
          status: "pending",
          attempts: newAttempts,
          next_retry_at: nextRetry.toISOString(),
          error_message: response.error || `HTTP ${response.status}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", webhook.id)

      console.log(`🔄 Webhook retry scheduled for order ${webhook.order_id} (attempt ${newAttempts}/${maxAttempts})`)
    }

    // Log the failure
    await this.logWebhook(webhook, response, responseTime, false)
  }

  private async logWebhook(webhook: any, response: any, responseTime: number, success: boolean) {
    try {
      await this.supabase.from("webhook_logs").insert({
        order_id: webhook.order_id,
        webhook_url: webhook.webhook_url,
        event_type: webhook.event_type,
        payload: webhook.payload,
        response_status: response.status,
        response_body: response.body?.substring(0, 1000), // Limit response body size
        response_time_ms: responseTime,
        success,
        error_message: response.error,
        retry_count: webhook.attempts,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error logging webhook:", error)
    }
  }

  async getWebhookStats(): Promise<{
    total_sent: number
    successful: number
    failed: number
    pending: number
    avg_response_time: number
    payment_link_webhooks: number
    order_completed_webhooks: number
  }> {
    try {
      const { data: stats } = await this.supabase.from("webhook_logs").select("success, response_time_ms, event_type")

      const { data: queueStats } = await this.supabase.from("webhook_queue").select("status")

      const totalSent = stats?.length || 0
      const successful = stats?.filter((s) => s.success).length || 0
      const failed = stats?.filter((s) => !s.success).length || 0
      const pending = queueStats?.filter((q) => q.status === "pending").length || 0
      const avgResponseTime = stats?.length
        ? stats.reduce((sum, s) => sum + (s.response_time_ms || 0), 0) / stats.length
        : 0

      const paymentLinkWebhooks = stats?.filter((s) => s.event_type === "payment_link_created").length || 0
      const orderCompletedWebhooks = stats?.filter((s) => s.event_type === "order_completed").length || 0

      return {
        total_sent: totalSent,
        successful,
        failed,
        pending,
        avg_response_time: Math.round(avgResponseTime),
        payment_link_webhooks: paymentLinkWebhooks,
        order_completed_webhooks: orderCompletedWebhooks,
      }
    } catch (error) {
      console.error("Error getting webhook stats:", error)
      return {
        total_sent: 0,
        successful: 0,
        failed: 0,
        pending: 0,
        avg_response_time: 0,
        payment_link_webhooks: 0,
        order_completed_webhooks: 0,
      }
    }
  }
}

// Export singleton instance
export const zapierWebhook = new ZapierWebhookCore()
