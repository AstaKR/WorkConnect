/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        accent: 'var(--color-accent)',
        sidebar: 'var(--color-sidebar)',
        background: 'var(--color-background)',
      },
    },
  },
  plugins: [],
}
