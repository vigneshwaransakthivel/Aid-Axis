/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f7f5',
          100: '#ccefeb',
          200: '#99dfd7',
          300: '#66cfc3',
          400: '#33bfaf',
          500: '#0d9488',
          600: '#0a756d',
          700: '#085752',
          800: '#053a36',
          900: '#031d1b',
        },
        teal: {
          DEFAULT: '#0d9488',
          dark: '#0a756d',
        }
      }
    },
  },
  plugins: [],
}
