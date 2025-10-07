// Auth utility functions
// Token management
export const getToken = () => {
  return localStorage.getItem('token')
}

export const setToken = (token) => {
  localStorage.setItem('token', token)
}

export const removeToken = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

// User management
export const getUser = () => {
  const user = localStorage.getItem('user')
  if (!user || user === 'undefined' || user === 'null') {
    return null
  }
  try {
    return JSON.parse(user)
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error)
    // Clear invalid data
    localStorage.removeItem('user')
    return null
  }
}

export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user))
}

export const removeUser = () => {
  localStorage.removeItem('user')
}

// Auth state
export const isAuthenticated = () => {
  return !!getToken()
}

export const hasRole = (role) => {
  const user = getUser()
  return user?.role === role
}

export const logout = () => {
  removeToken()
  removeUser()
  
  // Clear all coordinator-related localStorage data on logout
  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    if (key.startsWith('coordinator') || key.startsWith('teacher') || key.startsWith('student')) {
      localStorage.removeItem(key)
    }
  })
  
  window.location.href = '/'
}