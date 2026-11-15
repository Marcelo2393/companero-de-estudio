/**
 * Exportación del plan de estudio a Excel (.xlsx) usando SheetJS.
 * Genera dos hojas:
 *   - "Plan"   → todas las sesiones (diario o semanal según el modo)
 *   - "Resumen" → totales por curso
 */
import * as XLSX from 'xlsx'

import type { StudySession, Student } from '../types'

const DAYS_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const STATUS_ES: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  completed: 'Completada',
}

function sessionRows(sessions: StudySession[]) {
  return sessions.map((s) => ({
    Día: DAYS_ES[s.day_of_week],
    Curso: s.course_name,
    'Hora inicio': s.start_time,
    'Hora fin': s.end_time,
    'Duración (min)': s.duration_minutes,
    Estado: STATUS_ES[s.status] ?? s.status,
    'Estudiado (min)': s.actual_duration_minutes ?? '',
    'Nota del estudiante': s.note ?? '',
  }))
}

function summaryRows(sessions: StudySession[]) {
  const map: Record<string, { programadas: number; completadas: number; minutos: number }> = {}
  for (const s of sessions) {
    if (!map[s.course_name]) map[s.course_name] = { programadas: 0, completadas: 0, minutos: 0 }
    map[s.course_name].programadas++
    if (s.status === 'completed') {
      map[s.course_name].completadas++
      map[s.course_name].minutos += s.actual_duration_minutes ?? 0
    }
  }
  return Object.entries(map).map(([curso, v]) => ({
    Curso: curso,
    'Sesiones programadas': v.programadas,
    'Sesiones completadas': v.completadas,
    'Minutos estudiados': v.minutos,
    'Horas estudiadas': +(v.minutos / 60).toFixed(2),
    'Cumplimiento (%)': v.programadas
      ? +((v.completadas / v.programadas) * 100).toFixed(1)
      : 0,
  }))
}

function styleSheet(ws: XLSX.WorkSheet) {
  // Ancho automático de columnas (estimado por longitud de cabecera)
  const ref = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
  const cols: XLSX.ColInfo[] = []
  for (let c = ref.s.c; c <= ref.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })]
    cols.push({ wch: Math.max(14, (cell?.v?.toString().length ?? 10) + 4) })
  }
  ws['!cols'] = cols
}

export function exportStudyPlan(
  student: Student,
  sessions: StudySession[],
  mode: 'daily' | 'weekly'
) {
  const todayDow = (() => {
    const d = new Date().getDay()
    return d === 0 ? 6 : d - 1
  })()

  const filtered = mode === 'daily'
    ? sessions.filter((s) => s.day_of_week === todayDow)
    : sessions

  const sorted = [...filtered].sort((a, b) =>
    a.day_of_week !== b.day_of_week
      ? a.day_of_week - b.day_of_week
      : a.start_time.localeCompare(b.start_time)
  )

  const wb = XLSX.utils.book_new()

  // Hoja 1 – Detalle del plan
  const planRows = sessionRows(sorted)
  const wsPlan = XLSX.utils.json_to_sheet(planRows)
  styleSheet(wsPlan)
  XLSX.utils.book_append_sheet(wb, wsPlan, 'Plan')

  // Hoja 2 – Resumen por curso
  const sumRows = summaryRows(sorted)
  const wsSum = XLSX.utils.json_to_sheet(sumRows)
  styleSheet(wsSum)
  XLSX.utils.book_append_sheet(wb, wsSum, 'Resumen')

  const label = mode === 'daily' ? `Día_${DAYS_ES[todayDow]}` : 'Semanal'
  const date = new Date().toISOString().slice(0, 10)
  const filename = `Kuska_Plan_${student.name.replace(/\s+/g, '_')}_${label}_${date}.xlsx`

  XLSX.writeFile(wb, filename)
}
