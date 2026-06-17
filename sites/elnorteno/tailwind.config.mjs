/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "var(--brand-50,  #f7f3ea)",
          100: "var(--brand-100, #ebe5d6)",
          200: "var(--brand-200, #d8d1bf)",
          300: "var(--brand-300, #c3bba4)",
          500: "var(--brand-500, #6b7368)",
          600: "var(--brand-600, #4a5248)",
          700: "var(--brand-700, #2b3a32)",
          800: "var(--brand-800, #1d2e25)",
          900: "var(--brand-900, #14201a)",
        },
        pine: { DEFAULT: "#1d2e25", 2: "#28412f" },
        terra: { DEFAULT: "#b85a2a", 2: "#d36a35" },
        sand: { DEFAULT: "#e9dfc7" },
        ink: { DEFAULT: "#14201a", 2: "#2b3a32" },
        slate: { DEFAULT: "#6b7368" },
        gold: { DEFAULT: "#c08a3a" },
      },
      fontFamily: {
        sans: ['"Manrope"', "system-ui", "sans-serif"],
        display: ['"Anton"', '"Archivo Black"', "Impact", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
    },
  },
};
