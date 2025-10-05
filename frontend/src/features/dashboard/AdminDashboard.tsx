import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../services/api'
import { 
  Users, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  Clock,
  LogOut,
  RefreshCw,
  BarChart3,
  Activity,
  Settings
} from 'lucide-react'
import type { SOSAlert, DashboardStats } from '../../types'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
}

interface ResponseTimeStats {
  average_response_time_minutes: number
  total_processed: number
}

export default function AdminDashboard() {
  const { user, logout } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [alerts, setAlerts] = useState<SOSAlert[]>([])
  const [responseTime, setResponseTime] = useState<ResponseTimeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'alerts'>('overview')

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch dashboard stats
      const statsResponse = await api.get('/api/v1/analytics/dashboard')
      setStats(statsResponse.data)

      // Fetch response time stats
      const responseTimeResponse = await api.get('/api/v1/analytics/reports/response-time')
      setResponseTime(responseTimeResponse.data)

      // Fetch all users
      const usersResponse = await api.get('/api/v1/users/')
      setUsers(usersResponse.data)

      // Fetch recent alerts
      const alertsResponse = await api.get('/api/v1/sos/?limit=20')
      setAlerts(alertsResponse.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChangeUserRole = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/api/v1/users/${userId}`, { role: newRole })
      await fetchData() // Refresh data
    } catch (error) {
      console.error('Failed to update user role:', error)
      alert('Ошибка при изменении роли')
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'operator': return 'bg-blue-100 text-blue-800'
      case 'rescuer': return 'bg-green-100 text-green-800'
      case 'citizen': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU')
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('ru-RU')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Панель администратора</h1>
              <p className="text-purple-100 mt-1">
                {user?.full_name || user?.email} · Полный контроль системы
              </p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Выход</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="w-10 h-10 opacity-80" />
                <div className="text-right">
                  <p className="text-blue-100 text-sm">Всего тревог</p>
                  <p className="text-4xl font-bold">{stats.total_alerts}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-10 h-10 opacity-80" />
                <div className="text-right">
                  <p className="text-yellow-100 text-sm">Активные</p>
                  <p className="text-4xl font-bold">{stats.active_alerts}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-10 h-10 opacity-80" />
                <div className="text-right">
                  <p className="text-green-100 text-sm">Завершено</p>
                  <p className="text-4xl font-bold">{stats.by_status?.completed || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-10 h-10 opacity-80" />
                <div className="text-right">
                  <p className="text-purple-100 text-sm">Пользователи</p>
                  <p className="text-4xl font-bold">{users.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Сегодня</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.today_alerts || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Среднее время</p>
                <p className="text-2xl font-bold text-gray-900">
                  {responseTime?.average_response_time_minutes.toFixed(1) || 0} мин
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow p-6">
            <button
              onClick={fetchData}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Обновить
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow mb-8">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                Обзор
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-5 h-5" />
                Пользователи ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'alerts'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <AlertCircle className="w-5 h-5" />
                Последние тревоги ({alerts.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Статистика по типам</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {Object.entries(stats.by_type || {}).map(([type, count]) => (
                    <div key={type} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getTypeIcon(type)}</span>
                        <span className="text-sm text-gray-600 capitalize">{type}</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                    </div>
                  ))}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-6">Статистика по статусам</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(stats.by_status || {}).map(([status, count]) => (
                    <div key={status} className="bg-gray-50 rounded-lg p-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 ${getStatusColor(status)}`}>
                        {status}
                      </span>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Все пользователи</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <Settings className="w-4 h-4" />
                    Управление
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Имя</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Роль</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата регистрации</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{u.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{u.full_name || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(u.role)}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{formatDate(u.created_at)}</td>
                          <td className="px-6 py-4">
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            >
                              <option value="citizen">Гражданин</option>
                              <option value="rescuer">Спасатель</option>
                              <option value="operator">Оператор</option>
                              <option value="coordinator">Координатор</option>
                              <option value="admin">Админ</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Последние тревоги</h3>
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xl">{getTypeIcon(alert.type)}</span>
                            <h4 className="font-semibold text-gray-900">
                              {alert.title || `Тревога: ${alert.type}`}
                            </h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                              {alert.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Приоритет: {alert.priority}</span>
                            <span>·</span>
                            <span>{formatDateTime(alert.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
