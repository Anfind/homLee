import { NextRequest, NextResponse } from 'next/server'
import { LocalStorageToMongoMigration } from '@/lib/migration/localStorage-to-mongo'

// POST /api/migrate - Migrate data from localStorage to MongoDB
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { localStorageData, seedDefaultData = false } = body
    
    // Validate input
    if (!localStorageData && !seedDefaultData) {
      return NextResponse.json(
        { success: false, error: 'No migration data provided' },
        { status: 400 }
      )
    }
    
    let result
    
    if (seedDefaultData) {
      // Seed default data only
      result = await LocalStorageToMongoMigration.seedDefaultData()
    } else {
      // Migrate localStorage data
      result = await LocalStorageToMongoMigration.migrate(localStorageData)
    }
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Migration completed successfully',
        data: 'results' in result ? result.results : {}
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Migration API error:', error)
    return NextResponse.json(
      { success: false, error: 'Migration failed' },
      { status: 500 }
    )
  }
}

// GET /api/migrate - Get migration status/info
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Migration API is ready',
    instructions: {
      migrate: 'POST with { localStorageData: {...} } to migrate from localStorage',
      seedDefault: 'POST with { seedDefaultData: true } to create default data only'
    }
  })
}
