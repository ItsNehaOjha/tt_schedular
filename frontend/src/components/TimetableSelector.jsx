import React, { useState } from 'react'
import { motion } from 'framer-motion'

const TimetableSelector = ({ onSelect }) => {
  const [formData, setFormData] = useState({
    year: '',
    branch: '',
    section: '',
    semester: '',
    academicYear: ''
  })

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year']
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
  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8']

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Year
        </label>
        <select
          name="year"
          value={formData.year}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        >
          <option value="">Select Year</option>
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Branch
        </label>
        <select
          name="branch"
          value={formData.branch}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        >
          <option value="">Select Branch</option>
          {branches.map(branch => (
            <option key={branch.value} value={branch.value}>{branch.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Section
        </label>
        <select
          name="section"
          value={formData.section}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        >
          <option value="">Select Section</option>
          {sections.map(section => (
            <option key={section} value={section}>{section}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Semester
        </label>
        <select
          name="semester"
          value={formData.semester}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        >
          <option value="">Select Semester</option>
          {semesters.map(semester => (
            <option key={semester} value={semester}>Semester {semester}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Academic Year
        </label>
        <input
          type="text"
          name="academicYear"
          value={formData.academicYear}
          onChange={handleChange}
          placeholder="e.g., 2025-26"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        />
      </div>

      <motion.button
        type="submit"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          isFormValid
            ? 'bg-purple-500 hover:bg-purple-600 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        disabled={!isFormValid}
      >
        Create/View Timetable
      </motion.button>
    </form>
  )
}

export default TimetableSelector