import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../services/authApi'
import { UNAUTHORIZED_EVENT, tokenStorage } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  // True while a saved token is being checked, so a refresh doesn't flash the
  // signed-out site.
  const [initializing, setInitializing] = useState(() => Boolean(tokenStorage.get()))

  // Restore the session on first load.
  useEffect(() => {
    let cancelled = false

    if (!tokenStorage.get()) {
      setInitializing(false)
      return undefined
    }

    authApi
      .me()
      .then((currentUser) => {
        if (!cancelled) setUser(currentUser)
      })
      .catch((error) => {
        if (error.response?.status === 401) tokenStorage.clear()
      })
      .finally(() => {
        if (!cancelled) setInitializing(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Any 401 from the API (see services/api.js) lands here → back to login.
  useEffect(() => {
    function handleUnauthorized() {
      setUser(null)
      navigate('/login', {
        replace: true,
        state: { message: 'Your session has expired. Please sign in again.' },
      })
    }

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [navigate])

  const login = useCallback(async (credentials) => {
    const { user: loggedInUser, token } = await authApi.login(credentials)
    tokenStorage.set(token)
    setUser(loggedInUser)
    return loggedInUser
  }, [])

  const register = useCallback(async (payload) => {
    const { user: newUser, token } = await authApi.register(payload)
    tokenStorage.set(token)
    setUser(newUser)
    return newUser
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // The token may already be invalid; clear it locally either way.
    }
    tokenStorage.clear()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      initializing,
      isAdmin: user?.role === 'admin',
      isCustomer: user?.role === 'customer',
      login,
      register,
      logout,
    }),
    [user, initializing, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}

/** Where each role lands after signing in. */
// eslint-disable-next-line react-refresh/only-export-components
export function homePathFor(user) {
  return user?.role === 'admin' ? '/admin' : '/'
}
