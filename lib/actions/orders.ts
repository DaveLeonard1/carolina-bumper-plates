"use server"

import { z } from "zod"
import { sql } from "@vercel/postgres"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createSupabaseAdmin } from "@/lib/supabase"

const OrderSchema = z.object({
  id: z.string(),
  customer_id: z.string({
    invalid_type_error: "Please select a customer.",
  }),
  customer_name: z.string({
    invalid_type_error: "Please enter a customer name.",
  }),
  amount: z.coerce.number().gt(0, { message: "Please enter an amount greater than $0." }),
  status: z.enum(["pending", "paid"], {
    invalid_type_error: "Please select an order status.",
  }),
  date: z.string(),
})

const CreateOrder = OrderSchema.omit({ id: true, date: true })
const UpdateOrder = OrderSchema.omit({ id: true, date: true })

export type State = {
  errors?: {
    customer_id?: string[]
    amount?: string[]
    status?: string[]
  }
  message?: string | null
}

export async function getOrderByNumber(orderNumber: string) {
  console.log("🔍 Searching for order:", orderNumber)

  if (!orderNumber || orderNumber.trim() === "") {
    console.log("❌ Empty order number provided")
    return null
  }

  try {
    // Try both SQL and Supabase approaches for maximum compatibility

    // Method 1: Using Supabase (preferred)
    const supabaseAdmin = createSupabaseAdmin()
    const { data: supabaseOrder, error: supabaseError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber.trim())
      .single()

    if (supabaseOrder && !supabaseError) {
      console.log("✅ Order found via Supabase:", supabaseOrder.order_number)
      return supabaseOrder
    }

    if (supabaseError) {
      console.log("⚠️ Supabase error:", supabaseError.message)
    }

    // Method 2: Fallback to SQL
    const result = await sql`
      SELECT 
        id,
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        street_address,
        city,
        state,
        zip_code,
        delivery_instructions,
        delivery_option,
        additional_notes,
        first_name,
        last_name,
        order_items,
        subtotal,
        total_weight,
        status,
        invoiced_at,
        created_at,
        updated_at
      FROM orders 
      WHERE order_number = ${orderNumber.trim()}
      LIMIT 1
    `

    if (result.rows.length === 0) {
      console.log("❌ Order not found in database:", orderNumber)

      // Debug: Check what orders do exist
      const debugResult = await sql`
        SELECT order_number, customer_name, created_at 
        FROM orders 
        ORDER BY created_at DESC 
        LIMIT 5
      `
      console.log("📋 Recent orders in database:", debugResult.rows)

      return null
    }

    console.log("✅ Order found via SQL:", result.rows[0].order_number)
    return result.rows[0]
  } catch (error) {
    console.error("💥 Error fetching order:", error)
    return null
  }
}

export async function submitOrder(prevState: State, formData: FormData) {
  const validatedFields = CreateOrder.safeParse({
    customer_id: formData.get("customerId"),
    customer_name: formData.get("customerName"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Order.",
    }
  }

  const { customer_id, amount, status } = validatedFields.data
  const amountInCents = amount * 100
  const date = new Date().toISOString().split("T")[0]

  // Split customer name into first and last name
  const nameParts = formData.get("customerName")?.toString().trim().split(" ") || []
  const firstName = nameParts[0] || ""
  const lastName = nameParts.slice(1).join(" ") || ""

  try {
    await sql`
      INSERT INTO orders (customer_id, customer_name, first_name, last_name, amount, status, date)
      VALUES (${customer_id}, ${formData.get("customerName")}, ${firstName}, ${lastName}, ${amountInCents}, ${status}, ${date})
    `
  } catch (error) {
    return {
      message: "Database Error: Failed to Create Order.",
    }
  }

  revalidatePath("/dashboard/orders")
  redirect("/dashboard/orders")
}

export async function updateOrder(id: string, prevState: State, formData: FormData) {
  const validatedFields = UpdateOrder.safeParse({
    customer_id: formData.get("customerId"),
    customer_name: formData.get("customerName"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Update Order.",
    }
  }

  const { customer_id, amount, status } = validatedFields.data
  const amountInCents = amount * 100

  // Split customer name into first and last name
  const nameParts = formData.get("customerName")?.toString().trim().split(" ") || []
  const firstName = nameParts[0] || ""
  const lastName = nameParts.slice(1).join(" ") || ""

  try {
    await sql`
      UPDATE orders
      SET customer_id = ${customer_id}, customer_name = ${formData.get("customerName")}, first_name = ${firstName}, last_name = ${lastName}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `
  } catch (error) {
    return { message: "Database Error: Failed to Update Order." }
  }

  revalidatePath("/dashboard/orders")
  redirect("/dashboard/orders")
}

export async function deleteOrder(id: string) {
  try {
    await sql`DELETE FROM orders WHERE id = ${id}`
    revalidatePath("/dashboard/orders")
    return { message: "Deleted Order." }
  } catch (error) {
    return { message: "Database Error: Failed to Delete Order." }
  }
}
