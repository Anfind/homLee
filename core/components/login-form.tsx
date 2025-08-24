"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Lock, Shield, Building2, Info, User } from "lucide-react"

export interface UserType {
  username: string
  password?: string // For display only, not used in API
  role: "admin" | "truongphong" | "department_manager"
  department?: string
  name: string
  lastLogin?: Date
}

interface LoginFormProps {
  onLogin: (user: UserType) => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<UserType[]>([])

  // Fetch users from MongoDB API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users')
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            // Add demo passwords for display (these are not used for actual auth)
            const usersWithDemoPasswords = result.data.map((user: any) => ({
              ...user,
              password: user.username === 'admin' ? 'admin123' : `${user.username}123`
            }))
            setUsers(usersWithDemoPasswords)
          }
        }
      } catch (error) {
        console.error('Failed to fetch users:', error)
      }
    }
    
    fetchUsers()
  }, [])

  const handleAccountSelect = (accountUsername: string) => {
    const account = users.find((acc) => acc.username === accountUsername)
    if (account) {
      setUsername(account.username)
      setPassword(account.password || '')
      setSelectedAccount(accountUsername)
      setError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!username.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ thông tin")
      setIsLoading(false)
      return
    }

    try {
      // Call MongoDB authentication API
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Login successful
        onLogin(result.data)
      } else {
        setError(result.error || "Tên đăng nhập hoặc mật khẩu không đúng")
      }
    } catch (error) {
      console.error('Login error:', error)
      setError("Lỗi kết nối. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    if (role === "admin") return <Shield className="w-4 h-4 text-red-500" />
    if (role === "department_manager") return <User className="w-4 h-4 text-green-500" />
    return <User className="w-4 h-4 text-blue-500" />
  }

  const getRoleColor = (role: string) => {
    if (role === "admin") return "bg-red-50 border-red-200"
    if (role === "department_manager") return "bg-green-50 border-green-200"
    return "bg-blue-50 border-blue-200"
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case "admin": return "Quản trị viên"
      case "truongphong": return "Trưởng phòng"
      case "department_manager": return "Quản lý phòng ban"
      default: return "Nhân viên"
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4" suppressHydrationWarning>
      <div className="w-full max-w-lg" suppressHydrationWarning>
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-4">
            <div className="w-24 h-24 mx-auto mb-4 relative">
              <Image
                src="/logo_leeHomes.webp"
                alt="Lee Homes Logo"
                width={96}
                height={96}
                className="object-contain rounded-xl"
              />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">Hệ thống điểm danh Lee Homes</CardTitle>
            <CardDescription className="text-gray-600 text-base">
              Đăng nhập để quản lý chấm công nhân viên
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quick Access Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-900">Truy cập nhanh</h3>
              </div>
              <p className="text-xs text-blue-700 mb-3">
                Click vào tài khoản bên dưới để đăng nhập nhanh hoặc nhập thủ công
              </p>
            </div>

            {/* Demo Accounts */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4" />
                Tài khoản có sẵn ({users.length})
              </h3>
              <div className="grid gap-2 max-h-64 overflow-y-auto">
                {users.map((account) => (
                  <button
                    key={account.username}
                    onClick={() => handleAccountSelect(account.username)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                      selectedAccount === account.username
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : `${getRoleColor(account.role)} hover:shadow-md hover:scale-[1.02]`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            account.role === "admin" ? "bg-red-100" : 
                            account.role === "department_manager" ? "bg-green-100" : "bg-blue-100"
                          }`}
                        >
                          <span
                            className={`font-semibold ${
                              account.role === "admin" ? "text-red-600" : 
                              account.role === "department_manager" ? "text-green-600" : "text-blue-600"
                            }`}
                          >
                            {account.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {account.name}
                            {getRoleIcon(account.role)}
                          </div>
                          <div className="text-xs text-gray-600 flex items-center gap-2">
                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{account.username}</span>
                            <span>•</span>
                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{account.password}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <span className="font-medium">{getRoleName(account.role)}</span>
                            {account.department && (
                              <>
                                <span>•</span>
                                <Building2 className="w-3 h-3" />
                                <span>{account.department}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {selectedAccount === account.username && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Login Form */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Hoặc đăng nhập thủ công</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Tên đăng nhập
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Nhập tên đăng nhập"
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu"
                      className="pl-10 pr-12 h-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg font-medium disabled:opacity-50"
                >
                  {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
              </form>
            </div>

            <div className="text-center text-xs text-gray-500 border-t pt-4">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Kết nối với MongoDB - Dữ liệu được lưu an toàn
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
