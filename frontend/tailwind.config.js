/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':    '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'card-lg': '0 4px 16px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
      },
      keyframes: {
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(40px)' },
          to:   { opacity: '1', transform: 'translateX(0)'    },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-40px)' },
          to:   { opacity: '1', transform: 'translateX(0)'     },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96) translateY(4px)' },
          to:   { opacity: '1', transform: 'scale(1)    translateY(0)'   },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
        confettiFall: {
          '0%':   { transform: 'translateY(-10px) rotate(0deg)',   opacity: '1' },
          '100%': { transform: 'translateY(110vh) rotate(720deg)', opacity: '0' },
        },
        popIn: {
          '0%':  { transform: 'scale(0.85)', opacity: '0' },
          '60%': { transform: 'scale(1.05)'               },
          '100%':{ transform: 'scale(1)',    opacity: '1' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition:  '200% 0' },
        },
      },
      animation: {
        'slide-in-right': 'slideInRight 0.32s cubic-bezier(0.25,0.46,0.45,0.94) both',
        'slide-in-left':  'slideInLeft  0.32s cubic-bezier(0.25,0.46,0.45,0.94) both',
        'fade-up':        'fadeUp       0.35s ease-out both',
        'fade-in':        'fadeIn       0.25s ease-out both',
        'scale-in':       'scaleIn      0.22s cubic-bezier(0.16,1,0.3,1) both',
        'slide-down':     'slideDown    0.18s ease-out both',
        'slide-up':       'slideUp      0.3s  ease-out both',
        'pop-in':         'popIn        0.35s cubic-bezier(0.34,1.56,0.64,1) both',
        'shimmer':        'shimmer      1.8s  linear infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
