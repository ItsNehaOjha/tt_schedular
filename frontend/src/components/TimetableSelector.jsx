import React, { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const TimetableSelector = ({ onSelect, renderActionButton }) => {
  const [formData, setFormData] = useState({
    year: '',
    branch: '',
    section: '',
    semester: '',
    academicYear: ''
  })

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year']
  const yearToSemesters = {
    '1st Year': [1, 2],
    '2nd Year': [3, 4],
    '3rd Year': [5, 6],
    '4th Year': [7, 8]
  }

  const branches = [
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
  ]
  const sections = ['A', 'B', 'C', 'D']
  const semestersAll = ['1', '2', '3', '4', '5', '6', '7', '8']

  const allowedSemesters = useMemo(() => {
    const allowed = yearToSemesters[formData.year]
    return allowed ? allowed.map(String) : semestersAll
  }, [formData.year])

  // Auto-correct semester when year changes to ensure valid combo
  useEffect(() => {
    if (!formData.year) return
    if (!allowedSemesters.includes(formData.semester)) {
      setFormData(prev => ({ ...prev, semester: allowedSemesters[0] || '' }))
    }
  }, [formData.year, allowedSemesters])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.year && formData.branch && formData.section && formData.semester && formData.academicYear) {
      onSelect(formData)
    }
  }

  const isFormValid = formData.year && formData.branch && formData.section && formData.semester && formData.academicYear

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      
      {/* Responsive Two-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Year
          </label>
          <select
            name="year"
            value={formData.year}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          >
            <option value="">Select Year</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Branch
          </label>
          <select
            name="branch"
            value={formData.branch}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          >
            <option value="">Select Branch</option>
            {branches.map(branch => (
              <option key={branch.value} value={branch.value}>{branch.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Section
          </label>
          <select
            name="section"
            value={formData.section}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          >
            <option value="">Select Section</option>
            {sections.map(section => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Semester
          </label>
          <select
            name="semester"
            value={formData.semester}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          >
            <option value="">Select Semester</option>
            {allowedSemesters.map(semester => (
              <option key={semester} value={semester}>Semester {semester}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Academic Year
          </label>
          <input
            type="text"
            name="academicYear"
            value={formData.academicYear}
            onChange={handleChange}
            placeholder="e.g., 2025-26"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div className="pt-2 flex flex-col gap-2">
        <motion.button
          type="submit"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs transition-colors ${
            isFormValid
              ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          disabled={!isFormValid}
        >
          Create/View Timetable
        </motion.button>
        
        {/* Render custom action generator button if provided */}
        {renderActionButton && renderActionButton(formData)}
      </div>
    </form>
  )
}

export default TimetableSelector