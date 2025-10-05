import { useState, useEffect } from 'react'
import { Users, Shield, Plus, UserCheck } from 'lucide-react'
import { api } from '../../services/api'
import type { User, RescuerSpecialization, RescueTeam, CreateTeamRequest } from '../../types'

export function CoordinatorDashboard() {
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
      
      // Фильтруем только спасателей
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <nav className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
              <Shield className="w-8 h-8 text-purple-600" />
              👥 Панель координатора
            </h1>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Rescuers Management */}
        <div className="bg-white rounded-xl shadow">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Управление спасателями ({rescuers.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Имя
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Специализация
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Бригада
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Лидер
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Загрузка...
                    </td>
                  </tr>
                ) : rescuers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Нет спасателей
                    </td>
                  </tr>
                ) : (
                  rescuers.map((rescuer) => (
                    <tr key={rescuer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {rescuer.full_name || 'Не указано'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rescuer.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <select
                          value={rescuer.specialization || ''}
                          onChange={(e) => handleUpdateSpecialization(rescuer.id, e.target.value as RescuerSpecialization)}
                          className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">Выберите специализацию</option>
                          <option value="firefighter">Пожарный</option>
                          <option value="paramedic">Врач/Парамедик</option>
                          <option value="police">Полицейский</option>
                          <option value="water_rescue">Спасатель на воде</option>
                          <option value="mountain_rescue">Горный спасатель</option>
                          <option value="search_rescue">Поисковик</option>
                          <option value="technical_rescue">Технический спасатель</option>
                          <option value="ecological">Эколог</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rescuer.team_id ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {teams.find(t => t.id === rescuer.team_id)?.name || 'Бригада'}
                          </span>
                        ) : (
                          <span className="text-gray-400">Не в бригаде</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {rescuer.is_team_leader && (
                          <UserCheck className="w-5 h-5 text-green-600" />
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
        <div className="bg-white rounded-xl shadow">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Бригады ({teams.length})
            </h2>
            <button
              onClick={() => setShowCreateTeam(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Создать бригаду
            </button>
          </div>

          <div className="divide-y divide-gray-200">
            {teams.map((team) => (
              <div key={team.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {team.name}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Тип:</span>{' '}
                        <span className="font-medium">{getTeamTypeName(team.type)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Статус:</span>{' '}
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          team.status === 'available' ? 'bg-green-100 text-green-800' :
                          team.status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {team.status === 'available' ? 'Свободна' : 
                           team.status === 'busy' ? 'Занята' : 'Оффлайн'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Лидер:</span>{' '}
                        <span className="font-medium">{team.leader_name || 'Не назначен'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Участников:</span>{' '}
                        <span className="font-medium">{team.member_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Team Modal */}
        {showCreateTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Создать новую бригаду</h3>
              
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название бригады
                  </label>
                  <input
                    type="text"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип бригады
                  </label>
                  <select
                    value={newTeam.type}
                    onChange={(e) => setNewTeam({...newTeam, type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="multi_purpose">Универсальная</option>
                    <option value="fire">Пожарная</option>
                    <option value="medical">Медицинская</option>
                    <option value="police">Полиция</option>
                    <option value="water_rescue">Спасение на воде</option>
                    <option value="mountain_rescue">Горная</option>
                    <option value="search_rescue">Поисковая</option>
                    <option value="ecological">Экологическая</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Лидер бригады
                  </label>
                  <select
                    value={newTeam.leader_id}
                    onChange={(e) => setNewTeam({...newTeam, leader_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Члены бригады
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {rescuers.filter(r => !r.team_id).map(rescuer => (
                      <label key={rescuer.id} className="flex items-center gap-2 py-2 hover:bg-gray-50 px-2 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newTeam.member_ids?.includes(rescuer.id)}
                          onChange={() => handleToggleTeamMember(rescuer.id)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm">
                          {rescuer.full_name || rescuer.email}
                          {rescuer.specialization && (
                            <span className="text-gray-500 ml-2">
                              ({getSpecializationName(rescuer.specialization)})
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Создать
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateTeam(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
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
