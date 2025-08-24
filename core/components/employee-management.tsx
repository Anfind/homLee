"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Users, Key, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import type { Employee, Department } from "@/app/page"
import type { UserType as User } from "./login-form"

interface EmployeeManagementProps {
  employees: Employee[]
  users: User[]
  departments: Department[]
  currentUser: User
  onClose: () => void
  onEmployeeAdd: (employee: Employee) => void
  onEmployeeUpdate: (employee: Employee) => void
  onEmployeeDelete: (employeeId: string) => void
  onUserAdd: (user: User) => void
  onUserUpdate: (user: User) => void
  onUserDelete: (username: string) => void
}

export function EmployeeManagement({
  employees,
  users,
  departments,
  currentUser,
  onClose,
  onEmployeeAdd,
  onEmployeeUpdate,
  onEmployeeDelete,
  onUserAdd,
  onUserUpdate,
  onUserDelete,
}: EmployeeManagementProps) {
  const [activeTab, setActiveTab] = useState("employees")
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Employee form state
  const [employeeForm, setEmployeeForm] = useState({
    id: "",
    name: "",
    title: "Nhân viên",
    department: "",
  })

  // User form state
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    name: "",
    role: "truongphong" as "admin" | "truongphong" | "department_manager",
    department: "",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const departmentNames = departments.map((d) => d.name)

  // Memoize filtered data for better performance
  const filteredEmployees = useMemo(() => {
    let filtered = currentUser.role === "admin" 
      ? employees 
      : employees.filter((emp) => emp.department === currentUser.department)
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(term) ||
        emp.id.toLowerCase().includes(term) ||
        emp.department.toLowerCase().includes(term) ||
        emp.title.toLowerCase().includes(term)
      )
    }
    
    return filtered
  }, [employees, currentUser.role, currentUser.department, searchTerm])

  const filteredUsers =
    currentUser.role === "admin"
      ? users
      : users.filter((user) => user.department === currentUser.department || user.role === "admin")

  const resetEmployeeForm = () => {
    setEmployeeForm({
      id: "",
      name: "",
      title: "Nhân viên",
      department: currentUser.role === "truongphong" ? currentUser.department || "" : "",
    })
    setEditingEmployee(null)
    setIsSubmitting(false)
  }

  const resetUserForm = () => {
    setUserForm({
      username: "",
      password: "",
      name: "",
      role: "truongphong",
      department: currentUser.role === "truongphong" ? currentUser.department || "" : "",
    })
    setEditingUser(null)
    setShowPassword(false)
  }

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!employeeForm.id || !employeeForm.name || !employeeForm.department) {
      alert("Vui lòng điền đầy đủ thông tin")
      return
    }

    // For truongphong, only allow adding to their department
    if (currentUser.role === "truongphong" && employeeForm.department !== currentUser.department) {
      alert("Bạn chỉ có thể thêm nhân viên vào phòng ban của mình")
      return
    }

    // Check duplicate ID
    if (!editingEmployee && employees.some((emp) => emp.id === employeeForm.id)) {
      alert("ID nhân viên đã tồn tại")
      return
    }

    const employee: Employee = {
      id: employeeForm.id,
      name: employeeForm.name,
      title: employeeForm.title,
      department: employeeForm.department,
    }

    setIsSubmitting(true)
    try {
      if (editingEmployee) {
        await onEmployeeUpdate(employee)
      } else {
        await onEmployeeAdd(employee)
      }

      resetEmployeeForm()
      setShowAddEmployee(false)
    } catch (error) {
      console.error('Error submitting employee:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userForm.username || !userForm.password || !userForm.name) {
      alert("Vui lòng điền đầy đủ thông tin")
      return
    }

    if ((userForm.role === "truongphong" || userForm.role === "department_manager") && !userForm.department) {
      alert("Vui lòng chọn phòng ban cho trưởng phòng/quản lý phòng ban")
      return
    }

    // For truongphong, only allow creating accounts for their department
    if (currentUser.role === "truongphong" && userForm.department !== currentUser.department) {
      alert("Bạn chỉ có thể tạo tài khoản cho phòng ban của mình")
      return
    }

    // Check duplicate username (client-side check)
    if (!editingUser && users.some((user) => user.username === userForm.username.toLowerCase().trim())) {
      alert("Tên đăng nhập đã tồn tại")
      return
    }

    const user: User = {
      username: userForm.username.toLowerCase().trim(),
      password: userForm.password,
      name: userForm.name.trim(),
      role: userForm.role,
      department: (userForm.role === "truongphong" || userForm.role === "department_manager") ? userForm.department : undefined,
    }

    setIsSubmitting(true)
    try {
      if (editingUser) {
        await onUserUpdate(user)
      } else {
        await onUserAdd(user)
      }

      resetUserForm()
      setShowAddUser(false)
    } catch (error) {
      console.error('Error submitting user:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditEmployee = (employee: Employee) => {
    setEmployeeForm(employee)
    setEditingEmployee(employee)
    setShowAddEmployee(true)
  }

  const handleEditUser = (user: User) => {
    setUserForm({
      username: user.username,
      password: user.password || "",
      name: user.name,
      role: user.role,
      department: user.department || "",
    })
    setEditingUser(user)
    setShowAddUser(true)
  }

  const handleDeleteEmployee = (employeeId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa nhân viên này? Tất cả dữ liệu chấm công sẽ bị xóa.")) {
      onEmployeeDelete(employeeId)
    }
  }

  const handleDeleteUser = (username: string) => {
    if (username === "admin") {
      alert("Không thể xóa tài khoản admin")
      return
    }
    if (confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) {
      onUserDelete(username)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Quản lý nhân sự
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="employees">Nhân viên ({filteredEmployees.length})</TabsTrigger>
            <TabsTrigger value="users">Tài khoản ({filteredUsers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-4">
            <div className="flex justify-between items-center gap-4">
              <h3 className="text-lg font-semibold">Danh sách nhân viên</h3>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Tìm kiếm nhân viên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Button onClick={() => setShowAddEmployee(true)} className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Thêm nhân viên
                </Button>
              </div>
            </div>

            <div className="grid gap-4 max-h-96 overflow-y-auto">
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? "Không tìm thấy nhân viên nào" : "Chưa có nhân viên nào"}
                </div>
              ) : (
                filteredEmployees.map((employee) => (
                  <Card key={employee.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">{employee.name.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="font-medium">
                              {employee.name} <span className="text-gray-500">({employee.id})</span>
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                              <Badge variant="outline">{employee.title}</Badge>
                              <span>{employee.department}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditEmployee(employee)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Danh sách tài khoản</h3>
              <Button onClick={() => setShowAddUser(true)} className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Tạo tài khoản
              </Button>
            </div>

            <div className="grid gap-4 max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => (
                <Card key={user.username}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-semibold">{user.name.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.name} <span className="text-gray-500">(@{user.username})</span>
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                              {user.role === "admin" ? "Quản trị viên" : 
                               user.role === "department_manager" ? "Quản lý phòng ban" : "Trưởng phòng"}
                            </Badge>
                            {user.department && <span>{user.department}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        {user.username !== "admin" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.username)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Employee Dialog */}
        {showAddEmployee && (
          <Dialog open={true} onOpenChange={() => setShowAddEmployee(false)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingEmployee ? "Sửa thông tin nhân viên" : "Thêm nhân viên mới"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID nhân viên</label>
                  <Input
                    value={employeeForm.id}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, id: e.target.value.trim().toUpperCase() })}
                    placeholder="Ví dụ: 00123"
                    disabled={!!editingEmployee || isSubmitting}
                    required
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                  <Input
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                    placeholder="Nhập họ và tên"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tước vị</label>
                  <Select
                    value={employeeForm.title}
                    onValueChange={(value) => setEmployeeForm({ ...employeeForm, title: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nhân viên">Nhân viên</SelectItem>
                      <SelectItem value="Trưởng phòng">Trưởng phòng</SelectItem>
                      <SelectItem value="Phó phòng">Phó phòng</SelectItem>
                      <SelectItem value="Chuyên viên">Chuyên viên</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban</label>
                  <Select
                    value={employeeForm.department}
                    onValueChange={(value) => setEmployeeForm({ ...employeeForm, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phòng ban" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentNames.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowAddEmployee(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Đang xử lý..." : (editingEmployee ? "Cập nhật" : "Thêm")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Add/Edit User Dialog */}
        {showAddUser && (
          <Dialog open={true} onOpenChange={() => setShowAddUser(false)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? "Sửa thông tin tài khoản" : "Tạo tài khoản mới"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                  <Input
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    placeholder="Nhập tên đăng nhập"
                    disabled={!!editingUser}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      placeholder="Nhập mật khẩu"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                  <Input
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="Nhập họ và tên"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                  <Select
                    value={userForm.role}
                    onValueChange={(value: "admin" | "truongphong" | "department_manager") => setUserForm({ ...userForm, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Quản trị viên</SelectItem>
                      <SelectItem value="truongphong">Trưởng phòng</SelectItem>
                      <SelectItem value="department_manager">Quản lý phòng ban</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(userForm.role === "truongphong" || userForm.role === "department_manager") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban</label>
                    <Select
                      value={userForm.department}
                      onValueChange={(value) => setUserForm({ ...userForm, department: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn phòng ban" />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentNames.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowAddUser(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Đang xử lý..." : (editingUser ? "Cập nhật" : "Tạo")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}
