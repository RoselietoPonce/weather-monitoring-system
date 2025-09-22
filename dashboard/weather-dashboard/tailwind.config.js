/** @type {import('tailwindcss').Config} */
  export default {
    content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          // These are now CSS variables controlled by base.css
          background: 'var(--color-background)',
          surface: 'var(--color-surface)',
          primary: 'var(--color-primary)',
          'text-main': 'var(--color-text-main)',
          'text-light': 'var(--color-text-light)',
        },
        animation: {
          'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
      },
    },
    plugins: [],
  }
