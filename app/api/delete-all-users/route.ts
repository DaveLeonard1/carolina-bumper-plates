import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function DELETE() {
  try {
    console.log("🗑️ Starting database reset...")

    const results = {
      success: true,
      deletedUsers: [],
      ordersCleared: false,
      customersCleared: false,
      webhookLogsCleared: false,
      webhookQueueCleared: false,
      ordersCount: 0,
      customersCount: 0,
      webhookLogsCount: 0,
      webhookQueueCount: 0,
      errors: [],
    }

    // 1. Delete webhook logs first (they reference orders)
    console.log("Deleting all webhook logs...")
    try {
      const { count: webhookLogsCount } = await supabase.from("webhook_logs").select("*", { count: "exact", head: true })
      console.log(`Found ${webhookLogsCount || 0} webhook logs to delete`)

      const { error: webhookLogsError } = await supabase.from("webhook_logs").delete().not("id", "is", null)

      if (webhookLogsError) {
        console.error("Error deleting webhook logs:", webhookLogsError)
        results.errors.push({ table: "webhook_logs", error: webhookLogsError.message })
      } else {
        results.webhookLogsCleared = true
        results.webhookLogsCount = webhookLogsCount || 0
        console.log(`✅ Deleted ${webhookLogsCount || 0} webhook logs`)
      }
    } catch (error) {
      console.error("Error with webhook logs deletion:", error)
      results.errors.push({
        table: "webhook_logs",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // 2. Delete webhook queue entries (they may reference orders)
    console.log("Deleting all webhook queue entries...")
    try {
      const { count: webhookQueueCount } = await supabase.from("webhook_queue").select("*", { count: "exact", head: true })
      console.log(`Found ${webhookQueueCount || 0} webhook queue entries to delete`)

      const { error: webhookQueueError } = await supabase.from("webhook_queue").delete().not("id", "is", null)

      if (webhookQueueError) {
        console.error("Error deleting webhook queue:", webhookQueueError)
        results.errors.push({ table: "webhook_queue", error: webhookQueueError.message })
      } else {
        results.webhookQueueCleared = true
        results.webhookQueueCount = webhookQueueCount || 0
        console.log(`✅ Deleted ${webhookQueueCount || 0} webhook queue entries`)
      }
    } catch (error) {
      console.error("Error with webhook queue deletion:", error)
      results.errors.push({
        table: "webhook_queue",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // 3. Delete all orders (now that dependent records are gone)
    console.log("Deleting all orders...")
    try {
      const { count: orderCount } = await supabase.from("orders").select("*", { count: "exact", head: true })
      console.log(`Found ${orderCount || 0} orders to delete`)

      const { error: ordersError } = await supabase.from("orders").delete().not("id", "is", null)

      if (ordersError) {
        console.error("Error deleting orders:", ordersError)
        results.errors.push({ table: "orders", error: ordersError.message })
      } else {
        results.ordersCleared = true
        results.ordersCount = orderCount || 0
        console.log(`✅ Deleted ${orderCount || 0} orders`)
      }
    } catch (error) {
      console.error("Error with orders deletion:", error)
      results.errors.push({
        table: "orders",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // 4. Delete all customers
    console.log("Deleting all customers...")
    try {
      const { count: customerCount } = await supabase.from("customers").select("*", { count: "exact", head: true })
      console.log(`Found ${customerCount || 0} customers to delete`)

      const { error: customersError } = await supabase.from("customers").delete().not("id", "is", null)

      if (customersError) {
        console.error("Error deleting customers:", customersError)
        results.errors.push({ table: "customers", error: customersError.message })
      } else {
        results.customersCleared = true
        results.customersCount = customerCount || 0
        console.log(`✅ Deleted ${customerCount || 0} customers`)
      }
    } catch (error) {
      console.error("Error with customers deletion:", error)
      results.errors.push({
        table: "customers",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // 5. Get all auth users to delete
    console.log("Fetching auth users...")
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers()

    if (fetchError) {
      console.error("Error fetching users:", fetchError)
      results.errors.push({ table: "auth.users", error: fetchError.message })
    } else if (users?.users) {
      console.log(`Found ${users.users.length} auth users to delete`)

      // 6. Delete each auth user
      for (const user of users.users) {
        try {
          console.log(`Deleting user: ${user.email}`)
          const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

          if (deleteError) {
            console.error(`Error deleting user ${user.email}:`, deleteError)
            results.errors.push({
              email: user.email,
              error: deleteError.message,
            })
          } else {
            results.deletedUsers.push({
              id: user.id,
              email: user.email,
            })
            console.log(`✅ Deleted user: ${user.email}`)
          }
        } catch (error) {
          console.error(`Exception deleting user ${user.email}:`, error)
          results.errors.push({
            email: user.email,
            error: error instanceof Error ? error.message : "Unknown error",
          })
        }
      }
    }

    // 7. Alternative approach: If the above doesn't work, try raw SQL
    if (!results.ordersCleared || !results.customersCleared) {
      console.log("Trying alternative deletion method with raw SQL...")

      try {
        // Try using raw SQL for deletion
        if (!results.ordersCleared) {
          const { error: sqlOrdersError } = await supabase.rpc("delete_all_orders")
          if (!sqlOrdersError) {
            results.ordersCleared = true
            console.log("✅ Orders deleted via SQL function")
          }
        }

        if (!results.customersCleared) {
          const { error: sqlCustomersError } = await supabase.rpc("delete_all_customers")
          if (!sqlCustomersError) {
            results.customersCleared = true
            console.log("✅ Customers deleted via SQL function")
          }
        }
      } catch (sqlError) {
        console.log("SQL functions not available, trying direct approach...")

        // Final fallback: Get all records and delete by ID
        if (!results.ordersCleared) {
          try {
            const { data: allOrders } = await supabase.from("orders").select("id")
            if (allOrders && allOrders.length > 0) {
              const orderIds = allOrders.map((order) => order.id)
              const { error: deleteOrdersError } = await supabase.from("orders").delete().in("id", orderIds)
              if (!deleteOrdersError) {
                results.ordersCleared = true
                results.ordersCount = allOrders.length
                console.log(`✅ Deleted ${allOrders.length} orders by ID`)
              }
            } else {
              results.ordersCleared = true // No orders to delete
              results.ordersCount = 0
            }
          } catch (fallbackError) {
            console.error("Fallback orders deletion failed:", fallbackError)
          }
        }

        if (!results.customersCleared) {
          try {
            const { data: allCustomers } = await supabase.from("customers").select("id")
            if (allCustomers && allCustomers.length > 0) {
              const customerIds = allCustomers.map((customer) => customer.id)
              const { error: deleteCustomersError } = await supabase.from("customers").delete().in("id", customerIds)
              if (!deleteCustomersError) {
                results.customersCleared = true
                results.customersCount = allCustomers.length
                console.log(`✅ Deleted ${allCustomers.length} customers by ID`)
              }
            } else {
              results.customersCleared = true // No customers to delete
              results.customersCount = 0
            }
          } catch (fallbackError) {
            console.error("Fallback customers deletion failed:", fallbackError)
          }
        }
      }
    }

    // 8. Verify deletion by checking counts
    try {
      const { count: remainingOrders } = await supabase.from("orders").select("*", { count: "exact", head: true })
      const { count: remainingCustomers } = await supabase.from("customers").select("*", { count: "exact", head: true })
      const { count: remainingWebhookLogs } = await supabase.from("webhook_logs").select("*", { count: "exact", head: true })
      const { count: remainingWebhookQueue } = await supabase.from("webhook_queue").select("*", { count: "exact", head: true })

      console.log(`Remaining orders: ${remainingOrders || 0}`)
      console.log(`Remaining customers: ${remainingCustomers || 0}`)
      console.log(`Remaining webhook logs: ${remainingWebhookLogs || 0}`)
      console.log(`Remaining webhook queue: ${remainingWebhookQueue || 0}`)

      // Update success status based on remaining records
      if ((remainingOrders || 0) === 0 && (remainingCustomers || 0) === 0 && (remainingWebhookLogs || 0) === 0 && (remainingWebhookQueue || 0) === 0) {
        console.log("🎉 All database records successfully cleared!")
        results.success = true
      } else {
        console.log("⚠️ Some records may remain in the database")
        results.success = results.errors.length === 0 // Only success if no errors
      }
    } catch (error) {
      console.log("Could not verify deletion counts (this is not critical)")
    }

    console.log("Database reset completed!")
    console.log("Final results:", results)

    return Response.json(results)
  } catch (error) {
    console.error("Fatal error during database reset:", error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      deletedUsers: [],
      ordersCleared: false,
      customersCleared: false,
      webhookLogsCleared: false,
      webhookQueueCleared: false,
      ordersCount: 0,
      customersCount: 0,
      webhookLogsCount: 0,
      webhookQueueCount: 0,
      errors: [
        {
          table: "system",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      ],
    })
  }
}
