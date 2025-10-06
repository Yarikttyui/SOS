import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api, API_BASE_URL } from '../services/api'

const HEALTH_ENDPOINT = '/api/v1/health'

type BackendStatus = 'online' | 'degraded' | 'offline'

type HealthState = {
  status: BackendStatus
  latency: number | null
  lastChecked: number | null
  message?: string
}

export function useBackendStatus(pollInterval = 30000) {
  const [state, setState] = useState<HealthState>({
    status: 'offline',
    latency: null,
    lastChecked: null,
    message: 'Нет данных'
  })
  const timerRef = useRef<number>()

  const checkOnce = useCallback(async () => {
    const start = performance.now()
    try {
      const response = await api.get(HEALTH_ENDPOINT, { timeout: 6000 })
      const latency = Math.round(performance.now() - start)

      const newStatus: BackendStatus = latency > 2000 ? 'degraded' : 'online'

      setState(() => ({
        status: newStatus,
        latency,
        lastChecked: Date.now(),
        message: response.data?.status ?? 'healthy'
      }))
    } catch (error) {
      setState(() => ({
        status: 'offline',
        latency: null,
        lastChecked: Date.now(),
        message: navigator.onLine ? 'Сервер недоступен' : 'Нет сети'
      }))
    }
  }, [])

  useEffect(() => {
    void checkOnce()

    timerRef.current = window.setInterval(() => {
      void checkOnce()
    }, pollInterval)

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
      }
    }
  }, [checkOnce, pollInterval])

  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({
        status: prev.latency && prev.latency > 2000 ? 'degraded' : 'online',
        latency: prev.latency,
        lastChecked: Date.now(),
        message: 'Соединение восстановлено'
      }))
      void checkOnce()
    }

    const handleOffline = () => {
      setState((prev) => ({
        ...prev,
        status: 'offline',
        latency: null,
        lastChecked: Date.now(),
        message: 'Устройство офлайн'
      }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkOnce])

  const details = useMemo(() => {
    const targetUrl = `${API_BASE_URL}${HEALTH_ENDPOINT}`
    return { ...state, targetUrl }
  }, [state])

  return {
    ...details,
    refresh: checkOnce
  }
}
