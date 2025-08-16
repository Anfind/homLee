import mongoose, { Schema, Document } from 'mongoose'

// BonusPoint Interface for tracking point adjustments
export interface IBonusPoint extends Document {
  employeeId: string
  date: string // YYYY-MM-DD format
  points: number // Can be positive or negative
  editedBy: string
  editedAt: Date
  previousValue: number
  reason?: string
  createdAt: Date
  updatedAt: Date
}

const BonusPointSchema = new Schema<IBonusPoint>({
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
  points: {
    type: Number,
    required: true
    // Can be negative for penalties
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
    type: Number,
    required: true,
    default: 0
  },
  reason: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
})

// Create indexes for efficient queries
BonusPointSchema.index({ employeeId: 1, date: 1 })
BonusPointSchema.index({ date: 1 })
BonusPointSchema.index({ editedBy: 1 })
BonusPointSchema.index({ editedAt: -1 })

export const BonusPoint = mongoose.models.BonusPoint || mongoose.model<IBonusPoint>('BonusPoint', BonusPointSchema)
