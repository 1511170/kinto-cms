import { defineConfig } from 'astro/config';
import siteConfig from './config/site.config.ts';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Cargar skills activas
const activeSkills = JSON.parse(
  fs.readFileSync('./skills-active.json', 'utf-8')
).skills;

console.log('✅ Skills activas:', activeSkills.length ? activeSkills.join(', ') : 'Ninguna (core limpio)');

// https://astro.build/config
export default defineConfig({
  output: siteConfig.build.output,
  site: `https://${siteConfig.site.domain}`,
  
  // Sin integración @astrojs/tailwind - usamos PostCSS para Tailwind 4
  integrations: [],
  
  build: {
    format: 'directory',
    compressHTML: siteConfig.build.compressHTML
  },
  
  vite: {
    // Alias para skills - ¡USAR ESTOS EN LUGAR DE RUTAS RELATIVAS!
    resolve: {
      alias: {
        '@skills': join(__dirname, '../../skills'),
        '@skills-official': join(__dirname, '../../skills/official'),
        '@skills-community': join(__dirname, '../../skills/community'),
        '@site': join(__dirname, 'src'),
        '@components': join(__dirname, 'src/components'),
        '@layouts': join(__dirname, 'src/layouts'),
        '@config': join(__dirname, 'config'),
      }
    }
  }
});
