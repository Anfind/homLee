"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { LogOut, UserIcon, Building2, Clock } from "lucide-react"
import { useMemo } from "react"
import type { UserType } from "@/components/login-form"
import type { CheckInSettings } from "@/app/page"
import { AutoSyncControl } from "@/components/auto-sync-control"

interface HeaderProps {
  user: UserType
  onLogout: () => void
  checkInSettings: CheckInSettings
}

export function Header({ user, onLogout, checkInSettings }: HeaderProps) {
  const getRoleName = (role: string) => {
    switch (role) {
      case "admin": return "Quản trị viên"
      case "truongphong": return "Trưởng phòng"
      case "department_manager": return "Quản lý phòng ban"
      default: return "Nhân sự"
    }
  }

  // Get current day shift info from dynamic settings - memoized for performance
  const getCurrentShiftInfo = useMemo(() => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    const daySettings = checkInSettings[dayOfWeek]
    const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]
    
    // Find morning and afternoon shifts
    let morningShift = null
    let afternoonShift = null
    
    for (const shift of daySettings.shifts) {
      const startHour = parseInt(shift.startTime.split(':')[0])
      if (startHour < 12 && !morningShift) {
        morningShift = shift
      } else if (startHour >= 12 && !afternoonShift) {
        afternoonShift = shift
      }
    }
    
    const result = {
      morning: morningShift ? `${morningShift.startTime}-${morningShift.endTime}` : "Không có",
      afternoon: afternoonShift ? `${afternoonShift.startTime}-${afternoonShift.endTime}` : "Không có", 
      dayName: dayNames[dayOfWeek]
    }
    
    // Log only when settings actually change (not on every render)
    console.log(`🕒 Header updated shift info for ${result.dayName}: Morning ${result.morning}, Afternoon ${result.afternoon}`)
    
    return result
  }, [checkInSettings]) // Re-calculate when checkInSettings changes

  const shiftInfo = getCurrentShiftInfo

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 relative">
                <Image
                  src="/logo_leeHomes.webp"
                  alt="Lee Homes Logo"
                  width={48}
                  height={48}
                  className="object-contain rounded-lg"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Hệ thống điểm danh Lee Homes</h1>
                <p className="text-sm text-gray-500">Quản lý điểm danh nhân sự</p>
              </div>
            </div>
            
            {/* Current Shift Info */}
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
              <Clock className="w-4 h-4 text-blue-600" />
              <div className="text-sm">
                <div className="font-semibold text-blue-900">{shiftInfo.dayName}</div>
                <div className="text-blue-700">
                  Sáng: {shiftInfo.morning} • Chiều: {shiftInfo.afternoon}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Auto Sync Control - hiển thị cho admin */}
            {user.role === 'admin' && (
              <AutoSyncControl />
            )}
            
            <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm">
                <div className="font-semibold text-gray-900">{user.username}</div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span>{getRoleName(user.role)}</span>
                  {user.department && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span>{user.department}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 bg-transparent"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
