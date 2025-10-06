import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock,
  Flame,
  Leaf,
  LifeBuoy,
  LogOut,
  MapPin,
  Mountain,
  RefreshCw,
  Search,
  Shield,
  Target,
  TrendingUp,
  UserCog,
  Users
} from 'lucide-react'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import type {
  AlertStatus,
  DashboardStats,
  EmergencyType,
  SOSAlert,
  User,
  UserRole
} from '../../types'

type AdminTab = 'overview' | 'users' | 'alerts'

const STATUS_ORDER: AlertStatus[] = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled']
const TYPE_ORDER: EmergencyType[] = [
  'fire',
  'medical',
  'police',
  'water_rescue',
  'mountain_rescue',
  'search_rescue',
  'ecological',
  'general'
]

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

const STATUS_LABELS: Record<AlertStatus, string> = {
  pending: 'Новые',
  assigned: 'Назначенные',
  in_progress: 'В процессе',
  completed: 'Завершённые',
  cancelled: 'Отменённые'
}

const STATUS_COLORS: Record<AlertStatus, string> = {
  pending: 'bg-amber-500/15 border border-amber-400/40 text-amber-200',
  assigned: 'bg-sky-500/15 border border-sky-400/40 text-sky-200',
  in_progress: 'bg-indigo-500/15 border border-indigo-400/40 text-indigo-200',
  completed: 'bg-emerald-500/15 border border-emerald-400/40 text-emerald-200',
  cancelled: 'bg-slate-500/15 border border-slate-400/40 text-slate-200'
}

const ROLE_STYLES: Record<UserRole, string> = {
  admin: 'bg-gradient-to-r from-rose-500/40 to-rose-400/20 text-rose-100 border border-rose-400/40',
  coordinator: 'bg-gradient-to-r from-purple-500/40 to-purple-400/20 text-purple-100 border border-purple-400/40',
  operator: 'bg-gradient-to-r from-sky-500/40 to-sky-400/20 text-sky-100 border border-sky-400/40',
  rescuer: 'bg-gradient-to-r from-emerald-500/40 to-emerald-400/20 text-emerald-100 border border-emerald-400/40',
  citizen: 'bg-gradient-to-r from-slate-500/40 to-slate-400/20 text-slate-100 border border-slate-400/40'
}

const TYPE_LABELS: Record<EmergencyType, string> = {
  fire: 'Пожар',
  medical: 'Медицина',
  police: 'Полиция',
  water_rescue: 'Водоём',
  mountain_rescue: 'Горы',
  search_rescue: 'Поиск',
  ecological: 'Экология',
  general: 'Общая'
}

