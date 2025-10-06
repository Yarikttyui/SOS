import { Download, Smartphone } from 'lucide-react'
import { ANDROID_APK_URL } from '../services/api'

interface DownloadAppButtonProps {
  variant?: 'primary' | 'ghost'
  compact?: boolean
}

export function DownloadAppButton({ variant = 'primary', compact = false }: DownloadAppButtonProps) {
  const baseClasses = {
    primary: 'bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 text-white shadow-lg shadow-rose-500/30 hover:shadow-rose-500/40',
    ghost: 'bg-white/10 border border-white/20 text-white hover:bg-white/15'
  }[variant]

  return (
    <a
      href={ANDROID_APK_URL}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-400 focus-visible:ring-offset-slate-950 ${baseClasses} ${compact ? 'px-4 py-2 text-xs' : ''}`}
      target="_blank"
      rel="noopener noreferrer"
      download
    >
      <Smartphone className="h-4 w-4" />
      <span>Скачать приложение</span>
      <Download className="h-3.5 w-3.5" />
    </a>
  )
}
