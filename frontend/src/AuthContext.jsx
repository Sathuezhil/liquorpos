import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEY = 'liquorpos_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const value = useMemo(
    () => ({
      user,
      login(username, password) {
        const name = username.trim()
        if (!name || !password) {
          return { ok: false, error: 'Enter username and password' }
        }
        // Demo auth — replace with real API later
        if (name.toLowerCase() === 'admin' && password === 'admin') {
          const next = { name: 'Admin', role: 'admin' }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
          setUser(next)
          return { ok: true }
        }
        return { ok: false, error: 'Invalid username or password' }
      },
      logout() {
        localStorage.removeItem(STORAGE_KEY)
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
