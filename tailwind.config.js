/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#edf3fc',
          100: '#d7e4f9',
          200: '#b5d0f4',
          300: '#84b2ee',
          400: '#4d8de5',
          500: '#2b6fcf',
          600: '#1c3b73', // AMSTech Core Secondary Navy
          700: '#162e5a', // AMSTech Dark Navy
          800: '#122345',
          900: '#0d1933',
          950: '#081022',
        },
        amstech: {
          primary: '#ebb51d', // AMSTech Gold
          'primary-dark': '#d4a31a',
          secondary: '#1c3b73', // AMSTech Navy
          'secondary-dark': '#162e5a',
          'surface-yellow': '#fef9ec',
          slate: '#555a6a',
          steel: '#6b6f7e',
          stone: '#8e91a0',
          hairline: '#e0e2e8',
          'hairline-strong': '#c7cad5',
          ink: '#1c1c1e',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
