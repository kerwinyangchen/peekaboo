/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'Times New Roman', 'serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'monospace'],
        logo:    ['Pacifico', 'cursive'],
      },
      colors: {
        surface: {
          DEFAULT: '#FFFFFF',
          raised:  '#FAFAF9',
          overlay: '#F0EEE9',
          border:  '#E2E2E2',
          muted:   '#F5F4F1',
        },
        text: {
          primary:   '#121212',
          secondary: '#444444',
          muted:     '#767676',
          inverse:   '#FFFFFF',
        },
        brand: {
          DEFAULT: '#4A6FA5',
          hover:   '#3A5A8C',
          muted:   '#EEF3FC',
        },
        critical: {
          DEFAULT: '#D0021B',
          bg:      '#FEF0F1',
          border:  '#F5B5BB',
          text:    '#A80015',
        },
        warning: {
          DEFAULT: '#9B7A2F',
          bg:      '#FDF8EE',
          border:  '#E8D5A0',
          text:    '#7A5E1A',
        },
        pass: {
          DEFAULT: '#1A6B3C',
          bg:      '#EAF4EE',
          border:  '#A8D5B8',
          text:    '#155230',
        },
        info: {
          DEFAULT: '#2563EB',
          bg:      '#EEF3FE',
          border:  '#BFCFFE',
        },
      },
      borderRadius: {
        sm:      '2px',
        DEFAULT: '4px',
        md:      '4px',
        lg:      '6px',
        xl:      '8px',
      },
      boxShadow: {
        card:     '0 1px 3px 0 rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
        elevated: '0 4px 16px 0 rgba(0,0,0,0.10)',
        focus:    '0 0 0 3px rgba(74,111,165,0.20)',
      },
      animation: {
        'fade-in':    'fadeIn 200ms ease-out',
        'slide-up':   'slideUp 250ms cubic-bezier(0.16,1,0.3,1)',
        'slide-in':   'slideIn 300ms cubic-bezier(0.16,1,0.3,1)',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        shimmer:      'shimmer 1.6s linear infinite',
        shake:        'shake 280ms cubic-bezier(0.36,0.07,0.19,0.97) both',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '15%':      { transform: 'translateX(-4px)' },
          '30%':      { transform: 'translateX(4px)' },
          '45%':      { transform: 'translateX(-3px)' },
          '60%':      { transform: 'translateX(3px)' },
          '75%':      { transform: 'translateX(-2px)' },
          '90%':      { transform: 'translateX(2px)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
