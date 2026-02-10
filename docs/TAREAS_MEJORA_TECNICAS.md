# 🔧 Tareas de Mejora Técnicas - Post Simulación

> Lista específica de cambios de código a realizar en el sistema KINTO CMS

---

## 🔴 CRÍTICO - Arreglar Template Base

### 1. Fix `astro.config.mjs` en Template

**Archivo:** `templates/enterprise/astro.config.mjs`

```javascript
// ❌ ACTUAL (problemático)
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
// ...
const activeSkills = JSON.parse(
  require('fs').readFileSync('./skills-active.json', 'utf-8')
).skills;

// ✅ CORREGIDO
import { defineConfig } from 'astro/config';
import fs from 'fs';
import siteConfig from './config/site.config.ts';

const activeSkills = JSON.parse(
  fs.readFileSync('./skills-active.json', 'utf-8')
).skills;

export default defineConfig({
  output: 'static',
  site: `https://${siteConfig.site.domain}`,
  integrations: [], // Sin @astrojs/tailwind para Tailwind 4
  vite: {
    resolve: {
      alias: {
        '@skills': new URL('../../skills', import.meta.url).pathname,
        '@site': new URL('./src', import.meta.url).pathname,
        '@config': new URL('./config', import.meta.url).pathname,
      }
    }
  }
});
```

---

### 2. Agregar PostCSS Config para Tailwind 4

**Archivo nuevo:** `templates/enterprise/postcss.config.mjs`

```javascript
import tailwindcss from '@tailwindcss/postcss';

export default {
  plugins: [tailwindcss()]
};
```

---

### 3. Actualizar `package.json` del Template

**Archivo:** `templates/enterprise/package.json`

```json
{
  "dependencies": {
    "astro": "^5.0.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "tailwindcss": "^4.0.0"
  },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "validate": "astro check && npm run build"
  }
}
```

**Nota:** Remover `@astrojs/tailwind` de las dependencias.

---

## 🟡 IMPORTANTE - Mejorar Skills

### 4. Fix `skill-create.js` - Generar Exports Correctos

**Archivo:** `templates/enterprise/scripts/skill-create.js`

Agregar al template de `index.ts` generado:

```typescript
// Al crear una skill, generar esto automáticamente:

// Exportar componentes (AGREGAR ESTO)
export { default as ComponentName } from './components/ComponentName.astro';

// Resto del código existente...
export const config = { ... };
export function install(context) { ... }
```

**Lógica:** Detectar archivos `.astro` en `components/` y generar exports automáticamente.

---

### 5. Crear Skill `contact-form` Pre-implementada

**Estructura:** `skills/community/contact-form/`

```
contact-form/
├── SKILL.md
├── index.ts
├── components/
│   └── ContactForm.astro
└── config/
    └── cms-fields.yml
```

**`ContactForm.astro`** - Componente funcional mínimo:

```astro
---
interface Props {
  title?: string;
  submitLabel?: string;
}
const { title = "Contáctanos", submitLabel = "Enviar" } = Astro.props;
---

<form class="space-y-6" action="/api/contact" method="POST">
  {title && <h3 class="text-xl font-semibold mb-4">{title}</h3>}
  
  <div class="grid md:grid-cols-2 gap-4">
    <input 
      type="text" name="name" placeholder="Nombre" required
      class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-500"
    />
    <input 
      type="email" name="email" placeholder="Email" required
      class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-500"
    />
  </div>
  
  <textarea 
    name="message" rows="5" placeholder="Mensaje" required
    class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-500"
  ></textarea>
  
  <button 
    type="submit"
    class="px-8 py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700"
  >
    {submitLabel}
  </button>
</form>
```

---

### 6. Crear Skill `blog` Pre-implementada

**Incluir:**
- `BlogList.astro` - Listado de posts
- `BlogPost.astro` - Post individual
- `BlogCard.astro` - Card para previews
- CMS fields para posts (título, slug, contenido, fecha, autor, imagen)

---

## 🟢 MEJORAS - Developer Experience

### 7. Agregar `content.config.ts`

**Archivo nuevo:** `templates/enterprise/src/content.config.ts`

```typescript
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    author: z.string(),
    excerpt: z.string(),
    category: z.string(),
    published: z.boolean().default(true),
  }),
});

