import { NextRequest, NextResponse } from 'next/server'
import { getEnvironmentInfo } from '@/lib/environment'

export async function GET(request: NextRequest) {
  try {
    const envInfo = getEnvironmentInfo()
    
    return NextResponse.json({
      success: true,
      environment: envInfo,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get environment info'
    }, { status: 500 })
  }
}
