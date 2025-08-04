import { createSupabaseAdmin } from "@/lib/supabase"
import crypto from "crypto"

export interface WebhookDebugSession {
  sessionId: string
  orderId: string
  startTime: number
  steps: WebhookDebugStep[]
}

export interface WebhookDebugStep {
  stepName: string
  status: "started" | "completed" | "failed" | "warning"
  data?: any
  error?: any
  executionTime?: number
  timestamp: number
}

export interface WebhookDiagnosticResult {
  success: boolean
  sessionId: string
  orderId: string
  totalSteps: number
  failedSteps: number
  warningSteps: number
  completedSteps: number
  totalExecutionTime: number
  failurePoints: string[]
  recommendations: string[]
  configurationIssues: string[]
  networkIssues: string[]
  dataIssues: string[]
}

export class ZapierWebhookDebugger {
  private supabase = createSupabaseAdmin()
  private debugSessions = new Map<string, WebhookDebugSession>()

  async startDebugSession(orderId: string): Promise<string> {
    const sessionId = crypto.randomUUID()
    const session: WebhookDebugSession = {
      sessionId,
      orderId,
      startTime: Date.now(),
      steps: [],
    }

    this.debugSessions.set(sessionId, session)

    await this.logDebugStep(sessionId, "debug_session_started", "started", {
      orderId,
      sessionId,
      timestamp: new Date().toISOString(),
    })

    return sessionId
  }

  async logDebugStep(
    sessionId: string,
    stepName: string,
    status: "started" | "completed" | "failed" | "warning",
    data?: any,
    error?: any,
  ): Promise<void> {
    const session = this.debugSessions.get(sessionId)
    if (!session) {
      console.error(`Debug session ${sessionId} not found`)
      return
    }

    const stepStartTime = Date.now()
    const step: WebhookDebugStep = {
      stepName,
      status,
      data,
      error,
      timestamp: stepStartTime,
    }

    // Calculate execution time for completed/failed steps
    if (status === "completed" || status === "failed") {
      const previousStep = session.steps[session.steps.length - 1]
      if (previousStep && previousStep.stepName === stepName && previousStep.status === "started") {
        step.executionTime = stepStartTime - previousStep.timestamp
      }
    }

    session.steps.push(step)

    // Log to database
    try {
      await this.supabase.rpc("log_webhook_debug_step", {
        p_order_id: session.orderId,
        p_session_id: sessionId,
        p_step_name: stepName,
        p_step_status: status,
        p_step_data: data ? JSON.parse(JSON.stringify(data)) : null,
        p_error_details: error ? JSON.parse(JSON.stringify(error)) : null,
        p_execution_time_ms: step.executionTime || null,
      })
    } catch (dbError) {
      console.error("Failed to log debug step to database:", dbError)
    }
  }

  async archiveWebhookPayload(
    orderId: string,
    webhookUrl: string,
    payload: any,
    response: {
      status: number
      body: string
      headers?: Record<string, string>
      error?: string
      timing?: {
        total: number
        dns?: number
        connection?: number
        ssl?: number
        transfer?: number
      }
    },
    requestHeaders?: Record<string, string>,
  ): Promise<void> {
    try {
      await this.supabase.rpc("archive_webhook_payload", {
        p_order_id: orderId,
        p_webhook_url: webhookUrl,
        p_payload_sent: JSON.parse(JSON.stringify(payload)),
        p_headers_sent: requestHeaders ? JSON.parse(JSON.stringify(requestHeaders)) : null,
        p_response_received: response.body ? { body: response.body } : null,
        p_response_headers: response.headers ? JSON.parse(JSON.stringify(response.headers)) : null,
        p_http_status_code: response.status,
        p_network_error: response.error || null,
        p_timing_data: response.timing ? JSON.parse(JSON.stringify(response.timing)) : null,
      })
    } catch (error) {
      console.error("Failed to archive webhook payload:", error)
    }
  }

