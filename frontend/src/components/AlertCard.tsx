import { AlertTriangle, Bell, CheckCircle } from 'lucide-react'

import type { Alert } from '../types'

interface Props {
  alert: Alert
  onRead: (id: number) => void
}

export default function AlertCard({ alert, onRead }: Props) {
  const isNoncompliance = alert.type === 'daily_noncompliance'
  const Icon = isNoncompliance ? AlertTriangle : Bell

  return (
    <div
      className={`card-md p-4 flex gap-4 transition-all animate-slide-up ${
        alert.is_read ? '' : 'border-l-4 border-l-rose-400'
      }`}
    >
      {/* Ícono */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isNoncompliance ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className={`badge ${isNoncompliance ? 'badge-red' : 'badge-amber'}`}>
            {isNoncompliance ? 'Incumplimiento diario' : 'Sesión no iniciada'}
          </span>
          <span className="text-[11px] text-slate-400">
            {new Date(alert.created_at).toLocaleString('es-ES', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </span>
        </div>
        <p className="text-sm text-slate-700">{alert.message}</p>
      </div>

      {/* Acción */}
      {!alert.is_read && (
        <button
          onClick={() => onRead(alert.id)}
          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium self-start whitespace-nowrap px-2 py-1 rounded-lg hover:bg-brand-50 transition-colors"
        >
          <CheckCircle className="w-3.5 h-3.5" /> Marcar leída
        </button>
      )}
    </div>
  )
}
