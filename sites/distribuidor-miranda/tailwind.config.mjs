/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
    // Skills activas añaden sus paths aquí
  ],
  theme: {
    extend: {
      // Colores de marca — personalizar en cada sitio
      colors: {
        brand: {
          50: 'var(--brand-50, #f8fafc)',
          100: 'var(--brand-100, #f1f5f9)',
          200: 'var(--brand-200, #e2e8f0)',
          500: 'var(--brand-500, #64748b)',
          600: 'var(--brand-600, #475569)',
          700: 'var(--brand-700, #334155)',
          800: 'var(--brand-800, #1e293b)',
          900: 'var(--brand-900, #0f172a)',
        }
      },
      fontFamily: {
        sans: ['var(--font-sans, system-ui)', 'sans-serif'],
        display: ['var(--font-display, system-ui)', 'sans-serif'],
      },
    },
  },
}
