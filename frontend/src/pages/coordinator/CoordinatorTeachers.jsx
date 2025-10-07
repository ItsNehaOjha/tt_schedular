import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, RefreshCw, User, Loader } from 'lucide-react'
import { teacherAPI } from '../../utils/api'
import toast from 'react-hot-toast'

const CoordinatorTeachers = () => {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    department: '',
    password: 'teacher123'
  })

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    try {
      setLoading(true)
      const response = await teacherAPI.getAllTeachers()
      setTeachers(response.data.data || [])
    } catch (error) {
      console.error('Error fetching teachers:', error)
      toast.error('Failed to fetch teachers')
    } finally {
      setLoading(false)
    }
  }

  const handleReSyncTeachers = async () => {
    try {
      setSyncing(true)
      await teacherAPI.initializeCSE()
      toast.success('Teachers re-synced successfully!')
      await fetchTeachers()
    } catch (error) {
      console.error('Error re-syncing teachers:', error)
      toast.error('Failed to re-sync teachers')
    } finally {
      setSyncing(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingTeacher) {
        await teacherAPI.updateTeacher(editingTeacher.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          department: formData.department
        })
        toast.success('Teacher updated successfully!')
      } else {
        await teacherAPI.createTeacher(formData)
        toast.success('Teacher created successfully!')
      }
      setShowModal(false)
      setEditingTeacher(null)
      resetForm()
      await fetchTeachers()
    } catch (error) {
      console.error('Error saving teacher:', error)
      toast.error(error.response?.data?.message || 'Failed to save teacher')
    }
  }

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher)
    setFormData({
      username: teacher.username,
      firstName: teacher.firstName || '',
      lastName: teacher.lastName || '',
      department: teacher.department || '',
      password: 'teacher123'
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await teacherAPI.deleteTeacher(id)
        toast.success('Teacher deleted successfully!')
        await fetchTeachers()
      } catch (error) {
        console.error('Error deleting teacher:', error)
        toast.error('Failed to delete teacher')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      username: '',
      firstName: '',
      lastName: '',
      department: '',
      password: 'teacher123'
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Management</h1>
          <p className="text-gray-600">Manage teachers for your branch</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleReSyncTeachers}
            disabled={syncing}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {syncing ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>Re-sync Teachers</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Teacher</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {teacher.displayName || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {teacher.firstName && teacher.lastName ? `${teacher.firstName} ${teacher.lastName}` : 'No name set'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {teacher.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {teacher.department || 'Not specified'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(teacher)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(teacher.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <h2 className="text-lg font-semibold mb-4">
              {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingTeacher && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              {!editingTeacher && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingTeacher(null)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingTeacher ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default CoordinatorTeachers