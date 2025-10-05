import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../services/api'
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Navigation,
  LogOut,
  RefreshCw,
  Phone,
  Users
} from 'lucide-react'
import type { SOSAlert, RescueTeam } from '../../types'

export default function RescuerDashboard() {
  const { user, logout } = useAuthStore()
  const [myAlerts, setMyAlerts] = useState<SOSAlert[]>([])
  const [teamAlerts, setTeamAlerts] = useState<SOSAlert[]>([])
  const [availableAlerts, setAvailableAlerts] = useState<SOSAlert[]>([])
  const [teamInfo, setTeamInfo] = useState<RescueTeam | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'my' | 'team' | 'available'>('my')

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch alerts
      const alertsResponse = await api.get('/api/v1/sos/')
      const alerts = alertsResponse.data
      
      // Fetch team info if user is in a team
      if (user?.team_id) {
        try {
          const teamResponse = await api.get(`/api/v1/teams/${user.team_id}`)
          setTeamInfo(teamResponse.data)
        } catch (error) {
          console.error('Failed to fetch team info:', error)
        }
      }
      
      // Team alerts (all alerts assigned to my team)
      setTeamAlerts(alerts.filter((a: SOSAlert) => 
        a.team_id === user?.team_id && 
        a.status !== 'completed'
      ))
      
      // My personal alerts (assigned to me WITHOUT team - personal tasks only)
      setMyAlerts(alerts.filter((a: SOSAlert) => 
        a.assigned_to === user?.id && 
        !a.team_id && // Only personal tasks without team
        a.status !== 'completed'
      ))
      
      // Available alerts (unassigned or assigned to my team but not accepted yet)
      setAvailableAlerts(alerts.filter((a: SOSAlert) => 
        (a.status === 'assigned' && !a.assigned_to && !a.team_id) || // General pool
        (a.status === 'assigned' && a.team_id === user?.team_id && !a.assigned_to) // Assigned to my team
      ))
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchData()
    }
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [user?.id, user?.team_id])

  const handleAcceptAlert = async (alertId: string) => {
    try {
      // Send PATCH with empty body - backend will assign to current user and change status to IN_PROGRESS
      await api.patch(`/api/v1/sos/${alertId}`, {})
      fetchData()
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
      console.error('Failed to complete:', error)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'assigned': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 60000)
    
    if (diff < 60) return `${diff} мин назад`
    if (diff < 1440) return `${Math.floor(diff / 60)} ч назад`
    return d.toLocaleDateString('ru-RU')
  }

  const openNavigation = (lat: number, lon: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Панель спасателя
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-gray-600">
                  {user?.full_name || user?.email}
                </p>
                {teamInfo && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    <Users className="w-4 h-4" />
                    {teamInfo.name}
                    {user?.is_team_leader && (
                      <span className="ml-1 text-xs">(Лидер)</span>
                    )}
                  </span>
                )}
              </div>
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Мои задачи</p>
                <p className="text-3xl font-bold text-blue-600">{myAlerts.length}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          
          {user?.team_id && (
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Команда</p>
                  <p className="text-3xl font-bold text-purple-600">{teamAlerts.length}</p>
                </div>
                <Users className="w-12 h-12 text-purple-500" />
              </div>
            </div>
          )}
          
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Доступно</p>
                <p className="text-3xl font-bold text-yellow-600">{availableAlerts.length}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow p-6">
            <button
              onClick={fetchData}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Обновить
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow mb-8">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('my')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'my'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Мои задачи ({myAlerts.length})
              </button>
              {user?.team_id && (
                <button
                  onClick={() => setActiveTab('team')}
                  className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                    activeTab === 'team'
                      ? 'border-b-2 border-purple-600 text-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Команда ({teamAlerts.length})
                </button>
              )}
              {user?.is_team_leader && (
                <button
                  onClick={() => setActiveTab('available')}
                  className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                    activeTab === 'available'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Доступные ({availableAlerts.length})
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Загрузка...</div>
            ) : activeTab === 'my' ? (
              myAlerts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  У вас нет активных задач
                </div>
              ) : (
                myAlerts.map((alert) => (
                  <div key={alert.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">{getTypeIcon(alert.type)}</span>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {alert.title || `Тревога: ${alert.type}`}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                            {alert.status === 'assigned' ? 'Назначено' : 'В работе'}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-4">{alert.description}</p>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(alert.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{alert.address || 'Координаты доступны'}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <button
                            onClick={() => openNavigation(alert.latitude, alert.longitude)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <Navigation className="w-4 h-4" />
                            Навигация
                          </button>
                          
                          <button
                            onClick={() => window.open('tel:112')}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <Phone className="w-4 h-4" />
                            112
                          </button>
                          
                          {alert.status === 'in_progress' && (
                            <button
                              onClick={() => handleComplete(alert.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Завершить
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : activeTab === 'team' ? (
              teamAlerts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  У команды нет активных задач
                </div>
              ) : (
                teamAlerts.map((alert) => (
                  <div key={alert.id} className="p-6 bg-purple-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">{getTypeIcon(alert.type)}</span>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {alert.title || `Тревога: ${alert.type}`}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                            {alert.status === 'assigned' ? 'Назначено' : 'В работе'}
                          </span>
                          {alert.assigned_to_name && (
                            <span className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-xs font-medium">
                              Принял: {alert.assigned_to_name}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-4">{alert.description}</p>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(alert.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{alert.address || 'Координаты доступны'}</span>
                          </div>
                          {alert.team_name && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>{alert.team_name}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-3">
                          <button
                            onClick={() => openNavigation(alert.latitude, alert.longitude)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <Navigation className="w-4 h-4" />
                            Навигация
                          </button>
                          
                          <button
                            onClick={() => window.open('tel:112')}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <Phone className="w-4 h-4" />
                            112
                          </button>
                          
                          {alert.status === 'in_progress' && (user?.is_team_leader || alert.assigned_to === user?.id) && (
                            <button
                              onClick={() => handleComplete(alert.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Завершить
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              availableAlerts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Нет доступных задач
                </div>
              ) : (
                availableAlerts.map((alert) => (
                  <div key={alert.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">{getTypeIcon(alert.type)}</span>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {alert.title || `Тревога: ${alert.type}`}
                          </h3>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Приоритет: {alert.priority}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{alert.description}</p>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(alert.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{alert.latitude}, {alert.longitude}</span>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleAcceptAlert(alert.id)}
                        className="ml-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Принять
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
