import { createSupabaseAdmin } from "@/lib/supabase"
import type { CheckoutItem } from "@/lib/checkout-utils"

export async function POST(request: Request) {
  console.log("🛒 Starting checkout process...")

  try {
    const body = await request.json()
    const { orderItems, createAccount, password, ...orderData } = body

    console.log("📦 Received checkout data:", {
      itemCount: orderItems?.length || 0,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      createAccount: createAccount,
      hasPassword: !!password,
    })

    // Validate order items
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      console.log("❌ No order items provided")
      return new Response(
        JSON.stringify({
          error: "No order items provided",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    // Validate required customer data
    if (!orderData.customerName || !orderData.customerEmail || !orderData.customerPhone) {
      console.log("❌ Missing required customer data")
      return new Response(
        JSON.stringify({
          error: "Missing required customer information",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    // Validate password for account creation
    if (createAccount && (!password || password.length < 6)) {
      console.log("❌ Invalid password for account creation")
      return new Response(
        JSON.stringify({
          error: "Password must be at least 6 characters long",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    const supabaseAdmin = createSupabaseAdmin()

    // Handle authentication if creating account
    let authUserId = null
    if (createAccount && password) {
      console.log("🔐 Creating new user account...")

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: orderData.customerEmail.trim().toLowerCase(),
        password: password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: orderData.customerName.trim(),
          first_name: orderData.customerName.trim().split(" ")[0] || "",
          last_name: orderData.customerName.trim().split(" ").slice(1).join(" ") || "",
        },
      })

      if (authError) {
        console.error("❌ Error creating auth user:", authError)
        return new Response(
          JSON.stringify({
            error: "Failed to create user account: " + authError.message,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        )
      }

      if (authData.user) {
        authUserId = authData.user.id
        console.log("✅ Created auth user:", authUserId)
      }
    }

    // Verify products exist and get current prices
    const productIds = orderItems.map((item: CheckoutItem) => item.productId)
    console.log("🔍 Verifying products:", productIds)

    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("*")
      .in("id", productIds)

    if (productsError) {
      console.error("❌ Error fetching products:", productsError)
      return new Response(
        JSON.stringify({
          error: "Failed to verify products",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    if (!products || products.length === 0) {
      console.log("❌ No valid products found")
      return new Response(
        JSON.stringify({
          error: "No valid products found",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    console.log(
      "✅ Found products:",
      products.map((p) => ({ id: p.id, title: p.title })),
    )

    // Calculate totals with current prices
    let subtotal = 0
    let totalWeight = 0
    const validatedItems = []

    for (const item of orderItems) {
      const product = products?.find((p) => p.id === item.productId)
      if (!product) {
        console.log(`❌ Product ${item.productId} not found`)
        return new Response(
          JSON.stringify({
            error: `Product with ID ${item.productId} not found`,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        )
      }

      if (!product.available) {
        console.log(`❌ Product ${product.title} not available`)
        return new Response(
          JSON.stringify({
            error: `Product ${product.title} is no longer available`,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        )
      }

      const itemTotal = item.quantity * product.selling_price
      const itemWeight = item.quantity * product.weight * 2 // pairs

      subtotal += itemTotal
      totalWeight += itemWeight

      validatedItems.push({
        productId: product.id,
        weight: product.weight,
        title: product.title,
        quantity: item.quantity,
        price: product.selling_price,
        regularPrice: product.regular_price,
      })
    }

    console.log("💰 Calculated totals:", { subtotal, totalWeight, itemCount: validatedItems.length })

    // Split customer name into first and last name
    const nameParts = (orderData.customerName || "").trim().split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    // Check if customer already exists
    console.log("👤 Checking for existing customer:", orderData.customerEmail)
    const { data: existingCustomer, error: customerCheckError } = await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("email", orderData.customerEmail.trim().toLowerCase())
      .single()

    if (customerCheckError && customerCheckError.code !== "PGRST116") {
      console.error("❌ Error checking for existing customer:", customerCheckError)
    }

    let customerId = null

    if (existingCustomer) {
      console.log("✅ Found existing customer:", existingCustomer.id)
      customerId = existingCustomer.id

      // Update customer info with latest data and link auth user if created
      const updateData = {
        name: orderData.customerName.trim(),
        phone: orderData.customerPhone?.trim() || existingCustomer.phone,
        street_address: orderData.streetAddress?.trim() || existingCustomer.street_address,
        city: orderData.city?.trim() || existingCustomer.city,
        state: orderData.state?.trim() || existingCustomer.state,
        zip_code: orderData.zipCode?.trim() || existingCustomer.zip_code,
        delivery_option: orderData.deliveryOption || existingCustomer.delivery_option,
        updated_at: new Date().toISOString(),
        ...(authUserId && { user_id: authUserId }), // Link to auth user if account was created
      }

      const { error: updateError } = await supabaseAdmin
        .from("customers")
        .update(updateData)
        .eq("id", existingCustomer.id)

      if (updateError) {
        console.error("⚠️ Error updating customer:", updateError)
      } else {
        console.log("✅ Updated existing customer info")
      }
    } else {
      console.log("👤 Creating new customer...")

      // Create new customer record
      const customerData = {
        name: orderData.customerName.trim(),
        email: orderData.customerEmail.trim().toLowerCase(),
        phone: orderData.customerPhone?.trim() || null,
        street_address: orderData.streetAddress?.trim() || null,
        city: orderData.city?.trim() || null,
        state: orderData.state?.trim() || null,
        zip_code: orderData.zipCode?.trim() || null,
        delivery_instructions: orderData.deliveryInstructions?.trim() || null,
        delivery_option: orderData.deliveryOption || "door",
        user_id: authUserId, // Link to auth user if account was created
      }

      const { data: newCustomer, error: customerError } = await supabaseAdmin
        .from("customers")
        .insert(customerData)
        .select()
        .single()

      if (customerError) {
        console.error("❌ Error creating customer:", customerError)
        return new Response(
          JSON.stringify({
            error: "Failed to create customer record: " + customerError.message,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        )
      }

      console.log("✅ Created new customer:", newCustomer.id)
      customerId = newCustomer.id
    }

    // Prepare order data with proper validation
    const orderInsertData = {
      customer_name: orderData.customerName.trim(),
      customer_email: orderData.customerEmail.trim().toLowerCase(),
      customer_phone: orderData.customerPhone.trim(),
      street_address: orderData.streetAddress?.trim() || "",
      city: orderData.city?.trim() || "",
      state: orderData.state?.trim() || "",
      zip_code: orderData.zipCode?.trim() || "",
      delivery_instructions: orderData.deliveryInstructions?.trim() || null,
      delivery_option: orderData.deliveryOption || "door",
      additional_notes: orderData.additionalNotes?.trim() || null,
      order_items: validatedItems,
      subtotal: Math.round(subtotal * 100) / 100, // Ensure proper decimal precision
      total_weight: Math.round(totalWeight * 100) / 100,
      status: "pending",
      first_name: firstName,
      last_name: lastName,
      customer_id: customerId, // Link to customer record
      user_id: authUserId, // Link to auth user if account was created
    }

    console.log("💾 Attempting to create order with data:", {
      customer_name: orderInsertData.customer_name,
      customer_email: orderInsertData.customer_email,
      customer_id: orderInsertData.customer_id,
      user_id: orderInsertData.user_id,
      subtotal: orderInsertData.subtotal,
      total_weight: orderInsertData.total_weight,
      item_count: orderInsertData.order_items.length,
    })

    // Create order in database with retry logic
    let order = null
    let orderError = null

    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`🔄 Order creation attempt ${attempt}/3`)

      const { data: orderData, error: err } = await supabaseAdmin
        .from("orders")
        .insert(orderInsertData)
        .select()
        .single()

      if (orderData && !err) {
        order = orderData
        orderError = null
        break
      } else {
        orderError = err
        console.log(`⚠️ Attempt ${attempt} failed:`, err?.message)

        if (attempt < 3) {
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    }

    if (orderError || !order) {
      console.error("💥 Failed to create order after 3 attempts:", orderError)
      return new Response(
        JSON.stringify({
          error: "Failed to create order: " + (orderError?.message || "Unknown error"),
          details: orderError,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    console.log("🎉 Order created successfully:", {
      id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_id: order.customer_id,
      user_id: order.user_id,
    })

    // Verify the order was actually saved by trying to fetch it
    const { data: verificationOrder, error: verificationError } = await supabaseAdmin
      .from("orders")
      .select("order_number, customer_name, subtotal, customer_id, user_id")
      .eq("order_number", order.order_number)
      .single()

    if (verificationError || !verificationOrder) {
      console.error("💥 Order verification failed:", verificationError)
      return new Response(
        JSON.stringify({
          error: "Order was created but verification failed",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    console.log("✅ Order verification successful:", {
      order_number: verificationOrder.order_number,
      customer_id: verificationOrder.customer_id,
      user_id: verificationOrder.user_id,
    })

    return new Response(
      JSON.stringify({
        success: true,
        order: order,
        orderNumber: order.order_number,
        customerId: customerId,
        authUserId: authUserId,
        accountCreated: !!authUserId,
        redirectUrl: `/order-confirmation?order=${order.order_number}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("💥 Checkout API error:", error)
    return new Response(
      JSON.stringify({
        error: "Internal server error: " + error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
