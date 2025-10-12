import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UserPlus, 
  Users, 
  Edit, 
  Trash2, 
  Key, 
  Loader, 
  AlertCircle, 
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react'

const TeacherManagement = () => {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    department: ''
  })

  const queryClient = useQueryClient()

  // Fetch teachers
  const { data: teachersData, isLoading, error } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/coordinator/teachers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch teachers')
      }
      
      return response.json()
    }
  })

  // Create teacher mutation
  const createTeacherMutation = useMutation({
    mutationFn: async (teacherData) => {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/coordinator/create-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(teacherData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create teacher')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['teachers'])
      setShowCreateForm(false)
      setFormData({
        username: '',
        firstName: '',
        lastName: '',
        department: ''
      })
    }
  })

  // Update teacher mutation
  const updateTeacherMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/coordinator/teachers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update teacher')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['teachers'])
      setEditingTeacher(null)
    }
  })

  // Delete teacher mutation
  const deleteTeacherMutation = useMutation({
    mutationFn: async (teacherId) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/coordinator/teachers/${teacherId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete teacher')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['teachers'])
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (editingTeacher) {
      updateTeacherMutation.mutate({
        id: editingTeacher.id,
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          department: formData.department
        }
      })
    } else {
      createTeacherMutation.mutate(formData)
    }
  }

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher)
    setFormData({
      username: teacher.username,
      password: '',
      firstName: teacher.firstName || '',
      lastName: teacher.lastName || '',
      department: teacher.department || ''
    })
    setShowCreateForm(true)
  }

  const handleDelete = (teacherId) => {
    if (window.confirm('Are you sure you want to deactivate this teacher?')) {
      deleteTeacherMutation.mutate(teacherId)
    }
  }

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      department: ''
    })
    setEditingTeacher(null)
    setShowCreateForm(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
          <span className="text-red-700">Error loading teachers: {error.message}</span>
        </div>
      </div>
    )
  }

  const teachers = teachersData?.teachers || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Teacher Management</h2>
          <p className="text-gray-600">Create and manage teacher accounts</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary flex items-center"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Teacher
        </button>
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingTeacher ? 'Edit Teacher' : 'Create New Teacher'}
            </h3>

            {(createTeacherMutation.error || updateTeacherMutation.error) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                  <span className="text-red-700">
                    {createTeacherMutation.error?.message || updateTeacherMutation.error?.message}
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="input"
                    placeholder="teacher001"
                    required
                    disabled={editingTeacher || createTeacherMutation.isPending || updateTeacherMutation.isPending}
                  />
                </div>

                {!editingTeacher && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="input pr-10"
                        placeholder="Enter password"
                        required
                        disabled={createTeacherMutation.isPending}
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="input"
                    placeholder="John"
                    disabled={createTeacherMutation.isPending || updateTeacherMutation.isPending}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="input"
                    placeholder="Doe"
                    disabled={createTeacherMutation.isPending || updateTeacherMutation.isPending}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="input"
                    placeholder="CSE"
                    disabled={createTeacherMutation.isPending || updateTeacherMutation.isPending}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                  disabled={createTeacherMutation.isPending || updateTeacherMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex items-center"
                  disabled={createTeacherMutation.isPending || updateTeacherMutation.isPending}
                >
                  {(createTeacherMutation.isPending || updateTeacherMutation.isPending) ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      {editingTeacher ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {editingTeacher ? 'Update Teacher' : 'Create Teacher'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Teachers List */}
      <div className="card">
        <div className="flex items-center mb-4">
          <Users className="w-5 h-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Teachers ({teachers.length})
          </h3>
        </div>

        {teachers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No teachers yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first teacher account to get started
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Teacher
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {teacher.firstName && teacher.lastName
                            ? `${teacher.firstName} ${teacher.lastName}`
                            : teacher.username
                          }
                        </div>
                        <div className="text-sm text-gray-500">Teacher</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {teacher.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {teacher.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(teacher.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(teacher)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit teacher"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(teacher.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Deactivate teacher"
                          disabled={deleteTeacherMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeacherManagement