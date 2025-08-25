"use client"

import { Clock, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface ShiftInfoPanelProps {
  className?: string
}

export function ShiftInfoPanel({ className = "" }: ShiftInfoPanelProps) {
  // Get current day shift info
  const getCurrentShiftInfo = () => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    if (dayOfWeek === 0) { // Sunday
      return {
        morning: "07:00-08:45",
        afternoon: "13:30-14:45", 
        dayName: "Chủ nhật",
        isSpecial: true
      }
    } else { // Monday to Saturday
      return {
        morning: "07:00-07:45",
        afternoon: "13:30-14:00",
        dayName: ["", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][dayOfWeek],
        isSpecial: false
      }
    }
  }

  const shiftInfo = getCurrentShiftInfo()

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            shiftInfo.isSpecial ? 'bg-purple-100' : 'bg-blue-100'
          }`}>
            <Clock className={`w-4 h-4 ${
              shiftInfo.isSpecial ? 'text-purple-600' : 'text-blue-600'
            }`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Khung giờ chấm công</h3>
            <p className="text-sm text-gray-600">{shiftInfo.dayName} hôm nay</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
            <div>
              <div className="font-medium text-green-800">Ca sáng</div>
              <div className="text-sm text-green-600">Thời gian có điểm</div>
            </div>
            <div className="font-bold text-green-700 text-lg">
              {shiftInfo.morning}
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
            <div>
              <div className="font-medium text-orange-800">Ca chiều</div>
              <div className="text-sm text-orange-600">Thời gian có điểm</div>
            </div>
            <div className="font-bold text-orange-700 text-lg">
              {shiftInfo.afternoon}
            </div>
          </div>
        </div>

        {shiftInfo.isSpecial && (
          <div className="mt-3 p-2 bg-purple-50 rounded-lg flex items-start gap-2">
            <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-purple-700">
              <strong>Chủ nhật</strong> có khung giờ mở rộng hơn các ngày thường
            </p>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            <strong>Lưu ý:</strong> Chỉ chấm công trong khung giờ trên mới được tính điểm
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
