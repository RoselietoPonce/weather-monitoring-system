/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'gemini-gray': {
          100: '#f0f4f9',
          200: '#e0e6ec',
          300: '#c2c8d0',
          400: '#a3acb9',
          500: '#8591a2',
          600: '#67768b',
          700: '#4f5b6a',
          800: '#38414a',
          900: '#202124',
        },
        'gemini-blue': {
          light: '#8ab4f8',
          DEFAULT: '#1a73e8',
          deep: '#185abc',   // ✅ renamed from "dark"
        },
        'gemini-green': {
          light: '#81c995',
          DEFAULT: '#1e8e3e',
          deep: '#186c32',   // ✅ renamed from "dark"
        },
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
