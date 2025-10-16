/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'fleur-dark': '#120d0a',
        'fleur-glass': 'rgba(255, 255, 255, 0.08)',
        'fleur-glass-hover': 'rgba(255, 255, 255, 0.12)',
        'fleur-border': 'rgba(255, 255, 255, 0.20)',
        'fleur-border-strong': 'rgba(255, 255, 255, 0.35)',
      },
      backgroundImage: {
        'gradient-glass': 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
    },
  },
  plugins: [],
}

