import mongoose, { Schema, Document } from 'mongoose'

// CustomDailyValue Interface for flexible custom columns
export interface ICustomDailyValue extends Document {
  employeeId: string
  date: string // YYYY-MM-DD format
  columnKey: string // 'commission', 'custom1', 'custom2', 'custom3', etc.
  value: string // Flexible string value for various data types
  editedBy: string
  editedAt: Date
  previousValue: string
  createdAt: Date
  updatedAt: Date
}

const CustomDailyValueSchema = new Schema<ICustomDailyValue>({
  employeeId: {
    type: String,
    required: true,
    ref: 'Employee'
  },
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/ // YYYY-MM-DD format validation
  },
  columnKey: {
    type: String,
    required: true,
    enum: ['commission', 'custom1', 'custom2', 'custom3', 'overtime', 'bonus', 'deduction']
  },
  value: {
    type: String,
    required: true,
    trim: true
  },
  editedBy: {
    type: String,
    required: true
  },
  editedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  previousValue: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
})

// Create compound index for uniqueness and performance
CustomDailyValueSchema.index({ employeeId: 1, date: 1, columnKey: 1 }, { unique: true })
CustomDailyValueSchema.index({ date: 1 })
CustomDailyValueSchema.index({ columnKey: 1 })
CustomDailyValueSchema.index({ editedBy: 1 })

export const CustomDailyValue = mongoose.models.CustomDailyValue || mongoose.model<ICustomDailyValue>('CustomDailyValue', CustomDailyValueSchema)
