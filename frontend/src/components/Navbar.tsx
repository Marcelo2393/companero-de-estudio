import { Bell, LogOut, Settings } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../services/auth'

const PAGE_LABELS: Record<string, { title: string; emoji: string }> = {
  '/dashboard': { title: 'Dashboard',        emoji: '🏠' },
  '/plan':      { title: 'Plan de estudio',  emoji: '📅' },
  '/alertas':   { title: 'Alertas',          emoji: '🔔' },
  '/mentores':  { title: 'Mentores',         emoji: '👥' },
  '/riesgo':    { title: 'Análisis de riesgo', emoji: '📊' },
}

function Initials({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-brand text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
      {initials}
    </div>
  )
}

export default function Navbar() {
  const { student, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const page = PAGE_LABELS[location.pathname] ?? { title: 'Kuska', emoji: '🎓' }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header
      className="h-16 flex items-center justify-between px-6 flex-shrink-0 border-b border-slate-200/80"
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Breadcrumb de página */}
      <div className="flex items-center gap-3">
        <span className="text-xl">{page.emoji}</span>
        <div>
          <h2 className="text-sm font-bold text-slate-800 leading-tight">{page.title}</h2>
          <p className="text-[11px] text-slate-400">Kuska · Ciencias de la Computación</p>
        </div>
      </div>

      {/* Acciones del usuario */}
      <div className="flex items-center gap-2">
        <button
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-brand-600 transition-all"
          title="Notificaciones"
        >
          <Bell className="w-4 h-4" />
        </button>
        <button
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-brand-600 transition-all"
          title="Ajustes"
        >
          <Settings className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-default">
          {student && <Initials name={student.name} />}
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{student?.name}</p>
            <p className="text-[10px] text-slate-400">Estudiante</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-medium">Salir</span>
        </button>
      </div>
    </header>
  )
}
