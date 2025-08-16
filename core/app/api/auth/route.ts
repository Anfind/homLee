import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/connection'
import { User } from '@/lib/mongodb/models'

// POST /api/auth/login - User authentication
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { username, password } = body
    
    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      )
    }
    
    // Find user with password
    const user = await User.findOne({ 
      username: username.toLowerCase().trim(),
      isActive: true 
    })
    
    if (!user || user.password !== password) { // TODO: Use bcrypt in production
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      )
    }
    
    // Update last login
    user.lastLogin = new Date()
    await user.save()
    
    // Return user without password
    const userResponse = {
      username: user.username,
      name: user.name,
      role: user.role,
      department: user.department,
      lastLogin: user.lastLogin
    }
    
    return NextResponse.json({
      success: true,
      data: userResponse,
      message: 'Login successful'
    })
  } catch (error) {
    console.error('Error during login:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}

// POST /api/auth/logout - User logout (if needed for session management)
export async function DELETE() {
  return NextResponse.json({
    success: true,
    message: 'Logout successful'
  })
}
