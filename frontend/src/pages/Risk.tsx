import { Activity, Play, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'

import RiskWidget from '../components/RiskWidget'
import { getExternalities, getRiskAssessment, runSimulation } from '../services/api'
import { useAuth } from '../services/auth'
import type { RiskAssessment, SimulationWeek } from '../types'

const RISK_BAR: Record<string, string> = {
  bajo:  'bg-emerald-400',
  medio: 'bg-amber-400',
  alto:  'bg-red-500',
}

function riskLevel(score: number): string {
  return score >= 0.60 ? 'alto' : score >= 0.35 ? 'medio' : 'bajo'
}

export default function Risk() {
  const { student } = useAuth()
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null)
  const [externalities, setExternalities] = useState<Record<string, string>>({})
  const [simulation, setSimulation] = useState<SimulationWeek[] | null>(null)
  const [selectedEvents, setSelectedEvents] = useState<Record<string, string>>({})
  const [weeks, setWeeks] = useState(9)
  const [baseHours, setBaseHours] = useState(10)
  const [loading, setLoading] = useState(true)
  const [simLoading, setSimLoading] = useState(false)

  useEffect(() => {
    if (!student) return
    Promise.all([
      getRiskAssessment(student.id),
      getExternalities(),
    ]).then(([a, e]) => {
      setAssessment(a)
      setExternalities(e)
    }).finally(() => setLoading(false))
  }, [student])

  const handleAddEvent = (week: string, ext: string) => {
    if (!week || !ext) return
    setSelectedEvents((prev) => ({ ...prev, [week]: ext }))
  }

  const handleRunSim = async () => {
    setSimLoading(true)
    try {
      const result = await runSimulation(
        Object.keys(selectedEvents).length ? selectedEvents : undefined,
        weeks,
        baseHours
      )
      setSimulation(result)
    } finally {
      setSimLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-slate-500">Cargando análisis de riesgo...</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-800 mb-1 flex items-center gap-2">
          <Activity className="w-6 h-6 text-brand-600" /> Análisis de riesgo de abandono
        </h1>
        <p className="text-slate-500 text-sm">
          Predicción basada en el engine de modelos semanales. Macroperfiles según las 5 barreras
          definidas en el manual de modelos.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {assessment && <RiskWidget data={assessment} />}

        {/* Panel de simulación */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-3">Simulación semanal interactiva</h2>
          <p className="text-xs text-slate-500 mb-4">
            Añade externalidades para ver cómo evolucionaría el riesgo semana a semana
            (no usa datos reales — útil para demo y planificación preventiva).
          </p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-slate-600 mb-1 block">Semanas</label>
              <input
                type="number" min={3} max={20} value={weeks}
                onChange={(e) => setWeeks(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 mb-1 block">Horas base/semana</label>
              <input
                type="number" min={4} max={30} value={baseHours}
                onChange={(e) => setBaseHours(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Añadir externalidades */}
          <div className="mb-3">
            <label className="text-xs text-slate-600 mb-1 block">Agregar externalidad</label>
            <div className="flex gap-2">
              <select
                id="ext-week"
                className="w-20 px-2 py-2 text-sm rounded-lg border border-slate-300 outline-none"
                defaultValue=""
              >
                <option value="" disabled>Sem.</option>
                {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>Sem. {w}</option>
                ))}
              </select>
              <select
                id="ext-type"
                className="flex-1 px-2 py-2 text-sm rounded-lg border border-slate-300 outline-none"
                defaultValue=""
              >
                <option value="" disabled>Selecciona externalidad...</option>
                {Object.entries(externalities).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  const w = (document.getElementById('ext-week') as HTMLSelectElement).value
                  const e = (document.getElementById('ext-type') as HTMLSelectElement).value
                  handleAddEvent(w, e)
                }}
                className="px-3 py-2 rounded-lg bg-brand-600 text-white text-sm hover:bg-brand-700"
              >+</button>
            </div>
          </div>

          {/* Externalidades añadidas */}
          {Object.keys(selectedEvents).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {Object.entries(selectedEvents).map(([w, e]) => (
                <span key={w} className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 flex items-center gap-1">
                  Sem.{w}: {e}
                  <button onClick={() => setSelectedEvents((p) => { const n = {...p}; delete n[w]; return n })} className="hover:text-red-600">×</button>
                </span>
              ))}
              <button onClick={() => setSelectedEvents({})} className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-0.5">
                <RotateCcw className="w-3 h-3" /> limpiar
              </button>
            </div>
          )}

          <button
            onClick={handleRunSim}
            disabled={simLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            <Play className="w-4 h-4" /> {simLoading ? 'Simulando...' : 'Ejecutar simulación'}
          </button>
        </div>
      </div>

      {/* Resultados de la simulación */}
      {simulation && (
        <div>
          <h2 className="font-bold text-slate-800 mb-3">Resultados de la simulación</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-600 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Semana</th>
                  <th className="px-4 py-3 text-left">Externalidad</th>
                  <th className="px-4 py-3 text-left">Macroperfiles</th>
                  <th className="px-4 py-3 text-center">Horas disp.</th>
                  <th className="px-4 py-3 text-center">Riesgo</th>
                  <th className="px-4 py-3 text-left">Intervención</th>
                </tr>
              </thead>
              <tbody>
                {simulation.map((row) => {
                  const level = riskLevel(row.risk)
                  return (
                    <tr key={row.week} className={`border-t border-slate-100 ${row.alert ? 'bg-red-50/40' : ''}`}>
                      <td className="px-4 py-2.5 font-medium">{row.week}</td>
                      <td className="px-4 py-2.5 text-slate-600">{row.externality ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {(row.macroprofiles_es ?? row.macroprofiles).map((b: string) => (
                            <span key={b} className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{b}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center">{row.available_hours}h</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${RISK_BAR[level]}`} style={{ width: `${row.risk * 100}%` }} />
                          </div>
                          <span className="text-xs">{Math.round(row.risk * 100)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-600">
                        {(row.interventions_es ?? row.interventions)[0] ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
