import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Clock, Users, BookOpen, Coffee, Library, Wrench, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import api, { teacherAPI, subjectAPI } from '../utils/api'

const EditModal = ({ isOpen, onClose, onSave, initialData, timeSlot, day, data, timetableData }) => {
  const [formData, setFormData] = useState({
    type: 'lecture',
    subject: '',
    teacher: '',
    room: ''
  })
  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(false)

  const [isParallelLab, setIsParallelLab] = useState(false)
  const [parallelSessions, setParallelSessions] = useState([
    { batch: 'B1', subject: '', teacher: '', room: '' },
    { batch: 'B2', subject: '', teacher: '', room: '' }
  ])

  // new UI states for custom creation in lecture/lab mode
  const [showCustomSubject, setShowCustomSubject] = useState(false)
  const [showCustomTeacher, setShowCustomTeacher] = useState(false)
  const [customSubject, setCustomSubject] = useState({ name: '', code: '' })
  const [customTeacher, setCustomTeacher] = useState({ name: '' })

  const getBranch = () => data?.branch || timetableData?.branch || 'cse'
  const getYear = () => {
    const yearMap = { '1st Year': 1, '2nd Year': 2, '3rd Year': 3, '4th Year': 4 }
    return yearMap[data?.year || timetableData?.year] || 1
  }
  const getSemester = () => parseInt(data?.semester || timetableData?.semester || 1)

  // Fetch teachers and subjects
  const { data: teachersData, refetch: refetchTeachers } = useQuery({
    queryKey: ['teachers', getBranch()],
    queryFn: async () => (await teacherAPI.getTeachers()).data,
    enabled: isOpen
  })
  const { data: subjectsData, refetch: refetchSubjects } = useQuery({
    queryKey: ['subjects', getBranch(), getYear()],
    queryFn: async () => (await subjectAPI.getSubjects({ branch: getBranch(), year: getYear() })).data,
    enabled: isOpen
  })

  useEffect(() => {
    if (teachersData?.data) setTeachers(teachersData.data)
    if (subjectsData?.data) setSubjects(subjectsData.data)
  }, [teachersData, subjectsData])

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        type: initialData.type || 'lecture',
        subject: initialData.subject || '',
        teacher: initialData.teacher || '',
        room: initialData.room || ''
      })
    }
  }, [isOpen, initialData])

  const typeOptions = [
    { value: 'lecture', label: 'Lecture', icon: BookOpen },
    { value: 'lab', label: 'Lab', icon: Wrench },
    { value: 'split-lab', label: 'Split Lab (B1/B2)', icon: Users },
    { value: 'lunch', label: 'Lunch', icon: Coffee },
    { value: 'break', label: 'Break', icon: Clock },
    { value: 'library', label: 'Library', icon: Library },
    { value: 'mentor', label: 'Mentor', icon: UserCheck }
  ]

  const handleTypeChange = (type) => {
    if (type === 'split-lab') setIsParallelLab(true)
    else setIsParallelLab(false)

    if (['lunch', 'break', 'library', 'mentor'].includes(type)) {
      onSave({ type, subject: type.toUpperCase(), fillEntireRow: type === 'lunch' })
      onClose()
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} marked`)
      return
    }

    setFormData({ type, subject: '', teacher: '', room: '' })
  }

  // === NEW Custom Subject/Teacher creation for Lecture & Lab ===
  const handleCreateCustomSubject = async () => {
    if (!customSubject.name || !customSubject.code) return toast.error('Enter both name and code')
    try {
      setLoading(true)
      const res = await subjectAPI.createSubject({
        name: customSubject.name,
        code: customSubject.code,
        branches: [getBranch()],
        year: getYear(),
        semester: getSemester()
      })
      const newSub = res.data.data
      await refetchSubjects()
      toast.success('✅ Subject created')
      setFormData((prev) => ({ ...prev, subject: newSub._id }))
      setShowCustomSubject(false)
      setCustomSubject({ name: '', code: '' })
    } catch (err) {
      console.error(err)
      toast.error('Error creating subject')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCustomTeacher = async () => {
    if (!customTeacher.name) return toast.error('Enter teacher name')
    try {
      setLoading(true)
      const name = customTeacher.name.trim()
      const res = await teacherAPI.createTeacher({
        username: name.toLowerCase().replace(/\s+/g, ''),
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' '),
        department: 'General',
        password: 'teacher123'
      })
      const newT = res.data.data
      await refetchTeachers()
      toast.success('✅ Teacher created')
      setFormData((prev) => ({ ...prev, teacher: newT.id || newT._id }))
      setShowCustomTeacher(false)
      setCustomTeacher({ name: '' })
    } catch (err) {
      console.error(err)
      toast.error('Error creating teacher')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isParallelLab) {
      const valid = parallelSessions.filter((s) => s.subject && s.teacher)
      if (!valid.length) return toast.error('Fill both B1 and B2')

      const processedSessions = parallelSessions.map((session) => {
        const subj = subjects.find((s) => s._id === session.subject)
        const teach = teachers.find((t) => t.id === session.teacher)
        return {
          ...session,
          subject: subj?.name || session.subject,
          code: subj?.code || '',
          teacher: teach?.displayName || `${teach?.firstName || ''} ${teach?.lastName || ''}`.trim() || session.teacher
        }
      })

      onSave({
        type: 'split-lab',
        parallelSessions: processedSessions,
        isLabSession: true,
        requiresMultipleSlots: true
      })
      toast.success('✅ Split lab added')
      onClose()
      return
    }

    if ((formData.type === 'lecture' || formData.type === 'lab') && (!formData.subject || !formData.teacher)) {
      toast.error('Please select subject & teacher')
      return
    }

    const subj = subjects.find((s) => s._id === formData.subject)
    const teach = teachers.find((t) => t.id === formData.teacher)

    onSave({
      ...formData,
      subject: subj?.name || formData.subject,
      code: subj?.code || '',
      teacher: teach?.displayName || formData.teacher,
      isLabSession: formData.type === 'lab',
      requiresMultipleSlots: formData.type === 'lab'
    })
    toast.success('✅ Slot saved')
    onClose()
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Edit Class Schedule</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {typeOptions.map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleTypeChange(opt.value)}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center transition ${
                      formData.type === opt.value
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Split Lab Logic */}
          {isParallelLab ? (
            <>
              <h3 className="text-lg font-semibold mt-4">Split Lab (B1 / B2)</h3>
              {parallelSessions.map((session, i) => (
                <div key={i} className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium mb-2">Batch {session.batch}</h4>
                  {/* Subject */}
                  <select
                    value={session.subject}
                    onChange={(e) =>
                      e.target.value === 'add_new'
                        ? setParallelSessions((prev) =>
                            prev.map((s, j) => (j === i ? { ...s, showCustomSubject: true } : s))
                          )
                        : setParallelSessions((prev) =>
                            prev.map((s, j) => (j === i ? { ...s, subject: e.target.value } : s))
                          )
                    }
                    className="w-full px-3 py-2 border rounded-lg mb-2"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                    <option value="add_new" className="text-blue-600">
                      ➕ Add New Subject
                    </option>
                  </select>

                  {/* Teacher */}
                  <select
                    value={session.teacher}
                    onChange={(e) =>
                      e.target.value === 'add_new'
                        ? setParallelSessions((prev) =>
                            prev.map((s, j) => (j === i ? { ...s, showCustomTeacher: true } : s))
                          )
                        : setParallelSessions((prev) =>
                            prev.map((s, j) => (j === i ? { ...s, teacher: e.target.value } : s))
                          )
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.displayName}
                      </option>
                    ))}
                    <option value="add_new" className="text-green-600">
                      ➕ Add New Teacher
                    </option>
                  </select>

                  <input
                    placeholder="Room / Lab"
                    value={session.room}
                    onChange={(e) =>
                      setParallelSessions((prev) =>
                        prev.map((s, j) => (j === i ? { ...s, room: e.target.value } : s))
                      )
                    }
                    className="w-full px-3 py-2 border rounded-lg mt-2"
                  />
                </div>
              ))}
            </>
          ) : (
            <>
              {/* Subject Dropdown with custom add */}
              <select
                value={formData.subject}
                onChange={(e) => {
                  if (e.target.value === 'add_new') setShowCustomSubject(true)
                  else setFormData({ ...formData, subject: e.target.value })
                }}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.code})
                  </option>
                ))}
                <option value="add_new" className="text-blue-600">
                  ➕ Add New Subject
                </option>
              </select>

              {showCustomSubject && (
                <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                  <input
                    placeholder="Subject Name"
                    value={customSubject.name}
                    onChange={(e) => setCustomSubject({ ...customSubject, name: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                  <input
                    placeholder="Subject Code"
                    value={customSubject.code}
                    onChange={(e) => setCustomSubject({ ...customSubject, code: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCustomSubject}
                    className="bg-blue-600 text-white w-full py-1 rounded text-sm"
                    disabled={loading}
                  >
                    Create & Add
                  </button>
                </div>
              )}

              {/* Teacher Dropdown with custom add */}
              <select
                value={formData.teacher}
                onChange={(e) => {
                  if (e.target.value === 'add_new') setShowCustomTeacher(true)
                  else setFormData({ ...formData, teacher: e.target.value })
                }}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select Teacher</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.displayName}
                  </option>
                ))}
                <option value="add_new" className="text-green-600">
                  ➕ Add New Teacher
                </option>
              </select>

              {showCustomTeacher && (
                <div className="bg-green-50 p-3 rounded-lg space-y-2">
                  <input
                    placeholder="Teacher Name"
                    value={customTeacher.name}
                    onChange={(e) => setCustomTeacher({ name: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCustomTeacher}
                    className="bg-green-600 text-white w-full py-1 rounded text-sm"
                    disabled={loading}
                  >
                    Create & Add
                  </button>
                </div>
              )}

              <input
                placeholder="Room / Lab"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </>
          )}

          {/* Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
            >
              Save
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default EditModal
