import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../services/api'
import SOSButton from '../../components/sos/SOSButton'
import { AlertTriangle, MapPin, Phone, LogOut, Clock, RefreshCw } from 'lucide-react'
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
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'assigned': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-green-100 text-green-800'
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
    return new Date(date).toLocaleString('ru-RU')
  }

  const activeAlerts = myAlerts.filter(a => a.status !== 'completed' && a.status !== 'cancelled')
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🚨 Rescue System
              </h1>
              <p className="text-sm text-gray-600">Добро пожаловать, {user?.full_name || user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Emergency Alert Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                В случае реальной чрезвычайной ситуации звоните по номеру <strong>112</strong>
              </p>
            </div>
          </div>
        </div>

        {/* SOS Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Экстренный вызов
            </h2>
            <p className="text-gray-600">
              Нажмите кнопку SOS для вызова спасательных служб
            </p>
          </div>

          <div className="flex justify-center">
            <SOSButton />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 p-3 rounded-lg">
                <MapPin className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Моё местоположение</h3>
                <p className="text-sm text-gray-600">Тверь, Россия</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Экстренные службы</h3>
                <p className="text-sm text-gray-600">Номера: 101, 102, 103</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={fetchMyAlerts}>
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">История вызовов</h3>
                <p className="text-sm text-gray-600">{activeAlerts.length} активных</p>
              </div>
            </div>
          </div>
        </div>

        {/* My Alerts History */}
        {myAlerts.length > 0 && (
          <div className="bg-white rounded-xl shadow mb-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                Мои вызовы ({myAlerts.length})
              </h3>
              <button
                onClick={fetchMyAlerts}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Обновить
              </button>
            </div>
            
            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Загрузка...</div>
              ) : (
                myAlerts.map((alert) => (
                  <div key={alert.id} className="p-6 hover:bg-gray-50 transition-colors">
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
                          {alert.assigned_to && (
                            <span className="text-blue-600">✓ Спасатель назначен</span>
                          )}
                          {alert.status === 'completed' && (
                            <span className="text-green-600 font-medium">✓ Завершено</span>
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
        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            💡 Советы по безопасности
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Сохраняйте спокойствие в чрезвычайной ситуации</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Четко опишите ситуацию и ваше местоположение</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Следуйте инструкциям диспетчера</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Не покидайте место происшествия без разрешения</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}
