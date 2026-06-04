/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(48px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-48px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        confettiFall: {
          '0%':   { transform: 'translateY(-10px) rotate(0deg)',    opacity: '1' },
          '100%': { transform: 'translateY(110vh) rotate(720deg)',  opacity: '0' },
        },
        popIn: {
          '0%':   { transform: 'scale(0.85)', opacity: '0' },
          '60%':  { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
      },
      animation: {
        'slide-in-right': 'slideInRight 0.32s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
        'slide-in-left':  'slideInLeft  0.32s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
        'fade-up':        'fadeUp       0.4s  ease-out forwards',
        'pop-in':         'popIn        0.35s cubic-bezier(0.34,1.56,0.64,1)    forwards',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
