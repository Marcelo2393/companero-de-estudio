/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        surface: {
          DEFAULT: '#f8fafc',
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
        },
      },
      boxShadow: {
        card:    '0 1px 3px 0 rgb(0 0 0 / .06), 0 1px 2px -1px rgb(0 0 0 / .04)',
        'card-md': '0 4px 12px -2px rgb(0 0 0 / .08), 0 2px 6px -2px rgb(0 0 0 / .05)',
        'card-lg': '0 10px 30px -4px rgb(0 0 0 / .10), 0 4px 12px -4px rgb(0 0 0 / .07)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / .04)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        'gradient-brand-subtle': 'linear-gradient(135deg, #eef2ff 0%, #ede9fe 100%)',
        'dot-pattern': 'radial-gradient(circle, #c7d2fe 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot-sm': '20px 20px',
      },
      animation: {
        'fade-in':    'fadeIn .3s ease-out',
        'slide-up':   'slideUp .3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:     { from: { opacity: '0' },                    to: { opacity: '1' } },
        slideUp:    { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft:  { '0%, 100%': { opacity: '1' }, '50%': { opacity: '.7' } },
      },
    },
  },
  plugins: [],
}
