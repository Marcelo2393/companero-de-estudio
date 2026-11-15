import { BellRing, CalendarClock, CheckCircle2, Clock, KeyRound, Play, Target, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import RiskWidget from '../components/RiskWidget'
import { getDashboard, getRiskAssessment } from '../services/api'
import { useAuth } from '../services/auth'
import type { Dashboard as DashboardData, RiskAssessment } from '../types'
import TeacherDashboard from './TeacherDashboard'

const TEACHER_PASS = 'PROFE2024'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  completed: 'Completada',
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  completed: '#10b981',
}

export default function Dashboard() {
  const { student } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [risk, setRisk] = useState<RiskAssessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [teacherMode, setTeacherMode]     = useState(false)
  const [showModal, setShowModal]         = useState(false)
  const [passInput, setPassInput]         = useState('')
  const [passError, setPassError]         = useState('')

  useEffect(() => {
    if (!student) return
    Promise.all([
      getDashboard(student.id),
      getRiskAssessment(student.id),
    ]).then(([d, r]) => {
      setData(d)
      setRisk(r)
    }).finally(() => setLoading(false))
  }, [student])

  const handleTeacherLogin = () => {
    if (passInput === TEACHER_PASS) {
      setTeacherMode(true)
      setShowModal(false)
      setPassInput('')
      setPassError('')
    } else {
      setPassError('Contraseña incorrecta.')
    }
  }

  if (teacherMode) return <TeacherDashboard onExit={() => setTeacherMode(false)} />

  if (loading) return <div className="p-8 text-slate-500">Cargando dashboard...</div>
  if (!data)   return <div className="p-8 text-red-600">No se pudieron cargar los datos.</div>

  // --- datos para gráficas ---
  const pieData = [
    { name: 'Completadas', value: data.today_plan.filter(s => s.status === 'completed').length,   fill: '#10b981' },
    { name: 'En curso',    value: data.today_plan.filter(s => s.status === 'in_progress').length, fill: '#3b82f6' },
    { name: 'Pendientes',  value: data.today_plan.filter(s => s.status === 'pending').length,     fill: '#f59e0b' },
  ].filter(d => d.value > 0)

  const radialData = [
    { name: 'Cumplimiento', value: data.compliance_percentage, fill: '#6366f1' },
  ]

  const courseData = data.today_plan.map(s => ({
    name: s.course_name.length > 18 ? s.course_name.slice(0, 16) + '…' : s.course_name,
    duration: s.duration_minutes,
    status: s.status,
  }))

  const stats = [
    { label: 'Programadas hoy', value: `${data.scheduled_hours}h`,        icon: Clock,      color: 'text-indigo-600',  bg: 'bg-indigo-50'  },
    { label: 'Completadas',      value: `${data.completed_hours}h`,        icon: Target,     color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Cumplimiento',     value: `${data.compliance_percentage}%`,  icon: TrendingUp, color: 'text-brand-600',   bg: 'bg-brand-50'   },
    { label: 'Alertas pendientes', value: data.pending_alerts.length,      icon: BellRing,   color: 'text-rose-600',    bg: 'bg-rose-50'    },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Cabecera */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            ¡Hola, {data.student.name}! 👋
          </h1>
          <p className="text-slate-500 flex items-center gap-1 mt-1">
            <CalendarClock className="w-4 h-4" />
            {new Date(data.date + 'T00:00').toLocaleDateString('es-ES', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <KeyRound className="w-4 h-4" /> Vista docente
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl border border-slate-200 p-4 shadow-sm ${s.bg}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">{s.label}</span>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Fila de gráficas */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Gauge de cumplimiento */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col items-center">
          <h2 className="font-semibold text-slate-700 mb-2 self-start">Cumplimiento hoy</h2>
          <ResponsiveContainer width="100%" height={180}>
            <RadialBarChart
              cx="50%" cy="80%" innerRadius="60%" outerRadius="100%"
              startAngle={180} endAngle={0}
              data={radialData}
            >
              <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#f1f5f9' }} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Cumplimiento']} />
            </RadialBarChart>
          </ResponsiveContainer>
          <p className="text-3xl font-extrabold text-brand-600 -mt-4">
            {data.compliance_percentage}%
          </p>
        </div>

        {/* Pie de sesiones */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h2 className="font-semibold text-slate-700 mb-2">Sesiones de hoy</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={65}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 mt-10 text-center">Sin sesiones hoy.</p>
          )}
        </div>

        {/* Próxima sesión + plan rápido */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col">
          <h2 className="font-semibold text-slate-700 mb-3">Plan del día</h2>
          <div className="space-y-2 flex-1 overflow-auto">
            {data.today_plan.length === 0 ? (
              <p className="text-sm text-slate-400">Sin sesiones programadas hoy.</p>
            ) : (
              data.today_plan.map(s => (
                <div key={s.id} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: STATUS_COLORS[s.status] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{s.course_name}</p>
                    <p className="text-xs text-slate-400">{s.start_time}–{s.end_time}</p>
                  </div>
                  <span className="text-[11px] text-slate-500">{STATUS_LABELS[s.status]}</span>
                </div>
              ))
            )}
          </div>
          {data.next_session && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center">
                <Play className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Próxima sesión</p>
                <p className="text-sm font-semibold text-slate-800">{data.next_session.course_name}</p>
                <p className="text-xs text-slate-400">{data.next_session.start_time}–{data.next_session.end_time}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barras de progreso por curso */}
      {courseData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-700 mb-4">Progreso por materia hoy</h2>
          <div className="space-y-3">
            {courseData.map((c) => (
              <div key={c.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700">{c.name}</span>
                  <span className="text-xs flex items-center gap-1" style={{ color: STATUS_COLORS[c.status] }}>
                    {c.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {STATUS_LABELS[c.status]}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: c.status === 'completed' ? '100%' : c.status === 'in_progress' ? '50%' : '0%',
                      background: STATUS_COLORS[c.status],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alertas */}
      {data.pending_alerts.length > 0 && (
        <div className="bg-white rounded-xl border border-rose-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <BellRing className="w-5 h-5 text-rose-500" /> Alertas pendientes
          </h2>
          <ul className="space-y-2">
            {data.pending_alerts.map((a) => (
              <li key={a.id} className="text-sm text-slate-600 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 flex-shrink-0" />
                {a.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Widget de riesgo */}
      {risk && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-slate-800">Análisis de riesgo de abandono</h2>
            <Link to="/riesgo" className="text-xs text-brand-600 hover:underline">Ver análisis completo →</Link>
          </div>
          <RiskWidget data={risk} compact />
        </div>
      )}

      {/* Modal contraseña docente */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Vista del docente</h2>
            <p className="text-sm text-slate-500 mb-4">
              Ingresa la contraseña de demostración para ver el panel completo con gráficas y filtros de fecha.
            </p>
            <input
              type="password" value={passInput}
              onChange={e => setPassInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTeacherLogin()}
              placeholder="Contraseña del docente"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none mb-2"
              autoFocus
            />
            {passError && <p className="text-sm text-red-600 mb-2">{passError}</p>}
            <div className="flex gap-2">
              <button onClick={handleTeacherLogin}
                className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors">
                Acceder
              </button>
              <button onClick={() => { setShowModal(false); setPassInput(''); setPassError('') }}
                className="flex-1 py-2.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center">Demo: contraseña PROFE2024</p>
          </div>
        </div>
      )}
    </div>
  )
}
