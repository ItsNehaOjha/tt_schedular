import React, { useEffect, useMemo, useState } from 'react'
import { Loader, Plus, X } from 'lucide-react'
import Select from 'react-select'
import toast from 'react-hot-toast'
import { subjectAPI, teacherAPI, timetableAPI } from '../utils/api'

const defaultWeekDays = ['Monday','Tuesday','Wednesday','Thursday','Friday']

function SampleTimetableConfigForm({ branch, year, semester, academicYear, sections = [], onClose, onGenerationComplete }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [teachers, setTeachers] = useState([])
  const [subjects, setSubjects] = useState([])

  const [slotConfig, setSlotConfig] = useState({ startAt: '08:50', slotMinutes: 50, slotsPerDay: 8 })
  const [lunch, setLunch] = useState({ dayIndex: 2, slotIndex: 4, label: 'Lunch' })
  const [weekDays, setWeekDays] = useState(defaultWeekDays)
  const [lunchStartTime, setLunchStartTime] = useState('12:10')

  const [perSectionRows, setPerSectionRows] = useState({}) // { A: [ { name, subjectId, teacherId, weekly, isLab, requires2Slots, canSplitBatch } ] }
  const [applyAllSections, setApplyAllSections] = useState(true)
  const effectiveSections = useMemo(() => (applyAllSections && (!sections || sections.length === 0)) ? ['A','B','C'] : (sections.length ? sections : ['A']), [applyAllSections, sections])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        // Load teachers
        const tRes = await teacherAPI.getAllTeachers()
        const tData = tRes?.data?.data || tRes?.data || []
        setTeachers(Array.isArray(tData) ? tData : [])
        // Load subjects filtered by year+branch+semester
        let sRes = await subjectAPI.getSubjects({ branch, semester, year })
        let sData = sRes?.data?.data
        setSubjects(Array.isArray(sData) ? sData : [])
        // Initialize rows per section from subjects
        const baseRows = (Array.isArray(sData) ? sData : []).map(s => ({
          name: s.acronym || s.name,
          subjectId: s.code || s._id,
          teacherId: '',
          weekly: s.type === 'lab' ? 2 : 6,
          isLab: s.type === 'lab',
          requires2Slots: s.type === 'lab',
          canSplitBatch: s.type === 'lab'
        }))
        const initial = {}
        effectiveSections.forEach(sec => initial[sec] = [...baseRows])
        setPerSectionRows(initial)
      } catch (e) {
        console.error(e)
        toast.error('Failed to load teachers/subjects')
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch, semester, year])

  // Auto-calc lunch slot index from lunchStartTime, startAt and slotMinutes
  useEffect(() => {
    const parseMins = (t) => { const [h,m] = t.split(':').map(Number); return h*60 + m }
    try {
      const start = parseMins(slotConfig.startAt.replace(/\s?(AM|PM)/i,''))
      const lunchStart = parseMins(lunchStartTime)
      const diff = Math.max(0, lunchStart - start)
      const idx = Math.floor(diff / (slotConfig.slotMinutes||50))
      setLunch(l => ({ ...l, slotIndex: idx }))
    } catch {}
  }, [lunchStartTime, slotConfig.startAt, slotConfig.slotMinutes])

  const handleAddRow = (sec) => {
    setPerSectionRows(prev => ({
      ...prev,
      [sec]: [...(prev[sec] || []), { name: '', subjectId: '', teacherId: '', weekly: 1, isLab: false, requires2Slots: false, canSplitBatch: false }]
    }))
  }
  const handleRemoveRow = (sec, idx) => {
    setPerSectionRows(prev => ({
      ...prev,
      [sec]: (prev[sec] || []).filter((_, i) => i !== idx)
    }))
  }
  const handleRowChange = (sec, idx, field, value) => {
    setPerSectionRows(prev => {
      const copy = { ...prev }
      copy[sec] = [...(copy[sec] || [])]
      copy[sec][idx] = { ...copy[sec][idx], [field]: value }
      // keep flags consistent
      if (field === 'isLab' && value === false) {
        copy[sec][idx].requires2Slots = false
        copy[sec][idx].canSplitBatch = false
      }
      if (field === 'requires2Slots' || field === 'canSplitBatch') copy[sec][idx].isLab = true
      return copy
    })
  }

  const buildPayload = () => {
    const perSectionSubjects = {}
    const sectionKeys = Object.keys(perSectionRows || {})
    sectionKeys.forEach(sec => {
      const rows = (perSectionRows[sec] || []).filter(r => r.name && (r.weekly||0) > 0)
      perSectionSubjects[sec] = rows
    })

    const sectionsForPayload = applyAllSections ? [] : (sectionKeys.length ? sectionKeys : effectiveSections)

    return {
      branch,
      year,
      semester,
      academicYear,
      sections: sectionsForPayload,
      weekDays,
      slotConfig,
      lunch,
      perSectionSubjects,
      options: { avoidTeacherClashes: true, treatDraftsAsBusy: true, overwriteExisting: false, seed: 42 }
    }
  }

  const handleGenerate = async () => {
    try {
      // basic validation
      const hasAny = Object.values(perSectionRows || {}).some(list => (list || []).length > 0)
      if (!hasAny) return toast.error('No subjects available for generation. Please configure first.')
      if (!branch || !semester || !year || !academicYear) return toast.error('Branch, Year, Semester, and Academic Year are required!')
      // ensure all rows with weekly>0 have a teacher assigned
      const missingTeacher = Object.values(perSectionRows || {}).some(list => (list||[]).some(r => (r.weekly||0) > 0 && !r.teacherId))
      if (missingTeacher) return toast.error('Assign all teachers before generating.')
      setSaving(true)
      const payload = buildPayload()
      // Ensure perSectionSubjects has content
      const hasSectionData = Object.values(payload.perSectionSubjects || {}).some(arr => Array.isArray(arr) && arr.length)
      if (!hasSectionData) {
        setSaving(false)
        return toast.error('Add at least one subject before generating!')
      }
      console.log('Submitting Generate Payload:', payload)
      const res = await timetableAPI.generateSample(payload)
      console.log('Timetable Generator Response:', res?.data)
      if (res?.data?.status === 'ok') {
        const first = Object.values(res.data.generated || {})[0]
        if (first?.draftId) {
          toast.success('Draft generated')
          onGenerationComplete && onGenerationComplete(first.draftId)
          onClose && onClose()
          return
        }
      }
      toast.error('Failed to generate timetable')
    } catch (e) {
      console.error(e)
      toast.error(e?.response?.data?.message || 'Generation failed')
    } finally {
      setSaving(false)
    }
  }

  const teacherOptions = useMemo(() => (teachers || []).map(t => ({
    value: t._id || t.id || t.teacherId,
    label: t.displayName || t.name || `${t.firstName || ''} ${t.lastName || ''}`.trim()
  })), [teachers])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 flex items-center">
          <Loader className="w-5 h-5 mr-2 animate-spin"/>
          <span>Loading configuration...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Setup Sample Timetable Configuration</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5"/></button>
        </div>

        <div className="p-5 space-y-6">
          {/* Basic Options */}
          <div>
            <h3 className="font-medium mb-2">Basic Options</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="text-sm">Start Time
                <input value={slotConfig.startAt} onChange={e=>setSlotConfig(s=>({...s,startAt:e.target.value}))} className="mt-1 w-full border rounded px-2 py-1"/>
              </label>
              <label className="text-sm">Duration (min)
                <input type="number" value={slotConfig.slotMinutes} onChange={e=>setSlotConfig(s=>({...s,slotMinutes:parseInt(e.target.value)||50}))} className="mt-1 w-full border rounded px-2 py-1"/>
              </label>
              <label className="text-sm">Slots/Day
                <input type="number" value={slotConfig.slotsPerDay} onChange={e=>setSlotConfig(s=>({...s,slotsPerDay:parseInt(e.target.value)||8}))} className="mt-1 w-full border rounded px-2 py-1"/>
              </label>
              <label className="text-sm">Lunch Label
                <input value={lunch.label} onChange={e=>setLunch(l=>({...l,label:e.target.value}))} className="mt-1 w-full border rounded px-2 py-1"/>
              </label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
              <label className="text-sm">Lunch Day Index (0=Mon)
                <input type="number" value={lunch.dayIndex} onChange={e=>setLunch(l=>({...l,dayIndex:parseInt(e.target.value)||0}))} className="mt-1 w-full border rounded px-2 py-1"/>
              </label>
              <label className="text-sm">Lunch Slot Index (0-based)
                <input type="number" value={lunch.slotIndex} onChange={e=>setLunch(l=>({...l,slotIndex:parseInt(e.target.value)||0}))} className="mt-1 w-full border rounded px-2 py-1"/>
              </label>
              <label className="text-sm">Lunch Start Time
                <input value={lunchStartTime} onChange={e=>setLunchStartTime(e.target.value)} className="mt-1 w-full border rounded px-2 py-1"/>
              </label>
              <label className="text-sm flex items-center gap-2 mt-6">
                <input type="checkbox" checked={applyAllSections} onChange={()=>setApplyAllSections(v=>!v)} />
                Generate for all sections
              </label>
            </div>
            {/* Searchable dropdown is provided inline via react-select in the table */}
          </div>

          {/* Per-section Subjects */}
          {effectiveSections.map(sec => (
            <div key={sec} className="border rounded-md">
              <div className="px-3 py-2 border-b flex items-center justify-between">
                <div className="font-medium">Section {sec}</div>
                <button className="text-sm inline-flex items-center px-2 py-1 border rounded" onClick={()=>handleAddRow(sec)}>
                  <Plus className="w-4 h-4 mr-1"/> Add Subject
                </button>
              </div>
              <div className="p-3 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-4">Subject</th>
                      <th className="py-2 pr-4">Subject Code</th>
                      <th className="py-2 pr-4">Teacher</th>
                      <th className="py-2 pr-4">Weekly</th>
                      <th className="py-2 pr-4">Is Lab</th>
                      <th className="py-2 pr-4">2 Slots</th>
                      <th className="py-2 pr-4">Split Batch</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(perSectionRows[sec]||[]).map((row, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2 pr-4">
                          <input value={row.name} onChange={e=>handleRowChange(sec, idx, 'name', e.target.value)} className="w-40 border rounded px-2 py-1"/>
                        </td>
                        <td className="py-2 pr-4">
                          <input value={row.subjectId} onChange={e=>handleRowChange(sec, idx, 'subjectId', e.target.value)} className="w-32 border rounded px-2 py-1"/>
                        </td>
                        <td className="py-2 pr-4 min-w-[220px]">
                          <Select
                            classNamePrefix="react-select"
                            isSearchable
                            placeholder="Search/select teacher"
                            options={teacherOptions}
                            value={teacherOptions.find(o => o.value === row.teacherId) || null}
                            onChange={(opt) => handleRowChange(sec, idx, 'teacherId', opt ? opt.value : '')}
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <input type="number" min={0} value={row.weekly} onChange={e=>handleRowChange(sec, idx, 'weekly', parseInt(e.target.value)||0)} className="w-20 border rounded px-2 py-1"/>
                        </td>
                        <td className="py-2 pr-4 text-center">
                          <input type="checkbox" checked={!!row.isLab} onChange={e=>handleRowChange(sec, idx, 'isLab', e.target.checked)} />
                        </td>
                        <td className="py-2 pr-4 text-center">
                          <input type="checkbox" checked={!!row.requires2Slots} onChange={e=>handleRowChange(sec, idx, 'requires2Slots', e.target.checked)} />
                        </td>
                        <td className="py-2 pr-4 text-center">
                          <input type="checkbox" checked={!!row.canSplitBatch} onChange={e=>handleRowChange(sec, idx, 'canSplitBatch', e.target.checked)} />
                        </td>
                        <td className="py-2 pr-2 text-right">
                          <button className="text-red-600" onClick={()=>handleRemoveRow(sec, idx)}><X className="w-4 h-4"/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Options */}
          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <button className="px-3 py-2 border rounded" onClick={onClose}>Cancel</button>
            <button disabled={saving} className="px-4 py-2 bg-purple-600 text-white rounded inline-flex items-center" onClick={handleGenerate}>
              {saving && <Loader className="w-4 h-4 mr-2 animate-spin"/>}
              {saving ? 'Generating...' : 'Generate Timetable'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SampleTimetableConfigForm
