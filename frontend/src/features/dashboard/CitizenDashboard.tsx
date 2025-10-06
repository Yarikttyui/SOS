import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../services/api'
import {
  Activity,
  AlertTriangle,
  Bell,
  Clock,
  Compass,
  LogOut,
  MapPin,
  Phone,
  RefreshCw,
  Satellite,
  Shield,
  Sparkles,
  Waves,
} from 'lucide-react'
import type { SOSAlert } from '../../types'
import { DownloadAppButton } from '../../components/DownloadAppButton'
import { BackendStatusPill } from '../../components/BackendStatusPill'

const TYPE_EMOJI: Record<string, string> = {
  fire: '🔥',
  medical: '🚑',
  police: '👮',
  water_rescue: '🚤',
  mountain_rescue: '🧗',
  search_rescue: '🔍',
  ecological: '🌿',
  general: '⚠️',
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'assigned':
      return 'bg-sky-100 text-sky-700 border-sky-200'
    case 'in_progress':
      return 'bg-violet-100 text-violet-700 border-violet-200'
    case 'completed':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'cancelled':
      return 'bg-slate-100 text-slate-600 border-slate-200'
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Ожидание'
    case 'assigned':
      return 'Назначено'
    case 'in_progress':
      return 'В работе'
    case 'completed':
      return 'Завершено'
    case 'cancelled':
      return 'Отменено'
    default:
      return status
  }
}

const getTypeIcon = (type: string) => {
  return TYPE_EMOJI[type] || TYPE_EMOJI.general
}

