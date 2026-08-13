import { createContext, useContext, useMemo, useState } from 'react'
import { api } from './api'

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
      async login(username, password) {
        const name = username.trim()
        if (!name || !password) {
          return { ok: false, error: 'Enter username and password' }
        }
        try {
          const res = await api.login(name, password)
          const next = {
            id: res.data.id,
            name: res.data.name,
            username: res.data.username,
            role: res.data.role,
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
          setUser(next)
          return { ok: true }
        } catch (err) {
          return { ok: false, error: err.message || 'Invalid username or password' }
        }
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
