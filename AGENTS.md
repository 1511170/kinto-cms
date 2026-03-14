# AGENTS.md — Inicio Rápido para Cualquier IA

> **Para:** Claude Code, Kimi Code, Cursor, o cualquier IA agente

## Contexto Inmediato

- **Sistema:** KINTO CMS — Generador de sitios estáticos con arquitectura de skills
- **Stack:** Astro 5 + Tailwind CSS 4 + Sveltia CMS
- **Sitio activo:** `sites/globaldreamers/` — Agencia de estudios internacionales para latinoamericanos
- **Dominio:** globaldreamers.com | CMS (oculto): glo.kinto.info/admin
- **Estado:** Sitio en desarrollo con home completo y sistema de destinos funcionando

---

## Lee esto primero

**Lee `CLAUDE.md`** — tiene el contexto completo del proyecto, lo que ya está construido, convenciones CSS, interfaz de datos, y pendientes.

```bash
cat CLAUDE.md
```

---

## Lo que ya existe (no recrear)

### Sitio `sites/globaldreamers/`
- `src/layouts/Layout.astro` — Layout con SEO, OG, Twitter Cards, AI Citations
- `src/pages/index.astro` — Home completo (Navbar + Hero + Partners + WhyUs + HowItWorks + Destinations + CTABanner + Footer)
- `src/pages/estudiar-en-[country].astro` — Ruta dinámica data-driven para todos los destinos
- `src/pages/estudiar-en-australia.astro` — Página estática de Australia (puede eliminar si el template dinámico cubre)
- `src/data/destinations.ts` — Datos de destinos con interfaz `DestinationData`
- `src/components/` — Navbar, Hero, Partners, WhyUs, HowItWorks, Destinations, CTABanner, Footer
- `config/site.config.ts` — Config completa del sitio (dominio, CMS, build)

---

## Flujo de trabajo

### Paso 1: Orientarte
```bash
# Ver qué hay en el sitio activo
ls sites/globaldreamers/src/pages/
ls sites/globaldreamers/src/components/

# Ver skills instaladas
cat sites/globaldreamers/skills-active.json

# Ver skills disponibles
cd sites/globaldreamers && node scripts/skill-list.js
```

### Paso 2: Instalar skills si se necesitan
```bash
cd sites/globaldreamers
node scripts/skill-add.js seo-ai-citations   # Para Schema.org
node scripts/skill-add.js cms-sveltia        # Para panel de admin
node scripts/skill-add.js testimonials       # Para testimonios
```

### Paso 3: Trabajar en el código
- Editar páginas en `src/pages/`
- Editar componentes en `src/components/`
- Agregar datos de destinos en `src/data/destinations.ts`
- NUNCA copiar código entre sitios — crear skills reutilizables si hace falta

### Paso 4: Verificar
```bash
cd sites/globaldreamers
npm run build    # debe pasar sin errores
```

---

## Pendientes prioritarios

| Tarea | Dónde |
|-------|-------|
| Agregar Schema.org structured data | Instalar `seo-ai-citations` |
| `public/llms.txt` para AI Citations | `sites/globaldreamers/public/` |
| `public/og-image.png` (1200×630) | `sites/globaldreamers/public/` |
| `public/logo.svg` y `public/favicon.ico` | `sites/globaldreamers/public/` |
| Completar datos restantes en `destinations.ts` | `src/data/destinations.ts` |
| Páginas: Nosotros, Blog, Contacto | `src/pages/` |
| Configurar CMS con Sveltia | Instalar `cms-sveltia` |
| Deploy Cloudflare Pages | Instalar `cloudflare-pages` |

---

## Estructura importante

```
globaldreamers/                  ← raíz del repo
├── CLAUDE.md                    # ← Contexto completo (léelo)
├── KINTO.md                     # Guía del sistema
├── SKILLS_CATALOG.md            # Catálogo de 14 skills disponibles
├── STRUCTURE.md                 # Arquitectura del sistema
├── sites/
│   └── globaldreamers/          # ← Trabajas aquí
│       ├── KINTO.md             # Brief del cliente
│       ├── config/site.config.ts
│       ├── src/pages/           # Páginas Astro
│       ├── src/components/      # Componentes del sitio
│       ├── src/data/            # destinations.ts y otros datos
│       └── skills-active.json
└── skills/
    ├── official/                # cms-sveltia, kinto-cms
    └── community/               # 12 skills comunitarias
```

---

## Convenciones CSS / Tailwind

- Color de marca: `brand-600` (variantes: `brand-50`, `brand-100`, `brand-700`)
- Fuente heading: `font-display` → Montserrat (700/800)
- Fuente body: Open Sans (400/600/700) — default
- Blob decorativo: clase `.blob`
- Gradiente de texto: clase `.text-gradient`
- Animación lenta: `.animate-bounce-slow`
- WhatsApp links: `https://wa.me/?text=` + mensaje URL-encoded
- Imágenes Unsplash: `?w=400&h=400&fit=crop&q=80`

---

**TL;DR:** Lee `CLAUDE.md`, ve a `sites/globaldreamers`, revisa qué ya está hecho, instala skills si hacen falta, y trabaja sobre lo existente.
