"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Lock, Shield, Building2, Info, User } from "lucide-react"
import type { User as UserType } from "@/app/page"

interface LoginFormProps {
  onLogin: (user: UserType) => void
  users: UserType[]
}

export function LoginForm({ onLogin, users }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState("")
  const [error, setError] = useState("")

  const handleAccountSelect = (accountUsername: string) => {
    const account = users.find((acc) => acc.username === accountUsername)
    if (account) {
      setUsername(account.username)
      setPassword(account.password)
      setSelectedAccount(accountUsername)
      setError("")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!username.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ thông tin")
      return
    }

    const account = users.find((acc) => acc.username === username && acc.password === password)

    if (!account) {
      setError("Tên đăng nhập hoặc mật khẩu không đúng")
      return
    }

    onLogin(account)
  }

  const getRoleIcon = (role: string) => {
    return role === "admin" ? <Shield className="w-4 h-4 text-red-500" /> : <User className="w-4 h-4 text-blue-500" />
  }

  const getRoleColor = (role: string) => {
    return role === "admin" ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
  }

  const getRoleName = (role: string) => {
    return role === "admin" ? "Quản trị viên" : "Trưởng phòng"
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="w-full max-w-lg">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-4">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">Hệ thống chấm công</CardTitle>
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
                            account.role === "admin" ? "bg-red-100" : "bg-blue-100"
                          }`}
                        >
                          <span
                            className={`font-semibold ${account.role === "admin" ? "text-red-600" : "text-blue-600"}`}
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
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg font-medium"
                >
                  Đăng nhập
                </Button>
              </form>
            </div>

            <div className="text-center text-xs text-gray-500 border-t pt-4">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Phiên bản demo - Dữ liệu lưu trên trình duyệt
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
