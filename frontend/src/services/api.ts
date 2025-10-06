import axios from 'axios'

const rawEnvUrl = import.meta.env.VITE_API_URL
const fallbackUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000'

const normalizeBaseUrl = (url: string) => {
  const trimmed = url.replace(/\/+$/, '')
  return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed
}

const trimTrailingSlash = (url: string) => url.replace(/\/+$/, '')

export const API_BASE_URL = normalizeBaseUrl(rawEnvUrl || fallbackUrl)

const buildAndroidDownloadUrl = () => {
  const explicitUrl = import.meta.env.VITE_ANDROID_APK_URL
  if (explicitUrl) {
    return trimTrailingSlash(explicitUrl)
  }
  return `${API_BASE_URL}/api/v1/downloads/android`
}

export const ANDROID_APK_URL = buildAndroidDownloadUrl()
export const ANDROID_APK_METADATA_URL = `${trimTrailingSlash(ANDROID_APK_URL)}/metadata`

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        })

        const { access_token, refresh_token } = response.data
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)

        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