const testimonials = defineCollection({
  type: 'data',
  schema: z.object({
    author: z.string(),
    company: z.string().optional(),
    quote: z.string(),
    rating: z.number().min(1).max(5).default(5),
    published: z.boolean().default(true),
  }),
});

export const collections = { blog, testimonials };
```

---

### 8. Actualizar `skill-add.js` con Validación

**Mejora:** Verificar que la skill existe antes de intentar instalarla.

```javascript
// En skill-add.js
const skillPath = path.join(__dirname, '../../skills', category, skillName);

if (!fs.existsSync(skillPath)) {
  console.error(`❌ Skill "${skillName}" no encontrada en skills/${category}/`);
  console.log('\nSkills disponibles:');
  // Listar disponibles...
  process.exit(1);
}
```

---

### 9. Agregar Script de Validación

**Archivo nuevo:** `templates/enterprise/scripts/validate.js`

```javascript
#!/usr/bin/env node
/**
 * validate.js - Verifica que el sitio está correctamente configurado
 */

import fs from 'fs';
import { execSync } from 'child_process';

const checks = [
  {
    name: 'skills-active.json existe',
    test: () => fs.existsSync('./skills-active.json')
  },
  {
    name: 'site.config.ts válido',
    test: () => {
      try {
        import('../config/site.config.ts');
        return true;
      } catch {
        return false;
      }
    }
  },
  {
    name: 'Dependencias instaladas',
    test: () => fs.existsSync('./node_modules')
  },
  {
    name: 'Build funciona',
    test: () => {
      try {
        execSync('npm run build', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    }
  }
];

console.log('🔍 Validando configuración...\n');

for (const check of checks) {
  const result = check.test();
  console.log(`${result ? '✅' : '❌'} ${check.name}`);
}
```

---

## 📋 Checklist de Implementación

### Fase 1: Template Base (Est: 2 horas)
- [ ] Fix `astro.config.mjs` - ES modules + alias
- [ ] Agregar `postcss.config.mjs` para Tailwind 4
- [ ] Actualizar `package.json` - dependencias correctas
- [ ] Test: `npm install && npm run build` debe funcionar sin errores

### Fase 2: Skills System (Est: 3 horas)
- [ ] Fix `skill-create.js` - generar exports de componentes
- [ ] Crear skill `contact-form` pre-implementada
- [ ] Crear skill `blog` pre-implementada
- [ ] Agregar `content.config.ts` al template

### Fase 3: Developer Experience (Est: 2 horas)
- [ ] Agregar validaciones en `skill-add.js`
- [ ] Crear script `validate.js`
- [ ] Agregar tests de build en CI
- [ ] Documentar alias `@skills/*` y `@site/*`

### Fase 4: Testing (Est: 1 hora)
- [ ] Hacer simulación con nuevo template
- [ ] Verificar que build funcione sin errores
- [ ] Medir tiempo de generación de sitio

**Total estimado:** 8 horas de trabajo

---

## 🎯 Métricas de Éxito

Después de aplicar estas mejoras:

| Métrica | Antes | Después (target) |
|---------|-------|------------------|
| Tiempo generación sitio | 45 min | 15 min |
| Errores en build | 7 | 0 |
| Comandos adicionales | `--legacy-peer-deps` | Ninguno |
| Skills reutilizables | 0 | 4+ |
| IA puede usar sin ayuda | ⚠️ Con dificultad | ✅ Sí |

---

## 📁 Archivos a Modificar/Crear

### Modificar existentes:
1. `templates/enterprise/astro.config.mjs`
2. `templates/enterprise/package.json`
3. `templates/enterprise/scripts/skill-create.js`
4. `templates/enterprise/scripts/skill-add.js`
5. `templates/enterprise/tailwind.config.mjs` (si es necesario)

### Crear nuevos:
1. `templates/enterprise/postcss.config.mjs`
2. `templates/enterprise/src/content.config.ts`
3. `templates/enterprise/scripts/validate.js`
4. `skills/community/contact-form/` (skill completa)
5. `skills/community/blog/` (skill completa)

---

**Generado por:** Kimi (coder)  
**Basado en feedback de:** Simulación Kimitest  
**Prioridad:** CRÍTICO para próximos usuarios/IA
