export function GET() {
  try {
    return new Response(JSON.stringify({ message: "success" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    return new Response("Error: " + String(error), {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    })
  }
}
