/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#46ec13',
        'background-light': '#f6f8f6',
        'background-dark': '#142210',
        'surface-dark': '#1c2e17',
        'border-dark': '#2c4823',
        'text-muted': '#9fc992',
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '2rem',
        xl: '3rem',
      },
    },
  },
  plugins: [],
}

