/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gammon-primary': '#8B4513',
        'gammon-secondary': '#D2691E',
        'gammon-board': '#DEB887',
        'gammon-dark': '#654321',
        'gammon-light': '#F5DEB3',
        'gammon-white': '#FFFFFF',
        'gammon-black': '#000000',
      },
      fontFamily: {
        'gammon': ['Georgia', 'serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
      },
      boxShadow: {
        'gammon': '0 4px 6px -1px rgba(139, 69, 19, 0.3), 0 2px 4px -1px rgba(139, 69, 19, 0.2)',
      },
    },
  },
  plugins: [],
}
