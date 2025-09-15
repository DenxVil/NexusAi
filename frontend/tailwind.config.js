/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nexus: {
          50: '#f0f4ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#8b5cf6',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3c1a78',
        }
      },
      fontFamily: {
        'nexus': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'typing': 'typing 1.5s infinite',
        'pulse-slow': 'pulse 3s infinite',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}