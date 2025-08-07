import { NextRequest, NextResponse } from 'next/server'
import { getOption, setOption, deleteOption } from '@/lib/options'

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const { name } = params
    const value = await getOption(name)
    
    return NextResponse.json({
      success: true,
      option_name: name,
      option_value: value
    })
  } catch (error) {
    console.error(`Error fetching option '${params.name}':`, error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch option',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const { name } = params
    const body = await request.json()
    const { value } = body

    const success = await setOption(name, value)
    
    if (!success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update option' 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Option '${name}' updated successfully`
    })
  } catch (error) {
    console.error(`Error updating option '${params.name}':`, error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update option',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const { name } = params
    const success = await deleteOption(name)
    
    if (!success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to delete option' 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Option '${name}' deleted successfully`
    })
  } catch (error) {
    console.error(`Error deleting option '${params.name}':`, error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete option',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
