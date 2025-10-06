import { useState, useEffect } from 'react'
import { AlertCircle, MapPin, Mic, Sparkles, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { useGeolocation } from '../../hooks/useGeolocation'
import { api } from '../../services/api'
import type { EmergencyType } from '../../types'

interface AIReferenceData {
  types: { code: string; name: string; description: string }[]
  priorities: { level: number; name: string; description: string }[]
  severity_levels: { code: string; name: string; description: string }[]
}

interface AIAnalysis {
  type: string
  type_name?: string
  type_description?: string
  priority: number
  priority_name?: string
  priority_description?: string
  severity: string
  severity_name?: string
  severity_description?: string
  keywords: string[]
  confidence: number
  estimated_victims: number | null
  location_hints: string[]
  required_resources: string[]
  immediate_actions: string[]
  risk_assessment: string
  warning?: string | null
  notes?: string | null
  model_used?: string
  provider?: string
  reference?: AIReferenceData
  llm_raw?: unknown
  error?: string
}

const FALLBACK_LOCATION = {
  latitude: 56.8587,
  longitude: 35.9176,
}

const PRIORITY_FALLBACKS: Record<number, { name: string; description: string; icon: string }> = {
  1: {
    name: 'Критический',
    description: 'Угроза жизни, необходим немедленный отклик',
    icon: '⚠️',
  },
  2: {
    name: 'Высокий',
    description: 'Срочная помощь, риск серьёзного ухудшения',
    icon: '🔴',
  },
  3: {
    name: 'Средний',
    description: 'Требуется помощь в ближайшее время',
    icon: '🟡',
  },
  4: {
    name: 'Низкий',
    description: 'Мониторинг ситуации, опасность минимальна',
    icon: '🟢',
  },
  5: {
    name: 'Информационный',
    description: 'Сообщение для учёта или планирования',
    icon: 'ℹ️',
  },
}

const SEVERITY_FALLBACKS: Record<string, { name: string; description: string }> = {
  low: {
    name: 'Низкая',
    description: 'Ситуация под контролем, риск минимален',
  },
  medium: {
    name: 'Средняя',
    description: 'Есть риски, требуются координированные действия',
  },
  high: {
    name: 'Высокая',
    description: 'Серьёзная угроза, необходимы усиленные меры',
  },
  critical: {
    name: 'Критическая',
    description: 'Немедленная опасность жизни и здоровью',
  },
}

const TYPE_FALLBACKS: Record<string, { name: string; description: string }> = {
  fire: {
    name: 'Пожар',
    description: 'Возгорание, дым или угроза распространения огня',
  },
  medical: {
    name: 'Медицинская помощь',
    description: 'Травмы, болезни, необходимость экстренной помощи',
  },
  police: {
    name: 'Полиция',
    description: 'Угроза безопасности, правонарушения или насилие',
  },
  water_rescue: {
    name: 'Спасение на воде',
    description: 'Опасность на воде, тонущий человек или наводнение',
  },
  mountain_rescue: {
    name: 'Горноспасательная операция',
    description: 'Инцидент в горах, лавины, застрявшие туристы',
  },
  search_rescue: {
    name: 'Поисково-спасательная операция',
    description: 'Пропавшие люди, необходимость расширенных поисков',
  },
  ecological: {
    name: 'Экологическая катастрофа',
    description: 'Химические выбросы, утечка газа или загрязнение среды',
  },
  general: {
    name: 'Общая ситуация',
    description: 'Нестандартная ситуация, требующая уточнения',
  },
}

const PRIORITY_STYLE_MAP: Record<number, { gradient: string; badgeClass: string }> = {
  1: {
    gradient: 'bg-gradient-to-r from-red-600 via-red-500 to-rose-500',
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
  },
  2: {
    gradient: 'bg-gradient-to-r from-orange-500 via-red-500 to-amber-500',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  3: {
    gradient: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-300',
    badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  4: {
    gradient: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-green-400',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  5: {
    gradient: 'bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
}

const SEVERITY_STYLE_MAP: Record<string, { badgeClass: string; bannerClass: string; icon: string }> = {
  critical: {
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
    bannerClass: 'bg-red-50 border border-red-200 text-red-800',
    icon: '🚨',
  },
  high: {
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
    bannerClass: 'bg-orange-50 border border-orange-200 text-orange-800',
    icon: '⚠️',
  },
  medium: {
    badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    bannerClass: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
    icon: '⚠️',
  },
  low: {
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    bannerClass: 'bg-emerald-50 border border-emerald-200 text-emerald-800',
    icon: '✅',
  },
}

const RISK_LABELS: Record<string, string> = {
  critical: 'Критический риск развития ситуации',
  high: 'Высокий риск развития ситуации',
  medium: 'Средний риск, требуется контроль',
  low: 'Низкий риск, ситуация стабильна',
  requires_verification: 'Требуется уточнение данных',
}

export default function SOSButton() {
  const [isEmergency, setIsEmergency] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [emergencyType, setEmergencyType] = useState<EmergencyType>('general')
  const [description, setDescription] = useState('')
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualLatitude, setManualLatitude] = useState('')
  const [manualLongitude, setManualLongitude] = useState('')
  const [useManualLocation, setUseManualLocation] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const {
    latitude,
    longitude,
    accuracy,
    error: geoError,
    message: geoMessage,
    source: locationSource,
    isLoading: locationLoading,
    getLocation,
    resetLocation,
  } = useGeolocation()
  const hasCoordinates = typeof latitude === 'number' && typeof longitude === 'number'

  const resolveProviderLabel = (analysis: AIAnalysis | null): string => {
    if (!analysis) return 'AI-помощник'
    const rawProvider = analysis.provider ?? analysis.model_used
    if (!rawProvider) return 'AI-помощник'
    const normalized = rawProvider.toLowerCase()
    if (normalized.includes('yandex')) {
      return 'Яндекс GPT Lite'
    }
    if (normalized.includes('gigachat')) {
      return 'Сбер GigaChat (устарело)'
    }
    return rawProvider
  }

  const getPriorityMeta = (analysis: AIAnalysis) => {
    const fromReference = analysis.reference?.priorities?.find(
      (item) => item.level === analysis.priority
    )
    const fallback = PRIORITY_FALLBACKS[analysis.priority] ?? PRIORITY_FALLBACKS[3]

    return {
      name: analysis.priority_name || fromReference?.name || fallback.name,
      description:
        analysis.priority_description || fromReference?.description || fallback.description,
      icon: fallback.icon,
    }
  }

  const getSeverityMeta = (analysis: AIAnalysis) => {
    const fromReference = analysis.reference?.severity_levels?.find(
      (item) => item.code === analysis.severity
    )
    const fallback = SEVERITY_FALLBACKS[analysis.severity] || SEVERITY_FALLBACKS.medium

    return {
      name: analysis.severity_name || fromReference?.name || fallback.name,
      description:
        analysis.severity_description || fromReference?.description || fallback.description,
    }
  }

  const getTypeMeta = (analysis: AIAnalysis) => {
    const fromReference = analysis.reference?.types?.find(
      (item) => item.code === analysis.type
    )
    const fallback = TYPE_FALLBACKS[analysis.type] || TYPE_FALLBACKS.general

    return {
      name: analysis.type_name || fromReference?.name || fallback.name || analysis.type,
      description:
        analysis.type_description || fromReference?.description || fallback.description,
    }
  }

  useEffect(() => {
    if (!showModal) {
      setManualLatitude('')
      setManualLongitude('')
      setUseManualLocation(false)
      setSuccessMessage(null)
      resetLocation()
    }
  }, [showModal, resetLocation])

  const handleSOSClick = async () => {
    console.log('🆘 SOS Button clicked!')
    setShowModal(true)
    setError(null)
    await getLocation()
  }

  const analyzeWithAI = async () => {
    if (!description || description.length < 10) {
      setError('Пожалуйста, добавьте более подробное описание для AI анализа')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await api.post('/api/v1/ai/analyze/text', {
        text: description,
        analysis_type: 'classify'
      })

      console.log('🤖 AI Response:', response.data)

      if (response.data.success) {
        const analysis = response.data.analysis
        console.log('📊 AI Analysis:', analysis)
        console.log('🎯 Confidence:', analysis.confidence)
        console.log('⚡ Immediate Actions:', analysis.immediate_actions)
        console.log('📋 Risk Assessment:', analysis.risk_assessment)
        
        setAiAnalysis(analysis)
        setShowAIModal(true)
        
        if (analysis.type) {
          setEmergencyType(analysis.type as EmergencyType)
        }
      }
    } catch (err: any) {
      console.error('AI analysis failed:', err)
  setError('Не удалось выполнить анализ в Яндекс GPT. Продолжаем без рекомендаций.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSubmitEmergency = async () => {
    let finalLatitude: number | null = hasCoordinates ? latitude! : null
    let finalLongitude: number | null = hasCoordinates ? longitude! : null

    if (!finalLatitude || !finalLongitude) {
      const manualLat = manualLatitude.trim()
      const manualLon = manualLongitude.trim()

      if (manualLat && manualLon) {
        const parsedLat = Number(manualLat.replace(',', '.'))
        const parsedLon = Number(manualLon.replace(',', '.'))

        if (Number.isNaN(parsedLat) || Number.isNaN(parsedLon)) {
          setError('Введите корректные координаты вручную или включите геолокацию')
          return
        }

        finalLatitude = parsedLat
        finalLongitude = parsedLon
      }
    }

    if (!finalLatitude || !finalLongitude) {
      finalLatitude = FALLBACK_LOCATION.latitude
      finalLongitude = FALLBACK_LOCATION.longitude
    }

    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await api.post('/api/v1/sos/', {
        type: emergencyType,
        latitude: finalLatitude.toString(),
        longitude: finalLongitude.toString(),
        title: title || `Экстренная ситуация: ${emergencyType}`,
        description: description || 'Требуется помощь',
      })

      if (description && description.length >= 10) {
        await analyzeWithAI()
      }

      setIsEmergency(true)
      setDescription('')
      setTitle('')
      setManualLatitude('')
      setManualLongitude('')
      setUseManualLocation(false)
      setSuccessMessage('Сигнал SOS отправлен. Спасатели получили уведомление.')
      
      setTimeout(() => {
        setIsEmergency(false)
      }, 5000)

      setTimeout(() => {
        setShowModal(false)
        setSuccessMessage(null)
      }, 4000)
    } catch (err: any) {
      console.error('Failed to create SOS alert:', err)
      setError(err.response?.data?.detail || 'Не удалось отправить сигнал SOS')
    } finally {
      setIsSubmitting(false)
    }
  }

  const emergencyTypes = [
    {
      value: 'fire',
      icon: '🔥',
      title: 'Пожар',
      description: 'Пламя, задымление, запах гари',
      accent: 'from-rose-500/40 via-red-500/30 to-amber-400/30',
    },
    {
      value: 'medical',
      icon: '🚑',
      title: 'Медицинская помощь',
      description: 'Травмы, потеря сознания, реанимация',
      accent: 'from-sky-500/40 via-blue-500/30 to-indigo-400/25',
    },
    {
      value: 'police',
      icon: '👮',
      title: 'Полиция',
      description: 'Угроза безопасности, правонарушения',
      accent: 'from-indigo-500/40 via-indigo-400/30 to-slate-400/25',
    },
    {
      value: 'water_rescue',
      icon: '🚤',
      title: 'Спасение на воде',
      description: 'Течение, утопление, наводнение',
      accent: 'from-cyan-400/40 via-sky-400/30 to-blue-400/25',
    },
    {
      value: 'mountain_rescue',
      icon: '⛰️',
      title: 'Горноспасательная',
      description: 'Лавина, обрыв, потеря ориентира',
      accent: 'from-amber-400/40 via-yellow-500/25 to-lime-400/20',
    },
    {
      value: 'search_rescue',
      icon: '🔍',
      title: 'Поисково-спасательная',
      description: 'Пропавшие люди, разведка местности',
      accent: 'from-purple-500/40 via-violet-500/30 to-pink-400/25',
    },
    {
      value: 'ecological',
      icon: '☢️',
      title: 'Экологическая',
      description: 'Химическая опасность, утечка газа',
      accent: 'from-emerald-500/40 via-green-500/25 to-lime-400/20',
    },
    {
      value: 'general',
      icon: '⚠️',
      title: 'Общая ситуация',
      description: 'Иной инцидент, требующий помощи',
      accent: 'from-slate-400/40 via-slate-500/25 to-zinc-500/20',
    },
  ]

  return (
    <>
      {/* SOS Button */}
      <div className="relative inline-block">
        {/* Pulse rings animation - behind button */}
        {!isEmergency && (
          <>
            <div className="absolute inset-0 rounded-full bg-red-500 animate-pulse-ring opacity-75 pointer-events-none -z-10"></div>
            <div className="absolute inset-0 rounded-full bg-red-500 animate-pulse-ring opacity-75 pointer-events-none -z-10 [animation-delay:1s]"></div>
          </>
        )}
        
        <button
          onClick={handleSOSClick}
          disabled={isEmergency}
          className={`
            relative z-10 w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full text-white font-bold
            transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-4
            disabled:cursor-not-allowed
            ${isEmergency 
              ? 'bg-gradient-success shadow-lg ring-green-300 scale-95' 
              : 'bg-gradient-emergency sos-button hover:scale-105 active:scale-95 ring-red-300'
            }
          `}
        >
          {isEmergency ? (
            <div className="flex flex-col items-center justify-center animate-fade-in">
              <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 mb-3" />
              <span className="text-xl sm:text-2xl font-bold">Помощь вызвана</span>
              <span className="text-sm sm:text-base font-normal mt-2 opacity-90">Ожидайте спасателей</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <span className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-2 text-red-600 drop-shadow-[0_0_12px_rgba(239,68,68,0.35)]">SOS</span>
              <span className="text-sm sm:text-base font-semibold text-red-500">Нажмите для вызова</span>
            </div>
          )}
        </button>
      </div>

      {/* Emergency Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/70 shadow-[0_40px_120px_rgba(15,23,42,0.55)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-32 -left-40 h-72 w-72 bg-rose-500/25 blur-[140px]" />
              <div className="absolute -bottom-36 -right-24 h-72 w-72 bg-sky-500/25 blur-[150px]" />
              <div className="absolute top-1/3 left-1/2 h-52 w-52 -translate-x-1/2 bg-amber-400/10 blur-[140px]" />
            </div>
            <div className="relative flex max-h-[92vh] flex-col">
              <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/85 px-6 py-5 backdrop-blur-xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-white/20 bg-white/10 p-2">
                      <AlertCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="section-title text-white/60">Экстренное обращение</p>
                      <h2 className="text-2xl font-semibold text-white">Вызов спасателей</h2>
                      <p className="text-xs text-white/60">
                        Уточните детали, чтобы команды отреагировали максимально быстро
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                      <Sparkles className="h-4 w-4" />
                      AI-приоритизация активна
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      aria-label="Закрыть окно"
                      className="btn-glass text-xs font-semibold uppercase tracking-wide"
                    >
                      <XCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Закрыть</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-7 overflow-y-auto px-6 pb-8 pt-6">
                <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-5 sm:p-6 shadow-[0_30px_80px_rgba(15,23,42,0.45)]">
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-16 -left-24 h-44 w-44 bg-sky-500/30 blur-[100px]" />
                    <div className="absolute bottom-0 right-0 h-40 w-40 bg-emerald-400/20 blur-[110px]" />
                  </div>
                  <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl border border-sky-300/40 bg-sky-400/15 p-3 text-sky-100">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-semibold text-white">Ваше местоположение</p>
                          <p className="text-xs text-white/50">
                            Координаты передаются диспетчерам в защищённом канале
                          </p>
                        </div>
                        {locationLoading ? (
                          <div className="flex items-center gap-2 text-sm text-white/80">
                            <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-transparent" />
                            Определяем GPS…
                          </div>
                        ) : hasCoordinates ? (
                          <div className="flex flex-col gap-3">
                            <span className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 font-mono text-sm text-white">
                              <span>{latitude?.toFixed(6)}</span>
                              <span className="text-white/40">,</span>
                              <span>{longitude?.toFixed(6)}</span>
                            </span>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 font-semibold text-emerald-200">
                                ✓ {locationSource === 'gps' ? 'GPS-точность' : 'Используются уточнённые координаты'}
                              </span>
                              {accuracy && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-white/70">
                                  ± {Math.round(accuracy)} м
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => setUseManualLocation((prev) => !prev)}
                                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70 transition hover:border-white/30 hover:text-white"
                              >
                                {useManualLocation ? 'Скрыть ручной ввод' : 'Добавить вручную'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3 text-sm text-white/80">
                            <p className="font-semibold text-amber-200">
                              ⚠️ Не удалось определить местоположение автоматически
                            </p>
                            {geoError && (
                              <p className="text-xs text-rose-200 leading-snug">{geoError}</p>
                            )}
                            {geoMessage && (
                              <p className="text-xs text-amber-200/80 leading-snug">{geoMessage}</p>
                            )}
                            <p className="text-xs text-white/60 leading-snug">
                              Укажите координаты вручную или повторите попытку. При отсутствии данных будет применено
                              резервное расположение ({FALLBACK_LOCATION.latitude.toFixed(4)}, {FALLBACK_LOCATION.longitude.toFixed(4)}).
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs font-semibold">
                              <button
                                type="button"
                                onClick={getLocation}
                                className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-sky-100 transition-colors hover:border-sky-300/60 hover:text-white"
                              >
                                Повторить попытку
                              </button>
                              <button
                                type="button"
                                onClick={() => setUseManualLocation((prev) => !prev)}
                                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70 transition hover:border-white/30 hover:text-white"
                              >
                                {useManualLocation ? 'Скрыть ручной ввод' : 'Ввести координаты вручную'}
                              </button>
                            </div>
                          </div>
                        )}
                        {useManualLocation && (
                          <div className="relative mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-4 sm:p-5">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wide text-white/60">
                                  Широта
                                </label>
                                <input
                                  type="text"
                                  value={manualLatitude}
                                  onChange={(e) => setManualLatitude(e.target.value)}
                                  className="input-modern text-sm"
                                  placeholder="Например, 56.8587"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wide text-white/60">
                                  Долгота
                                </label>
                                <input
                                  type="text"
                                  value={manualLongitude}
                                  onChange={(e) => setManualLongitude(e.target.value)}
                                  className="input-modern text-sm"
                                  placeholder="Например, 35.9176"
                                />
                              </div>
                            </div>
                            <p className="mt-3 text-xs text-white/50">
                              Используйте десятичный формат. Поля можно оставить пустыми — система подставит резервные координаты.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    {hasCoordinates && (
                      <div className="flex flex-col items-start gap-3 text-xs text-white/70">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1">
                          Источник: {locationSource === 'gps' ? 'Satellite/GPS' : 'Сети и сервисы'}
                        </span>
                        {accuracy && (
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1">
                            Точность {Math.round(accuracy)} м
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={getLocation}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70 transition hover:border-white/30 hover:text-white"
                        >
                          Обновить координаты
                        </button>
                      </div>
                    )}
                  </div>
                </section>

                <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6 backdrop-blur-xl shadow-[0_28px_70px_rgba(15,23,42,0.38)]">
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-12 right-0 h-40 w-40 bg-rose-400/15 blur-[120px]" />
                    <div className="absolute bottom-0 left-[-60px] h-48 w-48 bg-purple-500/15 blur-[110px]" />
                  </div>
                  <div className="relative space-y-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                      <div>
                        <p className="section-title text-white/60">Тип чрезвычайной ситуации</p>
                        <h3 className="text-xl font-semibold text-white">Что произошло?</h3>
                      </div>
                      <p className="text-xs text-white/50 sm:text-right">
                        Выберите категорию — это влияет на приоритет и состав бригады
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {emergencyTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setEmergencyType(type.value as EmergencyType)}
                          className={`group relative overflow-hidden rounded-2xl border px-4 py-5 text-left transition-all duration-200 ${
                            emergencyType === type.value
                              ? 'border-rose-300/80 bg-white/10 shadow-[0_20px_45px_rgba(244,114,182,0.35)] ring-2 ring-rose-300/50'
                              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                          }`}
                        >
                          <div
                            className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-60 ${
                              emergencyType === type.value ? 'opacity-80' : ''
                            } bg-gradient-to-br ${type.accent}`}
                          />
                          <div className="relative z-10 flex flex-col gap-3 text-white">
                            <span className="text-3xl leading-none">{type.icon}</span>
                            <div className="space-y-1">
                              <p className="text-sm font-semibold">{type.title}</p>
                              <p className="text-xs leading-snug text-white/70">{type.description}</p>
                            </div>
                          </div>
                          {emergencyType === type.value && (
                            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                              ✓ Выбрано
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-5 sm:p-6 shadow-[0_28px_70px_rgba(15,23,42,0.4)] backdrop-blur-xl">
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute top-0 right-[-60px] h-48 w-48 bg-rose-500/20 blur-[130px]" />
                  </div>
                  <div className="relative grid gap-5 lg:grid-cols-5">
                    <div className="space-y-2 lg:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
                        Заголовок (опционально)
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="input-modern"
                        placeholder="Например: ДТП на трассе, человек без сознания"
                      />
                    </div>
                    <div className="space-y-2 lg:col-span-3">
                      <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
                        Описание ситуации
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={5}
                        className="input-modern resize-none"
                        placeholder="Опишите, что случилось, сколько пострадавших, опасные факторы, нужны ли специальные службы..."
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
                        <p>💡 Подробное описание ускорит реакцию и улучшит рекомендации AI</p>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-white/70">
                          {description.length} / 800
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {error && (
                  <div className="rounded-3xl border border-rose-400/50 bg-rose-500/10 p-4 text-sm text-rose-100 backdrop-blur">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-rose-200" />
                      <p className="font-medium">{error}</p>
                    </div>
                  </div>
                )}

                {successMessage && !showAIModal && (
                  <div className="rounded-3xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-sm text-emerald-100 backdrop-blur">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-200" />
                      <p className="font-medium">{successMessage}</p>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="group relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 text-left shadow-[0_24px_60px_rgba(168,85,247,0.25)] transition hover:border-white/30 hover:bg-white/10"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-sky-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative flex items-center justify-center gap-3">
                    <div className="rounded-2xl border border-purple-300/40 bg-purple-500/15 p-3 text-purple-100">
                      <Mic className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <span className="block text-sm font-semibold text-white">Описать голосом</span>
                      <span className="text-xs text-white/60">Скоро будет доступно</span>
                    </div>
                  </div>
                </button>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Закрыть
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitEmergency}
                    disabled={isSubmitting || isAnalyzing}
                    className="btn-primary flex-1"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Отправка...
                      </span>
                    ) : isAnalyzing ? (
                      <span className="flex items-center justify-center gap-2">
                        <Sparkles className="h-5 w-5 animate-pulse" />
                        AI анализ...
                      </span>
                    ) : (
                      '🚨 Отправить SOS'
                    )}
                  </button>
                </div>

                <div className="relative overflow-hidden rounded-3xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-100 backdrop-blur">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-rose-500/10" />
                  <div className="relative flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-200" />
                    <p>
                      <span className="font-semibold">Важно:</span> Ложный вызов экстренных служб преследуется по закону.
                      Убедитесь, что ситуация действительно требует немедленного вмешательства.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Modal */}
      {showAIModal && aiAnalysis && (() => {
        const providerLabel = resolveProviderLabel(aiAnalysis)
        const priorityMeta = getPriorityMeta(aiAnalysis)
        const severityMeta = getSeverityMeta(aiAnalysis)
        const typeMeta = getTypeMeta(aiAnalysis)

        const priorityLevel = Math.min(5, Math.max(1, aiAnalysis.priority || 3))
        const priorityStyles = PRIORITY_STYLE_MAP[priorityLevel] ?? PRIORITY_STYLE_MAP[3]
        const severityStyles = SEVERITY_STYLE_MAP[aiAnalysis.severity] ?? SEVERITY_STYLE_MAP.medium
        const confidenceValue =
          typeof aiAnalysis.confidence === 'number'
            ? Math.round(Math.max(0, Math.min(1, aiAnalysis.confidence)) * 100)
            : null
        const riskLabel = RISK_LABELS[aiAnalysis.risk_assessment] || aiAnalysis.risk_assessment

        const metadataChips = [
          {
            key: 'type',
            label: typeMeta.name,
            description: typeMeta.description,
            className: 'bg-blue-100 text-blue-800 border border-blue-200',
          },
          {
            key: 'priority',
            label: `${priorityMeta.icon ?? ''} ${priorityMeta.name}`.trim(),
            description: priorityMeta.description,
            className: `border ${priorityStyles.badgeClass}`.trim(),
          },
          {
            key: 'severity',
            label: severityMeta.name,
            description: severityMeta.description,
            className: `border ${severityStyles.badgeClass}`.trim(),
          },
        ].filter((chip) => Boolean(chip.label))

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="card-modern max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-5 sm:p-6 rounded-t-2xl z-10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                        <span>🤖 Анализ ситуации</span>
                        <span className="text-sm text-purple-100">{providerLabel}</span>
                      </h2>
                      <p className="text-sm opacity-90">
                        {confidenceValue !== null
                          ? `Уверенность модели: ${confidenceValue}%`
                          : 'Уверенность модели уточняется'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAIModal(false)}
                    className="text-purple-50 hover:text-white text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Success Banner */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">Вызов успешно отправлен!</p>
                    <p className="text-sm text-green-700">
                      Спасатели получили уведомление и уже направляются к вам
                    </p>
                  </div>
                </div>
              </div>

              {metadataChips.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {metadataChips.map((chip) => (
                    <span
                      key={chip.key}
                      className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-colors ${chip.className}`}
                      title={chip.description}
                    >
                      {chip.label}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid gap-4 mb-6 md:grid-cols-3">
                <div className={`rounded-2xl p-4 text-white shadow ${priorityStyles.gradient}`}>
                  <p className="text-sm text-white/80 font-medium">Приоритет</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight">{priorityLevel}</span>
                    <span className="text-lg font-semibold text-white/90 flex items-center gap-1">
                      {priorityMeta.icon && <span>{priorityMeta.icon}</span>}
                      {priorityMeta.name}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-white/80 leading-relaxed">{priorityMeta.description}</p>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm text-blue-600 font-medium">Тип чрезвычайной ситуации</p>
                  <p className="mt-1 text-xl font-bold text-blue-800">{typeMeta.name}</p>
                  <p className="mt-2 text-xs text-blue-700 leading-relaxed">{typeMeta.description}</p>
                  {aiAnalysis.warning && (
                    <p className="mt-3 text-xs font-semibold text-red-600" title="Предупреждение модели">
                      ⚠️ {aiAnalysis.warning}
                    </p>
                  )}
                </div>

                <div className={`rounded-2xl p-4 ${severityStyles.bannerClass}`}>
                  <p className="text-sm font-medium">Тяжесть последствий</p>
                  <p className="mt-1 text-xl font-bold flex items-center gap-2">
                    <span>{severityStyles.icon}</span>
                    <span>{severityMeta.name}</span>
                  </p>
                  <p className="mt-2 text-xs leading-relaxed">{severityMeta.description}</p>
                  <p className="mt-3 text-xs font-semibold">
                    Риск: {riskLabel || 'оценка уточняется'}
                  </p>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-yellow-900 mb-1">Оценка рисков</p>
                    <p className="text-sm text-yellow-800">
                      {aiAnalysis.risk_assessment || 'Требуется уточнение'}
                    </p>

                    {aiAnalysis.notes && (
                      <p className="mt-3 text-xs text-yellow-700">{aiAnalysis.notes}</p>
                    )}

                    {aiAnalysis.error && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs font-semibold text-red-800 mb-1">⚠️ Ошибка AI анализа</p>
                        <p className="text-xs text-red-700">{aiAnalysis.error}</p>
                        <p className="text-xs text-red-600 mt-2">
                          Возможные причины: недоступность сервиса Яндекс GPT, исчерпанная квота или временная сетевая проблема.
                          Вызов успешно отправлен, но рекомендации могли быть неполными.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Immediate Actions */}
              {aiAnalysis.immediate_actions && aiAnalysis.immediate_actions.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="text-red-600">⚡</span>
                    Немедленные действия
                  </h3>
                  <ul className="space-y-2">
                    {aiAnalysis.immediate_actions.map((action, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-red-600 font-bold">{index + 1}.</span>
                        <span className="text-gray-700">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Required Resources */}
              {aiAnalysis.required_resources && aiAnalysis.required_resources.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="text-blue-600">🚒</span>
                    Необходимые ресурсы
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysis.required_resources.map((resource, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {resource}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Estimated Victims */}
              {aiAnalysis.estimated_victims !== null && (
                <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-600 font-medium">Пострадавшие</p>
                  <p className="text-xl font-bold text-purple-700">
                    Примерно {aiAnalysis.estimated_victims} человек(а)
                  </p>
                </div>
              )}

              {/* Keywords */}
              {aiAnalysis.keywords && aiAnalysis.keywords.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">Ключевые слова</h3>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysis.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        #{keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Hints */}
              {aiAnalysis.location_hints && aiAnalysis.location_hints.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    Подсказки по местоположению
                  </h3>
                  <ul className="space-y-1">
                    {aiAnalysis.location_hints.map((hint, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-green-600">•</span>
                        <span>{hint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setShowAIModal(false)}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Понятно
              </button>

              {/* Debug Info */}
              <details className="mt-4 text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  🐛 Debug: Показать полные данные AI
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-60">
                  {JSON.stringify(aiAnalysis, null, 2)}
                </pre>
              </details>

              <p className="text-xs text-center text-gray-500 mt-4">
                Анализ выполнен с помощью {providerLabel}
              </p>
            </div>
          </div>
        )
      })()}
    </>
  )
}
