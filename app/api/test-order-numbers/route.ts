/**
 * This endpoint has been disabled to prevent accidental creation of test orders.
 * It was previously creating test orders when accessed, which was causing
 * duplicate test orders to be created when pushing from Windsurf to Git.
 * 
 * Disabled on: 2025-08-07
 */

export async function GET() {
  console.log("⚠️ Test order endpoint accessed but disabled")
  
  return Response.json({
    success: false,
    message: "This test endpoint has been disabled to prevent accidental creation of test orders.",
    disabled: true,
    disabledOn: "2025-08-07"
  }, { status: 403 })
}
