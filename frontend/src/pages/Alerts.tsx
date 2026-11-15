import { Bell, CheckCheck, RefreshCw, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

import AlertCard from '../components/AlertCard'
import { checkAlerts, getAlerts, markAlertRead } from '../services/api'
import { useAuth } from '../services/auth'
import type { Alert } from '../types'

export default function Alerts() {
  const { student } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const load = () => {
    if (!student) return
    getAlerts(student.id).then(setAlerts).finally(() => setLoading(false))
  }

  useEffect(load, [student])

  const handleCheck = async () => {
    if (!student) return
    const created = await checkAlerts(student.id)
    setMsg(created.length ? `Se generaron ${created.length} alerta(s) nueva(s).` : 'Sin alertas nuevas.')
    load()
  }

  const handleRead = async (id: number) => {
    await markAlertRead(id)
    load()
  }

  const unread = alerts.filter(a => !a.is_read).length

  if (loading) return (
    <div className="p-8 flex items-center justify-center text-slate-400">
      <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Cargando alertas...
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-600" /> Alertas
            {unread > 0 && (
              <span className="badge badge-red">{unread} sin leer</span>
            )}
          </h1>
          <p className="page-subtitle">
            Reglas deterministas: sesión no iniciada e incumplimiento diario
          </p>
        </div>
        <button onClick={handleCheck} className="btn-primary">
          <RefreshCw className="w-4 h-4" /> Verificar alertas
        </button>
      </div>

      {/* Mensaje de feedback */}
      {msg && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 text-sm flex items-center gap-2">
          <Bell className="w-4 h-4" /> {msg}
        </div>
      )}

      {/* Lista de alertas */}
      {alerts.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-emerald-600" />
          </div>
          <p className="font-semibold text-slate-700">Todo en orden</p>
          <p className="text-sm text-slate-400">No hay alertas pendientes para tu cuenta.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Acciones rápidas */}
          {unread > 0 && (
            <div className="flex justify-end mb-1">
              <button
                onClick={async () => {
                  for (const a of alerts.filter(a => !a.is_read)) await markAlertRead(a.id)
                  load()
                }}
                className="btn-ghost text-xs"
              >
                <CheckCheck className="w-4 h-4" /> Marcar todas como leídas
              </button>
            </div>
          )}
          {alerts.map(a => (
            <AlertCard key={a.id} alert={a} onRead={handleRead} />
          ))}
        </div>
      )}
    </div>
  )
}
