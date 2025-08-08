import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface WebhookPayload {
  event_type: "payment_link_created" | "order_completed"
  timestamp: string
  order: {
    id: number
    order_number: string
    customer_email: string
    customer_name?: string
    total_amount: number
    status: string
    payment_link_url?: string
    items?: any[]
  }
  customer?: {
    email: string
    name?: string
    phone?: string
  }
}

class ZapierWebhookService {
  private async getWebhookSettings() {
    const { data: settings, error } = await supabaseAdmin
      .from("admin_settings")
      .select("key, value")
      .in("key", ["zapier_webhook_enabled", "zapier_webhook_url"])

    if (error) {
      console.error("Error fetching webhook settings:", error)
      return { enabled: false, url: "" }
    }

    const enabled = settings?.find((s) => s.key === "zapier_webhook_enabled")?.value === "true"
    const url = settings?.find((s) => s.key === "zapier_webhook_url")?.value || ""

    return { enabled, url }
  }

  private async queueWebhook(orderId: number, payload: WebhookPayload, webhookUrl: string) {
    try {
      const { error } = await supabaseAdmin.from("webhook_queue").insert({
        order_id: orderId,
        webhook_url: webhookUrl,
        payload: payload,
        status: "pending",
        attempts: 0,
        max_attempts: 5,
        next_retry_at: new Date().toISOString(),
      })

      if (error) {
        console.error("Error queueing webhook:", error)
        return false
      }

      console.log(`Webhook queued for order ${orderId}:`, payload.event_type)
      return true
    } catch (error) {
      console.error("Error queueing webhook:", error)
      return false
    }
  }

