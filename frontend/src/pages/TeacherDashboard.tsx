import { AlertTriangle, Calendar, RefreshCw, ShieldAlert, TrendingUp, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { getTeacherDashboard } from '../services/api'
import type { TeacherDashboard as TDashboard } from '../types'

const RISK_COLORS = { bajo: '#10b981', medio: '#f59e0b', alto: '#ef4444' }
const RISK_LABELS = { bajo: 'Bajo', medio: 'Medio', alto: 'Alto' }

function today() {
  return new Date().toISOString().slice(0, 10)
}
function mondayOfWeek() {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

interface Props {
  onExit: () => void
}

export default function TeacherDashboard({ onExit }: Props) {
  const [data, setData]       = useState<TDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(mondayOfWeek())
  const [dateTo, setDateTo]     = useState(today())
  const [filterSemester, setFilterSemester] = useState('Todos')

  const load = (from = dateFrom, to = dateTo) => {
    setLoading(true)
    getTeacherDashboard(from, to)
      .then(setData)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const setPreset = (preset: 'today' | 'week' | 'month') => {
    const t = today()
    if (preset === 'today') { setDateFrom(t); setDateTo(t); load(t, t) }
    if (preset === 'week')  { const m = mondayOfWeek(); setDateFrom(m); setDateTo(t); load(m, t) }
    if (preset === 'month') {
      const m = new Date(); m.setDate(1)
      const from = m.toISOString().slice(0, 10)
      setDateFrom(from); setDateTo(t); load(from, t)
    }
  }

  const students = data
    ? (filterSemester === 'Todos'
        ? data.students
        : data.students.filter(s => s.semester_label === filterSemester))
    : []

  const riskCounts = students.reduce(
    (acc, s) => { acc[s.risk_level] = (acc[s.risk_level] || 0) + 1; return acc },
    {} as Record<string, number>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" /> Panel del Docente
          </h1>
          <p className="text-slate-500 text-sm">Vista agregada de todos los estudiantes · Ciencias de la Computación</p>
        </div>
        <button
          onClick={onExit}
          className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm hover:bg-slate-200 transition-colors"
        >
          Salir vista docente
        </button>
      </div>

      {/* Filtros de fecha */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Desde
            </label>
            <input type="date" value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Hasta</label>
            <input type="date" value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <button
            onClick={() => load()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Aplicar
          </button>
          <div className="flex gap-2 ml-auto">
            {(['today', 'week', 'month'] as const).map(p => (
              <button key={p} onClick={() => setPreset(p)}
                className="px-3 py-2 text-xs rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition-colors"
              >
                {p === 'today' ? 'Hoy' : p === 'week' ? 'Esta semana' : 'Este mes'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-slate-500 text-center">Cargando datos...</div>
      ) : data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total estudiantes', value: data.total_students,    icon: Users,         color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Cumplimiento prom.', value: `${data.avg_compliance}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Riesgo alto',         value: data.high_risk_count, icon: ShieldAlert,  color: 'text-red-600',     bg: 'bg-red-50' },
              { label: 'Alertas pendientes',  value: data.students.reduce((a, s) => a + s.unread_alerts, 0), icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map(k => (
              <div key={k.label} className={`rounded-xl border border-slate-200 p-4 shadow-sm ${k.bg}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">{k.label}</span>
                  <k.icon className={`w-5 h-5 ${k.color}`} />
                </div>
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Gráficas */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Actividad diaria */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h2 className="font-semibold text-slate-700 mb-3">Actividad diaria</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.daily_activity} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }}
                    tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip labelFormatter={v => `Fecha: ${v}`} />
                  <Legend iconSize={10} />
                  <Bar dataKey="completed" name="Completadas" fill="#10b981" radius={[4,4,0,0]} />
                  <Bar dataKey="pending"   name="Pendientes"  fill="#f59e0b" radius={[4,4,0,0]} />
                  <Bar dataKey="alerts"    name="Alertas"     fill="#ef4444" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Cumplimiento por curso */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h2 className="font-semibold text-slate-700 mb-3">Cumplimiento por curso (top 8)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={data.course_distribution.slice(0, 8)}
                  layout="vertical"
                  margin={{ left: 0, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }}
                    tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="course_name" tick={{ fontSize: 9 }} width={110} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Cumplimiento']} />
                  <Bar dataKey="compliance_pct" name="Cumplimiento %" radius={[0,4,4,0]}>
                    {data.course_distribution.slice(0, 8).map((entry, i) => (
                      <Cell key={i}
                        fill={entry.compliance_pct >= 70 ? '#10b981' : entry.compliance_pct >= 40 ? '#f59e0b' : '#ef4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Distribución de riesgo */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h2 className="font-semibold text-slate-700 mb-3">Distribución de riesgo</h2>
              <div className="flex items-center gap-6">
                {(['bajo', 'medio', 'alto'] as const).map(level => (
                  <div key={level} className="flex-1 text-center">
                    <div
                      className="text-3xl font-extrabold"
                      style={{ color: RISK_COLORS[level] }}
                    >
                      {riskCounts[level] ?? 0}
                    </div>
                    <p className="text-xs text-slate-500">{RISK_LABELS[level]}</p>
                    <div className="mt-2 h-2 rounded-full" style={{ background: RISK_COLORS[level], opacity: 0.25 }} />
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={data.daily_activity} margin={{ left: -20, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip labelFormatter={v => `Fecha: ${v}`} />
                  <Line dataKey="alerts" name="Alertas" stroke="#ef4444" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Cumplimiento promedio por semestre */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h2 className="font-semibold text-slate-700 mb-3">Cumplimiento por semestre</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={['Semestre 3', 'Semestre 5', 'Semestre 7'].map(sem => ({
                    sem,
                    avg: (() => {
                      const ss = data.students.filter(s => s.semester_label === sem)
                      return ss.length ? Math.round(ss.reduce((a, s) => a + s.compliance_pct, 0) / ss.length) : 0
                    })(),
                  }))}
                  margin={{ left: -10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="sem" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Cumplimiento promedio']} />
                  <Bar dataKey="avg" name="Cumplimiento promedio %" radius={[6,6,0,0]}>
                    {['#6366f1', '#8b5cf6', '#a78bfa'].map((fill, i) => (
                      <Cell key={i} fill={fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabla de estudiantes */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="font-semibold text-slate-700">Todos los estudiantes</h2>
              <select
                value={filterSemester}
                onChange={e => setFilterSemester(e.target.value)}
                className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option>Todos</option>
                <option>Semestre 3</option>
                <option>Semestre 5</option>
                <option>Semestre 7</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                    <th className="px-3 py-2 text-left">Estudiante</th>
                    <th className="px-3 py-2 text-left">Semestre</th>
                    <th className="px-3 py-2 text-center">Sesiones</th>
                    <th className="px-3 py-2 text-center">Completadas</th>
                    <th className="px-3 py-2 text-center">Cumplimiento</th>
                    <th className="px-3 py-2 text-center">Alertas</th>
                    <th className="px-3 py-2 text-center">Riesgo</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-slate-800">{s.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{s.dni}</div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 text-xs">{s.semester_label}</td>
                      <td className="px-3 py-2.5 text-center text-slate-600">{s.scheduled_sessions}</td>
                      <td className="px-3 py-2.5 text-center text-emerald-600 font-medium">{s.completed_sessions}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${s.compliance_pct}%`,
                                background: s.compliance_pct >= 70 ? '#10b981' : s.compliance_pct >= 40 ? '#f59e0b' : '#ef4444',
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium">{s.compliance_pct}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-xs font-semibold ${s.unread_alerts > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {s.total_alerts} {s.unread_alerts > 0 && `(${s.unread_alerts} sin leer)`}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            background: s.risk_level === 'alto' ? '#fee2e2' : s.risk_level === 'medio' ? '#fef3c7' : '#d1fae5',
                            color: RISK_COLORS[s.risk_level],
                          }}
                        >
                          {RISK_LABELS[s.risk_level]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
