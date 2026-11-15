import { Download } from 'lucide-react'
import { useState } from 'react'

import type { Student, StudySession } from '../types'
import { exportStudyPlan } from '../utils/exportExcel'

interface Props {
  student: Student
  sessions: StudySession[]
}

export default function DownloadExcelButton({ student, sessions }: Props) {
  const [open, setOpen] = useState(false)

  const download = (mode: 'daily' | 'weekly') => {
    exportStudyPlan(student, sessions, mode)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
      >
        <Download className="w-4 h-4" /> Descargar Excel
      </button>

      {open && (
        <>
          {/* capa para cerrar al hacer clic fuera */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-20 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden w-52">
            <button
              onClick={() => download('daily')}
              className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors"
            >
              📅 Actividad de hoy
            </button>
            <div className="border-t border-slate-100" />
            <button
              onClick={() => download('weekly')}
              className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors"
            >
              📊 Actividad semanal
            </button>
          </div>
        </>
      )}
    </div>
  )
}
