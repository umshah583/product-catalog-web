"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"

interface AuthUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  tenantId: string
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY = "catalog_auth"

function loadStoredAuth(): AuthState {
  if (typeof window === "undefined") {
    return { user: null, accessToken: null, refreshToken: null, isLoading: true, isAuthenticated: false }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { user: null, accessToken: null, refreshToken: null, isLoading: false, isAuthenticated: false }
    }
    const parsed = JSON.parse(raw)
    return {
      user: parsed.user ?? null,
      accessToken: parsed.accessToken ?? null,
      refreshToken: parsed.refreshToken ?? null,
      isLoading: false,
      isAuthenticated: !!parsed.accessToken,
    }
  } catch {
    return { user: null, accessToken: null, refreshToken: null, isLoading: false, isAuthenticated: false }
  }
}

function storeAuth(user: AuthUser | null, accessToken: string | null, refreshToken: string | null) {
  if (typeof window === "undefined") return
  if (accessToken) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, accessToken, refreshToken }))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    setAuth(loadStoredAuth())
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || "Login failed")
    }

    const data = await response.json()
    storeAuth(data.user, data.accessToken, data.refreshToken)
    setAuth({
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      isLoading: false,
      isAuthenticated: true,
    })
  }, [])

  const logout = useCallback(() => {
    storeAuth(null, null, null)
    setAuth({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,
    })
  }, [])

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

/** Returns the access token for use by the API client. */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw).accessToken ?? null
  } catch {
    return null
  }
}
