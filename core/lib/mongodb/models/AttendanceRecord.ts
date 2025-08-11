import mongoose, { Schema, Document } from 'mongoose'

// AttendanceRecord Interface
export interface IAttendanceRecord extends Document {
  employeeId: string
  date: string // YYYY-MM-DD format
  morningCheckIn?: string // HH:MM format
  afternoonCheckIn?: string // HH:MM format  
  points: number
  shifts?: Array<{
    id: string
    name: string
    startTime: string
    endTime: string
    points: number
    checkedIn?: boolean
  }>
  createdAt: Date
  updatedAt: Date
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>({
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
  morningCheckIn: {
    type: String,
    match: /^\d{2}:\d{2}$/, // HH:MM format validation
    default: undefined
  },
  afternoonCheckIn: {
    type: String,
    match: /^\d{2}:\d{2}$/, // HH:MM format validation
    default: undefined
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  shifts: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    points: { type: Number, required: true },
    checkedIn: { type: Boolean, default: false }
  }]
}, {
  timestamps: true
})

// Create compound indexes for better query performance
AttendanceRecordSchema.index({ employeeId: 1, date: 1 }, { unique: true })
AttendanceRecordSchema.index({ date: 1 })
AttendanceRecordSchema.index({ employeeId: 1 })

export const AttendanceRecord = mongoose.models.AttendanceRecord || mongoose.model<IAttendanceRecord>('AttendanceRecord', AttendanceRecordSchema)
