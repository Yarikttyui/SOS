import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, Smartphone } from 'lucide-react'
import { DownloadAppButton } from '../../components/DownloadAppButton'

export default function DownloadPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.25),transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.18),transparent_70%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col gap-12 px-4 py-12 sm:px-8">
        <header className="flex items-center justify-between">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Назад
          </Link>

          <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
            <Sparkles className="h-3.5 w-3.5" />
            Rescue Operations Cloud
          </div>
        </header>

        <main className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-8">
            <div className="inline-flex items-center gap-3 rounded-3xl bg-white/10 px-5 py-2 text-sm font-semibold uppercase tracking-[0.38em] text-white/80 shadow-lg shadow-indigo-500/30">
              <Smartphone className="h-4 w-4" />
              Android APK
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl font-semibold sm:text-5xl">
                Официальное приложение спасательной службы
              </h1>
              <p className="text-base text-slate-200/80 sm:text-lg">
                Устанавливайте мобильный клиент, чтобы получать экстренные уведомления, управлять выездами и оставаться на связи с оперативным штабом даже вне веб-панели.
              </p>
            </div>

            <div className="space-y-4 text-sm text-slate-100/75">
              <div className="glass-card-dark flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-4">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span>Подпись и контроль целостности через SHA-256</span>
              </div>
              <div className="glass-card-dark flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-4">
                <ShieldCheck className="h-4 w-4 text-sky-300" />
                <span>Защищённый обмен с сервером и автоматические обновления</span>
              </div>
            </div>

            <DownloadAppButton variant="primary" />

            <p className="text-xs text-slate-400/80">
              Если загрузка не начинается автоматически, откройте ссылку в браузере Google Chrome или скопируйте адрес загрузки в любое Android-устройство.
            </p>
          </section>

          <aside className="relative">
            <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-sky-400/30 blur-3xl" />
            <div className="relative overflow-hidden rounded-[3rem] border border-white/15 bg-slate-900/70 shadow-[0_35px_70px_-45px_rgba(79,70,229,0.65)]">
              <div className="absolute -top-32 right-0 h-64 w-64 rounded-full bg-rose-500/25 blur-[120px]" />
              <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-sky-500/25 blur-[140px]" />

              <div className="relative space-y-6 p-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                  <Sparkles className="h-3.5 w-3.5" />
                  Что внутри
                </div>

                <ul className="space-y-4 text-sm text-slate-200/85">
                  <li className="glass-card-dark flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <ShieldCheck className="h-5 w-5 text-emerald-300" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-white">Полевые тревоги</p>
                      <p className="text-slate-300/80">Получайте уведомления о выездах в режиме реального времени с встроенной сиреной.</p>
                    </div>
                  </li>
                  <li className="glass-card-dark flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <Smartphone className="h-5 w-5 text-sky-300" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-white">Работа офлайн</p>
                      <p className="text-slate-300/80">Доступ к ключевым данным в условиях слабого покрытия сети.</p>
                    </div>
                  </li>
                  <li className="glass-card-dark flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <Sparkles className="h-5 w-5 text-amber-300" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-white">ИИ-подсказки</p>
                      <p className="text-slate-300/80">Поддержка принятия решений и автоматическая маршрутизация бригад.</p>
                    </div>
                  </li>
                </ul>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300/75">
                  <p className="font-semibold uppercase tracking-[0.3em] text-white/70">Требования</p>
                  <p className="mt-2">Android 7.0 (Nougat) и выше, 120 МБ свободного места.</p>
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  )
}
