# CLAUDE.md — Contexto Completo del Proyecto KINTO CMS / Global Dreamers

## Qué es este repositorio

**KINTO CMS** — Generador de sitios estáticos empresariales con arquitectura de skills/plugins bajo demanda.

- **Raíz:** `C:\Users\camilo\DEVS\globaldreamers`
- **Stack:** Astro 5 (SSG) + Tailwind CSS 4 + Sveltia CMS
- **Deploy:** Cloudflare Pages
- **CLI:** `kinto.js` (en la raíz)

---

## Arquitectura del sistema

```
globaldreamers/           ← raíz del repo
├── core/                 # Motor mínimo Astro + Tailwind (NO tocar)
├── skills/
│   ├── official/         # cms-sveltia, kinto-cms
│   └── community/        # blog, contact-form, forms-web3forms, testimonials,
│                         # cloudflare-tunnel, cloudflare-pages, web-scraper,
│                         # browser-automation, image-optimizer, seo-ai-citations,
│                         # webflow-effects, webflow-migration, i18n
├── sites/
│   └── globaldreamers/   # ← Sitio activo del cliente
├── templates/
│   └── enterprise/       # Template base para nuevos sitios
└── docs/                 # AI_GENERATION.md, TAREAS_MEJORA_TECNICAS.md, etc.
```

---

## Sitio activo: Global Dreamers (`sites/globaldreamers/`)

**Cliente:** Global Dreamers — Agencia de estudios internacionales para latinoamericanos.
**Dominio:** globaldreamers.com
**CMS (oculto):** glo.kinto.info/admin (no enlazado públicamente)

### Stack del sitio
- Astro 5 (SSG, output: static)
- Tailwind CSS 4
- Fuentes: Montserrat (display/headings) + Open Sans (body) via Google Fonts
- Color brand: `brand-600` (definido en global.css como variable Tailwind)

### Estructura del sitio
```
sites/globaldreamers/
├── config/
│   └── site.config.ts         # Dominio, CMS config, build settings
├── src/
│   ├── layouts/
│   │   └── Layout.astro       # Layout base con SEO completo
│   ├── pages/
│   │   ├── index.astro                    # Página principal (Home)
│   │   ├── estudiar-en-australia.astro    # Página estática de Australia
│   │   └── estudiar-en-[country].astro    # Ruta dinámica para todos los destinos
│   ├── components/
│   │   ├── Navbar.astro        # Header fijo con dropdown de destinos
│   │   ├── Hero.astro          # Hero principal del home
│   │   ├── Partners.astro      # Logos de partners
│   │   ├── WhyUs.astro         # Razones para elegir GD
│   │   ├── HowItWorks.astro    # Proceso paso a paso
│   │   ├── Destinations.astro  # Grid de destinos disponibles
│   │   ├── CTABanner.astro     # Banda de CTA final
│   │   └── Footer.astro        # Pie de página
│   ├── data/
│   │   └── destinations.ts     # Datos de todos los destinos (data-driven)
│   ├── styles/
│   │   └── global.css          # Estilos globales + variables de marca
│   └── content.config.ts       # Configuración de colecciones de contenido
├── public/
│   └── robots.txt
└── skills-active.json          # Skills instaladas (actualmente vacío)
```

### Config del sitio (`config/site.config.ts`)
```typescript
{
  site: {
    domain: 'globaldreamers.com',
    name: 'Global Dreamers',
    description: 'Agencia de estudios internacionales...',
    language: 'es',
    logo: '/logo.svg',
    favicon: '/favicon.ico'
  },
  cms: {
    enabled: true,
    subdomain: 'glo.kinto.info',
    hidden: true,
    githubRepo: 'kinto-cms/globaldreamers-content',
    authEndpoint: 'https://glo-auth.kinto.workers.dev'
  },
  build: { output: 'static', compressHTML: true, inlineStylesheets: 'auto' }
}
```

---

## Lo que se ha construido (trabajo ya hecho)

### Layout base (`src/layouts/Layout.astro`)
- SEO completo: title, description, canonical, robots
- Open Graph (og:type, og:title, og:description, og:url, og:image, og:locale)
- Twitter Cards (summary_large_image)
- AI Citations: `<link rel="alternate" type="text/plain" href="/llms.txt" />`
- Google Fonts: Montserrat + Open Sans
- Slot `name="head"` para que skills inyecten schemas/scripts

### Home (`src/pages/index.astro`)
Componentes en orden: Navbar → Hero → Partners → WhyUs → HowItWorks → Destinations → CTABanner → Footer

### Navbar (`src/components/Navbar.astro`)
- Header fijo (`fixed top-0`), backdrop-blur, shadow
- Logo GlobalDreamers con ícono SVG de globo
- Desktop: Links + dropdown "Destinos" con grid 2 columnas (11 países con flags)
- Mobile: Hamburger menu + accordion de destinos
- CTA botón: "Agenda GRATIS" → `#contacto`
- Destinos en navbar: Australia, Canadá, Malta, Dubai, Reino Unido, Nueva Zelanda, Irlanda, España, Alemania, Italia, Estados Unidos

### Sistema de destinos (data-driven)
- **`src/data/destinations.ts`** — Archivo maestro con interfaz `DestinationData` y array `destinations[]`
- **`estudiar-en-[country].astro`** — Ruta dinámica que consume `destinations` via `getStaticPaths()`
- **`estudiar-en-australia.astro`** — Página estática de Australia (creada antes del template dinámico, puede coexistir o eliminarse)