  async diagnoseWebhookFailure(orderId: string): Promise<WebhookDiagnosticResult> {
    const sessionId = await this.startDebugSession(orderId)

    try {
      await this.logDebugStep(sessionId, "diagnosis_started", "started", { orderId })

      // Step 1: Check webhook configuration
      await this.logDebugStep(sessionId, "check_configuration", "started")
      const configResult = await this.checkWebhookConfiguration()
      await this.logDebugStep(
        sessionId,
        "check_configuration",
        configResult.valid ? "completed" : "failed",
        configResult.config,
        configResult.errors,
      )

      // Step 2: Validate order data
      await this.logDebugStep(sessionId, "validate_order_data", "started")
      const orderResult = await this.validateOrderData(orderId)
      await this.logDebugStep(
        sessionId,
        "validate_order_data",
        orderResult.valid ? "completed" : "failed",
        orderResult.data,
        orderResult.errors,
      )

      // Step 3: Test webhook connectivity
      await this.logDebugStep(sessionId, "test_connectivity", "started")
      const connectivityResult = await this.testWebhookConnectivity(configResult.config?.webhook_url)
      await this.logDebugStep(
        sessionId,
        "test_connectivity",
        connectivityResult.success ? "completed" : "failed",
        connectivityResult.data,
        connectivityResult.error,
      )

      // Step 4: Build and validate payload
      await this.logDebugStep(sessionId, "build_payload", "started")
      const payloadResult = await this.buildAndValidatePayload(orderId, configResult.config)
      await this.logDebugStep(
        sessionId,
        "build_payload",
        payloadResult.valid ? "completed" : "failed",
        { payloadSize: JSON.stringify(payloadResult.payload).length },
        payloadResult.errors,
      )

      // Step 5: Test webhook delivery
      if (configResult.valid && orderResult.valid && payloadResult.valid) {
        await this.logDebugStep(sessionId, "test_delivery", "started")
        const deliveryResult = await this.testWebhookDelivery(
          configResult.config.webhook_url,
          payloadResult.payload,
          configResult.config,
        )
        await this.logDebugStep(
          sessionId,
          "test_delivery",
          deliveryResult.success ? "completed" : "failed",
          deliveryResult.response,
          deliveryResult.error,
        )

        // Archive the test payload
        await this.archiveWebhookPayload(
          orderId,
          configResult.config.webhook_url,
          payloadResult.payload,
          deliveryResult.response || { status: 0, body: "", error: deliveryResult.error?.message },
        )
      }

      // Generate diagnostic result
      const session = this.debugSessions.get(sessionId)!
      const result = await this.generateDiagnosticResult(session, {
        config: configResult,
        order: orderResult,
        connectivity: connectivityResult,
        payload: payloadResult,
      })

      await this.logDebugStep(sessionId, "diagnosis_completed", "completed", result)

      return result
    } catch (error) {
      await this.logDebugStep(sessionId, "diagnosis_failed", "failed", null, {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      })

      throw error
    }
  }

  private async checkWebhookConfiguration(): Promise<{
    valid: boolean
    config?: any
    errors?: string[]
  }> {
    try {
      const { data: config, error } = await this.supabase.from("zapier_settings").select("*").single()

      if (error || !config) {
        return {
          valid: false,
          errors: ["Webhook configuration not found"],
        }
      }

      const errors: string[] = []

      if (!config.webhook_enabled) {
        errors.push("Webhook integration is disabled")
      }

      if (!config.webhook_url) {
        errors.push("Webhook URL is not configured")
      } else {
        try {
          new URL(config.webhook_url)
        } catch {
          errors.push("Webhook URL is invalid")
        }
      }

      if (config.webhook_timeout < 5 || config.webhook_timeout > 300) {
        errors.push("Webhook timeout is outside valid range (5-300 seconds)")
      }

      return {
        valid: errors.length === 0,
        config,
        errors: errors.length > 0 ? errors : undefined,
      }
    } catch (error) {
      return {
        valid: false,
        errors: [`Configuration check failed: ${error instanceof Error ? error.message : "Unknown error"}`],
      }
    }
  }

