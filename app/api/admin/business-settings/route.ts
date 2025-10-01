import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

// Default settings
const DEFAULT_SETTINGS = {
  business_name: "The Plate Yard",
  business_email: "info@theplateyard.com",
  business_phone: "(607) 329-5976",
  business_address: "1013 Hazeltn ln. Fuquay-Varina, NC 27526",
  website: "https://carolinabumperplates.com",
  minimum_order_weight: 7000,
  tax_rate: 0.0725,
  batch_progress_offset: 0,
}

export async function GET() {
  try {
    // Get all business settings from options table
    const { data, error } = await supabase
      .from("options")
      .select("option_name, option_value")
      .in("option_name", [
        "business_name",
        "business_email",
        "business_phone",
        "business_address",
        "website",
        "minimum_order_weight",
        "tax_rate",
        "batch_progress_offset",
      ])

    if (error) {
      console.error("Error fetching business settings:", error)
      throw error
    }

    // Convert array to object
    const settings: any = { ...DEFAULT_SETTINGS }
    if (data) {
      data.forEach((row) => {
        let value: any = row.option_value
        // Parse numeric values
        if (row.option_name === "minimum_order_weight") {
          value = parseInt(value) || DEFAULT_SETTINGS.minimum_order_weight
        } else if (row.option_name === "tax_rate") {
          value = parseFloat(value) || DEFAULT_SETTINGS.tax_rate
        } else if (row.option_name === "batch_progress_offset") {
          value = parseInt(value) || DEFAULT_SETTINGS.batch_progress_offset
        }
        settings[row.option_name] = value
      })
    }

    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error("Error in GET /api/admin/business-settings:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch business settings",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      business_name,
      business_email,
      business_phone,
      business_address,
      website,
      minimum_order_weight,
      tax_rate,
      batch_progress_offset,
    } = body

    // Prepare settings to update
    const settingsToUpdate = [
      { option_name: "business_name", option_value: business_name },
      { option_name: "business_email", option_value: business_email },
      { option_name: "business_phone", option_value: business_phone },
      { option_name: "business_address", option_value: business_address },
      { option_name: "website", option_value: website },
      { option_name: "minimum_order_weight", option_value: String(minimum_order_weight) },
      { option_name: "tax_rate", option_value: String(tax_rate) },
      { option_name: "batch_progress_offset", option_value: String(batch_progress_offset || 0) },
    ]

    // Upsert each setting (insert or update)
    for (const setting of settingsToUpdate) {
      const { error } = await supabase
        .from("options")
        .upsert(
          {
            option_name: setting.option_name,
            option_value: setting.option_value,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "option_name",
          }
        )

      if (error) {
        console.error(`Error upserting ${setting.option_name}:`, error)
        throw error
      }
    }

    return NextResponse.json({
      success: true,
      message: "Business settings saved successfully",
    })
  } catch (error) {
    console.error("Error in POST /api/admin/business-settings:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save business settings",
      },
      { status: 500 }
    )
  }
}
