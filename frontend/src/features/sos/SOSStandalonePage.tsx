import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Shield, Sparkles } from 'lucide-react'
import SOSButton from '../../components/sos/SOSButton'
import { useAuthStore } from '../../store/authStore'

export default function SOSStandalonePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-40 h-96 w-96 rounded-full bg-rose-500/30 blur-[160px]" />
        <div className="absolute top-1/4 right-0 h-80 w-80 rounded-full bg-sky-500/25 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-purple-500/20 blur-[150px]" />
      </div>

      <div className="relative z-10">
        <header className="border-b border-white/10 bg-slate-900/40 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </button>

            <div className="text-center lg:text-right">
              <p className="section-title text-white/60">Экстренный вызов</p>
              <h1 className="text-3xl font-semibold text-white">Отправка сигнала SOS</h1>
              <p className="mt-1 text-sm text-white/60">
                {user?.full_name || user?.email}
              </p>
            </div>
          </div>
        </header>

        <main className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-10 sm:px-6 lg:px-8">
          <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="grid gap-4 sm:grid-cols-3 text-sm text-white/70">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-amber-200" />
                <span>ИИ определит приоритет и ресурсы через несколько секунд после отправки</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-emerald-200" />
                <span>Передача координат и сообщений происходит в защищённом канале</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-sky-200" />
                <span>Можно указать точку вручную, если GPS недоступен</span>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-6">
            <SOSButton autoOpen onClose={() => navigate(-1)} />
            <p className="text-center text-xs text-white/60">
              Форма откроется в отдельном окне. Завершив заполнение, вы вернётесь на предыдущую панель.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
