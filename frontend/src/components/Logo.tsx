interface LogoProps {
  size?: number
  showText?: boolean
  tagline?: boolean
  variant?: 'light' | 'dark'
}

export default function Logo({
  size = 40,
  showText = true,
  tagline = false,
  variant = 'light',
}: LogoProps) {
  const textColor = variant === 'dark' ? 'text-white' : 'text-slate-900'
  const subColor  = variant === 'dark' ? 'text-indigo-300/80' : 'text-slate-500'

  return (
    <div className="flex items-center gap-2.5">
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        className="flex-shrink-0 drop-shadow-md"
        aria-label="Logo de Kuska"
        role="img"
      >
        <defs>
          <linearGradient id="kuskaG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#818cf8" />
            <stop offset="50%"  stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4338ca" />
          </linearGradient>
          <filter id="kuskaShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#4338ca" floodOpacity=".35" />
          </filter>
        </defs>
        {/* Fondo con esquinas redondeadas */}
        <rect x="2" y="2" width="60" height="60" rx="18" fill="url(#kuskaG)" filter="url(#kuskaShadow)" />
        {/* Brillo superior */}
        <rect x="2" y="2" width="60" height="28" rx="18" fill="white" opacity=".07" />
        {/* Birrete */}
        <polygon points="32,13 52,23 32,33 12,23" fill="white" opacity=".95" />
        {/* Cuerpo del birrete */}
        <path d="M20 27 L20 36 C20 44 44 44 44 36 L44 27 Z" fill="white" opacity=".85" />
        {/* Cordón */}
        <line x1="47" y1="22" x2="47" y2="32" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity=".9" />
        <circle cx="47" cy="35" r="2.5" fill="white" opacity=".9" />
      </svg>

      {showText && (
        <div className="leading-none">
          <span
            className={`font-extrabold tracking-tight leading-none ${textColor}`}
            style={{ fontSize: size * 0.44 }}
          >
            Kuska
          </span>
          {tagline && (
            <span className={`block leading-tight mt-0.5 ${subColor}`} style={{ fontSize: size * 0.22 }}>
              tu compañero de estudio
            </span>
          )}
        </div>
      )}
    </div>
  )
}
