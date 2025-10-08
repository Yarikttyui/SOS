import { useState, useEffect, useRef } from 'react';
import { Users, Shield, Activity, UserCog, Plus, Search } from 'lucide-react';
import axios from 'axios';
import { notify } from '../../utils/notifications';
import { useConfirmDialog } from '../../components/ConfirmDialog';

interface User {
  id?: number | string;
  email?: string;
  full_name?: string;
  name?: string; // Альтернативное поле из API
  user_id?: string; // ID из members API
  phone?: string;
  role?: string;
  specialization?: string;
  status?: string;
  created_at?: string;
}

interface RescueTeam {
  id: number | string;
  name: string;
  description?: string;
  leader_id?: number | string;
  status: string;
  created_at?: string;
  members?: any[]; // Может быть User[] или упрощенными объектами
  leader?: User;
}

type CoordinatorTab = 'overview' | 'rescuers' | 'teams';

export default function CoordinatorDashboard() {
  const { showConfirm, ConfirmDialog } = useConfirmDialog();
  const [activeTab, setActiveTab] = useState<CoordinatorTab>('overview');
  const [rescuers, setRescuers] = useState<User[]>([]);
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<RescueTeam | null>(null);
  const [showManageMembersModal, setShowManageMembersModal] = useState(false);
  const [showChangeLeaderModal, setShowChangeLeaderModal] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [newLeaderId, setNewLeaderId] = useState<string>('');
  const [newTeam, setNewTeam] = useState({
    name: '',
    type: 'general',
    description: '',
    leader_id: '',
    status: 'active'
  });

  const fetchDataRef = useRef(false);

  useEffect(() => {
    // Предотвращаем двойной вызов в StrictMode
    if (fetchDataRef.current) return;
    fetchDataRef.current = true;
    
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.warn('Токен не найден');
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };

      const [rescuersRes, teamsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/v1/users?role=rescuer`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/v1/teams`, { headers })
      ]);

      console.log('Данные загружены:', {
        rescuers: rescuersRes.data.length,
        teams: teamsRes.data.length
      });

      setRescuers(rescuersRes.data);
      setTeams(teamsRes.data);
    } catch (error: any) {
      console.error('Ошибка загрузки данных:', error);
      console.error('Детали ошибки:', error.response?.data);
      
      // Показываем ошибку только если это не первая загрузка без токена
      if (localStorage.getItem('access_token') && fetchDataRef.current) {
        const errorMessage = error.response?.data?.detail || 'Не удалось загрузить данные';
        notify.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      const teamData = {
        name: newTeam.name,
        type: newTeam.type,
        description: newTeam.description,
        leader_id: newTeam.leader_id ? parseInt(newTeam.leader_id) : undefined,
        status: newTeam.status
      };

      await notify.promise(
        axios.post(`${import.meta.env.VITE_API_URL}/api/v1/teams`, teamData, { headers }),
        {
          loading: 'Создание команды...',
          success: 'Команда успешно создана!',
          error: 'Ошибка при создании команды'
        }
      );
      
      setShowCreateTeamModal(false);
      setNewTeam({
        name: '',
        type: 'general',
        description: '',
        leader_id: '',
        status: 'active'
      });
      
      fetchData();
    } catch (error) {
      console.error('Ошибка создания команды:', error);
    }
  };

  const handleManageRescuers = () => {
    setActiveTab('rescuers');
  };

  const handleOpenManageMembers = (team: RescueTeam) => {
    setSelectedTeam(team);
    // Получаем текущих членов команды
    const currentMemberIds = team.members?.map(m => m.id) || [];
    setSelectedMemberIds(currentMemberIds);
    setShowManageMembersModal(true);
  };

  const handleUpdateTeamMembers = async () => {
    if (!selectedTeam) return;

    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      await notify.promise(
        axios.patch(
          `${import.meta.env.VITE_API_URL}/api/v1/teams/${selectedTeam.id}`,
          { member_ids: selectedMemberIds },
          { headers }
        ),
        {
          loading: 'Обновление членов команды...',
          success: 'Члены команды успешно обновлены!',
          error: 'Ошибка при обновлении членов команды'
        }
      );

      setShowManageMembersModal(false);
      setSelectedTeam(null);
      fetchData();
    } catch (error) {
      console.error('Ошибка обновления членов команды:', error);
    }
  };

  const handleChangeLeader = async () => {
    if (!selectedTeam || !newLeaderId) {
      notify.warning('Выберите нового руководителя');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      await notify.promise(
        axios.patch(
          `${import.meta.env.VITE_API_URL}/api/v1/teams/${selectedTeam.id}`,
          { leader_id: parseInt(newLeaderId) },
          { headers }
        ),
        {
          loading: 'Изменение руководителя...',
          success: 'Руководитель успешно изменен!',
          error: 'Ошибка при изменении руководителя'
        }
      );

      setShowChangeLeaderModal(false);
      setSelectedTeam(null);
      setNewLeaderId('');
      fetchData();
    } catch (error) {
      console.error('Ошибка изменения руководителя:', error);
    }
  };

  const handleRemoveMember = async (memberId: string | number, memberName: string) => {
    if (!selectedTeam) return;

    showConfirm({
      title: 'Удалить члена команды?',
      message: `Вы уверены, что хотите удалить ${memberName} из команды "${selectedTeam.name}"?`,
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      confirmColor: 'danger',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('access_token');
          const headers = { Authorization: `Bearer ${token}` };

          // Получаем текущих членов и удаляем одного
          const currentMemberIds = selectedTeam.members
            ?.map(m => {
              if (typeof m === 'object' && 'user_id' in m) return m.user_id;
              if (typeof m === 'object' && 'id' in m) return m.id;
              return null;
            })
            .filter(id => id && id !== memberId) || [];

          await notify.promise(
            axios.patch(
              `${import.meta.env.VITE_API_URL}/api/v1/teams/${selectedTeam.id}`,
              { member_ids: currentMemberIds },
              { headers }
            ),
            {
              loading: 'Удаление члена команды...',
              success: 'Член команды успешно удален!',
              error: 'Ошибка при удалении члена команды'
            }
          );

          fetchData();
          
          // Обновляем выбранную команду
          const updatedTeam = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/v1/teams/${selectedTeam.id}`,
            { headers }
          );
          setSelectedTeam(updatedTeam.data);
        } catch (error) {
          console.error('Ошибка удаления члена команды:', error);
        }
      }
    });
  };

  const toggleMemberSelection = (rescuerId: number | string | undefined) => {
    if (!rescuerId) return;
    
    const id = typeof rescuerId === 'string' ? parseInt(rescuerId) : rescuerId;
    
    setSelectedMemberIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(existingId => existingId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const stats = {
    totalRescuers: rescuers.length,
    activeRescuers: rescuers.filter(r => r.status === 'available').length,
    totalTeams: teams.length,
    activeTeams: teams.filter(t => t.status === 'active').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950">
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-700/20 via-transparent to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Панель координатора</h1>
            <p className="text-slate-400">Управление спасателями и командами</p>
          </div>

          {/* Табы */}
          <div className="mb-8 flex space-x-2 bg-slate-900/60 backdrop-blur-sm p-2 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity className="inline-block w-5 h-5 mr-2" />
              Обзор
            </button>
            <button
              onClick={() => setActiveTab('rescuers')}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'rescuers'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="inline-block w-5 h-5 mr-2" />
              Спасатели ({rescuers.length})
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'teams'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield className="inline-block w-5 h-5 mr-2" />
              Команды ({teams.length})
            </button>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-slate-400 mt-4">Загрузка данных...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Статистика */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-[0_20px_60px_rgba(59,130,246,0.3)]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-2xl">
                          <Users className="w-6 h-6 text-blue-400" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-slate-400 text-sm">Всего спасателей</p>
                        <p className="text-4xl font-bold text-white">{stats.totalRescuers}</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-[0_20px_60px_rgba(34,197,94,0.3)]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-500/20 rounded-2xl">
                          <UserCog className="w-6 h-6 text-green-400" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-slate-400 text-sm">Доступны</p>
                        <p className="text-4xl font-bold text-white">{stats.activeRescuers}</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-[0_20px_60px_rgba(168,85,247,0.3)]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-500/20 rounded-2xl">
                          <Shield className="w-6 h-6 text-purple-400" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-slate-400 text-sm">Всего команд</p>
                        <p className="text-4xl font-bold text-white">{stats.totalTeams}</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-[0_20px_60px_rgba(245,158,11,0.3)]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-500/20 rounded-2xl">
                          <Activity className="w-6 h-6 text-amber-400" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-slate-400 text-sm">Активных команд</p>
                        <p className="text-4xl font-bold text-white">{stats.activeTeams}</p>
                      </div>
                    </div>
                  </div>

                  {/* Быстрые действия */}
                  <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                    <h3 className="text-xl font-semibold text-white mb-6">Быстрые действия</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button 
                        onClick={() => setShowCreateTeamModal(true)}
                        className="flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-4 rounded-2xl transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50">
                        <Plus className="w-5 h-5" />
                        <span className="font-medium">Создать команду</span>
                      </button>
                      <button 
                        onClick={handleManageRescuers}
                        className="flex items-center justify-center space-x-3 bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-2xl transition-all border border-white/10">
                        <UserCog className="w-5 h-5" />
                        <span className="font-medium">Управление спасателями</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'rescuers' && (
                <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Поиск спасателей..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="all">Все статусы</option>
                        <option value="available">Доступен</option>
                        <option value="busy">Занят</option>
                        <option value="offline">Не в сети</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-800/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Спасатель</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Контакт</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Специализация</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Статус</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {rescuers
                          .filter(r => 
                            (filterStatus === 'all' || r.status === filterStatus) &&
                            (searchTerm === '' || (r.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()))
                          )
                          .map((rescuer) => (
                            <tr key={rescuer.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                                    {(rescuer.full_name || 'U').charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-white font-medium">{rescuer.full_name}</p>
                                    <p className="text-slate-400 text-sm">{rescuer.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-300">{rescuer.phone}</td>
                              <td className="px-6 py-4">
                                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-sm">
                                  {rescuer.specialization || 'Не указано'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                  rescuer.status === 'available' 
                                    ? 'bg-green-500/20 text-green-300'
                                    : rescuer.status === 'busy'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-slate-500/20 text-slate-300'
                                }`}>
                                  {rescuer.status === 'available' ? 'Доступен' : rescuer.status === 'busy' ? 'Занят' : 'Не в сети'}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'teams' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Команды спасателей</h2>
                    <button
                      onClick={() => setShowCreateTeamModal(true)}
                      className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl transition-all shadow-lg"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Создать команду</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map((team) => (
                      <div key={team.id} className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/10 hover:border-purple-500/50 transition-all shadow-lg hover:shadow-purple-500/20">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
                              <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">{team.name}</h3>
                              <p className="text-slate-400 text-sm">{team.members?.length || 0} членов</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            team.status === 'active'
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-slate-500/20 text-slate-300'
                          }`}>
                            {team.status === 'active' ? 'Активна' : 'Неактивна'}
                          </span>
                        </div>
                        
                        {team.description && (
                          <p className="text-slate-400 text-sm mb-4">{team.description}</p>
                        )}
                        
                        {team.leader && (
                          <div className="flex items-center space-x-2 mb-4 p-3 bg-slate-800/50 rounded-xl">
                            <UserCog className="w-4 h-4 text-purple-400" />
                            <span className="text-slate-300 text-sm">
                              Лидер: <span className="text-white font-medium">{team.leader.full_name}</span>
                            </span>
                          </div>
                        )}
                        
                        <button 
                          onClick={() => setSelectedTeam(team)}
                          className="w-full mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10">
                          Подробнее
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Модальное окно создания команды */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform animate-scaleIn">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white">Создание новой команды</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-slate-300 mb-2">Название команды</label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  placeholder="Введите название команды"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-2">Тип команды</label>
                <select
                  value={newTeam.type}
                  onChange={(e) => setNewTeam({...newTeam, type: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="general">Общая</option>
                  <option value="fire">Пожарная</option>
                  <option value="medical">Медицинская</option>
                  <option value="rescue">Спасательная</option>
                  <option value="police">Полицейская</option>
                  <option value="search">Поисковая</option>
                  <option value="water">Водная</option>
                  <option value="mountain">Горная</option>
                  <option value="multi_purpose">Многоцелевая</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-2">Описание</label>
                <textarea
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  placeholder="Описание команды (опционально)"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-2">Руководитель команды</label>
                <select
                  value={newTeam.leader_id}
                  onChange={(e) => setNewTeam({...newTeam, leader_id: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Выберите руководителя</option>
                  {rescuers
                    .filter(r => r.status === 'available')
                    .map(rescuer => (
                      <option key={rescuer.id} value={rescuer.id}>
                        {rescuer.full_name} - {rescuer.specialization || 'Без специализации'}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-2">Статус</label>
                <select
                  value={newTeam.status}
                  onChange={(e) => setNewTeam({...newTeam, status: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="active">Активна</option>
                  <option value="inactive">Неактивна</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex space-x-4">
              <button
                onClick={handleCreateTeam}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all shadow-lg"
              >
                Создать команду
              </button>
              <button
                onClick={() => setShowCreateTeamModal(false)}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all border border-white/10"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно просмотра команды */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl border border-white/10 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform animate-scaleIn">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedTeam.name || 'Команда без названия'}</h2>
                    <p className="text-slate-400">Детали команды</p>
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  selectedTeam.status === 'active'
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-slate-500/20 text-slate-300'
                }`}>
                  {selectedTeam.status === 'active' ? 'Активна' : 'Неактивна'}
                </span>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {selectedTeam.description && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Описание</h3>
                  <p className="text-slate-300">{selectedTeam.description}</p>
                </div>
              )}

              {selectedTeam.leader && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">Руководитель</h3>
                    <button
                      onClick={() => {
                        setNewLeaderId(selectedTeam.leader_id?.toString() || '');
                        setShowChangeLeaderModal(true);
                      }}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-all"
                    >
                      Изменить
                    </button>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {(selectedTeam.leader.full_name || selectedTeam.leader.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{selectedTeam.leader.full_name || 'Без имени'}</p>
                        <p className="text-slate-400 text-sm">{selectedTeam.leader.email || 'Нет email'}</p>
                        {selectedTeam.leader.phone && (
                          <p className="text-slate-400 text-sm">{selectedTeam.leader.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedTeam.members && selectedTeam.members.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Члены команды ({selectedTeam.members.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedTeam.members.map((member, index) => {
                      // Обработка случая, когда member - строка или объект без полей
                      const memberData = typeof member === 'string' 
                        ? { name: member, id: index }
                        : {
                            id: member.id || index,
                            name: member.full_name || (member as any).name || 'Неизвестно',
                            email: member.email || '',
                            status: member.status || 'unknown',
                            specialization: member.specialization || ''
                          };
                      
                      return (
                        <div key={memberData.id} className="bg-slate-800/50 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {memberData.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-white font-medium">{memberData.name}</p>
                                {memberData.email && (
                                  <p className="text-slate-400 text-sm">{memberData.email}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {memberData.status !== 'unknown' && (
                                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                                  memberData.status === 'available' 
                                    ? 'bg-green-500/20 text-green-300'
                                    : memberData.status === 'busy'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-slate-500/20 text-slate-300'
                                }`}>
                                  {memberData.status === 'available' ? 'Доступен' : memberData.status === 'busy' ? 'Занят' : 'Не в сети'}
                                </span>
                              )}
                              <button
                                onClick={() => {
                                  const memberId = (member as any).user_id || (member as any).id || memberData.id;
                                  handleRemoveMember(memberId, memberData.name);
                                }}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-all"
                                title="Удалить из команды"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          {memberData.specialization && (
                            <div className="mt-2">
                              <span className="text-slate-400 text-sm">
                                Специализация: <span className="text-purple-300">{memberData.specialization}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">Дата создания</p>
                  <p className="text-white font-medium">
                    {selectedTeam.created_at 
                      ? new Date(selectedTeam.created_at).toLocaleDateString('ru-RU')
                      : 'Неизвестно'
                    }
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">ID команды</p>
                  <p className="text-white font-medium">#{selectedTeam.id || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex space-x-4">
              <button
                onClick={() => handleOpenManageMembers(selectedTeam)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all shadow-lg"
              >
                Управление членами
              </button>
              <button
                onClick={() => setSelectedTeam(null)}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all border border-white/10"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно управления членами команды */}
      {showManageMembersModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform animate-scaleIn">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white">
                Управление членами команды: {selectedTeam.name}
              </h2>
              <p className="text-slate-400 mt-1">
                Выберите спасателей для добавления в команду
              </p>
            </div>
            
            <div className="p-6">
              <div className="mb-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <p className="text-purple-300 text-sm">
                  ✓ Выбрано спасателей: <span className="font-bold">{selectedMemberIds.length}</span>
                </p>
              </div>

              <div className="space-y-2">
                {rescuers.map((rescuer) => {
                  const rescuerId = typeof rescuer.id === 'string' ? parseInt(rescuer.id) : (rescuer.id || 0);
                  const isSelected = selectedMemberIds.includes(rescuerId);
                  const isLeader = selectedTeam.leader_id === rescuer.id;
                  
                  return (
                    <div
                      key={rescuer.id}
                      onClick={() => !isLeader && toggleMemberSelection(rescuer.id)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-500/20 border-purple-500/50'
                          : 'bg-slate-800/50 border-white/10 hover:border-purple-500/30'
                      } ${isLeader ? 'opacity-75 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                            isSelected
                              ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                              : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                          }`}>
                            {(rescuer.full_name || 'U').charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="text-white font-medium">{rescuer.full_name || 'Без имени'}</p>
                              {isLeader && (
                                <span className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded text-xs font-medium">
                                  Руководитель
                                </span>
                              )}
                            </div>
                            <p className="text-slate-400 text-sm">{rescuer.email || 'Нет email'}</p>
                            {rescuer.specialization && (
                              <p className="text-purple-400 text-sm mt-1">
                                {rescuer.specialization}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            rescuer.status === 'available' 
                              ? 'bg-green-500/20 text-green-300'
                              : rescuer.status === 'busy'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-500/20 text-slate-300'
                          }`}>
                            {rescuer.status === 'available' ? 'Доступен' : rescuer.status === 'busy' ? 'Занят' : 'Не в сети'}
                          </span>
                          
                          {isSelected && !isLeader && (
                            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          
                          {isLeader && (
                            <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex space-x-4">
              <button
                onClick={handleUpdateTeamMembers}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all shadow-lg"
              >
                Сохранить изменения
              </button>
              <button
                onClick={() => {
                  setShowManageMembersModal(false);
                  setSelectedTeam(null);
                }}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all border border-white/10"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно изменения руководителя */}
      {showChangeLeaderModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl border border-white/10 max-w-2xl w-full shadow-2xl transform animate-scaleIn">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white">
                Изменить руководителя команды: {selectedTeam.name}
              </h2>
              <p className="text-slate-400 mt-1">
                Выберите нового руководителя из списка спасателей
              </p>
            </div>
            
            <div className="p-6">
              <label className="block text-slate-300 mb-3 font-medium">Новый руководитель</label>
              <select
                value={newLeaderId}
                onChange={(e) => setNewLeaderId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">Выберите руководителя</option>
                {rescuers
                  .filter(r => r.status === 'available' || r.id === selectedTeam.leader_id)
                  .map(rescuer => (
                    <option key={rescuer.id} value={rescuer.id}>
                      {rescuer.full_name || rescuer.email} {rescuer.id === selectedTeam.leader_id ? '(текущий)' : ''}
                      {rescuer.specialization ? ` - ${rescuer.specialization}` : ''}
                    </option>
                  ))}
              </select>
              
              {selectedTeam.leader && (
                <div className="mt-4 p-4 bg-slate-800/50 rounded-xl">
                  <p className="text-slate-400 text-sm mb-1">Текущий руководитель:</p>
                  <p className="text-white font-medium">{selectedTeam.leader.full_name || selectedTeam.leader.email}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/10 flex space-x-4">
              <button
                onClick={handleChangeLeader}
                disabled={!newLeaderId || newLeaderId === selectedTeam.leader_id?.toString()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-lg"
              >
                Изменить руководителя
              </button>
              <button
                onClick={() => {
                  setShowChangeLeaderModal(false);
                  setNewLeaderId('');
                }}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all border border-white/10"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Красивый диалог подтверждения */}
      <ConfirmDialog />
    </div>
  );
}
