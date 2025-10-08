import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../services/api'
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  User,
  LogOut,
  RefreshCw,
  Filter,
  Flame,
  Heart,
  Shield,
  Waves,
  Mountain,
  Search,
  Leaf,
  AlertTriangle,
  TrendingUp,
  Activity,
  BarChart3,
  Phone
} from 'lucide-react'
import type { SOSAlert, DashboardStats } from '../../types'

const DEFAULT_STATS: DashboardStats = {
  total_alerts: 0,
  active_alerts: 0,
  today_alerts: 0,
  by_status: {
    pending: 0,
    assigned: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0
  },
  by_type: {
    fire: 0,
    medical: 0,
    police: 0,
    water_rescue: 0,
    mountain_rescue: 0,
    search_rescue: 0,
    ecological: 0,
    general: 0
  }
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/15 border border-amber-400/40 text-amber-100',
  assigned: 'bg-sky-500/15 border border-sky-400/40 text-sky-100',
  in_progress: 'bg-violet-500/15 border border-violet-400/40 text-violet-100',
  completed: 'bg-emerald-500/15 border border-emerald-400/40 text-emerald-100',
  cancelled: 'bg-slate-500/15 border border-slate-400/40 text-slate-200',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидание',
  assigned: 'Назначено',
  in_progress: 'В работе',
  completed: 'Завершено',
  cancelled: 'Отменено',
}

const STATUS_EMOJIS: Record<string, string> = {
  pending: '⏳',
  assigned: '🗂️',
  in_progress: '🚀',
  completed: '✅',
  cancelled: '✖️',
}

const PRIORITY_STYLES: Record<number, { badge: string; ring: string; label: string }> = {
  1: {
    badge: 'bg-rose-500/20 border border-rose-400/40 text-rose-100',
    ring: 'from-rose-500 via-red-500 to-orange-400',
    label: 'P1 · Критический',
  },
  2: {
    badge: 'bg-orange-500/20 border border-orange-400/40 text-orange-100',
    ring: 'from-orange-500 via-amber-500 to-yellow-400',
    label: 'P2 · Высокий',
  },
  3: {
    badge: 'bg-yellow-500/20 border border-yellow-400/40 text-yellow-100',
    ring: 'from-yellow-500 via-lime-500 to-emerald-400',
    label: 'P3 · Средний',
  },
  4: {
    badge: 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-100',
    ring: 'from-emerald-500 via-teal-500 to-sky-400',
    label: 'P4 · Низкий',
  },
}

const EMERGENCY_LABELS: Record<string, string> = {
  fire: 'Пожар',
  medical: 'Медицина',
  police: 'Полиция',
  water_rescue: 'Водная спасательная',
  mountain_rescue: 'Горная спасательная',
  search_rescue: 'Поисково-спасательная',
  ecological: 'Экологическая',
  general: 'Общий вызов',
}

