import mongoose, { Schema, Document } from 'mongoose'

// Employee Interface matching the existing structure
export interface IEmployee extends Document {
  _id: string
  id?: string // Virtual field for compatibility
  name: string
  title: string
  department: string
  createdAt: Date
  updatedAt: Date
}

const EmployeeSchema = new Schema<IEmployee>({
  _id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    default: 'Nhân viên'
  },
  department: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  _id: false, // Disable auto-generated _id since we provide our own
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Virtual field for compatibility with frontend
EmployeeSchema.virtual('id').get(function() {
  return this._id
})

// Create indexes for better performance
EmployeeSchema.index({ department: 1 })
// Note: _id index is automatically created by MongoDB, no need to manually define it
// Note: Removed name index as it's not frequently queried and causes duplicate warning

export const Employee = mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema)
