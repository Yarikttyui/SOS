import { useState, useEffect } from 'react'
import { 
  Users, 
  Shield, 
  Plus, 
  Activity,
  Award,
  LogOut,
  RefreshCw,
  Sparkles,
  Target
} from 'lucide-react'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import type { User, RescuerSpecialization, RescueTeam, CreateTeamRequest } from '../../types'

export function CoordinatorDashboard() {
  const { user, logout } = useAuthStore()
  const [rescuers, setRescuers] = useState<User[]>([])
  const [teams, setTeams] = useState<RescueTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [newTeam, setNewTeam] = useState<CreateTeamRequest>({
    name: '',
    type: 'multi_purpose',
    member_ids: [],
    leader_id: '',
    contact_phone: '',
    contact_email: '',
    capacity: '5-10 человек',
    specialization: []
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [usersRes, teamsRes] = await Promise.all([
        api.get('/api/v1/users'),
        api.get('/api/v1/teams')
      ])
      
      const rescuersList = usersRes.data.filter((u: User) => u.role === 'rescuer')
      setRescuers(rescuersList)
      setTeams(teamsRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSpecialization = async (userId: string, specialization: RescuerSpecialization) => {
    try {
      await api.patch(`/api/v1/users/${userId}`, { specialization })
      await fetchData()
    } catch (error) {
      console.error('Failed to update specialization:', error)
      alert('Ошибка при обновлении специализации')
    }
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/api/v1/teams', newTeam)
      setShowCreateTeam(false)
      setNewTeam({
        name: '',
        type: 'multi_purpose',
        member_ids: [],
        leader_id: '',
        contact_phone: '',
        contact_email: '',
        capacity: '5-10 человек',
        specialization: []
      })
      await fetchData()
    } catch (error) {
      console.error('Failed to create team:', error)
      alert('Ошибка при создании бригады')
    }
  }

  const handleToggleTeamMember = (userId: string) => {
    setNewTeam(prev => ({
      ...prev,
      member_ids: prev.member_ids?.includes(userId)
        ? prev.member_ids.filter(id => id !== userId)
        : [...(prev.member_ids || []), userId]
    }))
  }

  const getSpecializationName = (spec?: RescuerSpecialization) => {
    const names: Record<string, string> = {
      firefighter: 'Пожарный',
      paramedic: 'Врач/Парамедик',
      police: 'Полицейский',
      water_rescue: 'Спасатель на воде',
      mountain_rescue: 'Горный спасатель',
      search_rescue: 'Поисковик',
      technical_rescue: 'Технический спасатель',
      ecological: 'Эколог'
    }
    return spec ? names[spec] || spec : 'Не назначена'
  }

  const getSpecializationColor = (spec?: RescuerSpecialization) => {
    const colors: Record<string, string> = {
      firefighter: 'bg-gradient-to-r from-orange-500 to-red-500 text-white',
      paramedic: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
      police: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
      water_rescue: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white',
      mountain_rescue: 'bg-gradient-to-r from-gray-500 to-slate-600 text-white',
      search_rescue: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
      technical_rescue: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
      ecological: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
    }
    return colors[spec || ''] || 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
  }

  const getTeamTypeName = (type: string) => {
    const names: Record<string, string> = {
      fire: 'Пожарная',
      medical: 'Медицинская',
      police: 'Полиция',
      water_rescue: 'Спасение на воде',
      mountain_rescue: 'Горная',
      search_rescue: 'Поисковая',
      ecological: 'Экологическая',
      multi_purpose: 'Универсальная'
    }
    return names[type] || type
  }

  const getTeamTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      fire: 'from-orange-500 to-red-600',
      medical: 'from-red-500 to-pink-600',
      police: 'from-blue-500 to-indigo-600',
      water_rescue: 'from-cyan-500 to-blue-600',
      mountain_rescue: 'from-gray-500 to-slate-700',
      search_rescue: 'from-purple-500 to-pink-600',
      ecological: 'from-green-500 to-emerald-700',
      multi_purpose: 'from-purple-500 to-pink-600'
    }
    return colors[type] || 'from-gray-500 to-gray-700'
  }

  const availableRescuers = rescuers.filter(r => !r.team_id)
  const activeTeams = teams.filter(t => t.status === 'available')
  const busyTeams = teams.filter(t => t.status === 'busy')

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      {/* Enhanced Header with Glass Effect */}
      <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-2">
                  Панель координатора
                </h1>
                <p className="text-purple-600 mt-1 font-medium">
                  {user?.full_name || user?.email} • Управление командами
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 text-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-12 h-12 opacity-90" />
              <div className="text-right">
                <p className="text-purple-100 text-sm font-medium mb-1">Всего спасателей</p>
                <p className="text-5xl font-bold">{rescuers.length}</p>
              </div>
            </div>
            <div className="h-1 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white/60 rounded-full w-full"></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 text-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-12 h-12 opacity-90" />
              <div className="text-right">
                <p className="text-green-100 text-sm font-medium mb-1">Доступны</p>
                <p className="text-5xl font-bold">{availableRescuers.length}</p>
              </div>
            </div>
            <div className="h-1 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white/60 rounded-full w-3/4"></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <Shield className="w-12 h-12 opacity-90" />
              <div className="text-right">
                <p className="text-blue-100 text-sm font-medium mb-1">Активные бригады</p>
                <p className="text-5xl font-bold">{activeTeams.length}</p>
              </div>
            </div>
            <div className="h-1 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white/60 rounded-full w-2/3 animate-pulse"></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-12 h-12 opacity-90" />
              <div className="text-right">
                <p className="text-orange-100 text-sm font-medium mb-1">На задании</p>
                <p className="text-5xl font-bold">{busyTeams.length}</p>
              </div>
            </div>
            <div className="h-1 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white/60 rounded-full w-1/2"></div>
            </div>
          </div>
        </div>

        {/* Rescuers Management */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-7 h-7 text-purple-600" />
              Управление спасателями
              <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-bold">{rescuers.length}</span>
            </h2>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50 font-medium shadow-lg"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Обновить
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Спасатель
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Специализация
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Бригада
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Лидер
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                        <span className="font-medium">Загрузка данных...</span>
                      </div>
                    </td>
                  </tr>
                ) : rescuers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-12 h-12 text-gray-400" />
                        <span className="font-medium">Нет зарегистрированных спасателей</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rescuers.map((rescuer) => (
                    <tr key={rescuer.id} className="hover:bg-purple-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-sm font-bold text-gray-900">
                            {rescuer.full_name || 'Не указано'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {rescuer.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          id={`rescuer-specialization-${rescuer.id}`}
                          value={rescuer.specialization || ''}
                          onChange={(e) => handleUpdateSpecialization(rescuer.id, e.target.value as RescuerSpecialization)}
                          className="px-4 py-2 border-2 border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-purple-400 transition-colors"
                          aria-label={`Специализация для спасателя ${rescuer.full_name || rescuer.email}`}
                        >
                          <option value="">Выберите специализацию</option>
                          <option value="firefighter">🔥 Пожарный</option>
                          <option value="paramedic">🚑 Врач/Парамедик</option>
                          <option value="police">👮 Полицейский</option>
                          <option value="water_rescue">🚤 Спасатель на воде</option>
                          <option value="mountain_rescue">⛰️ Горный спасатель</option>
                          <option value="search_rescue">🔍 Поисковик</option>
                          <option value="technical_rescue">🔧 Технический спасатель</option>
                          <option value="ecological">🌿 Эколог</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {rescuer.team_id ? (
                          <span className={`inline-flex px-4 py-2 bg-gradient-to-r ${getTeamTypeColor(teams.find(t => t.id === rescuer.team_id)?.type || '')} text-white rounded-xl text-xs font-bold shadow-md`}>
                            {teams.find(t => t.id === rescuer.team_id)?.name || 'Бригада'}
                          </span>
                        ) : (
                          <span className="inline-flex px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-xs font-medium">
                            Не в бригаде
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {rescuer.is_team_leader && (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl shadow-md">
                            <Award className="w-4 h-4" />
                            <span className="text-xs font-bold">Лидер</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Teams Management */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="w-7 h-7 text-purple-600" />
              Бригады спасателей
              <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-bold">{teams.length}</span>
            </h2>
            <button
              onClick={() => setShowCreateTeam(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl font-medium"
            >
              <Plus className="w-5 h-5" />
              Создать бригаду
            </button>
          </div>

          <div className="divide-y divide-gray-200">
            {teams.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <div className="flex flex-col items-center gap-3">
                  <Shield className="w-16 h-16 text-gray-400" />
                  <p className="font-medium text-lg">Нет созданных бригад</p>
                  <button
                    onClick={() => setShowCreateTeam(true)}
                    className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg font-medium"
                  >
                    Создать первую бригаду
                  </button>
                </div>
              </div>
            ) : (
              teams.map((team) => (
                <div key={team.id} className="p-6 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`bg-gradient-to-br ${getTeamTypeColor(team.type)} p-3 rounded-xl shadow-lg`}>
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {team.name}
                          </h3>
                          <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold mt-1 ${
                            team.status === 'available' ? 'bg-green-100 text-green-800 border border-green-200' :
                            team.status === 'busy' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                            'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}>
                            {team.status === 'available' ? '✓ Свободна' : 
                             team.status === 'busy' ? '⚡ Занята' : '○ Оффлайн'}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm ml-14">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-600 text-xs font-medium mb-1">Тип</p>
                          <p className="font-bold text-gray-900">{getTeamTypeName(team.type)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-600 text-xs font-medium mb-1">Лидер</p>
                          <p className="font-bold text-gray-900">{team.leader_name || 'Не назначен'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-600 text-xs font-medium mb-1">Участников</p>
                          <p className="font-bold text-gray-900">{team.member_count || 0}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-600 text-xs font-medium mb-1">Вместимость</p>
                          <p className="font-bold text-gray-900">{team.capacity || 'Не указана'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Team Modal */}
        {showCreateTeam && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Создать новую бригаду</h3>
              </div>
              
              <form onSubmit={handleCreateTeam} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Название бригады
                  </label>
                  <input
                    type="text"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                    required
                    placeholder="Например: Альфа-1"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="create-team-type">
                    Тип бригады
                  </label>
                  <select
                    id="create-team-type"
                    value={newTeam.type}
                    onChange={(e) => setNewTeam({...newTeam, type: e.target.value as any})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors font-medium"
                  >
                    <option value="multi_purpose">⭐ Универсальная</option>
                    <option value="fire">🔥 Пожарная</option>
                    <option value="medical">🚑 Медицинская</option>
                    <option value="police">👮 Полиция</option>
                    <option value="water_rescue">🚤 Спасение на воде</option>
                    <option value="mountain_rescue">⛰️ Горная</option>
                    <option value="search_rescue">🔍 Поисковая</option>
                    <option value="ecological">🌿 Экологическая</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Члены бригады
                  </label>
                  <div className="border-2 border-gray-300 rounded-xl p-4 max-h-48 overflow-y-auto bg-gray-50">
                    {availableRescuers.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Нет доступных спасателей</p>
                    ) : (
                      availableRescuers.map(rescuer => (
                        <label key={rescuer.id} className="flex items-center gap-3 py-2 px-3 hover:bg-white rounded-lg cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={newTeam.member_ids?.includes(rescuer.id)}
                            onChange={() => handleToggleTeamMember(rescuer.id)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-5 h-5"
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {rescuer.full_name || rescuer.email}
                          </span>
                          {rescuer.specialization && (
                            <span className={`ml-auto px-2 py-1 rounded-lg text-xs font-bold ${getSpecializationColor(rescuer.specialization)}`}>
                              {getSpecializationName(rescuer.specialization)}
                            </span>
                          )}
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="create-team-leader">
                    Лидер бригады
                  </label>
                  <select
                    id="create-team-leader"
                    value={newTeam.leader_id}
                    onChange={(e) => setNewTeam({...newTeam, leader_id: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors font-medium"
                    disabled={!newTeam.member_ids || newTeam.member_ids.length === 0}
                  >
                    <option value="">
                      {!newTeam.member_ids || newTeam.member_ids.length === 0 
                        ? 'Сначала выберите членов команды' 
                        : 'Выберите лидера'}
                    </option>
                    {rescuers
                      .filter(r => newTeam.member_ids?.includes(r.id))
                      .map(r => (
                        <option key={r.id} value={r.id}>
                          {r.full_name || r.email} {r.specialization ? `(${getSpecializationName(r.specialization)})` : ''}
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl font-bold"
                  >
                    ✨ Создать бригаду
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateTeam(false)}
                    className="flex-1 px-6 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-bold"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