function formatDate(value?: string) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function formatDateTime(value?: string) {
  if (!value) return '—'
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getTypeIcon(type: EmergencyType) {
  const baseClass = 'h-5 w-5 text-white'
  switch (type) {
    case 'fire':
      return <Flame className={baseClass} />
    case 'medical':
      return <CheckCircle2 className={baseClass} />
    case 'police':
      return <Shield className={baseClass} />
    case 'water_rescue':
      return <LifeBuoy className={baseClass} />
    case 'mountain_rescue':
      return <Mountain className={baseClass} />
    case 'search_rescue':
      return <Search className={baseClass} />
    case 'ecological':
      return <Leaf className={baseClass} />
    case 'general':
      return <AlertCircle className={baseClass} />
    default:
      return <AlertTriangle className={baseClass} />
  }
}

function getProgressWidthClass(value: number, total: number) {
  if (!total) return 'w-0'
  const ratio = value / total
  if (ratio >= 0.95) return 'w-full'
  if (ratio >= 0.8) return 'w-11/12'
  if (ratio >= 0.6) return 'w-3/4'
  if (ratio >= 0.4) return 'w-2/3'
  if (ratio >= 0.25) return 'w-1/2'
  if (ratio >= 0.1) return 'w-1/3'
  return 'w-1/6'
}

export function AdminDashboard() {
  const { user, logout } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS)
  const [users, setUsers] = useState<User[]>([])
  const [alerts, setAlerts] = useState<SOSAlert[]>([])
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true)
    try {
      const [statsRes, usersRes, alertsRes] = await Promise.all([
        api.get('/api/v1/analytics/dashboard'),
        api.get('/api/v1/users'),
        api.get('/api/v1/sos/', { params: { limit: 25 } })
      ])

      const statsData = statsRes.data as Partial<DashboardStats> | undefined
      const mergedStats: DashboardStats = {
        ...DEFAULT_STATS,
        ...statsData,
        by_status: {
          ...DEFAULT_STATS.by_status,
          ...(statsData?.by_status ?? {})
        },
        by_type: {
          ...DEFAULT_STATS.by_type,
          ...(statsData?.by_type ?? {})
        }
      }

      setStats(mergedStats)
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : [])
      setAlerts(Array.isArray(alertsRes.data) ? alertsRes.data : [])
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData(false)
  }

  const handleChangeUserRole = async (userId: string, role: string) => {
    try {
      await api.patch(`/api/v1/users/${userId}`, { role })
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: role as UserRole } : u)))
    } catch (error) {
      console.error('Failed to change user role:', error)
      alert('Не удалось изменить роль пользователя')
    }
  }

  const statusEntries = useMemo(() =>
    STATUS_ORDER.map((status) => ({
      status,
      value: stats.by_status?.[status] ?? 0
    })), [stats.by_status])

  const typeEntries = useMemo(() =>
    TYPE_ORDER.map((type) => ({
      type,
      value: stats.by_type?.[type] ?? 0
    })), [stats.by_type])

  const verifiedUsers = useMemo(() => users.filter((u) => u.is_verified).length, [users])
  const activeOperators = useMemo(() => users.filter((u) => u.role === 'operator').length, [users])
  const totalRescuers = useMemo(() => users.filter((u) => u.role === 'rescuer').length, [users])

  const criticalAlerts = useMemo(
    () => alerts.filter((alert) => ['pending', 'assigned'].includes(alert.status)),
    [alerts]
  )

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.25),transparent_55%)]" />

      <div className="relative">
        <header className="border-b border-white/10 bg-slate-900/40 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex items-center gap-4">
              <div className="rounded-3xl border border-white/20 bg-white/10 p-4 shadow-[0_25px_70px_rgba(129,140,248,0.45)]">
                <UserCog className="h-10 w-10 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/60">Rescue Command Center</p>
                <h1 className="text-3xl font-semibold">Панель администратора</h1>
                <p className="mt-1 text-sm text-white/60">
                  {user?.full_name || user?.email} • Полный контроль системы
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="btn-glass flex items-center gap-2 text-sm font-semibold"
                aria-label="Обновить данные"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Обновить
              </button>
              <button onClick={logout} className="btn-glass flex items-center gap-2 text-sm font-semibold">
                <LogOut className="h-4 w-4" />
                Выйти
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <section className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/30 to-purple-700/20 p-6 shadow-[0_20px_60px_rgba(76,29,149,0.35)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Всего тревог</p>
                  <p className="mt-2 text-4xl font-bold">{stats.total_alerts}</p>
                </div>
                <div className="rounded-2xl bg-white/15 p-3">
                  <BarChart3 className="h-6 w-6 text-purple-100" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-purple-100/80">
                <TrendingUp className="h-4 w-4" />
                {stats.today_alerts} за сегодня
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-rose-500/30 to-orange-500/20 p-6 shadow-[0_20px_60px_rgba(225,29,72,0.3)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Активные тревоги</p>
                  <p className="mt-2 text-4xl font-bold">{stats.active_alerts}</p>
                </div>
                <div className="rounded-2xl bg-white/15 p-3">
                  <AlertTriangle className="h-6 w-6 text-rose-100" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-rose-100/80">
                <Bell className="h-4 w-4" />
                {criticalAlerts.length} требуют реакции
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/30 to-emerald-700/20 p-6 shadow-[0_20px_60px_rgba(16,185,129,0.3)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Верфицированные пользователи</p>
                  <p className="mt-2 text-4xl font-bold">{verifiedUsers}</p>
                </div>
                <div className="rounded-2xl bg-white/15 p-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-100" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-emerald-100/80">
                <Users className="h-4 w-4" />
                Всего пользователей: {users.length}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/30 to-indigo-500/20 p-6 shadow-[0_20px_60px_rgba(14,165,233,0.3)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Команда реагирования</p>
                  <p className="mt-2 text-4xl font-bold">{activeOperators}</p>
                </div>
                <div className="rounded-2xl bg-white/15 p-3">
                  <Shield className="h-6 w-6 text-sky-100" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-sky-100/80">
                <Target className="h-4 w-4" />
                Спасателей в системе: {totalRescuers}
              </div>
            </div>
          </section>

          <section className="mb-12">
            <div className="flex flex-wrap items-center gap-3">
              {([
                { key: 'overview', label: 'Обзор' },
                { key: 'users', label: 'Пользователи' },
                { key: 'alerts', label: 'Тревоги' }
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-2xl px-5 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 ${
                    activeTab === tab.key
                      ? 'bg-white/15 text-white shadow-[0_18px_45px_rgba(255,255,255,0.12)]'
                      : 'text-white/50 hover:text-white hover:bg-white/10'
                  }`}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-10">
            {activeTab === 'overview' && (
              <div className="grid gap-8 lg:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Распределение по статусу</h2>
                    <Clock className="h-5 w-5 text-white/40" />
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {statusEntries.map(({ status, value }) => (
                      <div key={status} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white/60">{STATUS_LABELS[status]}</span>
                          <span
                            className={`inline-flex items-center gap-2 rounded-xl px-3 py-1 text-xs font-semibold ${STATUS_COLORS[status]}`}
                          >
                            <Target className="h-3.5 w-3.5" />
                            {value}
                          </span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-white/5">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r from-white/70 to-white ${getProgressWidthClass(value, stats.total_alerts)}`}
                            aria-hidden="true"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Типы происшествий</h2>
                    <AlertCircle className="h-5 w-5 text-white/40" />
                  </div>
                  <div className="mt-6 space-y-4">
                    {typeEntries.map(({ type, value }) => (
                      <div
                        key={type}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl bg-gradient-to-br from-white/20 to-white/5 p-2">
                            {getTypeIcon(type)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{TYPE_LABELS[type]}</p>
                            <p className="text-xs text-white/50">{value} случаев</p>
                          </div>
                        </div>
                        <span className="text-lg font-semibold text-white/80">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl">
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Управление пользователями</h2>
                    <p className="text-sm text-white/50">Контролируйте роли и статус доступа</p>
                  </div>
                  <span className="stat-pill bg-white/10 text-white">
                    Активных аккаунтов: {users.filter((u) => u.is_active).length}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-white/5">
                      <tr className="text-left text-xs uppercase tracking-wide text-white/50">
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Имя</th>
                        <th className="px-6 py-4">Роль</th>
                        <th className="px-6 py-4">Статус</th>
                        <th className="px-6 py-4">Регистрация</th>
                        <th className="px-6 py-4">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-white/50">
                            <div className="flex flex-col items-center gap-3">
                              <RefreshCw className="h-8 w-8 animate-spin text-white/40" />
                              <span>Загрузка пользователей…</span>
                            </div>
                          </td>
                        </tr>
                      ) : users.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-white/50">
                            <div className="flex flex-col items-center gap-3">
                              <Users className="h-10 w-10 text-white/30" />
                              <span>Пользователи пока не добавлены</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.id} className="text-sm text-white/80">
                            <td className="px-6 py-4 font-semibold text-white">{u.email}</td>
                            <td className="px-6 py-4">{u.full_name || '—'}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-2 rounded-2xl px-3 py-1 text-xs font-semibold ${ROLE_STYLES[u.role]}`}>
                                <Shield className="h-3.5 w-3.5" />
                                {u.role}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-2 rounded-2xl px-3 py-1 text-xs font-semibold ${
                                u.is_active ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30' : 'bg-slate-500/15 text-slate-200 border border-slate-400/30'
                              }`}>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {u.is_active ? 'Активен' : 'Неактивен'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-white/60">{formatDate(u.created_at)}</td>
                            <td className="px-6 py-4">
                              <select
                                value={u.role}
                                onChange={(event) => handleChangeUserRole(u.id, event.target.value)}
                                className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-xs text-white/80 focus:outline-none focus:ring-2 focus:ring-rose-400/60"
                                aria-label={`Изменить роль пользователя ${u.email}`}
                              >
                                {Object.keys(ROLE_STYLES).map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="space-y-4">
                {loading ? (
                  <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-12 text-center text-white/60">
                    <RefreshCw className="mx-auto h-10 w-10 animate-spin text-white/40" />
                    <p className="mt-4 font-medium">Загрузка тревог…</p>
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-12 text-center text-white/60">
                    <AlertCircle className="mx-auto h-10 w-10 text-white/30" />
                    <p className="mt-4 font-medium">Нет зарегистрированных тревог</p>
                  </div>
                ) : (
                  alerts.map((alert) => {
                    const hasLocation = alert.latitude != null && alert.longitude != null
                    return (
                      <div
                        key={alert.id}
                        className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.45)] transition-transform duration-200 hover:-translate-y-1 hover:bg-slate-900/60"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="rounded-2xl bg-gradient-to-br from-white/20 to-white/5 p-3">
                                {getTypeIcon(alert.type)}
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-white">
                                  {alert.title || TYPE_LABELS[alert.type] || 'Сигнал SOS'}
                                </h3>
                                <p className="text-xs text-white/50">{formatDateTime(alert.created_at)}</p>
                              </div>
                              <span
                                className={`inline-flex items-center gap-2 rounded-2xl px-3 py-1 text-[11px] font-semibold ${
                                  STATUS_COLORS[alert.status] ?? STATUS_COLORS.pending
                                }`}
                              >
                                <Bell className="h-3.5 w-3.5" />
                                {STATUS_LABELS[alert.status] || alert.status}
                              </span>
                              <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/70">
                                Приоритет P{alert.priority}
                              </span>
                            </div>
                            {alert.description && (
                              <p className="text-sm leading-relaxed text-white/70">{alert.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 text-xs text-white/60">
                              <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-1 font-mono">
                                <MapPin className="h-3.5 w-3.5" />
                                {hasLocation
                                  ? `${Number(alert.latitude).toFixed(4)}, ${Number(alert.longitude).toFixed(4)}`
                                  : 'Координаты не указаны'}
                              </span>
                              <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-1">
                                <Clock className="h-3.5 w-3.5" />
                                {formatDateTime(alert.updated_at)}
                              </span>
                              {alert.team_name && (
                                <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-1">
                                  <Shield className="h-3.5 w-3.5" />
                                  {alert.team_name}
                                </span>
                              )}
                              {alert.assigned_to_name && (
                                <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-1">
                                  <Users className="h-3.5 w-3.5" />
                                  {alert.assigned_to_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard
