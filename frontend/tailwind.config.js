/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}', './lib/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Prompt', 'sans-serif'],
        brand: ['Playfair Display', 'serif'],
      },
      colors: {
        brand: {
          black: '#111111',
          charcoal: '#18181B',
          pinkLight: '#FDF2F8',
          pinkSoft: '#FCE7F3',
          pinkMedium: '#FBCFE8',
          pinkAccent: '#F472B6',
          pinkDark: '#DB2777',
        },
      },
    },
  },
  plugins: [],
};
