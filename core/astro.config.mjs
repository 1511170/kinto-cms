import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

// Core config - mínimo, sin skills activas por defecto
export default defineConfig({
  output: "static",
  integrations: [tailwind()],
  build: {
    format: "directory",
  },
  compressHTML: true,
  // Site config se inyecta desde el sitio específico
  site: process.env.SITE_URL || "http://localhost:4321",
});
