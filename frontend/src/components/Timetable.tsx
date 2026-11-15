import type { StudySession } from '../types'

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const STATUS_BLOCK: Record<string, string> = {
  pending:     'bg-amber-100   border-amber-300   text-amber-800',
  in_progress: 'bg-blue-100    border-blue-300    text-blue-800',
  completed:   'bg-emerald-100 border-emerald-300 text-emerald-800',
}

// Estilos para días anteriores (solo lectura, sin hover interactivo)
const STATUS_BLOCK_PAST: Record<string, string> = {
  pending:     'bg-slate-100 border-slate-200 text-slate-400',
  in_progress: 'bg-slate-100 border-slate-200 text-slate-400',
  completed:   'bg-slate-200 border-slate-300 text-slate-500',
}

interface Props {
  sessions: StudySession[]
  todayDow: number
  selectedId: number | null
  onSelect: (id: number) => void
}

/**
 * Horario semanal en ventanas de tiempo.
 * - Los días anteriores a hoy son solo lectura (no se pueden seleccionar).
 * - El día de hoy y los futuros son interactivos.
 */
export default function Timetable({ sessions, todayDow, selectedId, onSelect }: Props) {
  if (sessions.length === 0) {
    return <p className="text-sm text-slate-400">No hay sesiones programadas.</p>
  }

  const starts = sessions.map((s) => toMinutes(s.start_time))
  const ends   = sessions.map((s) => toMinutes(s.end_time))
  const earliest = Math.floor(Math.min(...starts) / 60)
  const latest   = Math.ceil(Math.max(...ends)   / 60)
  const rowH = 56
  const totalH = (latest - earliest) * rowH

  const labelHours = Array.from({ length: latest - earliest },     (_, i) => earliest + i)
  const gridHours  = Array.from({ length: latest - earliest + 1 }, (_, i) => earliest + i)
  const byDay = (dow: number) => sessions.filter((s) => s.day_of_week === dow)

  const cols = `56px repeat(7, minmax(0, 1fr))`

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        {/* Encabezado de días */}
        <div className="grid mb-1" style={{ gridTemplateColumns: cols }}>
          <div />
          {DAYS.map((d, dow) => {
            const isPast   = dow < todayDow
            const isToday  = dow === todayDow
            return (
              <div
                key={dow}
                className={`px-1 pb-2 text-center text-xs font-semibold ${
                  isPast  ? 'text-slate-400' :
                  isToday ? 'text-brand-600' : 'text-slate-600'
                }`}
              >
                {d}
                {isToday && (
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-brand-600 text-white text-[10px]">
                    Hoy
                  </span>
                )}
                {isPast && (
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-slate-200 text-slate-400 text-[10px]">
                    pasado
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Cuerpo: eje de horas + columnas */}
        <div className="grid" style={{ gridTemplateColumns: cols }}>
          {/* Eje de horas */}
          <div className="relative" style={{ height: totalH }}>
            {labelHours.map((h) => (
              <div
                key={h}
                className="absolute left-0 text-[11px] text-slate-400"
                style={{ top: (h - earliest) * rowH + 2 }}
              >
                {h}:00
              </div>
            ))}
          </div>

          {/* Columnas de días */}
          {DAYS.map((_, dow) => {
            const isPast = dow < todayDow
            return (
              <div
                key={dow}
                className={`relative border-l border-slate-100 ${isPast ? 'opacity-50' : ''}`}
                style={{ height: totalH }}
              >
                {/* fondo gris para días pasados */}
                {isPast && (
                  <div className="absolute inset-0 bg-slate-50 rounded" />
                )}

                {gridHours.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-slate-100"
                    style={{ top: (h - earliest) * rowH }}
                  />
                ))}

                {byDay(dow).map((s) => {
                  const top    = ((toMinutes(s.start_time) - earliest * 60) / 60) * rowH
                  const height = Math.max(
                    ((toMinutes(s.end_time) - toMinutes(s.start_time)) / 60) * rowH - 3,
                    22
                  )
                  const isSelected = selectedId === s.id
                  const blockStyle = isPast ? STATUS_BLOCK_PAST[s.status] : STATUS_BLOCK[s.status]
                  const hoverStyle = isPast ? '' : 'hover:brightness-95 cursor-pointer'

                  if (isPast) {
                    // Días anteriores: solo decorativo, sin clic
                    return (
                      <div
                        key={s.id}
                        className={`absolute left-1 right-1 rounded-md border px-1.5 py-1 text-left text-[11px] leading-tight ${blockStyle} cursor-not-allowed`}
                        style={{ top, height }}
                        title="Día anterior — solo lectura"
                      >
                        <span className="font-semibold block truncate">{s.course_name}</span>
                        <span className="opacity-70">{s.start_time}–{s.end_time}</span>
                      </div>
                    )
                  }

                  return (
                    <button
                      key={s.id}
                      onClick={() => onSelect(s.id)}
                      className={`absolute left-1 right-1 rounded-md border px-1.5 py-1 text-left text-[11px] leading-tight transition-all ${blockStyle} ${hoverStyle} ${
                        isSelected ? 'ring-2 ring-brand-500' : ''
                      }`}
                      style={{ top, height }}
                      title={`${s.course_name} · ${s.start_time}–${s.end_time}`}
                    >
                      <span className="font-semibold block truncate">{s.course_name}</span>
                      <span className="opacity-80">{s.start_time}–{s.end_time}</span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
