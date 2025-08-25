"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { CheckInSettings, Shift } from "@/app/page" // Import Shift interface

interface CheckInSettingsManagementProps {
  currentSettings: CheckInSettings
  onSave: (newSettings: CheckInSettings) => void
  onClose: () => void
}

export function CheckInSettingsManagement({ currentSettings, onSave, onClose }: CheckInSettingsManagementProps) {
  const [settings, setSettings] = useState<CheckInSettings>(currentSettings)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    setSettings(currentSettings)
  }, [currentSettings])

  const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]

  const handleShiftChange = (dayIndex: number, shiftId: string, field: keyof Shift, value: string | number) => {
    setSettings((prevSettings) => {
      const newSettings = { ...prevSettings }
      if (!newSettings[dayIndex]) {
        newSettings[dayIndex] = { shifts: [] }
      }
      const updatedShifts = newSettings[dayIndex].shifts.map((shift) =>
        shift.id === shiftId ? { ...shift, [field]: value } : shift,
      )
      newSettings[dayIndex].shifts = updatedShifts
      return newSettings
    })
  }

  const handleAddShift = (dayIndex: number) => {
    setSettings((prevSettings) => {
      const newSettings = { ...prevSettings }
      if (!newSettings[dayIndex]) {
        newSettings[dayIndex] = { shifts: [] }
      }
      const newShift: Shift = {
        id: `shift-${Date.now()}`, // Unique ID
        name: `Ca mới ${newSettings[dayIndex].shifts.length + 1}`,
        startTime: "08:00",
        endTime: "17:00",
        points: 1,
      }
      newSettings[dayIndex].shifts = [...newSettings[dayIndex].shifts, newShift]
      return newSettings
    })
  }

  const handleRemoveShift = (dayIndex: number, shiftId: string) => {
    setSettings((prevSettings) => {
      const newSettings = { ...prevSettings }
      if (newSettings[dayIndex]) {
        newSettings[dayIndex].shifts = newSettings[dayIndex].shifts.filter((shift) => shift.id !== shiftId)
      }
      return newSettings
    })
  }

  const validateTime = (time: string): boolean => {
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/
    return regex.test(time)
  }

  const handleSubmit = () => {
    const newErrors: { [key: string]: string } = {}
    let hasError = false

    Object.keys(settings).forEach((dayIndexStr) => {
      const dayIndex = Number.parseInt(dayIndexStr)
      settings[dayIndex].shifts.forEach((shift, shiftIdx) => {
        if (!shift.name.trim()) {
          newErrors[`day-${dayIndex}-shift-${shiftIdx}-name`] = "Tên ca không được để trống."
          hasError = true
        }
        if (!validateTime(shift.startTime)) {
          newErrors[`day-${dayIndex}-shift-${shiftIdx}-startTime`] = "Giờ bắt đầu không hợp lệ (HH:MM)."
          hasError = true
        }
        if (!validateTime(shift.endTime)) {
          newErrors[`day-${dayIndex}-shift-${shiftIdx}-endTime`] = "Giờ kết thúc không hợp lệ (HH:MM)."
          hasError = true
        }
        if (isNaN(shift.points) || shift.points < 0) {
          newErrors[`day-${dayIndex}-shift-${shiftIdx}-points`] = "Điểm phải là số không âm."
          hasError = true
        }

        // Basic time order validation (HH:MM comparison)
        if (validateTime(shift.startTime) && validateTime(shift.endTime)) {
          const [startHour, startMinute] = shift.startTime.split(":").map(Number)
          const [endHour, endMinute] = shift.endTime.split(":").map(Number)

          if (startHour * 60 + startMinute >= endHour * 60 + endMinute) {
            newErrors[`day-${dayIndex}-shift-${shiftIdx}-timeOrder`] = "Giờ kết thúc phải sau giờ bắt đầu."
            hasError = true
          }
        }
      })
    })

    setErrors(newErrors)

    if (!hasError) {
      onSave(settings)
      onClose()
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cấu hình giờ chấm công và ca làm việc</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <p className="text-sm text-gray-600">
            Tại đây bạn có thể định nghĩa các ca làm việc (giờ bắt đầu, giờ kết thúc và điểm) cho từng ngày trong tuần.
            Hệ thống sẽ dựa vào các ca này để tính điểm chấm công.
          </p>
          {dayNames.map((dayName, dayIndex) => (
            <div key={dayIndex} className="border rounded-md p-4 bg-gray-50">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">{dayName}</h3>
              <div className="grid gap-4">
                {settings[dayIndex]?.shifts.length === 0 && (
                  <p className="text-sm text-gray-500 italic">Chưa có ca làm việc nào được cấu hình cho ngày này.</p>
                )}
                {settings[dayIndex]?.shifts.map((shift, shiftIdx) => (
                  <div
                    key={shift.id}
                    className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end border-b pb-3 mb-3 last:border-b-0 last:pb-0 last:mb-0"
                  >
                    <div className="col-span-2">
                      <Label htmlFor={`shift-name-${dayIndex}-${shiftIdx}`}>Tên ca</Label>
                      <Input
                        id={`shift-name-${dayIndex}-${shiftIdx}`}
                        value={shift.name}
                        onChange={(e) => handleShiftChange(dayIndex, shift.id, "name", e.target.value)}
                        className={errors[`day-${dayIndex}-shift-${shiftIdx}-name`] ? "border-red-500" : ""}
                      />
                      {errors[`day-${dayIndex}-shift-${shiftIdx}-name`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`day-${dayIndex}-shift-${shiftIdx}-name`]}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`start-time-${dayIndex}-${shiftIdx}`}>Giờ bắt đầu</Label>
                      <Input
                        id={`start-time-${dayIndex}-${shiftIdx}`}
                        type="time"
                        value={shift.startTime}
                        onChange={(e) => handleShiftChange(dayIndex, shift.id, "startTime", e.target.value)}
                        className={errors[`day-${dayIndex}-shift-${shiftIdx}-startTime`] ? "border-red-500" : ""}
                      />
                      {errors[`day-${dayIndex}-shift-${shiftIdx}-startTime`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`day-${dayIndex}-shift-${shiftIdx}-startTime`]}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`end-time-${dayIndex}-${shiftIdx}`}>Giờ kết thúc</Label>
                      <Input
                        id={`end-time-${dayIndex}-${shiftIdx}`}
                        type="time"
                        value={shift.endTime}
                        onChange={(e) => handleShiftChange(dayIndex, shift.id, "endTime", e.target.value)}
                        className={errors[`day-${dayIndex}-shift-${shiftIdx}-endTime`] ? "border-red-500" : ""}
                      />
                      {errors[`day-${dayIndex}-shift-${shiftIdx}-endTime`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`day-${dayIndex}-shift-${shiftIdx}-endTime`]}
                        </p>
                      )}
                      {errors[`day-${dayIndex}-shift-${shiftIdx}-timeOrder`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`day-${dayIndex}-shift-${shiftIdx}-timeOrder`]}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`points-${dayIndex}-${shiftIdx}`}>Điểm</Label>
                      <Input
                        id={`points-${dayIndex}-${shiftIdx}`}
                        type="number"
                        value={isNaN(shift.points) ? "" : shift.points}
                        onChange={(e) => {
                          const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                          handleShiftChange(dayIndex, shift.id, "points", isNaN(value) ? 0 : value)
                        }}
                        className={errors[`day-${dayIndex}-shift-${shiftIdx}-points`] ? "border-red-500" : ""}
                      />
                      {errors[`day-${dayIndex}-shift-${shiftIdx}-points`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`day-${dayIndex}-shift-${shiftIdx}-points`]}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveShift(dayIndex, shift.id)}
                      className="col-span-1"
                    >
                      Xóa ca
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={() => handleAddShift(dayIndex)}>
                  Thêm ca làm việc
                </Button>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSubmit}>Lưu cấu hình</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
