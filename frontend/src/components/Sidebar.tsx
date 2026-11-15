import { Activity, Bell, BookOpen, CalendarDays, LayoutDashboard, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { useAuth } from '../services/auth'
import Logo from './Logo'

const items = [
  { to: '/dashboard', label: 'Dashboard',       icon: LayoutDashboard, desc: 'Resumen de actividad' },
  { to: '/plan',      label: 'Plan de estudio', icon: CalendarDays,    desc: 'Horario semanal'      },
  { to: '/alertas',   label: 'Alertas',         icon: Bell,            desc: 'Notificaciones'       },
  { to: '/mentores',  label: 'Mentores',        icon: Users,           desc: 'Equipo de apoyo'      },
  { to: '/riesgo',    label: 'Análisis',        icon: Activity,        desc: 'Riesgo de abandono'   },
]

function Initials({ name }: { name: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
      {name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
    </div>
  )
}

export default function Sidebar() {
  const { student } = useAuth()

  return (
    <aside
      className="w-64 flex flex-col flex-shrink-0 relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 40%, #3730a3 100%)',
      }}
    >
      {/* Patrón decorativo de fondo */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #a5b4fc 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Logo */}
      <div className="relative h-16 flex items-center px-5 border-b border-white/10">
        <Logo size={34} variant="dark" tagline />
      </div>

      {/* Sección de navegación */}
      <div className="relative flex-1 flex flex-col px-3 py-4 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-[.14em] text-indigo-300/60 px-3 mb-2">
          Menú principal
        </p>
        <nav className="space-y-1">
          {items.map(({ to, label, icon: Icon, desc }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-white/15 text-white shadow-inner'
                    : 'text-indigo-200/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-transparent group-hover:bg-white/10 text-indigo-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate">{label}</div>
                    <div className={`text-[10px] truncate transition-colors ${isActive ? 'text-indigo-200' : 'text-indigo-400/60 group-hover:text-indigo-300'}`}>
                      {desc}
                    </div>
                  </div>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-300 flex-shrink-0" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Separador */}
        <div className="my-4 border-t border-white/10" />

        {/* Información de la carrera */}
        <div className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
            <span className="text-[11px] font-semibold text-indigo-200">Ciencias de la Computación</span>
          </div>
          <p className="text-[10px] text-indigo-400/70 leading-relaxed">
            Plataforma contra el abandono escolar · Ciclo 2026
          </p>
        </div>
      </div>

      {/* Avatar del estudiante al pie */}
      {student && (
        <div className="relative px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <Initials name={student.name} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{student.name}</p>
              <p className="text-[10px] text-indigo-300/70 font-mono">{student.dni}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft flex-shrink-0" />
          </div>
        </div>
      )}
    </aside>
  )
}
