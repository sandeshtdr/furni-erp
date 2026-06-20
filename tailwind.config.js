/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0D1F3C',
        navyMid: '#1A3259',
        teal: '#0A8A7D',
        tealLt: '#12B5A5',
        amber: '#E07B39',
        coral: '#D94F3B',
        green: '#2A9D5C',
        purple: '#5B4FCF',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
