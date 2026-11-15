import { createContext, useContext, useState, type ReactNode } from 'react'

import type { Student } from '../types'

const STORAGE_KEY = 'ce_student'

interface AuthContextValue {
  student: Student | null
  login: (student: Student) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Student) : null
  })

  const login = (s: Student) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    setStudent(s)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setStudent(null)
  }

  return <AuthContext.Provider value={{ student, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
