import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    // Check if we can use Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      // If no Supabase, assume new user
      return NextResponse.json({ success: true, exists: false, debug: "No Supabase config" })
    }

    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if user exists in auth.users table
    const { data, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error("Error checking users:", error)
      // If we can't check, assume new user to be safe
      return NextResponse.json({ success: true, exists: false, debug: `Error: ${error.message}` })
    }

    const userExists = data.users.some((user) => user.email?.toLowerCase() === email.toLowerCase())

    // Debug info
    const matchingUsers = data.users.filter((user) => user.email?.toLowerCase() === email.toLowerCase())

    return NextResponse.json({
      success: true,
      exists: userExists,
      debug: {
        totalUsers: data.users.length,
        searchEmail: email.toLowerCase(),
        matchingUsers: matchingUsers.map((u) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
        })),
      },
    })
  } catch (error) {
    console.error("Email check error:", error)
    // On any error, assume new user
    return NextResponse.json({ success: true, exists: false, debug: `Exception: ${error}` })
  }
}
