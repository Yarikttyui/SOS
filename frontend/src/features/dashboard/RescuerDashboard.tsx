import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../services/api'
import {
  Shield,
  Users,
  BadgeCheck,
  LogOut,
  RefreshCw,
  AlertTriangle,
  Activity,
  TrendingUp,
  CheckCircle,
  Radio,
  Navigation,
  MapPin,
  Clock,
  PlayCircle,
  Flame,
  Heart,
  Waves,
  Mountain,
  Search,
  Leaf,
  Compass
} from 'lucide-react'
import type { SOSAlert, RescueTeam } from '../../types'
import { DownloadAppButton } from '../../components/DownloadAppButton'
import { BackendStatusPill } from '../../components/BackendStatusPill'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/15 border border-amber-400/40 text-amber-100',
  assigned: 'bg-sky-500/15 border border-sky-400/40 text-sky-100',
  in_progress: 'bg-indigo-500/15 border border-indigo-400/40 text-indigo-100',
  completed: 'bg-emerald-500/15 border border-emerald-400/40 text-emerald-100',
  cancelled: 'bg-slate-500/15 border border-slate-400/40 text-slate-200'
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидание',
  assigned: 'Назначено',
  in_progress: 'В работе',
  completed: 'Завершено',
  cancelled: 'Отменено'
}

const STATUS_EMOJIS: Record<string, string> = {
  pending: '⏳',
  assigned: '🗂️',
  in_progress: '🚀',
  completed: '✅',
  cancelled: '✖️'
}

const PRIORITY_STYLES: Record<number, { badge: string; gradient: string; label: string }> = {
  1: {
    badge: 'bg-rose-600/20 border border-rose-400/40 text-rose-100',
    gradient: 'from-rose-500 via-red-500 to-amber-500',
    label: 'P1 · Критический'
  },
  2: {
    badge: 'bg-orange-500/20 border border-orange-400/40 text-orange-100',
    gradient: 'from-orange-500 via-amber-500 to-yellow-500',
    label: 'P2 · Высокий'
  },
  3: {
    badge: 'bg-yellow-500/20 border border-yellow-400/40 text-yellow-100',
    gradient: 'from-yellow-500 via-lime-500 to-emerald-400',
    label: 'P3 · Средний'
  },
  4: {
    badge: 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-100',
    gradient: 'from-emerald-500 via-teal-500 to-sky-400',
    label: 'P4 · Низкий'
  }
}

const EMERGENCY_LABELS: Record<string, string> = {
  fire: 'Пожар',
  medical: 'Медицина',
  police: 'Полиция',
  water_rescue: 'Водная спасательная',
  mountain_rescue: 'Горная спасательная',
  search_rescue: 'Поисково-спасательная',
  ecological: 'Экологическая',
  general: 'Общий вызов'
}

const TEAM_STATUS_LABELS: Record<string, string> = {
  available: 'Готовы к выезду',
  busy: 'В работе',
  offline: 'Не в строю'
}

type TabKey = 'my' | 'team' | 'available'

type TabConfig = {
  id: TabKey
  label: string
  description: string
  gradient: string
  requiresTeam?: boolean
}

const TAB_CONFIG: TabConfig[] = [
  {
    id: 'my',
    label: 'Мои вызовы',
    description: 'Назначено лично вам',
    gradient: 'from-rose-500 via-red-500 to-amber-400'
  },
  {
    id: 'team',
    label: 'Задачи бригады',
    description: 'Общие задания команды',
    gradient: 'from-indigo-500 via-violet-500 to-sky-500',
    requiresTeam: true
  },
  {
    id: 'available',
    label: 'Доступно',
    description: 'Можно принять в работу',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500'
  }
]

