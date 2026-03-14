/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#694796',
        'background-light': '#ffffff',
        'background-dark': '#18151d',
        brand: {
          50:  '#f5f3f9',
          100: '#ede9f5',
          200: '#ddd6ed',
          300: '#c4b5e0',
          400: '#a78bd0',
          500: '#8b5cc0',
          600: '#694796',
          700: '#5a3d80',
          800: '#4b3369',
          900: '#3c2952',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
    },
  },
}
