import { AlertCircle, LogIn } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Logo from '../components/Logo'
import { login } from '../services/api'
import { useAuth } from '../services/auth'

// Lista completa de los 12 estudiantes de demostración agrupados por semestre.
const DEMO_STUDENTS = [
  {
    semester: 'Semestre 3',
    color: 'bg-sky-50 border-sky-200',
    badge: 'bg-sky-100 text-sky-700',
    students: [
      { dni: '16447495', name: 'Ana García',    note: 'Cumplimiento alto' },
      { dni: '72345678', name: 'Bruno López',   note: 'Cumplimiento medio' },
      { dni: '30567890', name: 'Carla Ruiz',    note: 'Horario tarde' },
      { dni: '45123789', name: 'Diego Morales', note: 'Riesgo medio' },
    ],
  },
  {
    semester: 'Semestre 5',
    color: 'bg-violet-50 border-violet-200',
    badge: 'bg-violet-100 text-violet-700',
    students: [
      { dni: '58934210', name: 'Elena Vargas',   note: 'Sin barreras' },
      { dni: '63210987', name: 'Favio Quispe',   note: 'Trabaja part-time' },
      { dni: '71890234', name: 'Gabriela Soto',  note: 'Baja motivación' },
      { dni: '29034567', name: 'Hugo Mendoza',   note: 'Buen ritmo' },
    ],
  },
  {
    semester: 'Semestre 7',
    color: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    students: [
      { dni: '84512036', name: 'Isabel Flores',   note: 'Tesis avanzada' },
      { dni: '37890124', name: 'Javier Castillo', note: 'Riesgo alto' },
      { dni: '92034785', name: 'Karen Paredes',   note: 'Barrera académica' },
      { dni: '10456823', name: 'Luis Aguilar',    note: 'Equilibrado' },
    ],
  },
]

export default function Login() {
  const { login: doLogin } = useAuth()
  const navigate = useNavigate()
  const [dni, setDni] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (value: string) => {
    if (!value.trim()) return
    setError('')
    setLoading(true)
    try {
      const student = await login(value.trim())
      doLogin(student)
      navigate('/dashboard')
    } catch (e) {
      const status = (e as { response?: { status?: number } }).response?.status
      setError(
        status === 404
          ? 'DNI no encontrado. Usa un DNI de demostración de la lista.'
          : 'Error al iniciar sesión. Verifica que el backend esté activo.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col lg:flex-row bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-900">
      {/* Panel izquierdo — formulario */}
      <div className="flex items-center justify-center p-6 lg:w-[420px] flex-shrink-0">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <Logo size={72} showText={false} />
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 mt-4">Kuska</h1>
            <p className="text-sm text-slate-500">tu compañero de estudio</p>
            <p className="text-xs text-slate-400 mt-2 max-w-xs">
              Plataforma educativa de Ciencias de la Computación contra el abandono escolar.
            </p>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); submit(dni) }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                DNI del estudiante
              </label>
              <input
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                placeholder="Ej. 16447495"
                inputMode="numeric"
                maxLength={8}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none tracking-widest text-lg font-mono"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || dni.length < 8}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              <LogIn className="w-5 h-5" /> {loading ? 'Accediendo...' : 'Acceder'}
            </button>

            <button
              type="button"
              onClick={() => submit('16447495')}
              disabled={loading}
              className="w-full py-2 rounded-lg bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 disabled:opacity-50 transition-colors"
            >
              Entrar como invitado (Ana García)
            </button>
          </form>
        </div>
      </div>

      {/* Panel derecho — lista de estudiantes de demo */}
      <div className="flex-1 overflow-y-auto p-6 lg:py-10">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-white font-bold text-lg mb-1">Estudiantes de demostración</h2>
          <p className="text-white/70 text-sm mb-5">
            Pulsa cualquier DNI para copiarlo al campo de acceso. 12 perfiles únicos de Ciencias
            de la Computación con actividad y riesgo variados.
          </p>

          <div className="space-y-4">
            {DEMO_STUDENTS.map((group) => (
              <div key={group.semester} className={`rounded-xl border p-4 ${group.color}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${group.badge}`}>
                    {group.semester}
                  </span>
                  <span className="text-xs text-slate-500">Ciencias de la Computación</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {group.students.map((s) => (
                    <button
                      key={s.dni}
                      type="button"
                      onClick={() => setDni(s.dni)}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white hover:bg-brand-50 border border-slate-100 hover:border-brand-200 transition-all text-left group"
                    >
                      <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {s.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{s.name}</p>
                        <p className="text-xs font-mono text-brand-600 group-hover:text-brand-700">
                          {s.dni}
                        </p>
                        <p className="text-[11px] text-slate-400">{s.note}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-white/50 text-xs mt-4 text-center">
            Solo para demostración · No usar datos personales reales
          </p>
        </div>
      </div>
    </div>
  )
}
