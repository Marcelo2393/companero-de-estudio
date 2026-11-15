/**
 * Tarjeta de sesión — VISTA DEL ESTUDIANTE.
 *
 * El estudiante solo ve el estado de la sesión y su nota.
 * Los botones de "Iniciar" y "Finalizar" son exclusivos del profesor
 * (ver TeacherStudyCard.tsx). Esta separación refleja que la asistencia
 * la controla el docente, no el alumno.
 */
import { BookOpen, CheckCircle2, Clock, GraduationCap } from 'lucide-react'

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

const STATUS_MESSAGES: Record<string, string> = {
  pending:     'Esperando que el profesor inicie la clase.',
  in_progress: 'Clase en curso. El profesor registrará el fin.',
  completed:   'Clase finalizada y registrada.',
}

interface Props {
  session: StudySession
}

export default function StudyCard({ session }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      {/* Cabecera */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-slate-800 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-brand-600" />
            {session.course_name}
          </h3>
          <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
            <Clock className="w-4 h-4" />
            {session.start_time} – {session.end_time} · {session.duration_minutes} min
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[session.status]}`}>
          {STATUS_LABELS[session.status]}
        </span>
      </div>

      {/* Mensaje de estado */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100 mb-3">
        <GraduationCap className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-slate-600">{STATUS_MESSAGES[session.status]}</p>
      </div>

      {/* Resultado al completar */}
      {session.status === 'completed' && (
        <div className="space-y-1">
          <p className="text-xs text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Tiempo registrado: <strong>{session.actual_duration_minutes} min</strong>
          </p>
          {session.note && (
            <p className="text-sm text-slate-600 mt-1">
              <span className="font-medium text-slate-700">Tu nota:</span>{' '}
              <span className="italic">"{session.note}"</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
