/**
 * Widget de riesgo de abandono — resultado del engine de entrega_modelos_semanales.
 * Muestra el nivel de riesgo, macroperfiles de barreras activas, intervenciones
 * recomendadas y roles de apoyo disponibles.
 */
import { AlertTriangle, CheckCircle, ShieldAlert, Users } from 'lucide-react'

import type { RiskAssessment } from '../types'

const RISK_CONFIG = {
  bajo:  { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle,  label: 'Riesgo bajo' },
  medio: { color: 'text-amber-700',   bg: 'bg-amber-50   border-amber-200',   icon: AlertTriangle, label: 'Riesgo medio' },
  alto:  { color: 'text-red-700',     bg: 'bg-red-50     border-red-200',     icon: ShieldAlert,   label: 'Riesgo alto' },
}

const BARRIER_COLORS: Record<string, string> = {
  'Trayectoria estable':                   'bg-emerald-100 text-emerald-700',
  'Barreras académicas':                   'bg-blue-100    text-blue-700',
  'Barreras de tiempo':                    'bg-amber-100   text-amber-700',
  'Barreras materiales y digitales':       'bg-orange-100  text-orange-700',
  'Barreras de integración y motivación':  'bg-purple-100  text-purple-700',
}

interface Props {
  data: RiskAssessment
  compact?: boolean
}

export default function RiskWidget({ data, compact = false }: Props) {
  const cfg = RISK_CONFIG[data.risk_level] ?? RISK_CONFIG['bajo']
  const Icon = cfg.icon

  if (compact) {
    return (
      <div className={`rounded-xl border p-4 shadow-sm flex items-center gap-3 ${cfg.bg}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.color} bg-white/60`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className={`font-semibold text-sm ${cfg.color}`}>{cfg.label}</p>
          <p className="text-xs text-slate-600">
            {data.macroprofiles_es[0] ?? 'Sin barreras detectadas'}
          </p>
        </div>
        <span className={`ml-auto text-lg font-bold ${cfg.color}`}>
          {Math.round(data.risk_score * 100)}%
        </span>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${cfg.bg}`}>
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-full bg-white/70 flex items-center justify-center ${cfg.color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className={`font-bold text-lg ${cfg.color}`}>{cfg.label}</h3>
          <p className="text-xs text-slate-500">
            Puntuación: <strong>{Math.round(data.risk_score * 100)}%</strong> · Semana {data.week}
          </p>
        </div>
      </div>

      {/* Barreras activas */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
          Macroperfiles activos
        </p>
        <div className="flex flex-wrap gap-1.5">
          {data.macroprofiles_es.map((b) => (
            <span key={b} className={`text-xs px-2 py-0.5 rounded-full font-medium ${BARRIER_COLORS[b] ?? 'bg-slate-100 text-slate-600'}`}>
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* Intervenciones */}
      {data.interventions.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
            Intervenciones recomendadas
          </p>
          <ul className="space-y-1">
            {data.interventions.map((i) => (
              <li key={i} className="text-sm text-slate-700 flex items-start gap-1.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                {i}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Roles de apoyo */}
      {data.support_roles.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Users className="w-3 h-3" /> Quién puede apoyarte
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.support_roles.map((r) => (
              <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-white/80 border border-slate-200 text-slate-700">
                {r}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Métricas */}
      <div className="mt-4 pt-3 border-t border-white/60 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[11px] text-slate-500">Cumplimiento hoy</p>
          <p className="font-bold text-slate-800">{Math.round(data.metrics.compliance_today * 100)}%</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Alertas total</p>
          <p className="font-bold text-slate-800">{data.metrics.total_alerts}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Objetivo diario</p>
          <p className="font-bold text-slate-800">{data.metrics.target_hours_daily}h</p>
        </div>
      </div>
    </div>
  )
}
