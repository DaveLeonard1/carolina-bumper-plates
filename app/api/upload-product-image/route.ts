import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const productId = formData.get("productId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!productId) {
      return NextResponse.json({ error: "No product ID provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload JPEG, PNG, or WebP images." },
        { status: 400 },
      )
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Please upload images smaller than 5MB." }, { status: 400 })
    }

    // Generate filename
    const timestamp = Date.now()
    const extension = file.name.split(".").pop()
    const filename = `product-${productId}-${timestamp}.${extension}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    // Update product in database
    const supabaseAdmin = createSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from("products")
      .update({
        image_url: blob.url,
        image_uploaded_at: new Date().toISOString(),
      })
      .eq("id", productId)

    if (updateError) {
      console.error("Failed to update product with image URL:", updateError)
      return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      imageUrl: blob.url,
      message: "Image uploaded successfully",
    })
  } catch (error) {
    console.error("Error uploading image:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}