  private async sendWebhook(webhookUrl: string, payload: WebhookPayload, orderId: number, retryCount = 0) {
    try {
      const startTime = Date.now()

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Carolina-Bumper-Plates-Webhook/1.0",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      const responseTime = Date.now() - startTime
      const responseText = await response.text()

      // Log the webhook attempt
      await supabaseAdmin.from("webhook_logs").insert({
        order_id: orderId,
        webhook_url: webhookUrl,
        payload: payload,
        response_status: response.status,
        response_body: responseText,
        response_time_ms: responseTime,
        success: response.ok,
        error_message: response.ok ? null : `HTTP ${response.status}: ${responseText}`,
        retry_count: retryCount,
      })

      return {
        success: response.ok,
        status: response.status,
        responseTime,
        responseBody: responseText,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Network error"

      // Log the failed attempt
      await supabaseAdmin.from("webhook_logs").insert({
        order_id: orderId,
        webhook_url: webhookUrl,
        payload: payload,
        response_status: 0,
        response_body: null,
        response_time_ms: 0,
        success: false,
        error_message: errorMessage,
        retry_count: retryCount,
      })

      return {
        success: false,
        status: 0,
        responseTime: 0,
        error: errorMessage,
      }
    }
  }

  async triggerPaymentLinkWebhook(orderId: number, paymentLinkUrl: string) {
    try {
      const settings = await this.getWebhookSettings()

      if (!settings.enabled) {
        console.log("Webhook disabled, skipping payment link webhook")
        return { success: false, reason: "Webhook disabled" }
      }

      if (!settings.url) {
        console.log("Webhook URL not configured, skipping payment link webhook")
        return { success: false, reason: "Webhook URL not configured" }
      }

      // Get order details
      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .select(`
          *,
          customers (
            email,
            first_name,
            last_name,
            phone
          )
        `)
        .eq("id", orderId)
        .single()

      if (orderError || !order) {
        console.error("Error fetching order for webhook:", orderError)
        return { success: false, reason: "Order not found" }
      }

      // Get order items
      const { data: orderItems } = await supabaseAdmin
        .from("order_items")
        .select(`
          *,
          products (
            name,
            description,
            image_url
          )
        `)
        .eq("order_id", orderId)

      const payload: WebhookPayload = {
        event_type: "payment_link_created",
        timestamp: new Date().toISOString(),
        order: {
          id: order.id,
          order_number: order.order_number,
          customer_email: order.customer_email,
          customer_name: order.customers
            ? `${order.customers.first_name} ${order.customers.last_name}`.trim()
            : undefined,
          total_amount: order.total_amount,
          status: order.status,
          payment_link_url: paymentLinkUrl,
          items: orderItems?.map((item) => ({
            product_name: item.products?.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          })),
        },
        customer: order.customers
          ? {
              email: order.customers.email,
              name: `${order.customers.first_name} ${order.customers.last_name}`.trim(),
              phone: order.customers.phone,
            }
          : undefined,
      }

      // Queue the webhook for reliable delivery
      const queued = await this.queueWebhook(orderId, payload, settings.url)

      if (queued) {
        console.log(`Payment link webhook queued for order ${order.order_number}`)
        return { success: true, queued: true }
      } else {
        return { success: false, reason: "Failed to queue webhook" }
      }
    } catch (error) {
      console.error("Error triggering payment link webhook:", error)
      return { success: false, reason: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  async triggerOrderCompletedWebhook(orderId: number) {
    try {
      const settings = await this.getWebhookSettings()

      if (!settings.enabled) {
        console.log("Webhook disabled, skipping order completed webhook")
        return { success: false, reason: "Webhook disabled" }
      }

      if (!settings.url) {
        console.log("Webhook URL not configured, skipping order completed webhook")
        return { success: false, reason: "Webhook URL not configured" }
      }

      // Get order details
      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .select(`
          *,
          customers (
            email,
            first_name,
            last_name,
            phone
          )
        `)
        .eq("id", orderId)
        .single()

      if (orderError || !order) {
        console.error("Error fetching order for webhook:", orderError)
        return { success: false, reason: "Order not found" }
      }

      // Get order items
      const { data: orderItems } = await supabaseAdmin
        .from("order_items")
        .select(`
          *,
          products (
            name,
            description,
            image_url
          )
        `)
        .eq("order_id", orderId)

      const payload: WebhookPayload = {
        event_type: "order_completed",
        timestamp: new Date().toISOString(),
        order: {
          id: order.id,
          order_number: order.order_number,
          customer_email: order.customer_email,
          customer_name: order.customers
            ? `${order.customers.first_name} ${order.customers.last_name}`.trim()
            : undefined,
          total_amount: order.total_amount,
          status: order.status,
          items: orderItems?.map((item) => ({
            product_name: item.products?.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          })),
        },
        customer: order.customers
          ? {
              email: order.customers.email,
              name: `${order.customers.first_name} ${order.customers.last_name}`.trim(),
              phone: order.customers.phone,
            }
          : undefined,
      }

      // Queue the webhook for reliable delivery
      const queued = await this.queueWebhook(orderId, payload, settings.url)

      if (queued) {
        console.log(`Order completed webhook queued for order ${order.order_number}`)
        return { success: true, queued: true }
      } else {
        return { success: false, reason: "Failed to queue webhook" }
      }
    } catch (error) {
      console.error("Error triggering order completed webhook:", error)
      return { success: false, reason: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  async processWebhookQueue() {
    try {
      // Get pending webhooks
      const { data: queueItems, error } = await supabaseAdmin
        .from("webhook_queue")
        .select("*")
        .eq("status", "pending")
        .lte("next_retry_at", new Date().toISOString())
        .order("created_at", { ascending: true })
        .limit(10)

      if (error) {
        console.error("Error fetching webhook queue:", error)
        return { success: false, processed: 0 }
      }

      if (!queueItems || queueItems.length === 0) {
        return { success: true, processed: 0 }
      }

      let processed = 0

      for (const item of queueItems) {
        try {
          // Mark as processing
          await supabaseAdmin.from("webhook_queue").update({ status: "processing" }).eq("id", item.id)

          // Send webhook
          const result = await this.sendWebhook(item.webhook_url, item.payload, item.order_id, item.attempts)

          if (result.success) {
            // Mark as completed
            await supabaseAdmin
              .from("webhook_queue")
              .update({
                status: "completed",
                completed_at: new Date().toISOString(),
              })
              .eq("id", item.id)

            processed++
          } else {
            // Increment attempts
            const newAttempts = item.attempts + 1

            if (newAttempts >= item.max_attempts) {
              // Mark as failed
              await supabaseAdmin
                .from("webhook_queue")
                .update({
                  status: "failed",
                  attempts: newAttempts,
                  error_message: result.error || `HTTP ${result.status}`,
                  failed_at: new Date().toISOString(),
                })
                .eq("id", item.id)
            } else {
              // Schedule retry with exponential backoff
              const retryDelay = Math.min(300000, Math.pow(2, newAttempts) * 1000) // Max 5 minutes
              const nextRetry = new Date(Date.now() + retryDelay)

              await supabaseAdmin
                .from("webhook_queue")
                .update({
                  status: "pending",
                  attempts: newAttempts,
                  next_retry_at: nextRetry.toISOString(),
                  error_message: result.error || `HTTP ${result.status}`,
                })
                .eq("id", item.id)
            }
          }
        } catch (error) {
          console.error(`Error processing webhook queue item ${item.id}:`, error)

          // Mark as failed
          await supabaseAdmin
            .from("webhook_queue")
            .update({
              status: "failed",
              error_message: error instanceof Error ? error.message : "Processing error",
              failed_at: new Date().toISOString(),
            })
            .eq("id", item.id)
        }
      }

      return { success: true, processed }
    } catch (error) {
      console.error("Error processing webhook queue:", error)
      return { success: false, processed: 0 }
    }
  }
}

export const zapierWebhook = new ZapierWebhookService()
