import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, LoginRequest, RegisterRequest, TokenResponse } from '../types'
import api from '../services/api'

const normalizeEmail = (value: string) => value.trim().toLowerCase()
const normalizeOptional = (value?: string | null) => {
  if (!value) {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}
const normalizePhone = (value?: string | null) => {
  const trimmed = normalizeOptional(value)
  if (!trimmed) {
    return undefined
  }
  return trimmed.replace(/[\s()\-]/g, '')
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  fetchCurrentUser: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post<TokenResponse>('/api/v1/auth/login', {
            email: normalizeEmail(credentials.email),
            password: credentials.password,
          })

          const { access_token, refresh_token, user } = response.data
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)

          if (user) {
            set({ user: user as User, isAuthenticated: true, isLoading: false })
          } else {
            await get().fetchCurrentUser()
            set({ isAuthenticated: true, isLoading: false })
          }
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || 'Login failed',
            isLoading: false,
          })
          throw error
        }
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null })
        try {
          const payload: RegisterRequest = {
            email: normalizeEmail(data.email),
            password: data.password,
            full_name: normalizeOptional(data.full_name),
            phone: normalizePhone(data.phone),
          }

          await api.post('/api/v1/auth/register', payload)

          await get().login({
            email: payload.email,
            password: data.password,
          })
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || 'Registration failed',
            isLoading: false,
          })
          throw error
        }
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, isAuthenticated: false })
      },

      fetchCurrentUser: async () => {
        try {
          const response = await api.get<User>('/api/v1/auth/me')
          set({ user: response.data, isAuthenticated: true })
        } catch (error) {
          set({ user: null, isAuthenticated: false })
          throw error
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
