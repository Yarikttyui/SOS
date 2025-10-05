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
  Filter
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
      
      // Fetch alerts
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterType !== 'all') params.append('type', filterType)
      
      const alertsResponse = await api.get(`/api/v1/sos/?${params}`)
      setAlerts(alertsResponse.data)

      // Fetch stats
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
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [filterStatus, filterType])

  const handleAssignAlert = async (alertId: string) => {
    try {
      // Operator assigns alert (changes status to ASSIGNED without specific rescuer)
      await api.patch(`/api/v1/sos/${alertId}`, {
        status: 'assigned'
        // Don't set assigned_to - let rescuers pick it up
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'assigned': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'fire': return '🔥'
      case 'medical': return '🚑'
      case 'police': return '👮'
      case 'water_rescue': return '🚤'
      case 'mountain_rescue': return '⛰️'
      case 'search_rescue': return '🔍'
      case 'ecological': return '☢️'
      default: return '⚠️'
    }
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    return d.toLocaleString('ru-RU')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Панель оператора
              </h1>
              <p className="text-sm text-gray-600">
                Добро пожаловать, {user?.full_name || user?.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Выход</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Всего тревог</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_alerts}</p>
                </div>
                <AlertCircle className="w-12 h-12 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Активные</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.active_alerts}</p>
                </div>
                <Clock className="w-12 h-12 text-yellow-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Сегодня</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.today_alerts}</p>
                </div>
                <RefreshCw className="w-12 h-12 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Завершено</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.by_status?.completed || 0}
                  </p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <div className="flex items-center gap-4 flex-wrap">
            <Filter className="w-5 h-5 text-gray-600" />
            <div className="flex-1 flex gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Все статусы</option>
                <option value="pending">Ожидание</option>
                <option value="assigned">Назначено</option>
                <option value="in_progress">В работе</option>
                <option value="completed">Завершено</option>
              </select>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Все типы</option>
                <option value="fire">Пожар</option>
                <option value="medical">Медицина</option>
                <option value="police">Полиция</option>
                <option value="water_rescue">Спасение на воде</option>
                <option value="mountain_rescue">Горная</option>
                <option value="search_rescue">Поиск</option>
                <option value="ecological">Экология</option>
              </select>
            </div>
            
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Обновить
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="bg-white rounded-xl shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Тревожные сигналы ({alerts.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                Загрузка...
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Нет тревожных сигналов
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getTypeIcon(alert.type)}</span>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {alert.title || `Тревога: ${alert.type}`}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                          {alert.status}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Приоритет: {alert.priority}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{alert.description}</p>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{alert.latitude}, {alert.longitude}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(alert.created_at)}</span>
                        </div>
                        {alert.status === 'in_progress' && (alert.assigned_to_name || alert.team_name) && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium text-blue-600">
                              {alert.team_name || alert.assigned_to_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {alert.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAssignAlert(alert.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Принять
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(alert.id, 'cancelled')}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                          >
                            Отменить
                          </button>
                        </>
                      )}
                      {alert.status === 'in_progress' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(alert.id, 'completed')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            Завершить вызов
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(alert.id, 'cancelled')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            Отменить
                          </button>
                          <span className="text-sm text-blue-600 font-medium">
                            {alert.team_name || alert.assigned_to_name 
                              ? `Бригада: ${alert.team_name || alert.assigned_to_name}` 
                              : 'Бригада в пути'}
                          </span>
                        </>
                      )}
                      {alert.status === 'assigned' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(alert.id, 'cancelled')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            Отменить вызов
                          </button>
                          <span className="text-sm text-orange-600 font-medium">
                            Ожидание бригады
                          </span>
                        </>
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
