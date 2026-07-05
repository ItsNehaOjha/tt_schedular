import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { LogIn, Loader, ArrowLeft, Eye, EyeOff, CheckCircle, Calendar } from 'lucide-react'
import { authAPI } from '../utils/api'
import { setToken, setUser } from '../utils/auth'
import toast from 'react-hot-toast'

const LoginPage = ({ onLoginSuccess }) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const expectedRole = searchParams.get('role')
  const signupSuccess = searchParams.get('signup') === 'success'
  
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })

  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    retry: false,
    onSuccess: (data) => {
      // Save token and user data to localStorage
      if (data.data.token) {
        setToken(data.data.token)
      }
      if (data.data.user) {
        setUser(data.data.user)
      }
      
      const displayName = data.data.user?.displayName || 
                       data.data.user?.firstName || 
                       data.data.user?.username || 
                       'User'
      
      toast.success(`Welcome back, ${displayName}!`, {
        duration: 3000
      })
      
      // Redirect based on role
      if (data.data.user.role === 'coordinator') {
        navigate('/coordinator/dashboard')
      } else {
        navigate('/teacher')
      }
    },
    onError: (error) => {
      console.error('Login error:', error)

      const serverMsg = error?.response?.data?.message
      const status = error?.response?.status

      // Network error (server offline)
      if (error.code === 'ERR_NETWORK' && !error.response) {
        toast.error('Cannot connect to backend server. Please try again later.', {
          duration: 5000
        });
        return;
      }
      // Authentication errors
      else if (status === 400 || status === 401) {
        toast.error(serverMsg || 'Invalid coordinator ID or password.', {
          duration: 5000
        });
      } 
      // Authorization errors
      else if (status === 403) {
        toast.error('Access denied. Unauthorized role or permissions.', {
          duration: 5000
        });
      } 
      // Other errors
      else {
        toast.error(serverMsg || error.message || 'Unexpected login error.', {
          duration: 5000
        });
      }
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
    loginMutation.mutate(formData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold text-slate-900">TT Scheduler</h1>
                <p className="text-sm text-slate-500">Smart Timetable</p>
              </div>
            </div>
          </motion.div>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Coordinator Portal
              </h2>
              <p className="text-slate-600 text-sm">
                Only authorized coordinators can access timetable management
              </p>
            </div>

            {signupSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6"
              >
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-green-700 text-sm">
                    Account created successfully! Please sign in with your credentials.
                  </span>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                  Coordinator ID
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter your coordinator ID"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-12"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign in as Coordinator
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-600 text-sm">
                New Coordinator?{' '}
                <Link to="/coordinator/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                  Create Coordinator Account
                </Link>
              </p>
            </div>
          </motion.div>

          {/* Back to Home */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <Link
              to="/"
              className="inline-flex items-center text-slate-500 hover:text-slate-700 text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Home
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage
