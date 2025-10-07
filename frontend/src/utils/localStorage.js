// Utility functions for localStorage management

export const getStoredState = (key, defaultValue = null) => {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch (error) {
    console.warn(`Error parsing localStorage key "${key}":`, error)
    return defaultValue
  }
}

export const setStoredState = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn(`Error setting localStorage key "${key}":`, error)
  }
}

export const removeStoredState = (key) => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.warn(`Error removing localStorage key "${key}":`, error)
  }
}

export const clearStoredState = (prefix) => {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.warn(`Error clearing localStorage with prefix "${prefix}":`, error)
  }
}

// Custom hook for persistent state
export const usePersistentState = (key, defaultValue) => {
  const [state, setState] = useState(() => getStoredState(key, defaultValue))

  useEffect(() => {
    setStoredState(key, state)
  }, [key, state])

  return [state, setState]
}