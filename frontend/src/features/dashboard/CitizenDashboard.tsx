import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../services/api'
import SOSButton from '../../components/sos/SOSButton'
import { AlertTriangle, MapPin, Phone, LogOut, Clock, RefreshCw, Activity, Shield, Bell } from 'lucide-react'
import type { SOSAlert } from '../../types'

export default function CitizenDashboard() {
  const { user, logout } = useAuthStore()
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in_progress': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидание'
      case 'assigned': return 'Назначено'
      case 'in_progress': return 'Выполняется'
      case 'completed': return 'Завершено'
      case 'cancelled': return 'Отменено'
      default: return status
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
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const activeAlerts = myAlerts.filter(a => a.status !== 'completed' && a.status !== 'cancelled')
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="glass-card sticky top-0 z-50 border-b border-white/20 shadow-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-emergency p-2.5 rounded-2xl shadow-glow transform hover:rotate-12 transition-transform duration-300">
                <span className="text-2xl">🚨</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Rescue System
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">
                  👋 {user?.full_name || user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-all transform hover:scale-105 active:scale-95"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline font-medium">Выйти</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Emergency Alert Banner */}
        <div className="card-modern bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 sm:p-5 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 bg-yellow-100 p-2 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Важная информация</h3>
              <p className="text-sm text-gray-700">
                В случае реальной чрезвычайной ситуации звоните по номеру <span className="font-bold text-red-600">112</span>
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="card-interactive bg-gradient-to-br from-red-500 to-red-600 text-white p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <Activity className="w-8 h-8 opacity-80" />
              <span className="text-3xl sm:text-4xl font-bold">{activeAlerts.length}</span>
            </div>
            <p className="text-sm sm:text-base font-semibold opacity-90">Активных вызовов</p>
          </div>

          <div className="card-interactive bg-gradient-to-br from-blue-500 to-blue-600 text-white p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <Shield className="w-8 h-8 opacity-80" />
              <span className="text-3xl sm:text-4xl font-bold">{myAlerts.length}</span>
            </div>
            <p className="text-sm sm:text-base font-semibold opacity-90">Всего вызовов</p>
          </div>

          <div className="card-interactive bg-gradient-to-br from-green-500 to-green-600 text-white p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <Phone className="w-8 h-8 opacity-80" />
              <span className="text-2xl sm:text-3xl font-bold">112</span>
            </div>
            <p className="text-sm sm:text-base font-semibold opacity-90">Экстренная служба</p>
          </div>

          <div className="card-interactive bg-gradient-to-br from-purple-500 to-purple-600 text-white p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <Bell className="w-8 h-8 opacity-80" />
              <span className="text-3xl sm:text-4xl font-bold">24/7</span>
            </div>
            <p className="text-sm sm:text-base font-semibold opacity-90">Поддержка</p>
          </div>
        </div>

        {/* SOS Section */}
        <div className="card-modern bg-gradient-to-br from-white to-gray-50 p-6 sm:p-10 animate-slide-up">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
              Экстренный вызов
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              Нажмите кнопку SOS для немедленного вызова спасательных служб. 
              Ваше местоположение будет автоматически определено.
            </p>
          </div>

          <div className="flex justify-center">
            <SOSButton />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="card-interactive group">
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-red-100 group-hover:bg-red-200 p-3 sm:p-4 rounded-2xl transition-colors">
                  <MapPin className="w-6 h-6 sm:w-7 sm:h-7 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg">Моё местоположение</h3>
                  <p className="text-sm text-gray-600">Тверь, Россия</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">GPS определение активно</p>
            </div>
          </div>

          <div className="card-interactive group">
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-blue-100 group-hover:bg-blue-200 p-3 sm:p-4 rounded-2xl transition-colors">
                  <Phone className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg">Экстренные службы</h3>
                  <p className="text-sm text-gray-600">Номера: 101, 102, 103</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Доступны 24/7</p>
            </div>
          </div>

          <div className="card-interactive group sm:col-span-2 lg:col-span-1" onClick={fetchMyAlerts}>
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-green-100 group-hover:bg-green-200 p-3 sm:p-4 rounded-2xl transition-colors">
                  <RefreshCw className="w-6 h-6 sm:w-7 sm:h-7 text-green-600 group-hover:rotate-180 transition-transform duration-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg">Обновить историю</h3>
                  <p className="text-sm text-gray-600">{activeAlerts.length} активных</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Нажмите для обновления</p>
            </div>
          </div>
        </div>

        {/* My Alerts History */}
        {myAlerts.length > 0 && (
          <div className="card-modern animate-slide-up">
            <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  📋 История вызовов
                </h3>
                <p className="text-sm text-gray-600 mt-1">Всего вызовов: {myAlerts.length}</p>
              </div>
              <button
                onClick={fetchMyAlerts}
                disabled={loading}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Обновить
              </button>
            </div>
            
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-red-600 mb-3"></div>
                  <p className="text-gray-500 font-medium">Загрузка...</p>
                </div>
              ) : (
                myAlerts.map((alert) => (
                  <div key={alert.id} className="p-5 sm:p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all group">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="flex-1 w-full">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="text-2xl transform group-hover:scale-110 transition-transform">{getTypeIcon(alert.type)}</span>
                          <h4 className="font-bold text-gray-900 text-base sm:text-lg">
                            {alert.title || `Тревога: ${alert.type}`}
                          </h4>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${getStatusColor(alert.status)}`}>
                            {getStatusLabel(alert.status)}
                          </span>
                          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            ⚡ Приоритет {alert.priority}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-4 text-sm sm:text-base leading-relaxed">{alert.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
                          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{formatTime(alert.created_at)}</span>
                          </div>
                          {alert.assigned_to && (
                            <span className="flex items-center gap-1 text-blue-600 font-semibold">
                              <Shield className="w-4 h-4" />
                              Спасатель назначен
                            </span>
                          )}
                          {alert.status === 'completed' && (
                            <span className="flex items-center gap-1 text-green-600 font-bold">
                              ✓ Завершено
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Information Section */}
        <div className="card-modern bg-gradient-to-br from-blue-50 to-indigo-50 p-6 sm:p-8 animate-slide-up border-2 border-blue-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-2xl">
              <span className="text-2xl">💡</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
              Советы по безопасности
            </h3>
          </div>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3 p-3 bg-white/70 backdrop-blur-sm rounded-xl">
              <span className="text-blue-600 text-xl flex-shrink-0">•</span>
              <span className="text-sm sm:text-base">Сохраняйте спокойствие в чрезвычайной ситуации</span>
            </li>
            <li className="flex items-start gap-3 p-3 bg-white/70 backdrop-blur-sm rounded-xl">
              <span className="text-blue-600 text-xl flex-shrink-0">•</span>
              <span className="text-sm sm:text-base">Четко опишите ситуацию и ваше местоположение</span>
            </li>
            <li className="flex items-start gap-3 p-3 bg-white/70 backdrop-blur-sm rounded-xl">
              <span className="text-blue-600 text-xl flex-shrink-0">•</span>
              <span className="text-sm sm:text-base">Следуйте инструкциям диспетчера</span>
            </li>
            <li className="flex items-start gap-3 p-3 bg-white/70 backdrop-blur-sm rounded-xl">
              <span className="text-blue-600 text-xl flex-shrink-0">•</span>
              <span className="text-sm sm:text-base">Не покидайте место происшествия без разрешения</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}
