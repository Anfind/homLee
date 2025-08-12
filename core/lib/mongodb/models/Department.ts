import mongoose, { Schema, Document } from 'mongoose'

// Department Interface
export interface IDepartment extends Document {
  _id: string
  name: string
  createdAt: Date
  createdBy: string
  updatedAt: Date
  isActive: boolean
}

const DepartmentSchema = new Schema<IDepartment>({
  _id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  createdBy: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  _id: false // Disable auto-generated _id since we provide our own
})

// Create indexes  
// Note: name field already has unique: true in schema, no need for separate index
DepartmentSchema.index({ isActive: 1 })

export const Department = mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema)
