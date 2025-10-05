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
  Users,
  Flame,
  Heart,
  Shield,
  Waves,
  Mountain,
  Search,
  Leaf,
  AlertTriangle,
  TrendingUp,
  Award,
  PlayCircle,
  XCircle
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
      
      const alertsResponse = await api.get('/api/v1/sos/')
      const alerts = alertsResponse.data
      
      if (user?.team_id) {
        try {
          const teamResponse = await api.get(`/api/v1/teams/${user.team_id}`)
          setTeamInfo(teamResponse.data)
        } catch (error) {
          console.error('Failed to fetch team info:', error)
        }
      }
      
      setTeamAlerts(alerts.filter((a: SOSAlert) => 
        a.team_id === user?.team_id && 
        a.status !== 'completed'
      ))
      
      setMyAlerts(alerts.filter((a: SOSAlert) => 
        a.assigned_to === user?.id && 
        !a.team_id &&
        a.status !== 'completed'
      ))
      
      setAvailableAlerts(alerts.filter((a: SOSAlert) => 
        (a.status === 'assigned' && !a.assigned_to && !a.team_id) ||
        (a.status === 'assigned' && a.team_id === user?.team_id && !a.assigned_to)
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'fire': return 'Пожар'
      case 'medical': return 'Медицина'
      case 'police': return 'Полиция'
      case 'water_rescue': return 'На воде'
      case 'mountain_rescue': return 'Горы'
      case 'search_rescue': return 'Поиск'
      case 'ecological': return 'Экология'
      default: return 'Общая'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'fire': return 'bg-red-100 text-red-800 border-red-200'
      case 'medical': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'police': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'water_rescue': return 'bg-cyan-100 text-cyan-800 border-cyan-200'
      case 'mountain_rescue': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'search_rescue': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'ecological': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">⏳ Ожидание</span>
      case 'assigned':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">📋 Назначено</span>
      case 'in_progress':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">🚀 Выполняется</span>
      case 'completed':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">✅ Завершено</span>
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">{status}</span>
    }
  }

  const getPriorityBadge = (priority: number) => {
    if (priority === 1) return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white">🔴 Критичный</span>
    if (priority === 2) return <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-600 text-white">🟠 Высокий</span>
    if (priority === 3) return <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-600 text-white">🟡 Средний</span>
    return <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-600 text-white">⚪ Низкий</span>
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

  const openNavigation = (lat: number, lon: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, '_blank')
  }

  const AlertCard = ({ alert, showAccept = false }: { alert: SOSAlert, showAccept?: boolean }) => (
    <div className="card-modern hover:shadow-xl transition-all duration-300 group">
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${getTypeColor(alert.type)} border-2`}>
              {getTypeIconComponent(alert.type)}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{alert.title}</h3>
              <p className="text-sm text-gray-600">{getTypeLabel(alert.type)}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getPriorityBadge(alert.priority)}
            {getStatusBadge(alert.status)}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-700 mb-4 line-clamp-2">{alert.description}</p>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{formatTime(alert.created_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              {Number(alert.latitude).toFixed(4)}, {Number(alert.longitude).toFixed(4)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-100">
          <button
            onClick={() => openNavigation(Number(alert.latitude), Number(alert.longitude))}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all transform hover:scale-105 active:scale-95"
          >
            <Navigation className="w-4 h-4" />
            Навигация
          </button>
          
          {showAccept ? (
            <button
              onClick={() => handleAcceptAlert(alert.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all transform hover:scale-105 active:scale-95"
            >
              <PlayCircle className="w-4 h-4" />
              Принять
            </button>
          ) : (
            <button
              onClick={() => handleComplete(alert.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all transform hover:scale-105 active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              Завершить
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-lg sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                🚒 Панель спасателя
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm sm:text-base text-gray-600 font-medium">
                  {user?.full_name || user?.email}
                </p>
                {teamInfo && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-bold shadow-md">
                    <Users className="w-4 h-4" />
                    {teamInfo.name}
                    {user?.is_team_leader && (
                      <Award className="w-4 h-4 ml-1" />
                    )}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="card-modern bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <AlertCircle className="w-8 h-8" />
              </div>
              <TrendingUp className="w-6 h-6 opacity-50" />
            </div>
            <p className="text-sm opacity-90 mb-1">Мои задачи</p>
            <p className="text-4xl font-extrabold">{myAlerts.length}</p>
          </div>
          
          {user?.team_id && (
            <div className="card-modern bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Users className="w-8 h-8" />
                </div>
                <TrendingUp className="w-6 h-6 opacity-50" />
              </div>
              <p className="text-sm opacity-90 mb-1">Командные</p>
              <p className="text-4xl font-extrabold">{teamAlerts.length}</p>
            </div>
          )}
          
          <div className="card-modern bg-gradient-to-br from-green-500 to-green-600 text-white p-6 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Clock className="w-8 h-8" />
              </div>
              <TrendingUp className="w-6 h-6 opacity-50" />
            </div>
            <p className="text-sm opacity-90 mb-1">Доступно</p>
            <p className="text-4xl font-extrabold">{availableAlerts.length}</p>
          </div>
          
          <div className="card-modern bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <CheckCircle className="w-8 h-8" />
              </div>
              <Award className="w-6 h-6 opacity-50" />
            </div>
            <p className="text-sm opacity-90 mb-1">На смене</p>
            <p className="text-4xl font-extrabold">24/7</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('my')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                activeTab === 'my'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Мои задачи ({myAlerts.length})
            </button>
            {user?.team_id && (
              <button
                onClick={() => setActiveTab('team')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                  activeTab === 'team'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Команда ({teamAlerts.length})
              </button>
            )}
            <button
              onClick={() => setActiveTab('available')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                activeTab === 'available'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Доступные ({availableAlerts.length})
            </button>
          </div>
        </div>

        {/* Alerts Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <RefreshCw className="w-12 h-12 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeTab === 'my' && myAlerts.length === 0 && (
              <div className="col-span-full text-center py-20">
                <CheckCircle className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-500 mb-2">Нет активных задач</h3>
                <p className="text-gray-400">Отличная работа! У вас нет назначенных вызовов.</p>
              </div>
            )}
            {activeTab === 'my' && myAlerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))}

            {activeTab === 'team' && teamAlerts.length === 0 && (
              <div className="col-span-full text-center py-20">
                <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-500 mb-2">Нет командных задач</h3>
                <p className="text-gray-400">У вашей команды нет активных вызовов.</p>
              </div>
            )}
            {activeTab === 'team' && teamAlerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))}

            {activeTab === 'available' && availableAlerts.length === 0 && (
              <div className="col-span-full text-center py-20">
                <AlertCircle className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-500 mb-2">Нет доступных вызовов</h3>
                <p className="text-gray-400">Все вызовы обрабатываются.</p>
              </div>
            )}
            {activeTab === 'available' && availableAlerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} showAccept />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
