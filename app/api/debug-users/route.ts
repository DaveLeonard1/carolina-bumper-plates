import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if we can use Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 503 })
    }

    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // List all users in auth.users table
    const { data, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error("Error listing users:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Also check the orders table
    const { data: orders, error: ordersError } = await supabase.from("orders").select("*")

    if (ordersError) {
      console.error("Error listing orders:", ordersError)
    }

    // Also check customer_profiles table
    const { data: profiles, error: profilesError } = await supabase.from("customer_profiles").select("*")

    if (profilesError) {
      console.error("Error listing profiles:", profilesError)
    }

    return NextResponse.json({
      success: true,
      users: data.users.map((user) => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        email_confirmed_at: user.email_confirmed_at,
        last_sign_in_at: user.last_sign_in_at,
      })),
      userCount: data.users.length,
      orders: orders || [],
      orderCount: orders?.length || 0,
      profiles: profiles || [],
      profileCount: profiles?.length || 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Debug users error:", error)
    return NextResponse.json({ success: false, error: "An error occurred" }, { status: 500 })
  }
}
