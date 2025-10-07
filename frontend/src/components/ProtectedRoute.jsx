import React from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated, hasRole, getUser } from '../utils/auth'

const ProtectedRoute = ({ children, requiredRole = null }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/coordinator/login" replace />
  }

  if (requiredRole && !hasRole(requiredRole)) {
    // Instead of redirecting to home, redirect to the user's appropriate role route
    const user = getUser()
    if (user?.role === 'teacher') {
      return <Navigate to="/teacher" replace />
    } else if (user?.role === 'coordinator') {
      return <Navigate to="/coordinator/login" replace />
    }
    // Fallback to home if role is unknown
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute