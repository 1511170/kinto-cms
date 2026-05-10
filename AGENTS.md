# 🤖 AGENTS.md — Guía Maestra para Agentes de Código

> **Para:** Kimi Code, Claude Code, Qwen Code, Cursor, GitHub Copilot, o cualquier agente de código.
> **Versión:** 2.0.0
> **Última actualización:** 2026-05-09

---

## 🎯 Contexto Inmediato (Leer Esto Primero)

| Campo | Valor |
|-------|-------|
| **Sistema** | KINTO CMS — Generador de sitios estáticos con arquitectura de skills |
| **Stack** | Astro 5 + Tailwind 3 + Sveltia CMS |
| **Patrón** | Core mínimo + Skills bajo demanda |
| **Estado repo** | Core limpio. Sin sitios creados. |

**Tu misión:** Crear sitios web para clientes usando solo skills reutilizables. Nunca escribas código ad-hoc si existe o puedes crear una skill.

---

## ⚡ Comandos Esenciales

### Crear un nuevo sitio para cliente
```bash
./kinto create-site nombre-cliente
cd sites/nombre-cliente
```

### Ver e instalar skills
```bash
node scripts/skill-list.js          # Ver disponibles
node scripts/skill-add.js cms-sveltia   # Instalar una
node scripts/skill-create.js mi-skill   # Crear nueva skill
```

### Desarrollo y verificación
```bash
npm install
npm run dev        # localhost:4321
npm run build      # MUST pass before finishing
npm run preview    # MUST verify visually before finishing
```

---

## 🧠 Principios de Oro (Boris-Style, Adaptados)

### 1. Planifica Antes de Tocar 3+ Archivos
Si vas a modificar más de 2 archivos, crea un plan escrito primero:
- ¿Cuál es el objetivo?
- ¿Qué archivos tocarás?
- ¿Qué skill(s) usarás o crearás?
- ¿Cómo verificarás que funciona?

**No ejecutes hasta tener un plan aprobado (implícita o explícitamente).**

### 2. Verificación es Todo
> *"Si el agente tiene un loop de feedback, la calidad mejora 2-3x"*

Después de **cada cambio significativo**:
1. `npm run build` → ¿pasa sin errores?
2. `npm run preview` → ¿se ve y funciona correctamente?
3. ¿Los links funcionan? ¿No hay 404s?
4. ¿El CMS está accesible si aplica?

### 3. Skills > Código Ad-Hoc
- Si existe una skill similar en `skills/` → **ÚSALA**
- Si no existe → **CREA una skill reutilizable** en `skills/community/`
- NUNCA copies componentes entre sitios. Extrae a skill.

### 4. Zero Hardcode
- NUNCA valores específicos de cliente en código de skill
- Usa `config/site.config.ts` para valores por sitio
- Usa variables de entorno para secrets (`.env`, nunca commitear)

### 5. Documentación Viva
Si haces algo incorrecto y luego lo corriges, **actualiza este AGENTS.md** para que no vuelva a pasar. Agrega la regla en la sección "Anti-Patrones".

---

## 📁 Estructura del Proyecto

```
kinto-cms/
├── AGENTS.md                 ← Estás aquí (guía para cualquier agente)
├── KINTO.md                  ← Guía completa del sistema (léela si es tu primera vez)
├── STRUCTURE.md              ← Arquitectura detallada
│
├── core/                     ← 🚫 NO TOCAR. Motor base Astro + Tailwind
│   ├── src/layouts/Layout.astro
│   └── src/utils/skill-loader.ts
│
├── skills/                   ← 🧩 Marketplace de skills
│   ├── official/             ← Skills mantenidas (cms-sveltia, etc.)
│   └── community/            ← Skills creadas por IA (testimonials, etc.)
│       └── [skill-name]/
│           ├── SKILL.md      ← Documentación de la skill
│           ├── index.ts      ← Entry point
│           ├── components/   ← Componentes Astro
│           └── config/       ← Config CMS si aplica
│
├── sites/                    ← 🌐 Sitios de clientes (vacío en repo base)
│   └── [nombre-cliente]/     ← Creado con ./kinto create-site
│       ├── src/pages/        ← Páginas Astro
│       ├── config/
│       │   ├── site.config.ts    ← Config por sitio (dominio, CMS, branding)
│       │   └── cms.config.yml    ← Config Sveltia
│       ├── scripts/
│       │   ├── skill-add.js
│       │   ├── skill-create.js
│       │   └── skill-list.js
│       ├── skills-active.json    ← Skills instaladas en este sitio
│       └── KINTO.md              ← Brief del cliente (si existe)
│
├── templates/
│   └── enterprise/           ← Template base para nuevos sitios
│
└── .claude/                  ← Config específica de Claude Code (si aplica)
    ├── agents/               ← Subagentes especializados
    ├── commands/             ← Slash commands
    └── settings.json         ← Hooks y settings
```

---

## 🔧 Workflow Detallado

### Paso 1: Crear Sitio
```bash
./kinto create-site nombre-cliente
cd sites/nombre-cliente
```

### Paso 2: Analizar Brief
Si existe `sites/[cliente]/KINTO.md`, léelo. Es el brief del cliente.

### Paso 3: Revisar Skills Existentes
```bash
node scripts/skill-list.js
```

Skills disponibles actualmente:
- ✅ `cms-sveltia` — Panel admin para el cliente
- ✅ `testimonials` — Testimonios con schema.org
- ✅ `seo-ai-citations` — SEO + schema.org
- ✅ `i18n` — Internacionalización

### Paso 4: Instalar Skills Necesarias
```bash
node scripts/skill-add.js cms-sveltia
node scripts/skill-add.js testimonials
# ... según el brief
```

### Paso 5: Generar Contenido
Editar `src/pages/index.astro` y páginas adicionales usando componentes de skills.

```astro
---
import { TestimonialsGrid } from '../../../skills/community/testimonials/index.ts';
---

<TestimonialsGrid category="default" max={6} />
```

### Paso 6: Si Falta una Skill, Crearla
```bash
node scripts/skill-create.js mi-nueva-skill
```

Esto crea:
```
skills/community/mi-nueva-skill/
├── SKILL.md              # Qué hace, cómo usar, props
├── index.ts              # Entry point + install function
├── components/           # Componentes Astro
└── config/               # Config CMS si aplica
```

**Reglas para crear skills:**
1. Debe ser **reutilizable** en otros sitios
2. Documentar en `SKILL.md` con tabla de props
3. Exportar componentes en `index.ts`
4. Usar `schema.org` si aplica (SEO)
5. Usar Tailwind utility classes, no CSS custom

### Paso 7: Verificar y Entregar
- [ ] Todas las skills necesarias en `skills-active.json`
- [ ] CMS configurado en `config/site.config.ts`
- [ ] Schema.org en lugares relevantes
- [ ] Imágenes optimizadas en `public/`
- [ ] **Build exitoso:** `npm run build`
- [ ] **Preview funciona:** `npm run preview`

---

## ✅ Patrones Correctos

### Importar una skill
```astro
---
import { Componente } from '../../../skills/community/[skill-name]/index.ts';
---
```

### Verificar si skill está activa
```typescript
import activeSkills from '../skills-active.json';
const hasSkill = activeSkills.skills.includes('testimonials');
```

### Config de sitio (site.config.ts)
```typescript
export default {
  site: 'https://cliente.com',
  cms: {
    enabled: true,
    subdomain: 'admin.cliente.com',
    hidden: true,
    githubRepo: 'org/repo'
  }
};
```

### CMS oculto
- Público: `tudominio.com`
- Admin: `admin.tudominio.com` (sin links públicos, acceso directo únicamente)

---

## ❌ Anti-Patrones (NO Hacer)

> **Regla:** Si descubres uno nuevo, agrégalo aquí.

| # | Anti-Patrón | Por qué está mal | Qué hacer en su lugar |
|---|-------------|------------------|----------------------|
| 1 | Hardcodear valores de cliente en skill | La skill deja de ser reutilizable | Usar `site.config.ts` o props |
| 2 | Copiar componentes entre sitios | Duplicación, imposible mantener | Extraer a `skills/community/` |
| 3 | Modificar `core/` directamente | Rompe todos los sitios | Crear una skill o sobreescribir en el sitio |
| 4 | Instalar skill sin necesidad | Bloat, más tiempo de build | Solo instalar lo que pida el brief |
| 5 | Olvidar `npm run build` antes de terminar | Errores en producción | Build + preview son obligatorios |
| 6 | Commitear `.env` o secrets | Riesgo de seguridad | Usar `.env.local` (ya en `.gitignore`) |
| 7 | Crear código ad-hoc sin considerar skill | Pérdida de reutilización | Preguntar: "¿Esto lo usaré en otro sitio?" |

---

## 🆘 ¿Atascado?

1. Ver skills disponibles: `node scripts/skill-list.js`
2. Ver config del sitio: `cat config/site.config.ts`
3. Ver skills activas: `cat skills-active.json`
4. Leer documentación: `cat KINTO.md` o `cat STRUCTURE.md`

---

## 🔗 Referencias

| Recurso | Ubicación | Para qué |
|---------|-----------|----------|
| Guía completa | `KINTO.md` | Entender el sistema a fondo |
| Arquitectura | `STRUCTURE.md` | Estructura de directorios y flujo de datos |
| Brief cliente | `sites/[nombre]/KINTO.md` | Requerimientos específicos del proyecto actual |
| Skill catalog | `SKILLS_CATALOG.md` | Lista de skills disponibles |

---

## 🚀 TL;DR — Inicio Rápido

```bash
# 1. Crear sitio
./kinto create-site mi-cliente && cd sites/mi-cliente

# 2. Ver skills
node scripts/skill-list.js

# 3. Instalar skills necesarias
node scripts/skill-add.js cms-sveltia

# 4. Generar páginas con componentes de skills

# 5. Verificar antes de entregar
npm run build && npm run preview
```

**Recuerda:** Planifica antes de tocar 3+ archivos. Verifica siempre. Skills > código ad-hoc.
