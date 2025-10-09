import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, Loader, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../utils/api'

const TeacherPage = () => {
  const navigate = useNavigate()
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBranch, setSelectedBranch] = useState('CSE')
  const [branchOptions] = useState([
    { value: 'CSE', label: 'Computer Science & Engineering' },
  { value: 'CS', label: 'Computer Science' },
  { value: 'Biotechnology', label: 'Biotechnology' },
  { value: 'CE', label: 'Civil Engineering' },
  { value: 'IT', label: 'Information Technology' },
  { value: 'EC', label: 'Electronics & Communication' },
  { value: 'EE', label: 'Electrical Engineering' },
  { value: 'ME', label: 'Mechanical Engineering' },
  { value: 'MBA', label: 'MBA' },
  { value: 'MCA', label: 'MCA' }
  ])
  const [selectedTeacher, setSelectedTeacher] = useState({
    name: '',
    id: ''
  })

  useEffect(() => {
    fetchTeachers()
  }, [selectedBranch])

  const fetchTeachers = async () => {
    try {
      setLoading(true)
      const url = selectedBranch 
        ? `/teachers/all?branch=${selectedBranch}`
        : '/teachers/all'
      
      const response = await api.get(url)
      setTeachers(response.data.data || [])
      
      // Don't show toast for no teachers found as UI already handles it
    } catch (error) {
      console.error('Error fetching teachers:', error)
      toast.error('Failed to load teachers')
      setTeachers([])
    } finally {
      setLoading(false)
    }
  }

  const handleTeacherSelect = (teacher) => {
    setSelectedTeacher({
      name: teacher.displayName || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.username,
      id: teacher.id
    })
  }

  const handleViewTimetable = () => {
    if (selectedTeacher.name && selectedTeacher.id) {
      navigate('/teacher/dashboard', { 
        state: { 
          teacherName: selectedTeacher.name, 
          teacherId: selectedTeacher.id 
        } 
      })
    }
  }

  const isFormValid = selectedTeacher.name && selectedTeacher.id

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading teachers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center mb-8"
        >
          <button
            onClick={() => navigate('/')}
            className="mr-4 p-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center">
            <Users className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Teacher Portal</h1>
              <p className="text-gray-600">Select your profile to view teaching schedule</p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <div className="space-y-6">
            {/* Branch Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Branch
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {branchOptions.map(branch => (
                  <option key={branch.value} value={branch.value}>{branch.label}</option>
                ))}
              </select>
            </div>

            {/* Teacher Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Teacher
              </label>
              {teachers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {selectedBranch ? `No teachers found for ${branchOptions.find(b => b.value === selectedBranch)?.label || selectedBranch} branch` : 'No teachers found'}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Please contact the coordinator to initialize teachers for this branch.
                  </p>
                  <button
                    onClick={fetchTeachers}
                    className="mt-4 text-green-600 hover:text-green-500 flex items-center mx-auto"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  // Update the teacher display to show proper names
                  {teachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      onClick={() => handleTeacherSelect(teacher)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTeacher.id === teacher.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {teacher.displayName || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.username}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {teacher.username} • {teacher.branch || teacher.department || 'CSE'}
                          </p>
                          {teacher.designation && (
                            <p className="text-xs text-gray-400">{teacher.designation}</p>
                          )}
                        </div>
                        {selectedTeacher.id === teacher.id && (
                          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleViewTimetable}
              disabled={!isFormValid}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                isFormValid
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              View Teaching Schedule
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default TeacherPage