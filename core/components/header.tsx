"use client"

import { Button } from "@/components/ui/button"
import { LogOut, UserIcon, Calendar, Building2 } from "lucide-react"
import type { User } from "@/app/page"

interface HeaderProps {
  user: User
  onLogout: () => void
}

export function Header({ user, onLogout }: HeaderProps) {
  const getRoleName = (role: string) => {
    return role === "admin" ? "Quản trị viên" : "Trưởng phòng"
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Hệ thống điểm Lee Homes</h1>
                <p className="text-sm text-gray-500">Quản lý điểm danh nhân viên</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
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