const formatTime = (date: string) => {
  const d = new Date(date)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000)

  if (diff < 1) return 'Только что'
  if (diff < 60) return `${diff} мин назад`
  if (diff < 1440) return `${Math.floor(diff / 60)} ч назад`
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTypeIcon = (type: string) => {
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
  const badgeClass = STATUS_STYLES[key] ?? 'bg-slate-500/15 border border-slate-400/40 text-slate-200'
  const label = STATUS_LABELS[key] ?? status
  const emoji = STATUS_EMOJIS[key] ?? '•'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${badgeClass}`}>
      <span>{emoji}</span>
      <span>{label}</span>
    </span>
  )
}

const getPriorityVisuals = (priority: number) => {
  return (
    PRIORITY_STYLES[priority] ?? {
      badge: 'bg-slate-500/20 border border-slate-400/40 text-slate-200',
      gradient: 'from-slate-600 via-slate-500 to-slate-400',
      label: `P${priority} · Приоритет`
    }
  )
}

const getEmergencyLabel = (type: string) => EMERGENCY_LABELS[type] ?? 'Неизвестный тип'

const buildNavigationUrl = (lat: number, lon: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`

export default function RescuerDashboard() {
  const { user, logout } = useAuthStore()
  const [myAlerts, setMyAlerts] = useState<SOSAlert[]>([])
  const [teamAlerts, setTeamAlerts] = useState<SOSAlert[]>([])
  const [availableAlerts, setAvailableAlerts] = useState<SOSAlert[]>([])
  const [teamInfo, setTeamInfo] = useState<RescueTeam | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('my')

  const fetchData = async () => {
    if (!user) return

    try {
      setLoading(true)

      const alertsResponse = await api.get<SOSAlert[]>('/api/v1/sos/')
      const rawAlerts = alertsResponse.data as unknown
      const alerts: SOSAlert[] = Array.isArray(rawAlerts)
        ? (rawAlerts as SOSAlert[])
        : rawAlerts && typeof rawAlerts === 'object' && Array.isArray((rawAlerts as any).items)
          ? ((rawAlerts as any).items as SOSAlert[])
          : []
      
      console.log('=== RESCUER DASHBOARD DEBUG ===')
      console.log('Total alerts from API:', alerts.length)
      console.log('User ID:', user.id)
      console.log('User Team ID:', user.team_id)
      console.log('All alerts:', alerts.map(a => ({
        id: a.id,
        title: a.title,
        status: a.status,
        assigned_to: a.assigned_to,
        team_id: a.team_id
      })))

      if (user.team_id) {
        try {
          const teamResponse = await api.get<RescueTeam>(`/api/v1/teams/${user.team_id}`)
          setTeamInfo(teamResponse.data)
        } catch (error) {
          console.error('Failed to fetch team info:', error)
        }
      } else {
        setTeamInfo(null)
      }

      setTeamAlerts(
        alerts.filter(
          (alert) =>
            alert.team_id === user.team_id &&
            alert.status !== 'completed'
        )
      )

      setMyAlerts(
        alerts.filter(
          (alert) =>
            alert.assigned_to === user.id &&
            (!alert.team_id || alert.team_id === user.team_id) &&
            alert.status !== 'completed'
        )
      )
      
      console.log('My alerts:', alerts.filter(a => a.assigned_to === user.id).map(a => ({ id: a.id, status: a.status, assigned_to: a.assigned_to })))

      setAvailableAlerts(
        alerts.filter(
          (alert) =>
            alert.status === 'assigned' &&
            (!alert.assigned_to || alert.assigned_to === user.id) &&
            (!alert.team_id || alert.team_id === user.team_id)
        )
      )
      
      console.log('Available alerts filtered:', alerts.filter(
        (alert) =>
          alert.status === 'assigned' &&
          (!alert.assigned_to || alert.assigned_to === user.id) &&
          (!alert.team_id || alert.team_id === user.team_id)
      ).map(a => ({ id: a.id, title: a.title, status: a.status, assigned_to: a.assigned_to, team_id: a.team_id })))
      
      console.log('=== END DEBUG ===')
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 20000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.team_id])

  const handleAcceptAlert = async (alertId: string) => {
    try {
      const response = await api.patch(`/api/v1/sos/${alertId}`, {})
      console.log('Alert accepted:', response.data)
      // Небольшая задержка для синхронизации с БД
      await new Promise(resolve => setTimeout(resolve, 500))
      await fetchData()
    } catch (error) {
      console.error('Failed to accept alert:', error)
    }
  }

  const handleComplete = async (alertId: string) => {
    try {
      await api.patch(`/api/v1/sos/${alertId}`, {
        status: 'completed'
      })
      fetchData()
    } catch (error) {
      console.error('Failed to complete alert:', error)
    }
  }

  const selectedAlerts = useMemo(() => {
    switch (activeTab) {
      case 'my':
        return myAlerts
      case 'team':
        return teamAlerts
      case 'available':
        return availableAlerts
      default:
        return myAlerts
    }
  }, [activeTab, myAlerts, teamAlerts, availableAlerts])

  const stats = useMemo(() => {
    const total = myAlerts.length + teamAlerts.length + availableAlerts.length
    return {
      total,
      my: myAlerts.length,
      team: teamAlerts.length,
      available: availableAlerts.length
    }
  }, [myAlerts.length, teamAlerts.length, availableAlerts.length])

  const emptyState = useMemo(() => {
    if (activeTab === 'team' && !user?.team_id) {
      return {
        title: 'Подключите бригаду',
        description: 'Обратитесь к координатору, чтобы привязать вас к оперативной группе.'
      }
    }

    switch (activeTab) {
      case 'my':
        return {
          title: 'Нет назначенных вызовов',
          description: 'Как только штаб закрепит за вами новый инцидент, он мгновенно появится здесь.'
        }
      case 'team':
        return {
          title: 'Команда свободна',
          description: 'Следите за эфирами диспетчера — новый вызов для бригады может поступить в любой момент.'
        }
      case 'available':
        return {
          title: 'Свободных сигналов нет',
          description: 'Все текущие обращения уже взяты в работу. Проверяйте в эфире новые сообщения.'
        }
      default:
        return {
          title: 'Нет данных',
          description: 'Здесь появятся актуальные вызовы, как только они будут доступны.'
        }
    }
  }, [activeTab, user?.team_id])

  const heroSubtitle = user?.is_team_leader
    ? 'Лидер оперативной бригады · контроль и принятие решений'
    : 'Специалист оперативной бригады · выполнение задач на месте'

  const teamStatusLabel = teamInfo ? (TEAM_STATUS_LABELS[teamInfo.status] ?? 'Статус не определён') : 'Без привязки к бригаде'

  const renderAlertCard = (alert: SOSAlert) => {
    const visuals = getPriorityVisuals(alert.priority)
    const typeLabel = getEmergencyLabel(alert.type)
    const title = alert.title || `${typeLabel} · SOS`
    const description = alert.description || 'Описание отсутствует'
    const canAccept = alert.status === 'assigned' && (!alert.assigned_to || alert.assigned_to === user?.id)
    const canComplete = alert.status === 'in_progress' && alert.assigned_to === user?.id
    const showAccept = canAccept && (activeTab === 'available' || activeTab === 'team')
    const showComplete = canComplete && (activeTab === 'my' || activeTab === 'team')
    const isMine = alert.assigned_to === user?.id
    const assignedName = alert.team_name || alert.assigned_to_name

    return (
      <article
        key={alert.id}
        className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl transition duration-200 hover:-translate-y-1 hover:border-white/30 hover:bg-slate-900/80"
      >
        <div className={`absolute inset-x-6 top-0 h-px bg-gradient-to-r ${visuals.gradient}`} />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                  {getTypeIcon(alert.type)}
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-500">{typeLabel}</p>
                  <h3 className="text-xl font-semibold text-white">{title}</h3>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${visuals.badge}`}>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {visuals.label}
                </span>
                {getStatusBadge(alert.status)}
              </div>
            </div>

            <p className="text-sm leading-relaxed text-slate-300">{description}</p>

            <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-sky-300" />
                <a
                  href={buildNavigationUrl(Number(alert.latitude), Number(alert.longitude))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-slate-200 underline-offset-4 hover:underline"
                >
                  {Number(alert.latitude).toFixed(4)}, {Number(alert.longitude).toFixed(4)}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-300" />
                <span>{formatTime(alert.created_at)}</span>
              </div>
              {assignedName && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-300" />
                  <span className="font-medium text-white">{assignedName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:w-56">
            <button
              onClick={() => window.open(buildNavigationUrl(Number(alert.latitude), Number(alert.longitude)), '_blank')}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-sky-400/60 hover:bg-white/10"
            >
              <Navigation className="h-4 w-4" />
              Маршрут
            </button>
            {showAccept && (
              <button
                onClick={() => handleAcceptAlert(alert.id)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-emerald-500/40"
              >
                <PlayCircle className="h-4 w-4" />
                Взять в работу
              </button>
            )}
            {showComplete && (
              <button
                onClick={() => handleComplete(alert.id)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/80 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-500"
              >
                <CheckCircle className="h-4 w-4" />
                Завершить
              </button>
            )}
            {!showAccept && !showComplete && (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xs text-slate-300">
                {isMine ? 'Ожидайте подтверждения координатора' : 'Контроль у координатора'}
              </div>
            )}
          </div>
        </div>
      </article>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.18),transparent_60%)]" />
        <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.2),transparent_65%)]" />
      </div>

      <header className="border-b border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 p-3 shadow-xl shadow-emerald-500/30">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                  Rescue Mission Control
                </p>
                <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Панель спасателя</h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                  <span>{user?.full_name || user?.email}</span>
                  {user?.is_team_leader && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-100">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Лидер экипажа
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs uppercase tracking-[0.28em] text-slate-500">{heroSubtitle}</p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-end">
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <BackendStatusPill dense />
                <DownloadAppButton variant="ghost" compact />
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="group flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-emerald-400/60 hover:bg-white/15 disabled:opacity-60"
                >
                  <RefreshCw className={`h-4 w-4 text-emerald-200 transition ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                  <span>Обновить сводку</span>
                </button>
                <button
                  onClick={logout}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:border-rose-400 hover:bg-rose-500/20"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Выход</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

  <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-12">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,2.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-8">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 p-6 shadow-xl transition duration-200 hover:-translate-y-1 hover:shadow-emerald-500/40">
                <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/20 blur-3xl" />
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-white/15 p-3">
                    <AlertTriangle className="h-7 w-7 text-white" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-white/70" />
                </div>
                <p className="mt-6 text-sm font-medium uppercase tracking-[0.3em] text-white/80">Мои вызовы</p>
                <p className="mt-2 text-4xl font-semibold text-white">{stats.my}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.28em] text-white/80">активных заданий</p>
              </article>

              <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-500 p-6 shadow-xl transition duration-200 hover:-translate-y-1 hover:shadow-indigo-500/40">
                <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 blur-3xl" />
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-white/15 p-3">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <Activity className="h-5 w-5 text-white/70" />
                </div>
                <p className="mt-6 text-sm font-medium uppercase tracking-[0.3em] text-white/80">Задачи бригады</p>
                <p className="mt-2 text-4xl font-semibold text-white">{user?.team_id ? stats.team : '—'}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.28em] text-white/80">
                  {user?.team_id ? 'в очереди команды' : 'нет привязки к бригаде'}
                </p>
              </article>

              <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-rose-500 via-red-500 to-amber-500 p-6 shadow-xl transition duration-200 hover:-translate-y-1 hover:shadow-rose-500/40">
                <div className="absolute -left-12 top-0 h-32 w-32 rounded-full bg-white/20 blur-3xl" />
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-white/15 p-3">
                    <Compass className="h-7 w-7 text-white" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-white/70" />
                </div>
                <p className="mt-6 text-sm font-medium uppercase tracking-[0.3em] text-white/80">Свободно</p>
                <p className="mt-2 text-4xl font-semibold text-white">{stats.available}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.28em] text-white/80">можно принять</p>
              </article>

              <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500 via-sky-500 to-indigo-500 p-6 shadow-xl transition duration-200 hover:-translate-y-1 hover:shadow-cyan-500/40">
                <div className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-white/20 blur-3xl" />
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-white/15 p-3">
                    <CheckCircle className="h-7 w-7 text-white" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-white/70" />
                </div>
                <p className="mt-6 text-sm font-medium uppercase tracking-[0.3em] text-white/80">Статус команды</p>
                <p className="mt-2 text-xl font-semibold text-white">{teamStatusLabel}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.28em] text-white/80">
                  {teamInfo?.member_count ? `${teamInfo.member_count} специалистов на линии` : 'индивидуальный режим'}
                </p>
              </article>
            </section>

            <section className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-2 shadow-xl">
                <div className="grid gap-2 sm:grid-cols-3">
                  {TAB_CONFIG.map((tab) => {
                    const isDisabled = tab.requiresTeam && !user?.team_id
                    const isActive = activeTab === tab.id

                    return (
                      <button
                        key={tab.id}
                        onClick={() => !isDisabled && setActiveTab(tab.id)}
                        disabled={isDisabled}
                        className={`relative overflow-hidden rounded-2xl border px-4 py-4 text-left transition ${
                          isActive
                            ? `border-white/40 bg-gradient-to-br ${tab.gradient} text-white shadow-lg`
                            : 'border-white/5 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                        } ${isDisabled ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold uppercase tracking-[0.35em]">
                            {tab.label}
                          </p>
                          {isActive && <span className="text-xs font-semibold text-white/80">{stats[tab.id]}</span>}
                        </div>
                        <p className="mt-2 text-xs text-white/80">
                          {tab.description}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Live Response</p>
                  <h2 className="text-2xl font-semibold text-white">Активные вызовы</h2>
                  <p className="text-sm text-slate-400">
                    Отслеживайте поступающие сигналы и берите управление, когда это необходимо.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                  <AlertTriangle className="h-4 w-4" />
                  {selectedAlerts.length} в текущей вкладке
                </span>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-slate-900/60 py-20">
                  <RefreshCw className="mb-4 h-12 w-12 text-emerald-300 animate-spin" />
                  <p className="text-sm text-slate-400">Обновляем оперативную сводку...</p>
                </div>
              ) : selectedAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/20 bg-slate-900/40 py-20 text-center">
                  <CheckCircle className="mb-4 h-14 w-14 text-emerald-300" />
                  <h3 className="text-xl font-semibold text-white">{emptyState.title}</h3>
                  <p className="mt-2 max-w-sm text-sm text-slate-400">{emptyState.description}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedAlerts.map((alert) => renderAlertCard(alert))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Бригада</p>
                  <h2 className="text-xl font-semibold text-white">{teamInfo?.name || 'Нет бригады'}</h2>
                </div>
                <Users className="h-5 w-5 text-slate-400" />
              </div>
              <div className="mt-6 space-y-3 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-emerald-300" />
                  <span>{teamStatusLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-sky-300" />
                  <span>
                    {teamInfo?.member_count
                      ? `${teamInfo.member_count} специалистов в смене`
                      : 'Работа в индивидуальном режиме'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-indigo-300" />
                  <span>{teamInfo?.base_address || 'Базирование не указано'}</span>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-600/20 via-slate-900/70 to-slate-900/40 p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-white">Оперативные заметки</h2>
              <ul className="mt-5 space-y-3 text-sm text-slate-200">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span>Подтверждайте выезд в эфире и фиксируйте изменение статуса немедленно.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-400" />
                  <span>Проверяйте координаты и сопутствующую информацию перед выездом.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-400" />
                  <span>Сообщайте координатору о любых изменениях ситуации на месте.</span>
                </li>
              </ul>
            </section>

            <section className="rounded-3xl border border-dashed border-emerald-400/40 bg-emerald-500/10 p-6 shadow-inner shadow-emerald-500/10">
              <h2 className="text-lg font-semibold text-emerald-100">Связь с диспетчером</h2>
              <p className="mt-2 text-sm text-emerald-50/80">
                Контактируйте со штабом через корпоративный канал или по телефону:
              </p>
              <a
                href={`tel:${teamInfo?.contact_phone || '+7 (800) 000-00-00'}`}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-emerald-400/60 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
              >
                <Radio className="h-4 w-4" />
                {teamInfo?.contact_phone || '+7 (800) 000-00-00'}
              </a>
              <p className="mt-3 text-xs text-emerald-100/70">
                Убедитесь, что связь с координатором стабильна перед принятием критических решений.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}
