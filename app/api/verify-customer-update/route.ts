import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { userId, expectedData } = await request.json()

    console.log("Verifying customer update for user:", userId)
    console.log("Expected data:", expectedData)

    // 1. Fetch the customer record
    const { data: customer, error: fetchError } = await supabase.from("customers").select("*").eq("id", userId).single()

    if (fetchError) {
      console.error("Error fetching customer:", fetchError)
      return NextResponse.json({
        success: false,
        error: "Failed to fetch customer",
        details: fetchError.message,
      })
    }

    if (!customer) {
      return NextResponse.json({
        success: false,
        error: "Customer not found",
      })
    }

    console.log("Found customer:", customer)

    // 2. Verify each field matches expected data
    const verification = {
      name: {
        expected: expectedData.name,
        actual: customer.name,
        matches: customer.name === expectedData.name,
      },
      email: {
        expected: expectedData.email,
        actual: customer.email,
        matches: customer.email === expectedData.email,
      },
      phone: {
        expected: expectedData.phone || "",
        actual: customer.phone || "",
        matches: (customer.phone || "") === (expectedData.phone || ""),
      },
      street_address: {
        expected: expectedData.street_address || "",
        actual: customer.street_address || "",
        matches: (customer.street_address || "") === (expectedData.street_address || ""),
      },
      city: {
        expected: expectedData.city || "",
        actual: customer.city || "",
        matches: (customer.city || "") === (expectedData.city || ""),
      },
      state: {
        expected: expectedData.state || "",
        actual: customer.state || "",
        matches: (customer.state || "") === (expectedData.state || ""),
      },
      zip_code: {
        expected: expectedData.zip_code || "",
        actual: customer.zip_code || "",
        matches: (customer.zip_code || "") === (expectedData.zip_code || ""),
      },
      delivery_option: {
        expected: expectedData.delivery_option || "door",
        actual: customer.delivery_option || "door",
        matches: (customer.delivery_option || "door") === (expectedData.delivery_option || "door"),
      },
    }

    // 3. Check for duplicates by email
    const { data: duplicates, error: duplicateError } = await supabase
      .from("customers")
      .select("id, name, email")
      .eq("email", customer.email)

    if (duplicateError) {
      console.error("Error checking duplicates:", duplicateError)
    }

    // 4. Check if updated_at is recent (within last 5 minutes)
    const updatedAt = new Date(customer.updated_at)
    const now = new Date()
    const timeDiff = now.getTime() - updatedAt.getTime()
    const isRecentlyUpdated = timeDiff < 5 * 60 * 1000 // 5 minutes

    // 5. Overall verification result
    const allFieldsMatch = Object.values(verification).every((field) => field.matches)

    const result = {
      success: allFieldsMatch,
      customer: customer,
      verification: verification,
      duplicates: duplicates || [],
      hasDuplicates: (duplicates?.length || 0) > 1,
      isRecentlyUpdated: isRecentlyUpdated,
      updatedAt: customer.updated_at,
      timeSinceUpdate: `${Math.round(timeDiff / 1000)} seconds ago`,
      summary: {
        totalFields: Object.keys(verification).length,
        matchingFields: Object.values(verification).filter((field) => field.matches).length,
        mismatchedFields: Object.values(verification)
          .filter((field) => !field.matches)
          .map((field) => ({
            field: Object.keys(verification).find((key) => verification[key] === field),
            expected: field.expected,
            actual: field.actual,
          })),
      },
    }

    console.log("Verification result:", result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({
      success: false,
      error: "Verification failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
