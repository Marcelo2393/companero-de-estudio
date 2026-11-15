import type { Mentor } from '../data/mentors'

const ACCENT_GRADIENTS = [
  'from-indigo-500 to-indigo-700',
  'from-rose-500 to-rose-700',
  'from-emerald-500 to-emerald-700',
  'from-amber-500 to-amber-700',
  'from-sky-500 to-sky-700',
  'from-violet-500 to-violet-700',
  'from-teal-500 to-teal-700',
  'from-orange-500 to-orange-700',
  'from-pink-500 to-pink-700',
  'from-cyan-500 to-cyan-700',
]

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

interface Props {
  mentor: Mentor
  index: number
  isSelected: boolean
  disabled: boolean
  onChoose: () => void
  onRemove: () => void
}

export default function MentorCard({ mentor, index, isSelected, disabled, onChoose, onRemove }: Props) {
  const accent = ACCENT_GRADIENTS[index % ACCENT_GRADIENTS.length]

  return (
    <div
      className={`card-md p-5 flex flex-col transition-all animate-slide-up ${
        isSelected ? 'ring-2 ring-brand-500 ring-offset-1' : ''
      }`}
    >
      {/* Cabecera */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${accent} text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-md`}
        >
          {initials(mentor.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 leading-tight">{mentor.name}</h3>
          <span className="text-xs font-medium text-brand-600">{mentor.specialty}</span>
        </div>

        {isSelected ? (
          <button
            onClick={onRemove}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-xl font-medium bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors"
          >
            Quitar ✓
          </button>
        ) : (
          <button
            onClick={onChoose}
            disabled={disabled}
            title={disabled ? 'Ya elegiste a otro mentor. Quítalo primero.' : undefined}
            className="flex-shrink-0 btn-primary disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed text-xs py-1.5"
          >
            Elegir
          </button>
        )}
      </div>

      {/* Habilidades */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {mentor.skills.map(s => (
          <span key={s} className="badge badge-indigo">{s}</span>
        ))}
      </div>

      {/* Experiencia */}
      <p className="text-sm text-slate-600 mb-3">
        <span className="font-semibold text-slate-700">Experiencia: </span>
        {mentor.experience}
      </p>

      {/* Frase motivacional */}
      <div className="mt-auto p-3 rounded-xl bg-gradient-brand-subtle border border-brand-100">
        <p className="text-sm text-slate-700 italic leading-relaxed">"{mentor.phrase}"</p>
      </div>

      {isSelected && (
        <p className="mt-3 text-sm text-emerald-700 font-semibold flex items-center gap-1.5">
          ✅ ¡{mentor.name} será tu mentor!
          <span className="font-normal text-slate-500">(pulsa "Quitar" para cambiar)</span>
        </p>
      )}
    </div>
  )
}
