#!/usr/bin/env node
/**
 * Script: skill-add.js
 * Instala una skill en el sitio activo
 * 
 * Uso: node scripts/skill-add.js [skill-name]
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const skillName = process.argv[2];

if (!skillName) {
  console.error('❌ Error: Debes especificar el nombre de la skill');
  console.log('Uso: node scripts/skill-add.js [skill-name]');
  console.log('Ejemplo: node scripts/skill-add.js testimonials');
  process.exit(1);
}

const skillsRoot = resolve(process.cwd(), '../../skills');
const activeSkillsPath = join(process.cwd(), 'skills-active.json');

// Buscar skill en official/ y community/
let skillPath = null;
let skillCategory = null;

for (const category of ['official', 'community']) {
  const path = join(skillsRoot, category, skillName);
  if (existsSync(path)) {
    skillPath = path;
    skillCategory = category;
    break;
  }
}

if (!skillPath) {
  console.error(`❌ Skill "${skillName}" no encontrada`);
  console.log('\nSkills disponibles:');
  
  for (const category of ['official', 'community']) {
    const catPath = join(skillsRoot, category);
    if (!existsSync(catPath)) continue;
    
    const skills = readdirSync(catPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => `  - ${d.name} (${category})`);
    
    if (skills.length) {
      console.log(`\n${category}:`);
      skills.forEach(s => console.log(s));
    }
  }
  
  console.log(`\n💡 Para crear una nueva skill:`);
  console.log(`   node scripts/skill-create.js ${skillName}`);
  process.exit(1);
}

// Leer skills activas actuales
const config = JSON.parse(readFileSync(activeSkillsPath, 'utf-8'));

if (config.skills.includes(skillName)) {
  console.log(`⚠️  Skill "${skillName}" ya está instalada`);
  process.exit(0);
}

// Añadir skill
config.skills.push(skillName);
writeFileSync(activeSkillsPath, JSON.stringify(config, null, 2));

console.log(`✅ Skill "${skillName}" instalada`);
console.log(`   Categoría: ${skillCategory}`);
console.log(`   Ubicación: skills/${skillCategory}/${skillName}/`);
console.log(`\n📖 Documentación:`);
console.log(`   cat skills/${skillCategory}/${skillName}/SKILL.md`);
console.log(`\n🔄 Reinicia el servidor para aplicar cambios:`);
console.log(`   npm run dev`);
