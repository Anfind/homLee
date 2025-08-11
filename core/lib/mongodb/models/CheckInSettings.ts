import mongoose, { Schema, Document } from 'mongoose'

// Shift Interface
export interface IShift {
  id: string
  name: string
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  points: number
}

// CheckInSettings Interface - stores shift configurations per day of week
export interface ICheckInSettings extends Document {
  dayOfWeek: number // 0=Sunday, 1=Monday, ..., 6=Saturday
  shifts: IShift[]
  isActive: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

const ShiftSchema = new Schema<IShift>({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  startTime: {
    type: String,
    required: true,
    match: /^\d{2}:\d{2}$/ // HH:MM format validation
  },
  endTime: {
    type: String,
    required: true,
    match: /^\d{2}:\d{2}$/ // HH:MM format validation
  },
  points: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false })

const CheckInSettingsSchema = new Schema<ICheckInSettings>({
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6,
    unique: true
  },
  shifts: [ShiftSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
})

// Create indexes
CheckInSettingsSchema.index({ dayOfWeek: 1 }, { unique: true })
CheckInSettingsSchema.index({ isActive: 1 })

export const CheckInSettings = mongoose.models.CheckInSettings || mongoose.model<ICheckInSettings>('CheckInSettings', CheckInSettingsSchema)