### Estructura de cada página de destino (10 secciones)
1. **Hero** — Imagen de fondo con overlay oscuro, badge, H1, CTA principal + secundario, stats
2. **¿Te identificas con esto?** — 3 pain points con iconos (miedo visa, soledad, costos)
3. **¿Por qué [País]?** — Grid de beneficios con iconos y border de colores
4. **Ciudades disponibles** — Grid circular con imágenes y subtítulo "para..."
5. **Inversión estimada** — Tabla de costos con total al final
6. **FAQ** — `<details>` accordion nativo, sin JS externo
7. **CTA final** — Sección con color brand, enlace a WhatsApp con mensaje pre-llenado

### Interfaz `DestinationData` (campos clave)
```typescript
interface DestinationData {
  country: string;           // slug URL (e.g. 'canada')
  name: string;              // nombre display
  flag: string;              // emoji
  heroBg: string;            // URL imagen unsplash
  heroTitle: string;         // usa '—' para split en dos líneas con gradiente
  heroSubtitle: string;
  heroBadge: string;
  heroStats: string;
  heroSecondaryBtn: string;
  painPoints: Array<{...}>;
  benefits: Array<{...}>;
  cities: Array<{ name, image, para }>;
  investmentRows: Array<{ concept, cost }>;
  investmentTotal: string;
  investmentCurrencyNote: string;
  faqs: Array<{ q, a }>;
  ctaTitle: string;
  ctaSubtext: string;
  whatsappMsg: string;       // mensaje URL-encoded para wa.me
  seoTitle: string;
  seoDescription: string;
  canonical: string;
}
```

---

## Convenciones del proyecto

### CSS / Tailwind
- Color de marca: `brand-600` (y variantes: `brand-50`, `brand-100`, `brand-700`)
- Fuente display (headings): clase `font-display` → Montserrat
- Fuente body: Open Sans (default)
- Blob decorativo: clase `.blob` (círculo blur de fondo)
- Gradiente de texto: clase `.text-gradient`
- Animación: `.animate-bounce-slow` para scroll indicator

### Componentes
- Sin frameworks JS (React/Vue/Svelte) — todo Astro puro
- Interactividad mínima con `<script>` inline en el mismo `.astro`
- Imágenes de Unsplash con query params `?w=&h=&fit=crop&q=80`
- WhatsApp links: `https://wa.me/?text=` + mensaje URL-encoded

### Páginas de destino
- URL pattern: `/estudiar-en-[country]` (slug en español, sin acento, ej. `espana`)
- SEO: título propio por destino, description única, canonical propio
- Schema.org: pendiente de agregar (skill `seo-ai-citations` no instalada aún)

---

## Skills disponibles (14 total)

| Skill | Categoría | Descripción |
|-------|-----------|-------------|
| `cms-sveltia` | official | Panel admin Git-based con Sveltia CMS |
| `kinto-cms` | official | CMS ligero basado en JSON |
| `blog` | community | Blog con schema.org |
| `contact-form` | community | Formulario con validación |
| `forms-web3forms` | community | Formularios sin backend |
| `testimonials` | community | Testimonios con schema.org Review |
| `cloudflare-pages` | community | Deploy a Cloudflare Pages |
| `cloudflare-tunnel` | community | Túneles permanentes |
| `web-scraper` | community | Scraping con Puppeteer + Cheerio |
| `browser-automation` | community | Testing visual con Puppeteer |
| `image-optimizer` | community | Conversión WebP/AVIF + srcsets |
| `seo-ai-citations` | community | Schema.org completo + llms.txt |
| `webflow-effects` | community | GSAP animations premium |
| `webflow-migration` | community | Migrar sitios Webflow a Astro |
| `i18n` | community | Internacionalización por URL |

### Comandos de skills
```bash
cd sites/globaldreamers
node scripts/skill-list.js          # Ver skills disponibles
node scripts/skill-add.js <name>    # Instalar skill
node scripts/skill-create.js <name> # Crear nueva skill
```

---

## Comandos de desarrollo

```bash
# Desde sites/globaldreamers/
npm install
npm run dev        # Dev server en localhost:4321
npm run build      # Build estático
npm run preview    # Preview del build
```

---

## Pendientes / Próximos pasos

- [ ] Skills activas: `skills-active.json` sigue vacío (placeholders)
- [ ] Agregar Schema.org structured data (instalar `seo-ai-citations`)
- [ ] `public/llms.txt` — archivo para AI Citations
- [ ] `public/og-image.png` — imagen Open Graph default
- [ ] `public/logo.svg` y `public/favicon.ico`
- [ ] Páginas: Nosotros, Blog, Contacto
- [ ] CMS configurado con Sveltia para que cliente edite contenido
- [ ] Completar datos de todos los destinos en `destinations.ts`
- [ ] Deploy en Cloudflare Pages

---

## Principios clave del sistema KINTO

1. **Core mínimo** — zero skills por defecto
2. **Skills bajo demanda** — instalar solo lo necesario via `node scripts/skill-add.js`
3. **Nunca copiar código entre sitios** — crear skills reutilizables
4. **CMS oculto** — no enlazado públicamente desde el sitio
5. **100% estático (SSG)** — sin server-side rendering
6. **Lighthouse 95+** — Core Web Vitals en todos los sitios
