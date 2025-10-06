import { Wifi, WifiOff, AlertTriangle } from 'lucide-react'
import { useMemo } from 'react'
import { useBackendStatus } from '../hooks/useBackendStatus'

interface BackendStatusPillProps {
  dense?: boolean
}

export function BackendStatusPill({ dense = false }: BackendStatusPillProps) {
  const { status, latency, lastChecked, refresh, targetUrl } = useBackendStatus()

  const { icon, label, tone } = useMemo(() => {
    switch (status) {
      case 'online':
        return {
          icon: <Wifi className="h-4 w-4" />,
          label: latency ? `API ${latency} мс` : 'Сервер в сети',
          tone: 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30'
        }
      case 'degraded':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          label: latency ? `Замедление ${latency} мс` : 'Замедление',
          tone: 'bg-amber-500/15 text-amber-100 border border-amber-400/40'
        }
      default:
        return {
          icon: <WifiOff className="h-4 w-4" />,
          label: 'Нет соединения',
          tone: 'bg-rose-500/15 text-rose-100 border border-rose-400/40'
        }
    }
  }, [status, latency])

  const tooltip = lastChecked
    ? `Последняя проверка: ${new Date(lastChecked).toLocaleTimeString('ru-RU')} · ${targetUrl}`
    : `Проверяется... ${targetUrl}`

  return (
    <button
      type="button"
      onClick={() => refresh()}
      title={tooltip}
      className={`inline-flex items-center gap-2 rounded-full ${tone} ${dense ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-slate-950`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  )
}
