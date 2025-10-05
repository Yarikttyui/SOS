import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { AlertCircle } from 'lucide-react'

interface RegisterForm {
  email: string
  password: string
  full_name: string
  phone: string
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError } = useAuthStore()
  
  const [formData, setFormData] = useState<RegisterForm>({
    email: '',
    password: '',
    full_name: '',
    phone: '',
  })

  const handleChange = (field: keyof RegisterForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (error) {
      clearError()
    }
    setFormData((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    
    try {
      await register({
        ...formData,
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
      })
      navigate('/')
    } catch (err) {
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-blue-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🚨 Регистрация
          </h1>
          <p className="text-gray-600">Создайте аккаунт в системе</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2" role="alert">
            <AlertCircle className="w-5 h-5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              id="register-email"
              type="email"
              required
              autoComplete="email"
              value={formData.email}
              onChange={handleChange('email')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="name@example.com"
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="register-full-name" className="block text-sm font-medium text-gray-700 mb-2">
              Полное имя
            </label>
            <input
              id="register-full-name"
              type="text"
              value={formData.full_name}
              onChange={handleChange('full_name')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Иван Иванов"
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="register-phone" className="block text-sm font-medium text-gray-700 mb-2">
              Телефон
            </label>
            <input
              id="register-phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange('phone')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="+7 (999) 999-99-99"
              autoComplete="tel"
            />
          </div>

          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-2">
              Пароль * (8-72 символа)
            </label>
            <input
              id="register-password"
              type="password"
              required
              minLength={8}
              maxLength={72}
              value={formData.password}
              onChange={handleChange('password')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Введите надёжный пароль"
              autoComplete="new-password"
              aria-required="true"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              ℹ️ Все новые пользователи регистрируются как <strong>Граждане</strong>. 
              Администратор может изменить вашу роль на Оператора или Спасателя позже.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-red-600 hover:text-red-700 font-medium">
            Войти
          </Link>
        </div>
      </div>
    </div>
  )
}
