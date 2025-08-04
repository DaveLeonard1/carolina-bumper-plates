import { createSupabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .order("weight", { ascending: true })

    if (error) {
      console.error("Products fetch error:", error)
      return new Response(
        JSON.stringify({
          error: "Failed to fetch products",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    return new Response(
      JSON.stringify({
        products: products || [],
        count: products?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Products API error:", error)
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
      },
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    const body = await request.json()
    const { title, weight, selling_price, regular_price, description, available } = body

    // Validate required fields
    if (!title || !weight || selling_price === undefined || regular_price === undefined) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          required: ["title", "weight", "selling_price", "regular_price"],
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const productData = {
      title: String(title).trim(),
      weight: Number.parseInt(String(weight)),
      selling_price: Number.parseFloat(String(selling_price)),
      regular_price: Number.parseFloat(String(regular_price)),
      description: description ? String(description).trim() : null,
      available: Boolean(available),
    }

    const { data: product, error } = await supabaseAdmin.from("products").insert([productData]).select().single()

    if (error) {
      console.error("Product insert error:", error)
      return new Response(
        JSON.stringify({
          error: "Failed to create product",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        product,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Products POST error:", error)
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
