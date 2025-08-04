"use server"

import { z } from "zod"
import { sql } from "@vercel/postgres"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const OrderSchema = z.object({
  id: z.string(),
  customer_id: z.string({
    invalid_type_error: "Please select a customer.",
  }),
  customer_name: z.string(),
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

export async function createOrder(prevState: State, formData: FormData) {
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

  const { customer_id, customer_name, amount, status } = validatedFields.data
  const amountInCents = amount * 100
  const date = new Date().toISOString().split("T")[0]

  // Split customer name into first and last name
  const nameParts = customer_name.trim().split(" ")
  const firstName = nameParts[0] || ""
  const lastName = nameParts.slice(1).join(" ") || ""

  try {
    await sql`
    INSERT INTO orders (customer_id, customer_name, first_name, last_name, amount, status, date)
    VALUES (${customer_id}, ${customer_name}, ${firstName}, ${lastName}, ${amountInCents}, ${status}, ${date})
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

  const { customer_id, customer_name, amount, status } = validatedFields.data
  const amountInCents = amount * 100

  // Split customer name into first and last name
  const nameParts = customer_name.trim().split(" ")
  const firstName = nameParts[0] || ""
  const lastName = nameParts.slice(1).join(" ") || ""

  try {
    await sql`
      UPDATE orders
      SET customer_id = ${customer_id}, customer_name = ${customer_name}, first_name = ${firstName}, last_name = ${lastName}, amount = ${amountInCents}, status = ${status}
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

  const { customer_id, customer_name, amount, status } = validatedFields.data
  const amountInCents = amount * 100
  const date = new Date().toISOString().split("T")[0]

  // Split customer name into first and last name
  const nameParts = formData.customer_name.trim().split(" ")
  const firstName = nameParts[0] || ""
  const lastName = nameParts.slice(1).join(" ") || ""

  try {
    const order = {
      customer_id: customer_id,
      customer_name: formData.customer_name,
      first_name: firstName,
      last_name: lastName,
      amount: amountInCents,
      status: status,
      date: date,
    }
    // await sql`
    // INSERT INTO orders (customer_id, customer_name, amount, status, date)
    // VALUES (${customer_id}, ${customer_name}, ${amountInCents}, ${status}, ${date})
    // `
    console.log("Order created", order)
  } catch (error) {
    return {
      message: "Database Error: Failed to Create Order.",
    }
  }

  revalidatePath("/dashboard/orders")
  redirect("/dashboard/orders")
}
