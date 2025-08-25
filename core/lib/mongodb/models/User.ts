import mongoose, { Schema, Document } from 'mongoose'

// User Interface for authentication
export interface IUser extends Document {
  username: string
  password: string // In production, this should be hashed
  role: 'admin' | 'truongphong' | 'department_manager'
  department?: string
  name: string
  lastLogin?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  password: {
    type: String,
    required: true,
    minlength: 6
    // TODO: Add password hashing in production
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'truongphong', 'department_manager'],
    default: 'truongphong'
  },
  department: {
    type: String,
    required: function(this: IUser) {
      return this.role === 'truongphong' || this.role === 'department_manager'
    }
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Create indexes (username already has unique: true in schema definition)
UserSchema.index({ role: 1 })
UserSchema.index({ department: 1 })

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
