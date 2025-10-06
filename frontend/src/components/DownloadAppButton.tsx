import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Download, Smartphone } from 'lucide-react'
import { ANDROID_APK_METADATA_URL, ANDROID_APK_URL } from '../services/api'

interface DownloadAppButtonProps {
  variant?: 'primary' | 'ghost'
  compact?: boolean
}

type ApkMetadata = {
  versionName?: string
  versionCode?: number
  sizeBytes?: number
  publishedAtUtc?: string
  sha256?: string
  filename?: string
}

export function DownloadAppButton({ variant = 'primary', compact = false }: DownloadAppButtonProps) {
  const [status, setStatus] = useState<'checking' | 'ready' | 'error'>('checking')
  const [metadata, setMetadata] = useState<ApkMetadata | null>(null)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    const loadMetadata = async () => {
      try {
        const response = await fetch(ANDROID_APK_METADATA_URL, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`Metadata request failed with status ${response.status}`)
        }

        const payload = await response.json()
        if (cancelled) return

        setMetadata({
          versionName: payload.versionName ?? payload.version_name,
          versionCode: payload.versionCode ?? payload.version_code,
          sizeBytes: Number(payload.sizeBytes ?? payload.size_bytes ?? NaN),
          publishedAtUtc: payload.publishedAtUtc ?? payload.published_at ?? payload.updated_at,
          sha256: payload.sha256 ?? payload.checksum ?? payload.checksum_sha256,
          filename: payload.filename ?? payload.fileName,
        })
        setStatus('ready')
      } catch (error) {
        if (cancelled) return
        setMetadata(null)
        setStatus('error')
        console.warn('Unable to fetch APK metadata:', error)
      }
    }

    loadMetadata()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  const baseClasses = {
    primary: 'bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 text-white shadow-lg shadow-rose-500/30 hover:shadow-rose-500/40',
    ghost: 'bg-white/10 border border-white/20 text-white hover:bg-white/15'
  }[variant]

  const formattedMetadata = useMemo(() => {
    if (!metadata) return null

    const { versionName, versionCode, sizeBytes, publishedAtUtc } = metadata

    const formatBytes = (bytes: number) => {
      if (!Number.isFinite(bytes) || bytes <= 0) return null
      const units = ['Б', 'КБ', 'МБ', 'ГБ']
      let value = bytes
      let unitIdx = 0
      while (value >= 1024 && unitIdx < units.length - 1) {
        value /= 1024
        unitIdx += 1
      }
      return `${value.toFixed(value >= 10 || unitIdx === 0 ? 0 : 1)} ${units[unitIdx]}`
    }

    const formatDate = (iso?: string) => {
      if (!iso) return null
      const date = new Date(iso)
      if (Number.isNaN(date.getTime())) return null
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      })
    }

    const parts: string[] = []
    if (versionName) {
      parts.push(`v${versionName}${versionCode ? ` (${versionCode})` : ''}`)
    }
  const sizeLabel = typeof sizeBytes === 'number' ? formatBytes(sizeBytes) : null
    if (sizeLabel) {
      parts.push(sizeLabel)
    }
  const dateLabel = formatDate(publishedAtUtc)
    if (dateLabel) {
      parts.push(dateLabel)
    }

    if (parts.length === 0) {
      return null
    }

    return parts.join(' · ')
  }, [metadata])

  return (
    <div className="flex flex-col items-start gap-2">
      <a
        href={ANDROID_APK_URL}
        className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-400 focus-visible:ring-offset-slate-950 ${baseClasses} ${compact ? 'px-4 py-2 text-xs' : ''}`}
        target="_blank"
        rel="noopener noreferrer"
        download
        type="application/vnd.android.package-archive"
        data-availability={status}
      >
        <Smartphone className="h-4 w-4" />
        <span>Скачать приложение</span>
        <Download className="h-3.5 w-3.5" />
      </a>

      {status === 'ready' && formattedMetadata && (
        <span className="text-xs font-medium text-slate-300/80">
          {formattedMetadata}
        </span>
      )}

      {status === 'error' && (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-200/80">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          APK пока не загружен на сервер. Обновите сборку перед публикацией.
        </span>
      )}
    </div>
  )
}
