import { useState, useCallback } from 'react'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  message: string | null
  source: 'gps' | 'ip' | null
  isLoading: boolean
}

async function fetchIpFallback(signal?: AbortSignal) {
  const response = await fetch('https://ipapi.co/json/', { signal })
  if (!response.ok) {
    throw new Error('IP geolocation request failed')
  }
  const data = await response.json()

  if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
    throw new Error('IP geolocation returned invalid coordinates')
  }

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    accuracy: null,
  }
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    message: null,
    source: null,
    isLoading: false,
  })

  const getLocation = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      message: 'Определяем координаты...',
    }))

    const supportsGeolocation = typeof window !== 'undefined' && 'geolocation' in navigator

    if (supportsGeolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 0,
          })
        })

        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          message: 'Координаты получены через GPS',
          source: 'gps',
          isLoading: false,
        })
        return
      } catch (error: any) {
        const message = error?.message || 'Не удалось получить координаты через GPS'
        setState(prev => ({
          ...prev,
          error: message,
          message: 'Пробуем определить координаты по IP-адресу...',
        }))
      }
    } else {
      setState(prev => ({
        ...prev,
        error: 'Ваш браузер не поддерживает геолокацию',
        message: 'Пробуем приблизительное определение по IP-адресу...',
      }))
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 7000)
      const ipLocation = await fetchIpFallback(controller.signal)
      clearTimeout(timeout)

      setState({
        latitude: ipLocation.latitude,
        longitude: ipLocation.longitude,
        accuracy: ipLocation.accuracy,
        error: null,
        message: 'Используем приблизительные координаты по IP-адресу',
        source: 'ip',
        isLoading: false,
      })
    } catch (ipError: any) {
      setState(prev => ({
        ...prev,
        error: ipError?.message || 'Не удалось определить координаты',
        message: null,
        isLoading: false,
        source: null,
      }))
    }
  }, [])

  const resetLocation = useCallback(() => {
    setState({
      latitude: null,
      longitude: null,
      accuracy: null,
      error: null,
      message: null,
      source: null,
      isLoading: false,
    })
  }, [])

  return {
    ...state,
    getLocation,
    resetLocation,
  }
}
