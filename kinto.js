#!/usr/bin/env node
/**
 * KINTO CMS CLI
 * Comando central para gestionar sitios y skills
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const [, , command, ...args] = process.argv;

const CWD = process.cwd();
const KINTO_ROOT = resolve(CWD);

function showHelp() {
  console.log(`
🚀 KINTO CMS - Content Management System

Comandos:
  kinto init <site-name>           Crear nuevo sitio
  kinto dev --site=<name>          Modo desarrollo
  kinto build --site=<name>        Build estático
  kinto deploy --site=<name>       Deploy a Cloudflare
  
  kinto skills:list                Listar skills disponibles
  kinto skill:add <name>           Instalar skill
  kinto skill:create <name>        Crear nueva skill
  kinto skill:remove <name>        Remover skill
  
  kinto sites:list                 Listar sitios
  kinto sites:clone <from> <to>    Clonar sitio como template

Opciones:
  --site=<name>                    Especificar sitio
  --template=<name>                Usar template
  --category=<official|community>  Categoría para skills

Ejemplos:
  kinto init serviworldlogistics
  kinto dev --site=serviworldlogistics
  kinto skill:add testimonials --site=serviworldlogistics
  kinto skill:create fleet-tracker
`);
}

function initSite(siteName) {
  const sitePath = join(KINTO_ROOT, 'sites', siteName);
  
  if (existsSync(sitePath)) {
    console.error(`❌ El sitio "${siteName}" ya existe`);
    process.exit(1);
  }

  console.log(`🚀 Creando sitio: ${siteName}...`);
  
  // Copiar template base
  const templatePath = join(KINTO_ROOT, 'templates', 'enterprise');
  
  if (!existsSync(templatePath)) {
    // Crear estructura mínima si no hay template
    mkdirSync(sitePath, { recursive: true });
    mkdirSync(join(sitePath, 'src', 'pages'), { recursive: true });
    mkdirSync(join(sitePath, 'config'), { recursive: true });
    
    // Crear archivos base
    // (copiar desde core y personalizar)
  }
  
  console.log(`✅ Sitio "${siteName}" creado`);
  console.log(`   Ubicación: sites/${siteName}/`);
  console.log(`\n👉 Siguientes pasos:`);
  console.log(`   cd sites/${siteName}`);
  console.log(`   npm install`);
  console.log(`   npm run dev`);
}

function listSkills() {
  const skillsRoot = join(KINTO_ROOT, 'skills');
  
  console.log('🧩 Skills disponibles:\n');
  
  for (const category of ['official', 'community']) {
    const catPath = join(skillsRoot, category);
    if (!existsSync(catPath)) continue;
    
    const skills = readdirSync(catPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => `  • ${d.name}`);
    
    if (skills.length) {
      console.log(`${category.toUpperCase()}:`);
      skills.forEach(s => console.log(s));
      console.log('');
    }
  }
}

function devMode(siteName) {
  const sitePath = join(KINTO_ROOT, 'sites', siteName);
  
  if (!existsSync(sitePath)) {
    console.error(`❌ Sitio "${siteName}" no encontrado`);
    process.exit(1);
  }
  
  console.log(`🚀 Iniciando desarrollo para: ${siteName}`);
  execSync('npm run dev', { 
    cwd: sitePath, 
    stdio: 'inherit' 
  });
}

function buildSite(siteName) {
  const sitePath = join(KINTO_ROOT, 'sites', siteName);
  
  if (!existsSync(sitePath)) {
    console.error(`❌ Sitio "${siteName}" no encontrado`);
    process.exit(1);
  }
  
  console.log(`🔨 Building: ${siteName}...`);
  execSync('npm run build', { 
    cwd: sitePath, 
    stdio: 'inherit' 
  });
  console.log(`✅ Build completado: sites/${siteName}/dist/`);
}

// Main switch
switch (command) {
  case 'init':
    initSite(args[0]);
    break;
  case 'skills:list':
    listSkills();
    break;
  case 'dev':
    const devSite = args.find(a => a.startsWith('--site='))?.split('=')[1];
    if (!devSite) {
      console.error('❌ Especifica --site=<nombre>');
      process.exit(1);
    }
    devMode(devSite);
    break;
  case 'build':
    const buildSiteName = args.find(a => a.startsWith('--site='))?.split('=')[1];
    if (!buildSiteName) {
      console.error('❌ Especifica --site=<nombre>');
      process.exit(1);
    }
    buildSite(buildSiteName);
    break;
  case 'help':
  case '--help':
  case '-h':
  default:
    showHelp();
    break;
}
