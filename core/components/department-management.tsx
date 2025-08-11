"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, Plus, Edit, Trash2, Users, UserCheck } from "lucide-react"
import type { Department, Employee, User } from "@/app/page"

interface DepartmentManagementProps {
  departments: Department[]
  employees: Employee[]
  users: User[]
  currentUser: User
  onClose: () => void
  onDepartmentAdd: (department: Department) => void
  onDepartmentUpdate: (department: Department) => void
  onDepartmentDelete: (departmentId: string) => void
}

export function DepartmentManagement({
  departments,
  employees,
  users,
  currentUser,
  onClose,
  onDepartmentAdd,
  onDepartmentUpdate,
  onDepartmentDelete,
}: DepartmentManagementProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [departmentName, setDepartmentName] = useState("")

  const resetForm = () => {
    setDepartmentName("")
    setEditingDepartment(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!departmentName.trim()) {
      alert("Vui lòng nhập tên phòng ban")
      return
    }

    // Check duplicate name
    if (!editingDepartment && departments.some((dept) => dept.name === departmentName.trim())) {
      alert("Tên phòng ban đã tồn tại")
      return
    }

    if (editingDepartment) {
      const updatedDepartment: Department = {
        ...editingDepartment,
        name: departmentName.trim(),
      }
      onDepartmentUpdate(updatedDepartment)
    } else {
      const newDepartment: Department = {
        id: `dept-${Date.now()}`,
        name: departmentName.trim(),
        createdAt: new Date().toISOString(),
        createdBy: currentUser.username,
      }
      onDepartmentAdd(newDepartment)
    }

    resetForm()
    setShowAddDialog(false)
  }

  const handleEdit = (department: Department) => {
    setDepartmentName(department.name)
    setEditingDepartment(department)
    setShowAddDialog(true)
  }

  const handleDelete = (departmentId: string) => {
    const department = departments.find((d) => d.id === departmentId)
    if (!department) return

    const employeeCount = employees.filter((emp) => emp.department === department.name).length
    const userCount = users.filter((user) => user.department === department.name).length

    if (employeeCount > 0 || userCount > 0) {
      if (
        !confirm(
          `Phòng ban "${department.name}" có ${employeeCount} nhân viên và ${userCount} tài khoản.\n\nXóa phòng ban sẽ xóa tất cả nhân viên và tài khoản thuộc phòng này.\n\nBạn có chắc chắn muốn tiếp tục?`,
        )
      ) {
        return
      }
    } else {
      if (!confirm(`Bạn có chắc chắn muốn xóa phòng ban "${department.name}"?`)) {
        return
      }
    }

    onDepartmentDelete(departmentId)
  }

  const getDepartmentStats = (departmentName: string) => {
    const employeeCount = employees.filter((emp) => emp.department === departmentName).length
    const userCount = users.filter((user) => user.department === departmentName).length
    return { employeeCount, userCount }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Quản lý phòng ban ({departments.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Danh sách phòng ban</h3>
            <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Thêm phòng ban
            </Button>
          </div>

          <div className="grid gap-4 max-h-96 overflow-y-auto">
            {departments.map((department) => {
              const stats = getDepartmentStats(department.name)

              return (
                <Card key={department.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{department.name}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{stats.employeeCount} nhân viên</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <UserCheck className="w-4 h-4" />
                              <span>{stats.userCount} tài khoản</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Tạo bởi: {department.createdBy} •{" "}
                            {new Date(department.createdAt).toLocaleDateString("vi-VN")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(department)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(department.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Add/Edit Department Dialog */}
        {showAddDialog && (
          <Dialog open={true} onOpenChange={() => setShowAddDialog(false)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingDepartment ? "Sửa tên phòng ban" : "Thêm phòng ban mới"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên phòng ban</label>
                  <Input
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    placeholder="Ví dụ: Phòng Marketing"
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Hủy
                  </Button>
                  <Button type="submit">{editingDepartment ? "Cập nhật" : "Thêm"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}
