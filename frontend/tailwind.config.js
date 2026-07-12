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
        // Premium Academic Theme Color Palette (Harmony of Navy, Slate, and Indigo)
        primary: {
          50: '#f4f6fa',
          100: '#e9edf5',
          200: '#ccd8eb',
          300: '#9fb6db',
          400: '#6b8fc5',
          500: '#476fae',
          600: '#355691',
          700: '#2c4677',
          800: '#273c64',
          900: '#233454',
          950: '#151e33',
        },
        accent: {
          50: '#faf6f0',
          100: '#f3eade',
          200: '#e5d1bd',
          300: '#d3b295',
          400: '#be8f6d',
          500: '#ad7251',
          600: '#9d6044',
          700: '#834c37',
          800: '#6a3e30',
          900: '#563329',
          950: '#2e1914',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        serif: ['Lora', 'Merriweather', 'serif'],
      },
    },
  },
  plugins: [],
}
