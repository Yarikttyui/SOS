import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { AlertCircle, Shield, Zap, Users, Sparkles, Clock, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    
    try {
      await login(formData)
      navigate('/')
    } catch (err) {
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 bg-slate-950 text-slate-100">
      <div className="absolute inset-0 pointer-events-none">
        <div className="floating-shape" />
        <div className="floating-shape" />
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        <div className="aurora-wrapper rounded-[3rem] bg-slate-900/40 border border-white/10 shadow-[0_40px_80px_-45px_rgba(15,23,42,0.9)]">
          <div className="absolute inset-0 overflow-hidden rounded-[3rem]">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-amber-400/40 via-rose-500/30 to-purple-500/40 blur-[120px]" />
            <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-gradient-to-tr from-blue-500/30 via-sky-400/20 to-rose-400/40 blur-[140px]" />
          </div>

          <div className="relative grid gap-12 lg:grid-cols-[1.05fr_0.95fr] p-6 sm:p-12">
            {/* Hero Section */}
            <div className="flex flex-col justify-between">
              <div className="space-y-10">
                <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 px-4 py-2 rounded-full text-sm font-medium uppercase tracking-[0.3em] text-white/80 w-fit shadow-lg">
                  <Sparkles className="w-4 h-4" />
                  Rescue Operations Cloud
                </div>

                <div className="space-y-5">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2.25rem] bg-white text-5xl shadow-[0_20px_60px_rgba(255,255,255,0.35)]">
                    🚨
                  </div>
                  <h1 className="text-4xl sm:text-5xl xl:text-[3.5rem] font-semibold leading-tight text-white drop-shadow-2xl">
                    Экосистема спасательных операций следующего поколения
                  </h1>
                  <p className="text-base sm:text-lg text-slate-100/80 max-w-xl leading-relaxed">
                    Отправляйте SOS, отслеживайте статус спасателей и получайте рекомендации ИИ в едином интерфейсе.
                    Всё защищено, быстро и доступно 24/7.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="glass-card-dark rounded-2xl p-5 border border-white/10 shadow-xl">
                    <Shield className="w-7 h-7 text-emerald-300 mb-3" />
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">Безопасность</p>
                    <p className="text-lg font-semibold">ISO/IEC 27001</p>
                  </div>
                  <div className="glass-card-dark rounded-2xl p-5 border border-white/10 shadow-xl">
                    <Zap className="w-7 h-7 text-amber-300 mb-3" />
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">Скорость</p>
                    <p className="text-lg font-semibold">до 1.2 сек</p>
                  </div>
                  <div className="glass-card-dark rounded-2xl p-5 border border-white/10 shadow-xl">
                    <Users className="w-7 h-7 text-sky-300 mb-3" />
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">Надёжность</p>
                    <p className="text-lg font-semibold">24/7/365</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex flex-wrap gap-4 text-sm text-white/70">
                <div className="stat-pill bg-white/15 text-white/85 border-white/20">
                  <CheckCircle2 className="w-4 h-4" />
                  Готово к промышленной эксплуатации
                </div>
                <div className="stat-pill bg-white/15 text-white/85 border-white/20">
                  <Clock className="w-4 h-4" />
                  Время реакции <span className="font-semibold">&lt; 60 секунд</span>
                </div>
              </div>
            </div>

            {/* Login Side */}
            <div className="relative">
              <div className="gradient-border h-full">
                <div className="gradient-border-inner p-8 sm:p-10 backdrop-blur-md">
                  <div className="mb-8">
                    <p className="section-title">Войти в систему</p>
                    <h2 className="mt-3 text-2xl sm:text-3xl font-semibold text-slate-900">
                      Управление инцидентами и аналитика в одном окне
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Используйте корпоративный аккаунт, чтобы получить доступ к панели управления и последним тревогам.
                    </p>
                  </div>

                  {error && (
                    <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl flex items-center gap-3 animate-fade-in">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-semibold text-slate-600">
                        Email адрес
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input-modern"
                        placeholder="dispatcher@rescue.ru"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="password" className="block text-sm font-semibold text-slate-600">
                        Пароль
                      </label>
                      <input
                        id="password"
                        type="password"
                        required
                        autoComplete="current-password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="input-modern"
                        placeholder="Введите пароль"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary w-full text-base disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938л3-2.647z" />
                          </svg>
                          Вход...
                        </span>
                      ) : (
                        'Войти в систему'
                      )}
                    </button>
                  </form>

                  <div className="mt-8 text-center text-sm text-slate-500">
                    Нет аккаунта?{' '}
                    <Link
                      to="/register"
                      className="text-rose-500 hover:text-rose-600 font-semibold transition-colors"
                    >
                      Зарегистрироваться
                    </Link>
                  </div>

                  <div className="mt-10 grid gap-3 bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      <span>Шифрование TLS 1.3 и контроль доступа по ролям</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>ИИ-помощник анализирует сообщения в режиме реального времени</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
