import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Database configuration missing",
        },
        { status: 500 },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log("🗑️ Starting database cleanup...")

    // Delete order timeline events first (has foreign key to orders)
    const { error: timelineError, count: timelineCount } = await supabase
      .from("order_timeline")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all rows

    if (timelineError) {
      console.error("Error deleting order timeline:", timelineError)
    } else {
      console.log(`✅ Deleted ${timelineCount || 0} order timeline events`)
    }

    // Delete order items (has foreign key to orders)
    const { error: itemsError, count: itemsCount } = await supabase
      .from("order_items")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all rows

    if (itemsError) {
      console.error("Error deleting order items:", itemsError)
    } else {
      console.log(`✅ Deleted ${itemsCount || 0} order items`)
    }

    // Delete orders
    const { error: ordersError, count: ordersCount } = await supabase
      .from("orders")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all rows

    if (ordersError) {
      console.error("Error deleting orders:", ordersError)
    } else {
      console.log(`✅ Deleted ${ordersCount || 0} orders`)
    }

    // Delete customers
    const { error: customersError, count: customersCount } = await supabase
      .from("customers")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all rows

    if (customersError) {
      console.error("Error deleting customers:", customersError)
    } else {
      console.log(`✅ Deleted ${customersCount || 0} customers`)
    }

    console.log("✅ Database cleanup completed")

    return NextResponse.json({
      success: true,
      message: "Successfully cleared all testing data",
      details: {
        customersDeleted: customersCount || 0,
        ordersDeleted: ordersCount || 0,
        orderItemsDeleted: itemsCount || 0,
        timelineEventsDeleted: timelineCount || 0,
      },
    })
  } catch (error) {
    console.error("Reset database error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to clear data: " + (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    )
  }
}
