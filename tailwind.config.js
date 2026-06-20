/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Clean bold sans-serif to match printed Scrabble letter tiles.
        tile: ['"Helvetica Neue"', 'Arial', 'Liberation Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