export default function OperatorDashboard() {
  const { user, logout } = useAuthStore()
  const [alerts, setAlerts] = useState<SOSAlert[]>([])
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS)
  const [hasStats, setHasStats] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterType !== 'all') params.append('type', filterType)
      
      const alertsResponse = await api.get(`/api/v1/sos/?${params}`)
      const rawAlerts = alertsResponse.data as unknown
      let normalizedAlerts: SOSAlert[] = []
      if (Array.isArray(rawAlerts)) {
        normalizedAlerts = rawAlerts as SOSAlert[]
      } else if (rawAlerts && typeof rawAlerts === 'object' && Array.isArray((rawAlerts as any).items)) {
        normalizedAlerts = (rawAlerts as any).items as SOSAlert[]
      }
      setAlerts(normalizedAlerts)

      const statsResponse = await api.get('/api/v1/analytics/dashboard')
      const statsPayload = (statsResponse.data ?? {}) as Partial<DashboardStats>
      const safeStats: DashboardStats = {
        ...DEFAULT_STATS,
        ...statsPayload,
        by_status: {
          ...DEFAULT_STATS.by_status,
          ...(statsPayload.by_status ?? {})
        },
        by_type: {
          ...DEFAULT_STATS.by_type,
          ...(statsPayload.by_type ?? {})
        }
      }
      setStats(safeStats)
      setHasStats(true)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setHasStats(false)
      setStats(DEFAULT_STATS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [filterStatus, filterType])

  const handleAssignAlert = async (alertId: string) => {
    try {
      await api.patch(`/api/v1/sos/${alertId}`, {
        status: 'assigned'
      })
      fetchData()
    } catch (error) {
      console.error('Failed to assign alert:', error)
    }
  }

  const handleUpdateStatus = async (alertId: string, status: string) => {
    try {
      await api.patch(`/api/v1/sos/${alertId}`, { status })
      fetchData()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const getTypeIconComponent = (type: string) => {
    const baseClass = 'h-5 w-5'
    switch (type) {
      case 'fire':
        return <Flame className={`${baseClass} text-rose-300`} />
      case 'medical':
        return <Heart className={`${baseClass} text-sky-300`} />
      case 'police':
        return <Shield className={`${baseClass} text-indigo-300`} />
      case 'water_rescue':
        return <Waves className={`${baseClass} text-cyan-300`} />
      case 'mountain_rescue':
        return <Mountain className={`${baseClass} text-amber-300`} />
      case 'search_rescue':
        return <Search className={`${baseClass} text-orange-300`} />
      case 'ecological':
        return <Leaf className={`${baseClass} text-emerald-300`} />
      default:
        return <AlertTriangle className={`${baseClass} text-slate-300`} />
    }
  }

  const getStatusBadge = (status: string) => {
    const key = status.toLowerCase()
    const badgeClass = STATUS_STYLES[key] ?? 'bg-slate-500/15 border border-slate-400/40 text-slate-100'
    const label = STATUS_LABELS[key] ?? status
    const emoji = STATUS_EMOJIS[key] ?? 'ℹ️'

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide uppercase ${badgeClass}`}>
        <span>{emoji}</span>
        <span>{label}</span>
      </span>
    )
  }

  const getPriorityVisuals = (priority: number) => {
    return (
      PRIORITY_STYLES[priority] ?? {
        badge: 'bg-slate-500/20 border border-slate-400/40 text-slate-200',
        ring: 'from-slate-600 via-slate-500 to-slate-400',
        label: `P${priority} · Приоритет`,
      }
    )
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 60000)
    
    if (diff < 1) return 'Только что'
    if (diff < 60) return `${diff} мин назад`
    if (diff < 1440) return `${Math.floor(diff / 60)} ч назад`
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const statusEntries = Object.entries(stats.by_status || {})
  const typeEntries = Object.entries(stats.by_type || {})
  const topTypes = typeEntries
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
  const totalTypesCount = typeEntries.reduce((acc, [, value]) => acc + value, 0)

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.22),transparent_60%)]" />
        <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.2),transparent_65%)]" />
      </div>

      <header className="border-b border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-500 p-3 shadow-xl shadow-indigo-500/40">
                <Phone className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                  Unified Command Center
                </p>
                <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
                  Панель оператора
                </h1>
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                  <User className="h-4 w-4 text-slate-400" />
                  {user?.full_name || user?.email}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={fetchData}
                disabled={loading}
                className="group flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/20 disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 text-sky-200 transition ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                <span>Обновить данные</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center justify-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:border-rose-400 hover:bg-rose-500/20"
              >
                <LogOut className="h-4 w-4" />
                <span>Выйти из системы</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8 lg:px-12">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
          <div className="space-y-8">
            {hasStats && (
              <>
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 p-6 shadow-xl transition duration-200 hover:-translate-y-1 hover:shadow-2xl">
                    <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/20 blur-3xl" />
                    <div className="flex items-center justify-between">
                      <div className="rounded-2xl bg-white/15 p-3">
                        <BarChart3 className="h-7 w-7 text-white" />
                      </div>
                      <TrendingUp className="h-5 w-5 text-white/60" />
                    </div>
                    <p className="mt-6 text-sm font-medium uppercase tracking-[0.3em] text-white/70">
                      Всего тревог
                    </p>
                    <p className="mt-2 text-4xl font-semibold text-white">{stats.total_alerts ?? 0}</p>
                  </article>

                  <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 shadow-xl transition duration-200 hover:-translate-y-1 hover:shadow-2xl">
                    <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 blur-3xl" />
                    <div className="flex items-center justify-between">
                      <div className="rounded-2xl bg-white/15 p-3">
                        <Activity className="h-7 w-7 text-white" />
                      </div>
                      <AlertTriangle className="h-5 w-5 text-white/70" />
                    </div>
                    <p className="mt-6 text-sm font-medium uppercase tracking-[0.3em] text-white/80">
                      Активные сейчас
                    </p>
                    <p className="mt-2 text-4xl font-semibold text-white">{stats.active_alerts ?? 0}</p>
                  </article>

                  <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 p-6 shadow-xl transition duration-200 hover:-translate-y-1 hover:shadow-2xl">
                    <div className="absolute -left-10 top-0 h-28 w-28 rounded-full bg-white/20 blur-3xl" />
                    <div className="flex items-center justify-between">
                      <div className="rounded-2xl bg-white/15 p-3">
                        <Clock className="h-7 w-7 text-white" />
                      </div>
                      <TrendingUp className="h-5 w-5 text-white/70" />
                    </div>
                    <p className="mt-6 text-sm font-medium uppercase tracking-[0.3em] text-white/80">
                      За последние 24ч
                    </p>
                    <p className="mt-2 text-4xl font-semibold text-white">{stats.today_alerts ?? 0}</p>
                  </article>

                  <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 p-6 shadow-xl transition duration-200 hover:-translate-y-1 hover:shadow-2xl">
                    <div className="absolute bottom-0 right-0 h-28 w-28 rounded-full bg-white/20 blur-3xl" />
                    <div className="flex items-center justify-between">
                      <div className="rounded-2xl bg-white/15 p-3">
                        <CheckCircle className="h-7 w-7 text-white" />
                      </div>
                      <TrendingUp className="h-5 w-5 text-white/70" />
                    </div>
                    <p className="mt-6 text-sm font-medium uppercase tracking-[0.3em] text-white/80">
                      Закрытые кейсы
                    </p>
                    <p className="mt-2 text-4xl font-semibold text-white">{stats.by_status?.completed ?? 0}</p>
                  </article>
                </section>

                <section className="grid gap-4 lg:grid-cols-2">
                  <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-white">Статус тревог</h2>
                        <p className="text-sm text-slate-400">Мониторинг распределения по этапам реагирования</p>
                      </div>
                      <BarChart3 className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="mt-6 space-y-4">
                      {statusEntries.map(([statusKey, value]) => {
                        const normalized = statusKey as string
                        const badgeClass = STATUS_STYLES[normalized] ?? 'bg-slate-500/15 border border-slate-400/40 text-slate-200'
                        const label = STATUS_LABELS[normalized] ?? normalized
                        const percentage = stats.total_alerts ? Math.round((value / Math.max(stats.total_alerts, 1)) * 100) : 0

                        return (
                          <div key={statusKey} className="space-y-2">
                            <div className="flex items-center justify-between text-sm text-slate-300">
                              <span className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ${badgeClass}`}>
                                  {STATUS_EMOJIS[normalized] ?? '•'}
                                  {label}
                                </span>
                              </span>
                              <span className="font-semibold text-white">{value}</span>
                            </div>
                            <progress
                              value={value}
                              max={Math.max(stats.total_alerts ?? 1, 1)}
                              aria-label={`Доля статуса ${label}`}
                              className="progress-track"
                              data-percentage={percentage}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </article>

                  <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-white">Типы инцидентов</h2>
                        <p className="text-sm text-slate-400">Топ категорий за выбранный период</p>
                      </div>
                      <Activity className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="mt-6 space-y-4">
                      {topTypes.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-white/20 bg-slate-900/40 p-4 text-sm text-slate-400">
                          Данные по типам тревог появятся после получения первых сигналов.
                        </p>
                      ) : (
                        topTypes.map(([typeKey, value]) => {
                          const label = EMERGENCY_LABELS[typeKey] ?? typeKey
                          const share = totalTypesCount ? Math.round((value / totalTypesCount) * 100) : 0

                          return (
                            <div key={typeKey} className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                              <div className="flex items-center gap-3 text-sm text-slate-200">
                                <span className="rounded-2xl bg-white/10 p-2">
                                  {getTypeIconComponent(typeKey)}
                                </span>
                                <div>
                                  <p className="font-semibold text-white">{label}</p>
                                  <p className="text-xs text-slate-400">{share}% от обращений</p>
                                </div>
                              </div>
                              <span className="text-base font-semibold text-white">{value}</span>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </article>
                </section>
              </>
            )}

            <section className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                    Live Feed
                  </p>
                  <h2 className="text-2xl font-semibold text-white">Текущие тревожные сигналы</h2>
                  <p className="text-sm text-slate-400">Приоритетно обрабатывайте критические вызовы и держите команду в курсе</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                  <AlertTriangle className="h-4 w-4" />
                  {alerts.length} активных инцидентов
                </span>
              </div>

              <div className="space-y-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-slate-900/60 py-20">
                    <RefreshCw className="mb-4 h-12 w-12 text-sky-300 animate-spin" />
                    <p className="text-sm text-slate-400">Обновляем сводку инцидентов...</p>
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/20 bg-slate-900/40 py-20 text-center">
                    <CheckCircle className="mb-4 h-14 w-14 text-emerald-300" />
                    <h3 className="text-xl font-semibold text-white">На линии спокойно</h3>
                    <p className="mt-2 max-w-sm text-sm text-slate-400">
                      Новые запросы появятся здесь мгновенно. Держите связь с оперативными службами.
                    </p>
                  </div>
                ) : (
                  alerts.map((alert) => {
                    const visuals = getPriorityVisuals(alert.priority)
                    const typeLabel = EMERGENCY_LABELS[alert.type] ?? alert.type
                    const title = alert.title || `${typeLabel} · SOS`
                    const description = alert.description || 'Описание отсутствует'

                    return (
                      <article
                        key={alert.id}
                        className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl transition duration-200 hover:-translate-y-1 hover:border-white/30 hover:bg-slate-900/80"
                      >
                        <div className={`absolute inset-x-6 top-0 h-px bg-gradient-to-r ${visuals.ring}`} />
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex-1 space-y-5">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                                  {getTypeIconComponent(alert.type)}
                                </span>
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-500">
                                    {typeLabel}
                                  </p>
                                  <h3 className="text-xl font-semibold text-white">
                                    {title}
                                  </h3>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${visuals.badge}`}>
                                  <Flame className="h-3.5 w-3.5" />
                                  {visuals.label}
                                </span>
                                {getStatusBadge(alert.status)}
                              </div>
                            </div>

                            <p className="text-sm leading-relaxed text-slate-300">
                              {description}
                            </p>

                            <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-3">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-sky-300" />
                                <span className="font-mono text-slate-200">
                                  {Number(alert.latitude).toFixed(4)}, {Number(alert.longitude).toFixed(4)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-indigo-300" />
                                <span>{formatTime(alert.created_at)}</span>
                              </div>
                              {(alert.assigned_to_name || alert.team_name) && (
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-emerald-300" />
                                  <span className="font-medium text-white">
                                    {alert.team_name || alert.assigned_to_name}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 lg:min-w-[220px]">
                            {alert.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleAssignAlert(alert.id)}
                                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-indigo-500/40"
                                >
                                  <Phone className="h-4 w-4" />
                                  Взять в работу
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(alert.id, 'cancelled')}
                                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-rose-400/50 hover:text-rose-200"
                                >
                                  Отменить запрос
                                </button>
                              </>
                            )}

                            {alert.status === 'assigned' && (
                              <button
                                onClick={() => handleUpdateStatus(alert.id, 'in_progress')}
                                className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                              >
                                <Activity className="h-4 w-4" />
                                Подтвердить выезд
                              </button>
                            )}

                            {alert.status === 'in_progress' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(alert.id, 'completed')}
                                  className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/80 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-500"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Завершено
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(alert.id, 'cancelled')}
                                  className="flex items-center justify-center gap-2 rounded-2xl border border-rose-400/40 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/10"
                                >
                                  Отменить выезд
                                </button>
                              </>
                            )}

                            {alert.status === 'completed' && (
                              <span className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/50 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100">
                                <CheckCircle className="h-4 w-4" />
                                Завершено
                              </span>
                            )}

                            {alert.status === 'cancelled' && (
                              <span className="flex items-center justify-center gap-2 rounded-2xl border border-slate-500/50 bg-slate-800/80 px-4 py-3 text-sm font-semibold text-slate-300">
                                <AlertCircle className="h-4 w-4" />
                                Запрос отменён
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    )
                  })
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Контроль</p>
                  <h2 className="text-xl font-semibold text-white">Фильтр оперативных задач</h2>
                </div>
                <Filter className="h-5 w-5 text-slate-400" />
              </div>

              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="statusFilter" className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Статус обращения
                  </label>
                  <select
                    id="statusFilter"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-sky-400/60 focus:bg-white/10"
                  >
                    <option className="bg-slate-900 text-slate-200" value="all">Все статусы</option>
                    <option className="bg-slate-900 text-slate-200" value="pending">Ожидание</option>
                    <option className="bg-slate-900 text-slate-200" value="assigned">Назначено</option>
                    <option className="bg-slate-900 text-slate-200" value="in_progress">В работе</option>
                    <option className="bg-slate-900 text-slate-200" value="completed">Завершено</option>
                    <option className="bg-slate-900 text-slate-200" value="cancelled">Отменено</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="typeFilter" className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Тип тревоги
                  </label>
                  <select
                    id="typeFilter"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-sky-400/60 focus:bg-white/10"
                  >
                    <option className="bg-slate-900 text-slate-200" value="all">Все типы</option>
                    <option className="bg-slate-900 text-slate-200" value="fire">Пожар</option>
                    <option className="bg-slate-900 text-slate-200" value="medical">Медицина</option>
                    <option className="bg-slate-900 text-slate-200" value="police">Полиция</option>
                    <option className="bg-slate-900 text-slate-200" value="water_rescue">Водная спасательная</option>
                    <option className="bg-slate-900 text-slate-200" value="mountain_rescue">Горная спасательная</option>
                    <option className="bg-slate-900 text-slate-200" value="search_rescue">Поисково-спасательная</option>
                    <option className="bg-slate-900 text-slate-200" value="ecological">Экологическая</option>
                    <option className="bg-slate-900 text-slate-200" value="general">Общий вызов</option>
                  </select>
                </div>

                <button
                  onClick={fetchData}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-sky-400/60 hover:bg-white/10"
                >
                  <RefreshCw className="h-4 w-4" />
                  Применить фильтры
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/25 via-slate-900/80 to-slate-900/40 p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-white">Протокол реакции</h2>
              <p className="mt-2 text-sm text-slate-300">
                Напоминания по последовательности действий для критических ситуаций.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-200">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-400" />
                  <span>Проверьте координаты и подтверждённость вызова, сверяйте с системами мониторинга.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-400" />
                  <span>Назначайте ближайшие и свободные команды, учитывая профиль и приоритет.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span>Отмечайте ключевые статусы: выезд, прибытие, завершение. Следите за обратной связью.</span>
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}
