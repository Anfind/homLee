import mongoose, { Schema, Document } from 'mongoose'

// Employee Interface matching the existing structure
export interface IEmployee extends Document {
  _id: string
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
  _id: false // Disable auto-generated _id since we provide our own
})

// Create indexes for better performance
EmployeeSchema.index({ department: 1 })
EmployeeSchema.index({ name: 1 })

export const Employee = mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema)
