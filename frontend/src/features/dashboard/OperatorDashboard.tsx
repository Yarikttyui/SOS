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

export default function OperatorDashboard() {
  const { user, logout } = useAuthStore()
  const [alerts, setAlerts] = useState<SOSAlert[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
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
      setAlerts(alertsResponse.data)

      const statsResponse = await api.get('/api/v1/analytics/dashboard')
      setStats(statsResponse.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
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
    const iconProps = { className: "w-5 h-5" }
    switch (type) {
      case 'fire': return <Flame {...iconProps} className="w-5 h-5 text-red-600" />
      case 'medical': return <Heart {...iconProps} className="w-5 h-5 text-blue-600" />
      case 'police': return <Shield {...iconProps} className="w-5 h-5 text-indigo-600" />
      case 'water_rescue': return <Waves {...iconProps} className="w-5 h-5 text-cyan-600" />
      case 'mountain_rescue': return <Mountain {...iconProps} className="w-5 h-5 text-yellow-700" />
      case 'search_rescue': return <Search {...iconProps} className="w-5 h-5 text-orange-600" />
      case 'ecological': return <Leaf {...iconProps} className="w-5 h-5 text-green-600" />
      default: return <AlertTriangle {...iconProps} className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">⏳ Ожидание</span>
      case 'assigned':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">📋 Назначено</span>
      case 'in_progress':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">🚀 В работе</span>
      case 'completed':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">✅ Завершено</span>
      case 'cancelled':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-300">❌ Отменено</span>
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-300">{status}</span>
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return 'border-l-4 border-red-600 bg-red-50'
    if (priority === 2) return 'border-l-4 border-orange-600 bg-orange-50'
    if (priority === 3) return 'border-l-4 border-yellow-600 bg-yellow-50'
    return 'border-l-4 border-gray-600 bg-gray-50'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-lg sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                📞 Панель оператора
              </h1>
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                {user?.full_name || user?.email}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl font-semibold transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Обновить</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-semibold transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Выход</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="card-modern bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <TrendingUp className="w-6 h-6 opacity-50" />
              </div>
              <p className="text-sm opacity-90 mb-1">Всего тревог</p>
              <p className="text-4xl font-extrabold">{stats.total_alerts || 0}</p>
            </div>
            
            <div className="card-modern bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Activity className="w-8 h-8" />
                </div>
                <TrendingUp className="w-6 h-6 opacity-50" />
              </div>
              <p className="text-sm opacity-90 mb-1">Активные</p>
              <p className="text-4xl font-extrabold">{stats.active_alerts || 0}</p>
            </div>
            
            <div className="card-modern bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Clock className="w-8 h-8" />
                </div>
                <TrendingUp className="w-6 h-6 opacity-50" />
              </div>
              <p className="text-sm opacity-90 mb-1">Сегодня</p>
              <p className="text-4xl font-extrabold">{stats.today_alerts || 0}</p>
            </div>
            
            <div className="card-modern bg-gradient-to-br from-green-500 to-green-600 text-white p-6 hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <TrendingUp className="w-6 h-6 opacity-50" />
              </div>
              <p className="text-sm opacity-90 mb-1">Завершено</p>
              <p className="text-4xl font-extrabold">{stats.by_status?.completed || 0}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card-modern p-5 sm:p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-gray-700">
              <Filter className="w-5 h-5" />
              <span className="font-semibold">Фильтры:</span>
            </div>
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-modern flex-1"
              >
                <option value="all">Все статусы</option>
                <option value="pending">Ожидание</option>
                <option value="assigned">Назначено</option>
                <option value="in_progress">В работе</option>
                <option value="completed">Завершено</option>
                <option value="cancelled">Отменено</option>
              </select>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-modern flex-1"
              >
                <option value="all">Все типы</option>
                <option value="fire">🔥 Пожар</option>
                <option value="medical">🚑 Медицина</option>
                <option value="police">👮 Полиция</option>
                <option value="water_rescue">🌊 На воде</option>
                <option value="mountain_rescue">⛰️ Горы</option>
                <option value="search_rescue">🔍 Поиск</option>
                <option value="ecological">☢️ Экология</option>
                <option value="general">⚠️ Общая</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="card-modern">
          <div className="p-5 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-cyan-50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                🚨 Тревожные сигналы
              </h2>
              <span className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-lg">
                {alerts.length}
              </span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw className="w-16 h-16 text-indigo-600 animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Загрузка данных...</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="w-20 h-20 text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-500 mb-2">Нет тревожных сигналов</h3>
                <p className="text-gray-400">Все спокойно! 🎉</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-5 sm:p-6 hover:bg-gray-50 transition-all ${getPriorityColor(alert.priority)}`}
                >
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          {getTypeIconComponent(alert.type)}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {alert.title || `Тревога: ${alert.type}`}
                        </h3>
                        {getStatusBadge(alert.status)}
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white">
                          P{alert.priority}
                        </span>
                      </div>
                      
                      {/* Description */}
                      <p className="text-gray-700 mb-4 leading-relaxed">{alert.description}</p>
                      
                      {/* Info Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="font-mono">{Number(alert.latitude).toFixed(4)}, {Number(alert.longitude).toFixed(4)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{formatTime(alert.created_at)}</span>
                        </div>
                        {(alert.assigned_to_name || alert.team_name) && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-indigo-600" />
                            <span className="font-semibold text-indigo-600">
                              {alert.team_name || alert.assigned_to_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex lg:flex-col gap-2 min-w-[160px]">
                      {alert.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAssignAlert(alert.id)}
                            className="flex-1 lg:flex-none btn-primary flex items-center justify-center gap-2 py-3"
                          >
                            <Phone className="w-4 h-4" />
                            Принять
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(alert.id, 'cancelled')}
                            className="flex-1 lg:flex-none px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all"
                          >
                            Отменить
                          </button>
                        </>
                      )}
                      {alert.status === 'in_progress' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(alert.id, 'completed')}
                            className="flex-1 lg:flex-none btn-primary bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2 py-3"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Завершить
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(alert.id, 'cancelled')}
                            className="flex-1 lg:flex-none px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all"
                          >
                            Отменить
                          </button>
                        </>
                      )}
                      {alert.status === 'assigned' && (
                        <button
                          onClick={() => handleUpdateStatus(alert.id, 'cancelled')}
                          className="flex-1 lg:flex-none px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all"
                        >
                          Отменить вызов
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
