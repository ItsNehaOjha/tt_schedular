import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GraduationCap, ArrowLeft, Loader } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../utils/api'

const StudentPage = () => {
  const navigate = useNavigate()
  
  // Load initial state from localStorage
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('studentPage_formData')
    return saved ? JSON.parse(saved) : {
      year: '',
      branch: '',
      section: ''
    }
  })
  const [options, setOptions] = useState({
    years: [],
    branches: [],
    sections: []
  })
  const [loading, setLoading] = useState(true)

  // Persist form data to localStorage
  useEffect(() => {
    localStorage.setItem('studentPage_formData', JSON.stringify(formData))
  }, [formData])

  useEffect(() => {
    fetchClassOptions()
  }, [])

  const fetchClassOptions = async () => {
    try {
      setLoading(true)
      const response = await api.get('/classes/options')
      setOptions(response.data.data)
    } catch (error) {
      console.error('Error fetching class options:', error)
      toast.error('Failed to load class options')
      // Fallback to static options
      setOptions({
        years: ['1', '2', '3', '4'],
        branches: ['CSE', 'CS', 'Biotechnology', 'CE', 'IT', 'EC', 'EE', 'ME', 'MBA', 'MCA'],

        sections: ['A', 'B', 'C', 'D']
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleViewTimetable = () => {
    if (formData.year && formData.branch && formData.section) {
      // Convert numeric year to the format expected by backend
      const yearMapping = {
        '1': '1st Year',
        '2': '2nd Year', 
        '3': '3rd Year',
        '4': '4th Year'
      }
      
      const formattedYear = yearMapping[formData.year] || formData.year
      
      navigate('/student/dashboard', { 
        state: { 
          year: formattedYear, 
          branch: formData.branch, 
          section: formData.section 
        } 
      })
    }
  }

  const isFormValid = formData.year && formData.branch && formData.section

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading class options...</p>
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
            <GraduationCap className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Portal</h1>
              <p className="text-gray-600">Select your class details to view timetable</p>
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
            {/* Year Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Year
              </label>
              <select
                value={formData.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose Year</option>
                {options.years.map((year) => (
                  <option key={year} value={year}>
                    {year === '1' ? '1st Year' : year === '2' ? '2nd Year' : year === '3' ? '3rd Year' : '4th Year'}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Branch
              </label>
              <select
                value={formData.branch}
                onChange={(e) => handleInputChange('branch', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose Branch</option>
                {options.branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Section
              </label>
              <select
                value={formData.section}
                onChange={(e) => handleInputChange('section', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose Section</option>
                {options.sections.map((section) => (
                  <option key={section} value={section}>
                    Section {section}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleViewTimetable}
              disabled={!isFormValid}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                isFormValid
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              View Timetable
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default StudentPage