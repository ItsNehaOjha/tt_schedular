// src/components/EditModal.jsx
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Clock, Users, BookOpen, Coffee, Library, Wrench, UserCheck, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import api, { teacherAPI, subjectAPI } from '../utils/api'
import TeacherSelect from './TeacherSelect'

const EditModal = ({ isOpen, onClose, onSave, initialData, timeSlot, day, data, timetableData }) => {
  const [formData, setFormData] = useState({
    type: 'lecture',
    subject: '',
    teacher: null,
    room: ''
  })
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(false)

  const [isParallelLab, setIsParallelLab] = useState(false)
  const [parallelSessions, setParallelSessions] = useState([
    { batch: 'B1', subject: '', teacher: null, room: '' },
    { batch: 'B2', subject: '', teacher: null, room: '' }
  ])

  // add-teacher panel
  const [showAddTeacher, setShowAddTeacher] = useState(false)
  const [customTeacher, setCustomTeacher] = useState({ name: '', department: '' })
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [subjectLoading, setSubjectLoading] = useState(false)
  const [customSubject, setCustomSubject] = useState({ name: '', code: '', acronym: '', type: 'theory', credits: 3 })

  const getBranch = () => data?.branch || timetableData?.branch || 'CSE'
  const getYear = () => {
    const yearMap = { '1st Year': 1, '2nd Year': 2, '3rd Year': 3, '4th Year': 4 }
    return yearMap[data?.year || timetableData?.year] || 1
  }
  const getSemesterGlobal = () => parseInt(data?.semester || timetableData?.semester || 1)
  // Use GLOBAL semester everywhere (backend is backward-compatible for legacy data)
  const getSemester = () => getSemesterGlobal()

  // Fetch lists (filter by branch + semester [+ year])
  const { data: subjectsData, refetch: refetchSubjects } = useQuery({
    queryKey: ['subjects', getBranch(), getSemesterGlobal(), getYear()],
    queryFn: async () => (await subjectAPI.getSubjects({ branch: getBranch(), semester: getSemesterGlobal(), year: getYear() })).data,
    enabled: isOpen
  })

  useEffect(() => { if (subjectsData?.data) setSubjects(subjectsData.data) }, [subjectsData])

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        type: initialData.type || 'lecture',
        subject: initialData.subject || '',
        teacher: initialData.teacher || null,
        room: initialData.room || ''
      })
      setIsParallelLab(initialData.type === 'split-lab')
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
    const parallel = type === 'split-lab'
    setIsParallelLab(parallel)

    if (['lunch', 'break', 'library', 'mentor'].includes(type)) {
      onSave({ type, subject: type.toUpperCase(), fillEntireRow: type === 'lunch' })
      onClose()
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} marked`)
      return
    }

    setFormData({ type, subject: '', teacher: null, room: '' })
    if (parallel) {
      setParallelSessions([
        { batch: 'B1', subject: '', teacher: null, room: '' },
        { batch: 'B2', subject: '', teacher: null, room: '' }
      ])
    }
  }

  // Add new teacher (separate button)
  const handleCreateTeacher = async () => {
  try {
    const fullName = customTeacher.name.trim();
    if (!fullName) return toast.error("Enter teacher name");

    const [firstName, ...rest] = fullName.split(" ");
    const lastName = rest.join(" ").trim();
    const department = (customTeacher.department || "CSE").trim();

    if (!firstName || !department) {
      return toast.error("First name and department are required");
    }

    setLoading(true);

    // Backend expects firstName, lastName, department
    const payload = {
      firstName,
      lastName: lastName || "",
      department
    };

    const res = await api.post("/coordinator/create-teacher", payload);
    const t = res.data?.data;

    // Inform TeacherSelect to refresh cached list
    window.dispatchEvent(new CustomEvent("teacher-cache-invalidate"));

    // Select teacher after creation
    const picked = {
      id: t.id,
      name: t.name,
      teacherId: t.teacherId,
      department: t.department
    };

    if (isParallelLab) {
      setParallelSessions(prev =>
        prev.map((s, i) => (i === 0 ? { ...s, teacher: picked } : s))
      );
    } else {
      setFormData(prev => ({ ...prev, teacher: picked }));
    }

    toast.success("✅ Teacher created");
    setShowAddTeacher(false);
    setCustomTeacher({ name: "", department: "CSE" });
  } catch (err) {
    console.error(err);
    toast.error(err.response?.data?.message || "Error creating teacher");
  } finally {
    setLoading(false);
  }
};


  const handleCreateSubject = async () => {
    try {
      const name = (customSubject.name || '').trim()
      const code = (customSubject.code || '').trim()
      if (!name || !code) return toast.error('Enter subject name and code')
      const payload = {
        name,
        code,
        acronym: (customSubject.acronym || code).trim(),
        branches: [String(getBranch()).toUpperCase()],
        type: customSubject.type === 'lab' ? 'lab' : 'theory',
        year: getYear(),
        semester: getSemesterGlobal(),
        creditHours: Number(customSubject.credits) || 3
      }
      setSubjectLoading(true)
      const res = await subjectAPI.createSubject(payload)
      const created = res?.data?.data
      if (created?._id) {
        await refetchSubjects()
        if (!isParallelLab) setFormData(prev => ({ ...prev, subject: created._id }))
        toast.success('✅ Subject created')
        setShowAddSubject(false)
        setCustomSubject({ name: '', code: '', acronym: '', type: 'theory', credits: 3 })
      }
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Error creating subject')
    } finally {
      setSubjectLoading(false)
    }
  }


  // Submit
  const handleSubmit = (e) => {
    e.preventDefault()

    if (isParallelLab) {
      const filled = parallelSessions.every(s => s.subject && s.teacher)
      if (!filled) return toast.error('Fill both B1 and B2 (subject + teacher)')
      const processed = parallelSessions.map(s => {
        const subj = subjects.find(x => x._id === s.subject)
        return {
          batch: s.batch,
          subject: subj?.name || s.subject,
          code: subj?.code || '',
          teacher: s.teacher?.name || '',
          teacherId: s.teacher?.id || null,
          room: s.room || '',
        }
      })
      onSave({
        type: 'split-lab',
        parallelSessions: processed,
        isLabSession: true,
        requiresMultipleSlots: true
      })
      toast.success('✅ Split lab added')
      onClose()
      return
    }

    if ((formData.type === 'lecture' || formData.type === 'lab') &&
        (!formData.subject || !formData.teacher)) {
      toast.error('Please select subject & teacher')
      return
    }

    const subj = subjects.find((s) => s._id === formData.subject)
    const teach = formData.teacher

    onSave({
      type: formData.type,
      subject: subj?.name || formData.subject,
      code: subj?.code || '',
      teacher: teach ? teach.name : '',
      teacherId: teach ? teach.id : null,
      room: formData.room,
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

          {/* Type Selector */}
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
                      (formData.type === opt.value || (isParallelLab && opt.value==='split-lab'))
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

          {/* Subject */}
          {!isParallelLab && (
            <select
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Subject</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowAddSubject(s => !s)}
              className="inline-flex items-center text-sm text-purple-700 hover:text-purple-800"
            >
              + Add New Subject
            </button>
          </div>

          {showAddSubject && (
            <div className="bg-purple-50 p-3 rounded-lg grid grid-cols-1 gap-2">
              <input
                placeholder="Subject Name"
                value={customSubject.name}
                onChange={(e) => setCustomSubject({ ...customSubject, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Code (e.g., KCS501)"
                  value={customSubject.code}
                  onChange={(e) => setCustomSubject({ ...customSubject, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  placeholder="Acronym (optional)"
                  value={customSubject.acronym}
                  onChange={(e) => setCustomSubject({ ...customSubject, acronym: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={customSubject.type}
                  onChange={(e) => setCustomSubject({ ...customSubject, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="theory">Theory</option>
                  <option value="lab">Lab</option>
                </select>
                <input
                  type="number"
                  placeholder="Credits"
                  value={customSubject.credits}
                  onChange={(e) => setCustomSubject({ ...customSubject, credits: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <button
                type="button"
                onClick={handleCreateSubject}
                disabled={subjectLoading}
                className="bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
              >
                {subjectLoading ? 'Creating…' : 'Create Subject'}
              </button>
            </div>
          )}

          {/* Split Lab (subjects + teachers for B1/B2) */}
          {isParallelLab && (
            <>
              <h3 className="text-lg font-semibold mt-2">Split Lab (B1 / B2)</h3>
              {parallelSessions.map((session, i) => (
                <div key={i} className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <div className="text-sm font-medium">Batch {session.batch}</div>
                  <select
                    value={session.subject}
                    onChange={(e) =>
                      setParallelSessions(prev =>
                        prev.map((s, j) => j === i ? { ...s, subject: e.target.value } : s)
                      )
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>

                  <TeacherSelect
                    value={session.teacher}
                    onChange={(teacher) =>
                      setParallelSessions(prev =>
                        prev.map((s, j) => j === i ? { ...s, teacher } : s)
                      )
                    }
                    day={day}
                    timeSlot={timeSlot}
                    slotKey={timeSlot}
                    placeholder="Select teacher…"
                  />

                  <input
                    placeholder="Room / Lab"
                    value={session.room}
                    onChange={(e) =>
                      setParallelSessions(prev =>
                        prev.map((s, j) => j === i ? { ...s, room: e.target.value } : s)
                      )
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              ))}
            </>
          )}

          {/* TeacherSelect (lecture/lab) */}
          {!isParallelLab && (
            <TeacherSelect
              value={formData.teacher}
              onChange={(teacher) => setFormData({ ...formData, teacher })}
              day={day}
              timeSlot={timeSlot}
              slotKey={timeSlot}
              placeholder="Select teacher…"
            />
          )}

          {/* Add New Teacher Button + Inline Panel */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowAddTeacher(s => !s)}
              className="inline-flex items-center text-sm text-purple-700 hover:text-purple-800"
            >
              <Plus className="w-4 h-4 mr-1" /> Add New Teacher
            </button>
          </div>

          {showAddTeacher && (
            <div className="bg-purple-50 p-3 rounded-lg grid grid-cols-1 gap-2">
              <input
                placeholder="Teacher Name"
                value={customTeacher.name}
                onChange={(e) => setCustomTeacher({ ...customTeacher, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                placeholder="Department (e.g., CSE, IT, ECE)"
                value={customTeacher.department}
                onChange={(e) => setCustomTeacher({ ...customTeacher, department: e.target.value })}    
                className="w-full px-3 py-2 border rounded-lg"
              />
              <button
                type="button"
                onClick={handleCreateTeacher}
                disabled={loading}
                className="bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
              >
                {loading ? 'Creating…' : 'Create Teacher'}
              </button>
            </div>
          )}

          {/* Room */}
          {!isParallelLab && (
            <input
              placeholder="Room / Lab"
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          )}

          <div className="flex space-x-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="flex-1 border py-2 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
              Save
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default EditModal
