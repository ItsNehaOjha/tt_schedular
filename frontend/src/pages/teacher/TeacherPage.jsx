import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, Loader, RefreshCw, Search } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../utils/api'

const TeacherPage = () => {
  const navigate = useNavigate()

  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)

  // Branch filter
  const [selectedBranch, setSelectedBranch] = useState('CSE')
  const [branchOptions] = useState([
    
    { value: 'CSE',     label: 'Computer Science & Engineering' },
    { value: 'CS',      label: 'Computer Science' },
    { value: 'CSD',     label: 'Computer Science & Design' },
    { value: 'IT',      label: 'Information Technology' },
    { value: 'ECE',     label: 'Electronics & Communication' },
    { value: 'ME',      label: 'Mechanical Engineering' },
    { value: 'MBA',     label: 'MBA' },
    { value: 'MCA',     label: 'MCA' },
  ])

  // 🔎 Search filter (local)
  const [query, setQuery] = useState('')

  // Selected teacher
  const [selectedTeacher, setSelectedTeacher] = useState({ name: '', id: '' })

  useEffect(() => {
    fetchTeachers()
  }, [selectedBranch])

  const fetchTeachers = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/teachers/list')
      const all = data?.data || []

      // Branch filter (case-insensitive)
      const filtered = all.filter(t =>
        (t.department || '').toUpperCase() === selectedBranch.toUpperCase()
      )

      setTeachers(filtered)
    } catch (err) {
      console.error('Error fetching teachers:', err)
      toast.error('Failed to load teachers')
      setTeachers([])
    } finally {
      setLoading(false)
    }
  }

  const normalize = (s) => (s || '').toString().toLowerCase().replace(/\s+/g, ' ').trim()

  // 🔍 Search across name + username + teacherId
  const visibleTeachers = useMemo(() => {
    const q = normalize(query)
    if (!q) return teachers

    return teachers.filter(t => {
      const name =
        t.name ||
        t.displayName ||
        `${t.firstName || ''} ${t.lastName || ''}`.trim()

      const haystack = `${name} ${t.username || ''} ${t.teacherId || ''}`
      return normalize(haystack).includes(q)
    })
  }, [teachers, query])

  const handleTeacherSelect = (t) => {
    const name =
      t.name ||
      t.displayName ||
      `${t.firstName || ''} ${t.lastName || ''}`.trim() ||
      t.username ||
      'Unknown Teacher'

    setSelectedTeacher({ name, id: t.id || t._id })
  }

  const handleViewTimetable = () => {
    if (selectedTeacher.name && selectedTeacher.id) {
      navigate('/teacher/dashboard', {
        state: {
          teacherName: selectedTeacher.name,
          teacherId: selectedTeacher.id,
        },
      })
    }
  }

  const isFormValid = Boolean(selectedTeacher.name && selectedTeacher.id)

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

        {/* Card */}
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
                onChange={(e) => {
                  setSelectedBranch(e.target.value)
                  setQuery('')               // reset search when branch changes
                  setSelectedTeacher({ name: '', id: '' }) // reset selection
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {branchOptions.map(b => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Teacher
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type name, username, or ID (e.g., Tushar, mr.tushar, CSE-043)…"
                  className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && visibleTeachers.length > 0) {
                      handleTeacherSelect(visibleTeachers[0])
                    }
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Showing {visibleTeachers.length} of {teachers.length} teachers
              </p>
            </div>

            {/* Teacher List */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Teacher
              </label>

              {visibleTeachers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No matching teachers found</p>
                  <button
                    onClick={fetchTeachers}
                    className="mt-4 text-green-600 hover:text-green-500 flex items-center mx-auto"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {visibleTeachers.map((t) => {
                    const id = t.id || t._id
                    const selected = selectedTeacher.id === id
                    const name =
                      t.name ||
                      t.displayName ||
                      `${t.firstName || ''} ${t.lastName || ''}`.trim() ||
                      t.username ||
                      'Unknown Teacher'

                    return (
                      <div
                        key={id}
                        onClick={() => handleTeacherSelect(t)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selected ? 'border-green-500 bg-green-50'
                                   : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium text-gray-900">{name}</h3>
                            <p className="text-sm text-gray-500">
                              {(t.teacherId || '').trim()} {t.teacherId ? '• ' : ''}{t.department || 'N/A'}
                            </p>
                            {t.designation && (
                              <p className="text-xs text-gray-400">{t.designation}</p>
                            )}
                          </div>
                          {selected && <div className="w-4 h-4 bg-green-500 rounded-full" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Submit */}
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