const formatTime = (date: string) => {
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function CitizenDashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [myAlerts, setMyAlerts] = useState<SOSAlert[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMyAlerts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/v1/sos/')
      setMyAlerts(response.data)
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMyAlerts()
  }, [])

  const activeAlerts = myAlerts.filter(
    (alert) => alert.status !== 'completed' && alert.status !== 'cancelled'
  )

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute -top-40 -left-32 w-96 h-96 bg-gradient-to-br from-rose-500/30 via-purple-500/40 to-blue-500/20 blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[520px] h-[520px] bg-gradient-to-br from-blue-500/25 via-sky-400/30 to-emerald-400/20 blur-[160px]" />
      </div>

      <header className="relative z-20 border-b border-white/10 bg-slate-900/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative p-3 rounded-2xl bg-gradient-to-br from-rose-500 via-red-500 to-orange-500 shadow-[0_20px_60px_rgba(244,114,182,0.45)]">
                <span className="text-2xl">🚨</span>
              </div>
              <div>
                <p className="section-title text-white/60">Rescue Command Center</p>
                <h1 className="text-2xl sm:text-3xl font-semibold text-white/95">
                  Панель гражданского пользователя
                </h1>
                <p className="text-sm text-white/60 mt-1">👋 {user?.full_name || user?.email}</p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-end">
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <div className="stat-pill bg-white/20 text-white border-white/30 w-full sm:w-auto">
                  <Activity className="w-4 h-4" />
                  Активно: <span className="font-semibold">{activeAlerts.length}</span>
                </div>
                <div className="stat-pill bg-white/20 text-white border-white/30 w-full sm:w-auto">
                  <Shield className="w-4 h-4" />
                  Всего: <span className="font-semibold">{myAlerts.length}</span>
                </div>
                <BackendStatusPill dense />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <DownloadAppButton variant="primary" compact />
                <button onClick={logout} className="btn-glass flex items-center gap-2 text-sm font-semibold">
                  <LogOut className="w-4 h-4" />
                  Выйти
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

  <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <div className="rounded-3xl border border-amber-200/30 bg-amber-500/10 backdrop-blur-xl overflow-hidden">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-6 py-4">
            <div className="flex items-start gap-3">
              <div className="bg-amber-400/30 border border-amber-200/50 rounded-2xl p-2">
                <AlertTriangle className="h-6 w-6 text-amber-200" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Важное уведомление:</h3>
                <p className="text-sm text-amber-100/90">
                  При реальной угрозе жизни незамедлительно звоните по номеру <span className="font-semibold">112</span> и сообщите координаты.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/70">
              <Compass className="w-4 h-4" />
              Геолокация обновляется каждые 15 секунд
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
          <div className="card-modern bg-white/10 border border-white/10 text-white p-8 sm:p-10 relative overflow-hidden">
            <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-b from-white/10 to-transparent blur-2xl" />
            <div className="relative z-10 space-y-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="space-y-4 max-w-xl">
                  <p className="section-title text-white/60">Экстренный вызов</p>
                  <h2 className="text-3xl lg:text-4xl font-semibold leading-tight text-white">
                    Нажмите SOS, чтобы скоординировать спасателей и получить инструкции ИИ
                  </h2>
                  <p className="text-sm sm:text-base text-white/70 leading-relaxed max-w-2xl">
                    Мы автоматически определим ваше местоположение, оценим приоритет инцидента и передадим данные ближайшим службам.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/20 px-4 py-3 text-sm text-white/80 shadow-lg shadow-rose-200/20">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    ИИ-оценка готова
                  </div>
                  <p className="mt-2 text-xs text-white/60">
                    Модель посчитает приоритет и рекомендуемые ресурсы через 3 секунды после отправки
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/sos')}
                  className="relative inline-flex w-full max-w-xs items-center justify-center gap-3 overflow-hidden rounded-full border border-rose-400/40 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 px-8 py-4 text-lg font-semibold shadow-[0_24px_60px_rgba(244,114,182,0.45)] transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 sm:w-auto"
                >
                  <span className="text-2xl">🚨</span>
                  <span>Открыть окно SOS</span>
                </button>
                <p className="text-xs text-white/60">
                  Форма откроется в отдельном защищённом окне. После отправки вы вернётесь на панель.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 text-xs sm:text-sm text-white/70">
                <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl p-3">
                  <MapPin className="w-4 h-4 text-rose-200" />
                  GPS: Тверь, Россия · Точность 12 м
                </div>
                <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl p-3">
                  <Satellite className="w-4 h-4 text-blue-200" />
                  Канал связи: Защищённый LTE/5G
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card-modern bg-slate-900/60 border border-white/10 text-white p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="section-title text-white/50">Статус системы</p>
                  <h3 className="text-xl font-semibold">Мониторинг в реальном времени</h3>
                </div>
                <button onClick={fetchMyAlerts} className="btn-glass text-xs px-4 py-2">
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="ml-2">Обновить</span>
                </button>
              </div>
              <div className="grid gap-4">
                <div className="flex items-center justify-between bg-white/10 border border-white/15 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-emerald-200" />
                    <span className="text-sm text-white/70">Активных сигналов</span>
                  </div>
                  <span className="text-2xl font-semibold">{activeAlerts.length}</span>
                </div>
                <div className="flex items-center justify-between bg-white/10 border border-white/15 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-sky-200" />
                    <span className="text-sm text-white/70">Всего обращений</span>
                  </div>
                  <span className="text-2xl font-semibold">{myAlerts.length}</span>
                </div>
                <div className="flex items-center justify-between bg-white/10 border border-white/15 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-rose-200" />
                    <span className="text-sm text-white/70">Горячая линия</span>
                  </div>
                  <span className="text-lg font-semibold">112 · 101 · 103</span>
                </div>
              </div>
            </div>

            <div className="card-modern bg-white/90 text-slate-900 p-6 space-y-4">
              <h3 className="text-lg font-semibold">Советы по безопасности</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-1">•</span>
                  <span>Сохраняйте спокойствие и позаботьтесь о личной безопасности</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-1">•</span>
                  <span>Сообщите диспетчеру точный адрес и ориентиры</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-1">•</span>
                  <span>Следуйте инструкциям операторов и не отключайтесь</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-1">•</span>
                  <span>Не покидайте место происшествия без уведомления служб</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {myAlerts.length > 0 && (
          <div className="card-modern bg-white/95 text-slate-900 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
              <div>
                <p className="section-title text-slate-400">История обращений</p>
                <h3 className="text-2xl font-semibold">Последние события ({myAlerts.length})</h3>
              </div>
              <button onClick={fetchMyAlerts} disabled={loading} className="btn-secondary flex items-center gap-2 text-sm">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Синхронизировать
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-rose-500 mb-3"></div>
                  <p className="text-slate-500 font-medium">Загрузка данных...</p>
                </div>
              ) : (
                myAlerts.map((alert) => (
                  <div key={alert.id} className="relative pl-6">
                    <span className="absolute left-0 top-2 w-3 h-3 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 shadow-[0_0_0_4px_rgba(244,114,182,0.25)]" />
                    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-2xl">{getTypeIcon(alert.type)}</span>
                        <h4 className="text-lg font-semibold">{alert.title || `Тревога: ${alert.type}`}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(alert.status)}`}>
                          {getStatusLabel(alert.status)}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                          ⚡ Приоритет {alert.priority}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600 leading-relaxed">{alert.description}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{formatTime(alert.created_at)}</span>
                        </div>
                        {alert.assigned_to && (
                          <span className="flex items-center gap-2 text-sky-600 font-semibold">
                            <Shield className="w-4 h-4" />
                            Спасатель назначен
                          </span>
                        )}
                        {alert.status === 'completed' && (
                          <span className="flex items-center gap-2 text-emerald-600 font-semibold">✓ Завершено</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card-modern bg-slate-900/60 border border-white/10 text-white p-6 space-y-3">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-rose-200" />
              <h4 className="text-lg font-semibold">Координаты пользователя</h4>
            </div>
            <p className="text-sm text-white/70">
              Текущая точка: <span className="font-semibold">Тверь, Россия</span>. При необходимости укажите точный адрес вручную в форме SOS.
            </p>
          </div>

          <div className="card-modern bg-white/90 text-slate-900 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Waves className="w-5 h-5 text-emerald-500" />
              <h4 className="text-lg font-semibold">Связь с экстренными службами</h4>
            </div>
            <p className="text-sm text-slate-600">
              Платформа гарантирует резервирование каналов и автоматическую передачу данных диспетчеру, включая AI-анализ обращения.
            </p>
          </div>

          <div className="card-modern bg-gradient-to-br from-rose-500/80 via-red-500/70 to-amber-400/80 text-white p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5" />
              <h4 className="text-lg font-semibold">ИИ контроль качества</h4>
            </div>
            <p className="text-sm text-white/90">
              Любой сигнал проходит машинный анализ: определяется тип инцидента, приоритет и рекомендуемые ресурсы до передачи в штаб.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
