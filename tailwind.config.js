/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'fp-orange': '#F5A623',
        'fp-orange-deep': '#E88D1F',
        'fp-pink': '#D94A8C',
        'fp-magenta': '#D4145A',
        'fp-pink-electric': '#E91E8C',
        'fp-purple': '#4A1A6B',
        'fp-dark': '#1A1A2E',
      },
      fontFamily: {
        'display': ['Dela Gothic One', 'cursive'],
        'body': ['Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-fp': 'linear-gradient(135deg, #F5A623 0%, #D4145A 100%)',
        'gradient-fp-reverse': 'linear-gradient(135deg, #D4145A 0%, #F5A623 100%)',
        'gradient-fp-horizontal': 'linear-gradient(90deg, #F5A623 0%, #D4145A 100%)',
      },
    },
  },
  plugins: [],
}
