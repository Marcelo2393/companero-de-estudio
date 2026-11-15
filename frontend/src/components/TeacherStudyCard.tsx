/**
 * Tarjeta de sesión — VISTA DEL PROFESOR.
 *
 * El docente puede iniciar la clase (tomar asistencia) y finalizarla.
 * El estudiante puede añadir una nota mientras la clase está en curso.
 */
import { BookOpen, CheckCircle2, Clock, Play, Square } from 'lucide-react'
import { useState } from 'react'

import type { StudySession } from '../types'

const STATUS_LABELS: Record<string, string> = {
  pending:     'Pendiente',
  in_progress: 'En curso',
  completed:   'Completada',
}

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100  text-blue-700',
  completed:   'bg-emerald-100 text-emerald-700',
}

interface Props {
  session: StudySession
  onStart:  (id: number) => void
  onFinish: (id: number, note: string) => void
}

export default function TeacherStudyCard({ session, onStart, onFinish }: Props) {
  const [note, setNote] = useState(session.note ?? '')

  return (
    <div className="bg-white rounded-xl border-2 border-indigo-200 p-4 shadow-sm">
      {/* Badge "Vista profesor" */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
          Vista profesor
        </span>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[session.status]}`}>
          {STATUS_LABELS[session.status]}
        </span>
      </div>

      {/* Cabecera */}
      <h3 className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
        <BookOpen className="w-4 h-4 text-brand-600" />
        {session.course_name}
      </h3>
      <p className="text-sm text-slate-500 flex items-center gap-1 mb-3">
        <Clock className="w-4 h-4" />
        {session.start_time} – {session.end_time} · {session.duration_minutes} min
      </p>

      {/* Campo de nota (solo cuando está en curso) */}
      {session.status === 'in_progress' && (
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nota del estudiante (opcional)..."
          maxLength={280}
          className="w-full mb-3 px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none"
        />
      )}

      {/* Resultado al completar */}
      {session.status === 'completed' && (
        <div className="mb-3 space-y-1">
          <p className="text-xs text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Tiempo registrado: <strong>{session.actual_duration_minutes} min</strong>
          </p>
          {session.note && (
            <p className="text-sm text-slate-600">
              <span className="font-medium">Nota:</span>{' '}
              <span className="italic">"{session.note}"</span>
            </p>
          )}
        </div>
      )}

      {/* Controles del profesor */}
      <div className="flex gap-2">
        <button
          disabled={session.status !== 'pending'}
          onClick={() => onStart(session.id)}
          className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          <Play className="w-4 h-4" /> Iniciar clase
        </button>
        <button
          disabled={session.status !== 'in_progress'}
          onClick={() => onFinish(session.id, note)}
          className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-slate-800 text-white hover:bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          <Square className="w-4 h-4" /> Finalizar clase
        </button>
      </div>
    </div>
  )
}
