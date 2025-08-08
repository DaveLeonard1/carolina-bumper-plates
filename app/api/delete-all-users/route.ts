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
      ordersCount: 0,
      customersCount: 0,
      errors: [],
    }

    // 1. Delete all orders first (due to foreign key constraints)
    console.log("Deleting all orders...")
    try {
      // First get count of orders
      const { count: orderCount } = await supabase.from("orders").select("*", { count: "exact", head: true })

      console.log(`Found ${orderCount || 0} orders to delete`)

      // Delete all orders by selecting all and then deleting
      // This avoids any WHERE clause issues with UUID
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

    // 2. Delete all customers
    console.log("Deleting all customers...")
    try {
      // First get count of customers
      const { count: customerCount } = await supabase.from("customers").select("*", { count: "exact", head: true })

      console.log(`Found ${customerCount || 0} customers to delete`)

      // Delete all customers by selecting all and then deleting
      // This avoids any WHERE clause issues with UUID
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

    // 3. Get all auth users to delete
    console.log("Fetching auth users...")
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers()

    if (fetchError) {
      console.error("Error fetching users:", fetchError)
      results.errors.push({ table: "auth.users", error: fetchError.message })
    } else if (users?.users) {
      console.log(`Found ${users.users.length} auth users to delete`)

      // 4. Delete each auth user
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

    // 5. Alternative approach: If the above doesn't work, try raw SQL
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

    // 6. Verify deletion by checking counts
    try {
      const { count: remainingOrders } = await supabase.from("orders").select("*", { count: "exact", head: true })
      const { count: remainingCustomers } = await supabase.from("customers").select("*", { count: "exact", head: true })

      console.log(`Remaining orders: ${remainingOrders || 0}`)
      console.log(`Remaining customers: ${remainingCustomers || 0}`)

      // Update success status based on remaining records
      if ((remainingOrders || 0) === 0 && (remainingCustomers || 0) === 0) {
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
      ordersCount: 0,
      customersCount: 0,
      errors: [
        {
          table: "system",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      ],
    })
  }
}
