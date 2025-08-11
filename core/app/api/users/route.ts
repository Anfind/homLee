import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/connection'
import { User } from '@/lib/mongodb/models'

// GET /api/users - Get all users
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const searchParams = request.nextUrl.searchParams
    const department = searchParams.get('department')
    const role = searchParams.get('role')
    
    let query: any = { isActive: true }
    if (department) {
      query.department = department
    }
    if (role) {
      query.role = role
    }
    
    const users = await User.find(query).select('-password').sort({ name: 1 })
    
    return NextResponse.json({
      success: true,
      data: users,
      count: users.length
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { username, password, name, role, department } = body
    
    // Validation
    if (!username || !password || !name || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: username, password, name, role' },
        { status: 400 }
      )
    }
    
    if (role === 'truongphong' && !department) {
      return NextResponse.json(
        { success: false, error: 'Department is required for truongphong role' },
        { status: 400 }
      )
    }
    
    // Check if username already exists
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 409 }
      )
    }
    
    const user = new User({
      username,
      password, // TODO: Hash password in production
      name,
      role,
      department: role === 'truongphong' ? department : undefined
    })
    
    await user.save()
    
    // Return user without password
    const userResponse = user.toObject()
    delete userResponse.password
    
    return NextResponse.json({
      success: true,
      data: userResponse,
      message: 'User created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

// PUT /api/users - Update user
export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { username, name, role, department, password } = body
    
    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      )
    }
    
    const updateData: any = { name, role }
    if (role === 'truongphong' && department) {
      updateData.department = department
    }
    if (password) {
      updateData.password = password // TODO: Hash password in production
    }
    
    const user = await User.findOneAndUpdate(
      { username },
      updateData,
      { new: true, runValidators: true }
    ).select('-password')
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users - Delete user (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    
    const searchParams = request.nextUrl.searchParams
    const username = searchParams.get('username')
    
    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      )
    }
    
    // Prevent deleting admin user
    if (username === 'admin') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete admin user' },
        { status: 403 }
      )
    }
    
    const user = await User.findOneAndUpdate(
      { username },
      { isActive: false },
      { new: true }
    ).select('-password')
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
