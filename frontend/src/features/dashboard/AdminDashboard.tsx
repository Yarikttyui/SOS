import { useState, useEffect } from 'react'
import { 
  LogOut, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  Users, 
  TrendingUp, 
  Activity, 
  RefreshCw,
  BarChart3,
  Settings,
  UserCog,
  Flame,
  Heart,
  Shield,
  Waves,
  Mountain,
  Search,
  AlertTriangle,
  Leaf
} from 'lucide-react'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import type { User, SOSAlert } from '../../types'

interface SystemStats {
  total_alerts: number
  active_alerts: number
  today_alerts: number
  by_status: Record<string, number>
  by_type: Record<string, number>
}

interface ResponseTimeStats {
  average_response_time_minutes: number
}

export default function AdminDashboard() {
  const { user, logout } = useAuthStore()
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [responseTime, setResponseTime] = useState<ResponseTimeStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [alerts, setAlerts] = useState<SOSAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'alerts'>('overview')

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsRes, usersRes, alertsRes, responseRes] = await Promise.all([
        api.get('/api/v1/stats/system'),
        api.get('/api/v1/users'),
        api.get('/api/v1/sos/recent?limit=20'),
        api.get('/api/v1/stats/response-time')
      ])
      
      setStats(statsRes.data)
      setUsers(usersRes.data)
      setAlerts(alertsRes.data)
      setResponseTime(responseRes.data)
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChangeUserRole = async (userId: string, role: string) => {
    try {
      await api.patch(`/api/v1/users/${userId}`, { role })
      await fetchData()
    } catch (error) {
      console.error('Failed to change role:', error)
      alert('Ошибка при изменении роли')
    }
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
      coordinator: 'bg-gradient-to-r from-purple-400 to-pink-400 text-white',
      operator: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
      rescuer: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
      citizen: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      accepted: 'bg-blue-100 text-blue-800 border border-blue-200',
      in_progress: 'bg-purple-100 text-purple-800 border border-purple-200',
      completed: 'bg-green-100 text-green-800 border border-green-200',
      cancelled: 'bg-gray-100 text-gray-800 border border-gray-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      fire: <Flame className="w-5 h-5 text-orange-500" />,
      medical: <Heart className="w-5 h-5 text-red-500" />,
      police: <Shield className="w-5 h-5 text-blue-500" />,
      water_rescue: <Waves className="w-5 h-5 text-cyan-500" />,
      mountain_rescue: <Mountain className="w-5 h-5 text-gray-600" />,
      search_rescue: <Search className="w-5 h-5 text-purple-500" />,
      ecological: <Leaf className="w-5 h-5 text-green-600" />,
      general: <AlertTriangle className="w-5 h-5 text-yellow-500" />
    }
    return icons[type] || icons.general
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      fire: 'Пожар',
      medical: 'Медицина',
      police: 'Полиция',
      water_rescue: 'Спасение на воде',
      mountain_rescue: 'Горная спасательная',
      search_rescue: 'Поисково-спасательная',
      ecological: 'Экологическая',
      general: 'Общая'
    }
    return labels[type] || type
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU')
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('ru-RU')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Modern Header with Glass Effect */}
      <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl shadow-lg">
                <UserCog className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Панель администратора
                </h1>
                <p className="text-purple-600 mt-1 font-medium">
                  {user?.full_name || user?.email} • Полный контроль системы
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Выход</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Cards with Gradients and Animations */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="group bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <AlertCircle className="w-12 h-12 opacity-90 group-hover:scale-110 transition-transform" />
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium mb-1">Всего тревог</p>
                  <p className="text-5xl font-bold">{stats.total_alerts}</p>
                </div>
              </div>
              <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white/60 rounded-full w-3/4"></div>
              </div>
            </div>
            
            <div className="group bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-12 h-12 opacity-90 group-hover:scale-110 transition-transform" />
                <div className="text-right">
                  <p className="text-orange-100 text-sm font-medium mb-1">Активные</p>
                  <p className="text-5xl font-bold">{stats.active_alerts}</p>
                </div>
              </div>
              <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white/60 rounded-full w-1/2 animate-pulse"></div>
              </div>
            </div>
            
            <div className="group bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 text-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle className="w-12 h-12 opacity-90 group-hover:scale-110 transition-transform" />
                <div className="text-right">
                  <p className="text-green-100 text-sm font-medium mb-1">Завершено</p>
                  <p className="text-5xl font-bold">{stats.by_status?.completed || 0}</p>
                </div>
              </div>
              <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white/60 rounded-full w-full"></div>
              </div>
            </div>
            
            <div className="group bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 text-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-12 h-12 opacity-90 group-hover:scale-110 transition-transform" />
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium mb-1">Пользователи</p>
                  <p className="text-5xl font-bold">{users.length}</p>
                </div>
              </div>
              <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white/60 rounded-full w-5/6"></div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-4 rounded-xl">
                <TrendingUp className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Сегодня</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.today_alerts || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-4 rounded-xl">
                <Activity className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Среднее время</p>
                <p className="text-3xl font-bold text-gray-900">
                  {responseTime?.average_response_time_minutes.toFixed(1) || 0} мин
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <button
              onClick={fetchData}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl"
            >
              <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
              Обновить данные
            </button>
          </div>
        </div>

        {/* Modern Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden border border-gray-100">
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-8 py-4 font-semibold transition-all ${
                  activeTab === 'overview'
                    ? 'border-b-3 border-purple-600 text-purple-600 bg-purple-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                Обзор системы
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-8 py-4 font-semibold transition-all ${
                  activeTab === 'users'
                    ? 'border-b-3 border-purple-600 text-purple-600 bg-purple-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Users className="w-5 h-5" />
                Пользователи ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={`flex items-center gap-2 px-8 py-4 font-semibold transition-all ${
                  activeTab === 'alerts'
                    ? 'border-b-3 border-purple-600 text-purple-600 bg-purple-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <AlertCircle className="w-5 h-5" />
                Последние тревоги ({alerts.length})
              </button>
            </div>
          </div>

          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <BarChart3 className="w-7 h-7 text-purple-600" />
                  Статистика по типам тревог
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                  {Object.entries(stats.by_type || {}).map(([type, count]) => (
                    <div key={type} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all hover:scale-105">
                      <div className="flex items-center gap-3 mb-3">
                        {getTypeIcon(type)}
                        <span className="text-sm text-gray-700 font-medium">{getTypeLabel(type)}</span>
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{count}</p>
                    </div>
                  ))}
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Activity className="w-7 h-7 text-purple-600" />
                  Статистика по статусам
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  {Object.entries(stats.by_status || {}).map(([status, count]) => (
                    <div key={status} className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all hover:scale-105">
                      <span className={`inline-flex px-4 py-2 rounded-xl text-xs font-bold mb-3 ${getStatusColor(status)}`}>
                        {status}
                      </span>
                      <p className="text-3xl font-bold text-gray-900">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Users className="w-7 h-7 text-purple-600" />
                    Управление пользователями
                  </h3>
                  <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl font-medium">
                    <Settings className="w-5 h-5" />
                    Настройки
                  </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Имя</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Роль</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Дата регистрации</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-purple-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{u.full_name || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-4 py-2 rounded-xl text-xs font-bold ${getRoleColor(u.role)} shadow-md`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatDate(u.created_at)}</td>
                          <td className="px-6 py-4">
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                              className="px-4 py-2 border-2 border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-purple-400 transition-colors"
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
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <AlertCircle className="w-7 h-7 text-purple-600" />
                  Последние тревоги
                </h3>
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-3 rounded-xl">
                              {getTypeIcon(alert.type)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 text-lg">
                                {alert.title || `Тревога: ${getTypeLabel(alert.type)}`}
                              </h4>
                              <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold mt-1 ${getStatusColor(alert.status)}`}>
                                {alert.status}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mb-3 ml-16">{alert.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 ml-16">
                            <span className="font-medium">Приоритет: <span className="text-purple-600">{alert.priority}</span></span>
                            <span>•</span>
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
