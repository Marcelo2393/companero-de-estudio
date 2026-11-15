import { Sparkles, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

import MentorCard from '../components/MentorCard'
import { mentors } from '../data/mentors'

const STORAGE_KEY = 'ce_selected_mentor'

export default function Mentors() {
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? Number(raw) : null
  })

  useEffect(() => {
    if (selectedId == null) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, String(selectedId))
  }, [selectedId])

  const chosen = mentors.find(m => m.id === selectedId) ?? null

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Cabecera */}
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Users className="w-6 h-6 text-brand-600" /> Mentores
        </h1>
        <p className="page-subtitle">
          Especialistas en Ciencias de la Computación listos para acompañarte. Solo puedes elegir uno a la vez.
        </p>
      </div>

      {/* Banner del mentor elegido */}
      {chosen && (
        <div className="mb-5 px-5 py-4 rounded-2xl flex items-center gap-3 animate-slide-up"
          style={{ background: 'linear-gradient(135deg, #eef2ff, #ede9fe)', border: '1px solid #c7d2fe' }}>
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-brand-800">Tu mentor actual: {chosen.name}</p>
            <p className="text-xs text-brand-600">{chosen.specialty} · Pulsa "Quitar" en su tarjeta para cambiar</p>
          </div>
        </div>
      )}

      {/* Grid de mentores */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mentors.map((m, i) => (
          <MentorCard
            key={m.id}
            mentor={m}
            index={i}
            isSelected={selectedId === m.id}
            disabled={selectedId !== null && selectedId !== m.id}
            onChoose={() => setSelectedId(m.id)}
            onRemove={() => setSelectedId(null)}
          />
        ))}
      </div>
    </div>
  )
}