  private async validateOrderData(orderId: string): Promise<{
    valid: boolean
    data?: any
    errors?: string[]
  }> {
    try {
      const { data: order, error } = await this.supabase
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

      if (error || !order) {
        return {
          valid: false,
          errors: [`Order not found: ${error?.message || "Unknown error"}`],
        }
      }

      const errors: string[] = []

      // Check required order fields
      if (!order.order_number) errors.push("Order number is missing")
      if (!order.customer_email) errors.push("Customer email is missing")
      if (!order.order_items) errors.push("Order items are missing")
      if (!order.payment_link_url) errors.push("Payment link URL is missing")

      // Validate order items
      if (order.order_items) {
        try {
          const items = typeof order.order_items === "string" ? JSON.parse(order.order_items) : order.order_items

          if (!Array.isArray(items) || items.length === 0) {
            errors.push("Order items array is empty or invalid")
          } else {
            items.forEach((item, index) => {
              if (!item.weight) errors.push(`Item ${index + 1}: weight is missing`)
              if (!item.quantity || item.quantity <= 0) errors.push(`Item ${index + 1}: quantity is invalid`)
              if (!item.price || item.price <= 0) errors.push(`Item ${index + 1}: price is invalid`)
            })
          }
        } catch {
          errors.push("Order items JSON is malformed")
        }
      }

      return {
        valid: errors.length === 0,
        data: order,
        errors: errors.length > 0 ? errors : undefined,
      }
    } catch (error) {
      return {
        valid: false,
        errors: [`Order validation failed: ${error instanceof Error ? error.message : "Unknown error"}`],
      }
    }
  }

