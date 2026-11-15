import { KeyRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import DownloadExcelButton from '../components/DownloadExcelButton'
import StudyCard from '../components/StudyCard'
import TeacherStudyCard from '../components/TeacherStudyCard'
import Timetable from '../components/Timetable'
import { finishSession, getWeeklyPlan, startSession } from '../services/api'
import { useAuth } from '../services/auth'
import type { StudySession } from '../types'

// Contraseña de demo para acceder a la vista del profesor.
const TEACHER_PASS = 'PROFE2024'

export default function StudyPlan() {
  const { student } = useAuth()
  const [sessions, setSessions]       = useState<StudySession[]>([])
  const [loading, setLoading]         = useState(true)
  const [msg, setMsg]                 = useState('')
  const [selectedId, setSelectedId]   = useState<number | null>(null)

  // Vista del profesor
  const [teacherMode, setTeacherMode]     = useState(false)
  const [showPassModal, setShowPassModal] = useState(false)
  const [passInput, setPassInput]         = useState('')
  const [passError, setPassError]         = useState('')

  // JS getDay(): 0=Domingo..6=Sábado. Backend: 0=Lunes..6=Domingo.
  const jsToday  = new Date().getDay()
  const todayDow = jsToday === 0 ? 6 : jsToday - 1

  const load = () => {
    if (!student) return
    getWeeklyPlan(student.id).then((list) => {
      setSessions(list)
      setSelectedId((prev) =>
        prev ?? list.find((s) => s.day_of_week === todayDow)?.id ?? list[0]?.id ?? null
      )
    }).finally(() => setLoading(false))
  }

  useEffect(load, [student])

  const handleStart = async (id: number) => {
    setMsg((await startSession(id)).message)
    load()
  }

  const handleFinish = async (id: number, note: string) => {
    setMsg((await finishSession(id, note)).message)
    load()
  }

  const handleTeacherLogin = () => {
    if (passInput === TEACHER_PASS) {
      setTeacherMode(true)
      setShowPassModal(false)
      setPassInput('')
      setPassError('')
    } else {
      setPassError('Contraseña incorrecta.')
    }
  }

  // Selección: solo permitir días >= hoy
  const handleSelect = (id: number) => {
    const session = sessions.find((s) => s.id === id)
    if (!session) return
    if (session.day_of_week < todayDow) return // día pasado → ignorar
    setSelectedId(id)
  }

  if (loading) return <div className="p-8 text-slate-500">Cargando plan...</div>

  const selected = sessions.find((s) => s.id === selectedId) ?? null

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Plan de estudio</h1>
          <p className="text-slate-500 text-sm">
            Tu horario semanal. Pulsa una sesión de hoy o de días futuros para ver su detalle.
            <br />
            <span className="text-slate-400">Los días anteriores son solo lectura.</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DownloadExcelButton student={student!} sessions={sessions} />
          {!teacherMode ? (
            <button
              onClick={() => setShowPassModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <KeyRound className="w-4 h-4" /> Vista profesor
            </button>
          ) : (
            <button
              onClick={() => setTeacherMode(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-100 text-indigo-700 text-sm font-medium hover:bg-indigo-200 transition-colors"
            >
              <X className="w-4 h-4" /> Salir vista profesor
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm">{msg}</div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Horario semanal */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /> Pendiente
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-100 border border-blue-300" /> En curso
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" /> Completada
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200" /> Día pasado
            </span>
          </div>
          <Timetable
            sessions={sessions}
            todayDow={todayDow}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        </div>

        {/* Panel de detalle */}
        <div>
          {selected ? (
            <div key={selected.id}>
              {teacherMode ? (
                <TeacherStudyCard
                  session={selected}
                  onStart={handleStart}
                  onFinish={handleFinish}
                />
              ) : (
                <StudyCard session={selected} />
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
              Selecciona una sesión de hoy o de días futuros para ver su detalle.
            </div>
          )}
        </div>
      </div>

      {/* Modal contraseña del profesor */}
      {showPassModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Vista del profesor</h2>
            <p className="text-sm text-slate-500 mb-4">
              Ingresa la contraseña de demostración para tomar asistencia y registrar las clases.
            </p>
            <input
              type="password"
              value={passInput}
              onChange={(e) => setPassInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTeacherLogin()}
              placeholder="Contraseña del profesor"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none mb-2"
              autoFocus
            />
            {passError && <p className="text-sm text-red-600 mb-2">{passError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleTeacherLogin}
                className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
              >
                Acceder
              </button>
              <button
                onClick={() => { setShowPassModal(false); setPassInput(''); setPassError('') }}
                className="flex-1 py-2.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
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
