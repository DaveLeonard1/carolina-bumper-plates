import { NextRequest, NextResponse } from 'next/server'
import { getAllOptions, setOptions, OptionUpdate } from '@/lib/options'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeSensitive = searchParams.get('include_sensitive') === 'true'
    
    const options = await getAllOptions(includeSensitive)
    
    return NextResponse.json({
      success: true,
      options
    })
  } catch (error) {
    console.error('Error fetching options:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch options',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { options } = body

    if (!Array.isArray(options)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Options must be an array' 
        },
        { status: 400 }
      )
    }

    // Validate option updates
    const validOptions: OptionUpdate[] = []
    for (const option of options) {
      if (!option.option_name || typeof option.option_name !== 'string') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Each option must have a valid option_name' 
          },
          { status: 400 }
        )
      }
      
      validOptions.push({
        option_name: option.option_name,
        option_value: option.option_value
      })
    }

    const success = await setOptions(validOptions)
    
    if (!success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update options' 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${validOptions.length} options`
    })
  } catch (error) {
    console.error('Error updating options:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update options',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