  private async testWebhookConnectivity(webhookUrl?: string): Promise<{
    success: boolean
    data?: any
    error?: any
  }> {
    if (!webhookUrl) {
      return {
        success: false,
        error: { message: "No webhook URL provided" },
      }
    }

    try {
      const startTime = Date.now()

      // Test basic connectivity with a HEAD request
      const response = await fetch(webhookUrl, {
        method: "HEAD",
        headers: {
          "User-Agent": "Carolina-Bumper-Plates-Webhook-Test/1.0",
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      const endTime = Date.now()

      return {
        success: true,
        data: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          responseTime: endTime - startTime,
          url: webhookUrl,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown connectivity error",
          code: (error as any)?.code,
          type: error instanceof TypeError ? "network" : "unknown",
        },
      }
    }
  }

  private async buildAndValidatePayload(
    orderId: string,
    config: any,
  ): Promise<{
    valid: boolean
    payload?: any
    errors?: string[]
  }> {
    try {
      // Get order data
      const { data: orderData } = await this.supabase
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

      if (!orderData) {
        return {
          valid: false,
          errors: ["Failed to fetch order data for payload"],
        }
      }

      // Build payload similar to the main webhook system
      const payload = {
        event_type: "payment_link_created",
        timestamp: new Date().toISOString(),
        order: {
          id: orderData.id,
          order_number: orderData.order_number,
          status: orderData.status,
          payment_status: orderData.payment_status,
          payment_link_url: orderData.payment_link_url,
          total_amount: orderData.total_amount || 0,
          currency: "USD",
          created_at: orderData.created_at,
        },
        metadata: {
          source: "webhook_diagnostic_test",
          created_via: "diagnostic",
          test_mode: true,
        },
      }

      // Add optional data based on configuration
      if (config?.include_customer_data && orderData.customer_email) {
        payload.customer = {
          id: orderData.customers?.id || null,
          email: orderData.customer_email,
          first_name: orderData.customers?.first_name || null,
          last_name: orderData.customers?.last_name || null,
          full_name: orderData.customer_name || null,
          phone: orderData.customer_phone || orderData.customers?.phone || null,
          stripe_customer_id: orderData.customers?.stripe_customer_id || null,
        }
      }

      // Validate payload structure
      const errors: string[] = []

      if (!payload.order.id) errors.push("Order ID is missing from payload")
      if (!payload.order.order_number) errors.push("Order number is missing from payload")
      if (!payload.order.payment_link_url) errors.push("Payment link URL is missing from payload")

      // Check payload size
      const payloadSize = JSON.stringify(payload).length
      if (payloadSize > 1024 * 1024) {
        // 1MB limit
        errors.push(`Payload size (${payloadSize} bytes) exceeds 1MB limit`)
      }

      return {
        valid: errors.length === 0,
        payload,
        errors: errors.length > 0 ? errors : undefined,
      }
    } catch (error) {
      return {
        valid: false,
        errors: [`Payload building failed: ${error instanceof Error ? error.message : "Unknown error"}`],
      }
    }
  }

  private async testWebhookDelivery(
    webhookUrl: string,
    payload: any,
    config: any,
  ): Promise<{
    success: boolean
    response?: any
    error?: any
  }> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "Carolina-Bumper-Plates-Webhook-Test/1.0",
        "X-Webhook-Test": "true",
      }

      // Add signature if secret is configured
      if (config.webhook_secret) {
        const signature = crypto
          .createHmac("sha256", config.webhook_secret)
          .update(JSON.stringify(payload))
          .digest("hex")
        headers["X-Webhook-Signature"] = `sha256=${signature}`
      }

      const startTime = Date.now()

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout((config.webhook_timeout || 30) * 1000),
      })

      const endTime = Date.now()
      const responseBody = await response.text()

      return {
        success: response.ok,
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseBody,
          responseTime: endTime - startTime,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown delivery error",
          code: (error as any)?.code,
          type: error instanceof TypeError ? "network" : "unknown",
        },
      }
    }
  }

  private async generateDiagnosticResult(session: WebhookDebugSession, results: any): Promise<WebhookDiagnosticResult> {
    const failedSteps = (session?.steps ?? []).filter((s) => s.status === "failed").length
    const warningSteps = (session?.steps ?? []).filter((s) => s.status === "warning").length
    const completedSteps = (session?.steps ?? []).filter((s) => s.status === "completed").length
    const totalExecutionTime = Date.now() - (session?.startTime ?? Date.now())

    const safe = <T = unknown>(arr?: T[]): T[] => (Array.isArray(arr) ? arr : [])

    const failurePoints: string[] = []
    const recommendations: string[] = []
    const configurationIssues: string[] = []
    const networkIssues: string[] = []
    const dataIssues: string[] = []

    // ---------- helper guards ------------
    const cfgErrors = safe(results?.config?.errors)
    const ordErrors = safe(results?.order?.errors)
    const payloadErrors = safe(results?.payload?.errors)
    const connErrMsg = results?.connectivity?.error?.message
    // -------------------------------------

    if (!results?.config?.valid) {
      configurationIssues.push(...cfgErrors)
      recommendations.push("Fix webhook configuration in admin settings and re-run diagnosis")
    }

    if (!results?.order?.valid) {
      dataIssues.push(...ordErrors)
      recommendations.push("Ensure order contains all required fields before creating a payment link")
    }

    if (!results?.connectivity?.success && connErrMsg) {
      networkIssues.push(connErrMsg)
      recommendations.push("Check network connectivity / DNS / SSL for webhook URL")
    }

    if (!results?.payload?.valid) {
      dataIssues.push(...payloadErrors)
      recommendations.push("Review payload structure or size constraints")
    }

    safe(session?.steps).forEach((step) => {
      if (step.status === "failed") {
        failurePoints.push(`${step.stepName}: ${step.error?.message ?? "Unknown error"}`)
      }
    })

    return {
      success: failedSteps === 0,
      sessionId: session.sessionId,
      orderId: session.orderId,
      totalSteps: session.steps.length,
      failedSteps,
      warningSteps,
      completedSteps,
      totalExecutionTime,
      failurePoints,
      recommendations,
      configurationIssues,
      networkIssues,
      dataIssues,
    }
  }

  async getDebugHistory(orderId: string, limit = 10): Promise<any[]> {
    try {
      // 1️⃣ Primary query against the materialized view
      const { data, error } = await this.supabase
        .from("webhook_failure_analysis")
        .select("*")
        .eq("order_id", orderId)
        .order("last_attempt", { ascending: false })
        .limit(limit)

      // If the view is missing, Supabase will return error.code === '42P01'
      const viewMissing = error && (error as any).code === "42P01"

      if (!viewMissing && error) {
        console.error("Failed to fetch debug history:", error)
        // other DB errors – just bubble the empty array
        return []
      }

      if (!viewMissing && data && data.length > 0) {
        return data
      }

      // 2️⃣ View doesn’t exist ➜ fallback to raw logs
      console.warn("webhook_failure_analysis view missing. Falling back to aggregated data from webhook_debug_logs …")

      const { data: rawLogs, error: rawError } = await this.supabase
        .from("webhook_debug_logs")
        .select(
          `order_id,
           debug_session_id,
           step_name,
           step_status,
           execution_time_ms,
           created_at`,
        )
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1000)

      // 🛡️  NEW guard — the table itself might not exist yet
      const tableMissing = rawError && (rawError as any).code === "42P01"
      if (tableMissing) {
        console.warn("webhook_debug_logs table missing. Returning empty history.")
        return []
      }

      if (rawError || !rawLogs) {
        console.error("Fallback query failed:", rawError)
        return []
      }

      // Client-side aggregation mimicking the view’s shape
      const sessions = new Map<
        string,
        {
          order_id: string
          debug_session_id: string
          total_steps: number
          failed_steps: number
          warning_steps: number
          completed_steps: number
          last_attempt: string
          failure_summary: string
          total_execution_time_ms: number
        }
      >()

      rawLogs.forEach((log) => {
        const id = log.debug_session_id
        if (!sessions.has(id)) {
          sessions.set(id, {
            order_id: log.order_id,
            debug_session_id: id,
            total_steps: 0,
            failed_steps: 0,
            warning_steps: 0,
            completed_steps: 0,
            last_attempt: log.created_at,
            failure_summary: "",
            total_execution_time_ms: 0,
          })
        }
        const s = sessions.get(id)!
        s.total_steps++
        if (log.step_status === "failed") s.failed_steps++
        if (log.step_status === "warning") s.warning_steps++
        if (log.step_status === "completed") s.completed_steps++
        // Update last_attempt to newest timestamp
        if (new Date(log.created_at) > new Date(s.last_attempt)) s.last_attempt = log.created_at
        s.total_execution_time_ms += log.execution_time_ms || 0
      })

      // Simple failure summary (first 3 failed step names)
      sessions.forEach((s) => {
        const fails = rawLogs
          .filter((l) => l.debug_session_id === s.debug_session_id && l.step_status === "failed")
          .slice(0, 3)
          .map((l) => l.step_name)
        s.failure_summary = fails.join("; ")
      })

      return Array.from(sessions.values())
        .sort((a, b) => new Date(b.last_attempt).getTime() - new Date(a.last_attempt).getTime())
        .slice(0, limit)
    } catch (err) {
      console.error("Error fetching debug history:", err)
      return []
    }
  }

  async getWebhookStats(): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from("webhook_performance_analysis")
        .select("*")
        .order("time_bucket", { ascending: false })
        .limit(24) // Last 24 hours

      if (error) {
        console.error("Failed to fetch webhook stats:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error fetching webhook stats:", error)
      return null
    }
  }
}

// Export singleton instance
export const webhookDebugger = new ZapierWebhookDebugger()
