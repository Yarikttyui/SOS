import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { AlertCircle, Shield, Zap, Users } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-pink-500 to-purple-600">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-glow-lg mb-4 transform hover:rotate-12 transition-transform duration-300">
            <span className="text-4xl">🚨</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
            Rescue System
          </h1>
          <p className="text-white/90 text-lg font-medium">
            Система спасательных операций
          </p>
        </div>

        {/* Login Form Card */}
        <div className="glass-card rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-2xl bg-white/95 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          
          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-2xl flex items-center gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
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
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
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
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Вход...
                </span>
              ) : (
                'Войти в систему'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Нет аккаунта?{' '}
              <Link 
                to="/register" 
                className="text-red-600 hover:text-red-700 font-semibold hover:underline transition-all"
              >
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mt-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="glass-card bg-white/20 backdrop-blur-md p-4 rounded-2xl text-center text-white border border-white/30">
            <Shield className="w-6 h-6 mx-auto mb-2" />
            <p className="text-xs font-medium">Безопасно</p>
          </div>
          <div className="glass-card bg-white/20 backdrop-blur-md p-4 rounded-2xl text-center text-white border border-white/30">
            <Zap className="w-6 h-6 mx-auto mb-2" />
            <p className="text-xs font-medium">Быстро</p>
          </div>
          <div className="glass-card bg-white/20 backdrop-blur-md p-4 rounded-2xl text-center text-white border border-white/30">
            <Users className="w-6 h-6 mx-auto mb-2" />
            <p className="text-xs font-medium">Надёжно</p>
          </div>
        </div>

        {/* Emergency Notice */}
        <div className="mt-6 text-center glass-card bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <p className="text-white/90 text-sm font-medium">
            ⚠️ При чрезвычайной ситуации звоните <span className="font-bold">112</span>
          </p>
        </div>
      </div>
    </div>
  )
}
