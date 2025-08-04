export async function GET() {
  try {
    return Response.json({
      success: true,
      message: "Basic API is working!",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Basic test error:", error)
    return Response.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    )
  }
}
