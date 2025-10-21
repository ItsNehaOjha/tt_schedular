import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { LogIn, Loader, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { authAPI } from '../utils/api'
import { setToken, setUser } from '../utils/auth'
import toast from 'react-hot-toast'

const LoginPage = ({ onLoginSuccess }) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const expectedRole = searchParams.get('role')
  const signupSuccess = searchParams.get('signup') === 'success'
  
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
      
      toast.success(`Welcome back, ${displayName}!`)
      
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

  if (error.code === 'ERR_NETWORK' && !error.response) {
  toast.error('Cannot connect to backend (possible CORS issue or server offline).');
  return;
}

  else if (status === 400 || status === 401) {
    toast.error(serverMsg || 'Invalid username or password.')
  } 
  else if (status === 403) {
    toast.error('Access denied. Unauthorized role or permissions.')
  } 
  else {
    toast.error(serverMsg || error.message || 'Unexpected login error.')
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

  const getRoleDisplayName = (role) => {
    return role ? role.charAt(0).toUpperCase() + role.slice(1) : ''
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
            <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {expectedRole ? `${getRoleDisplayName(expectedRole)} Login` : 'Login'}
            </h2>
            <p className="text-gray-600">
              {expectedRole 
                ? `Sign in to your ${expectedRole} account` 
                : 'Sign in to your account'
              }
            </p>
          </div>

          {signupSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-green-700">
                  Account created successfully! Please sign in with your credentials.
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                {expectedRole === 'coordinator' ? 'Coordinator ID' : 'Username'}
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input-field"
                placeholder={expectedRole === 'coordinator' ? 'Enter your coordinator ID' : 'Enter your username'}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="btn-primary w-full flex items-center justify-center"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {expectedRole === 'coordinator' && (
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/coordinator-signup" className="text-purple-600 hover:text-purple-500 font-medium">
                  Sign up here
                </Link>
              </p>
            </div>
          )}

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

export default LoginPage