import React, { useState } from 'react'
import { motion } from 'framer-motion'

const TimetableSelector = ({ onSelect }) => {
  const [formData, setFormData] = useState({
    year: '',
    branch: '',
    section: '',
  })

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year']
  const branches = [
    { value: 'cse', label: 'Computer Science' },
    { value: 'ece', label: 'Electronics' },
    { value: 'mech', label: 'Mechanical' },
    { value: 'civil', label: 'Civil' },
    { value: 'eee', label: 'Electrical' },
    { value: 'it', label: 'Information Technology' }
  ]
  const sections = ['A', 'B', 'C', 'D']

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.year && formData.branch && formData.section) {
      onSelect(formData)
    }
  }

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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select Section</option>
          {sections.map(section => (
            <option key={section} value={section}>{section}</option>
          ))}
        </select>
      </div>

      <motion.button
        type="submit"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full btn-primary"
        disabled={!formData.year || !formData.branch || !formData.section}
      >
        View Timetable
      </motion.button>
    </form>
  )
}

export default TimetableSelector