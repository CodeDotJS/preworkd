import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    const { jobId } = await params
    const { searchParams } = new URL(request.url)
    
    // Get API endpoint from query parameter or use default
    const apiEndpoint = searchParams.get('endpoint') || 'https://yaysay-validator.onrender.com/validate/'

    // Validate job ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(jobId)) {
      return NextResponse.json({ error: "Invalid job ID format" }, { status: 400 })
    }

    // Make request to external API using configurable endpoint
    const response = await fetch(`${apiEndpoint}${jobId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `External API error: ${response.status} ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
