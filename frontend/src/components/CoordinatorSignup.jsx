import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { UserPlus, Loader, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { authAPI } from '../utils/api'

const CoordinatorSignup = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    coordinatorId: '',
    cname: '',
    branch: '',
    year: '',
    password: '',
    confirmPassword: ''
  })

  const branchOptions = [
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
  const yearOptions = ['1', '2', '3', '4']

  const signupMutation = useMutation({
    mutationFn: authAPI.registerCoordinator,
    onSuccess: () => {
      navigate('/login?role=coordinator&signup=success')
    },
    onError: (error) => {
      console.error('Signup error:', error)
    }
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
       toast.error('Passwords do not match.');
      return
    }

    signupMutation.mutate({
      coordinatorId: formData.coordinatorId,
      cname: formData.cname,
      branch: formData.branch,
      year: formData.year,
      password: formData.password
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="text-center mb-8">
            <div className="bg-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Coordinator Signup
            </h2>
            <p className="text-gray-600">
              Create your coordinator account
            </p>
          </div>

          {signupMutation.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">
                  {signupMutation.error?.response?.data?.message || 'Signup failed'}
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="coordinatorId" className="block text-sm font-medium text-gray-700 mb-2">
                Coordinator ID
              </label>
              <input
                type="text"
                id="coordinatorId"
                name="coordinatorId"
                value={formData.coordinatorId}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your unique coordinator ID"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be your login username (e.g., coord001, admin@college.edu)
              </p>
            </div>

            <div>
              <label htmlFor="cname" className="block text-sm font-medium text-gray-700 mb-2">
                Coordinator Name
              </label>
              <input
                type="text"
                id="cname"
                name="cname"
                value={formData.cname}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-2">
                  Branch
                </label>
                <select
                  id="branch"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">Select Branch</option>
                  {branchOptions.map(branch => (
                    <option key={branch.value} value={branch.value}>{branch.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <select
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">Select Year</option>
                  {yearOptions.map(year => (
                    <option key={year} value={year}>Year {year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pr-10"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field"
                placeholder="Confirm your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={signupMutation.isPending}
              className="btn-primary w-full flex items-center justify-center"
            >
              {signupMutation.isPending ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login?role=coordinator" className="text-purple-600 hover:text-purple-500 font-medium">
                Sign in here
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link
              to="/"
              className="inline-flex items-center text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default CoordinatorSignup