# 📚 Catálogo de Skills - KINTO CMS

> **Versión:** 2.1  
> **Última actualización:** 2026-02-26  
> **Total de skills disponibles:** 14

---

## 🏛️ Skills Oficiales

### `cms-sveltia`
Sistema de gestión de contenido basado en Git con Sveltia CMS.

---

### `kinto-cms`
Sistema de gestión de contenidos ligero basado en archivos JSON para sitios Astro.

**Instalación:**
```bash
node scripts/skill-add.js kinto-cms
```

**Scripts:**
- `create-collection.sh` - Crear nueva colección
- `add-content.sh` - Agregar contenido a colección

**Características:**
- ✅ Solo archivos JSON (sin DB externa)
- ✅ Type-safe con TypeScript
- ✅ Git-friendly (version control)
- ✅ Funciona en Cloudflare Pages
- ✅ Rápido (sin queries de DB)

**Instalación:**
```bash
node scripts/skill-add.js cms-sveltia
```

**Componentes:**
- `Admin.astro` - Panel de administración integrado

**Características:**
- ✅ Edición de contenido vía UI
- ✅ Colecciones configurables
- ✅ Autenticación GitHub
- ✅ Preview en tiempo real

---

## 🛠️ Skills Community

### `blog`
Sistema de blog completo con listado, posts individuales y schema.org.

**Instalación:**
```bash
node scripts/skill-add.js blog
```

**Componentes:**
- `BlogCard.astro` - Card de preview de post
- `BlogList.astro` - Listado con filtros
- `BlogPost.astro` - Post individual

**Uso:**
```astro
---
import { BlogList } from '@skills/community/blog';
const posts = await getCollection('blog');
---

<BlogList posts={posts} />
```

**Colecciones CMS:**
- title, excerpt, date, author, category, tags, image, published

---

### `contact-form`
Formulario de contacto profesional con validación y estilos Tailwind.

**Instalación:**
```bash
node scripts/skill-add.js contact-form
```

**Componentes:**
- `ContactForm.astro` - Formulario completo

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| title | string | "Contáctanos" | Título del formulario |
| subtitle | string | "" | Subtítulo descriptivo |
| submitLabel | string | "Enviar mensaje" | Texto del botón |
| showPhone | boolean | true | Mostrar campo teléfono |
| showCompany | boolean | true | Mostrar campo empresa |
| serviceSelect | boolean | false | Selector de servicio |
| action | string | "/api/contact" | URL del endpoint |

**Uso:**
```astro
<ContactForm 
  title="Solicita una cotización"
  subtitle="Te responderemos en menos de 24 horas"
  showPhone={true}
  showCompany={true}
  serviceSelect={true}
/>
```

---

### `forms-web3forms`
Formularios funcionales sin backend propio usando Web3Forms.

**Instalación:**
```bash
node scripts/skill-add.js forms-web3forms
```

**Configuración:**
1. Obtener API Key en https://web3forms.com/
2. Configurar en `config/site.config.ts`:

```typescript
export default {
  forms: {
    web3formsKey: 'TU-API-KEY-AQUI'
  }
};
```

**Uso:**
```astro
<ContactForm 
  title="Contáctanos"
  recipientEmail="contacto@tuempresa.com"
/>
```

---

### `testimonials`
Sistema de testimonios con schema.org Review markup para SEO/AI citations.

**Instalación:**
```bash
node scripts/skill-add.js testimonials
```

**Componentes:**
- `TestimonialsGrid.astro` - Grid de testimonios
- `TestimonialCard.astro` - Card individual

**Props de TestimonialsGrid:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| testimonials | array | [] | Array de testimonios |
| limit | number | - | Límite de testimonios a mostrar |
| showRatings | boolean | true | Mostrar ratings |
| columns | 2/3/4 | 3 | Número de columnas |

**Uso:**
```astro
<TestimonialsGrid 
  testimonials={testimonials} 
  limit={6} 
  showRatings={true} 
  columns={3}
/>
```

---

### `cloudflare-pages`
Deploy automatizado a Cloudflare Pages con configuración optimizada.

**Instalación:**
```bash
node scripts/skill-add.js cloudflare-pages
```

**Características:**
- ✅ Build commands pre-configurados
- ✅ Variables de entorno para Cloudflare
- ✅ Wrangler CLI integration
- ✅ Deploy previews

---

### `cloudflare-tunnel`
Skill para crear túneles seguros de desarrollo con Cloudflare Tunnel.

**Instalación:**
```bash
node scripts/skill-add.js cloudflare-tunnel
```

**Setup:**
```bash
node skills/community/cloudflare-tunnel/setup-tunnel.js \
  --token="eyJ..." \
  --domain="tudominio.com" \
  --dev-domain="dev.tudominio.com" \
  --port=4321
```

**Características:**
- Túneles permanentes (no expiran)
- Dominios personalizados
- SSL automático
- CDN integrado
- Soporte prod/dev separados
- Systemd service incluido

---

### `web-scraper`
Web scraping y crawling para extraer contenido de sitios existentes.

**Instalación:**
```bash
node scripts/skill-add.js web-scraper
npm install puppeteer cheerio --legacy-peer-deps
```

**Uso:**
```bash
# Scrapear sitio completo
node skills/community/web-scraper/scripts/scrape.cjs \
  --url=https://ejemplo.com \
  --output=./scraped-content

# Deep scraping (más thorough)
node skills/community/web-scraper/scripts/deep-scrape.cjs \
  --url=https://ejemplo.com \
  --output=./scraped-deep
```

**Output:**
- `content.json` - Contenido estructurado
- `pages/` - HTML de cada página
- `images/` - Imágenes descargadas
- `report.md` - Resumen

---

### `browser-automation`
Testing visual y funcional con Puppeteer.

**Instalación:**
```bash
node scripts/skill-add.js browser-automation
npm install puppeteer --legacy-peer-deps
```

**Uso:**
```bash
# Screenshots de todo el sitio
npm run test:visual

# Testing E2E
npm run test:e2e
```

**Tests incluidos:**
- ✅ Links funcionan
- ✅ Botones responden
- ✅ Formularios envían
- ✅ Navegación móvil
- ✅ Carga de imágenes
- ✅ CSS aplicado

---

### `image-optimizer`
Optimización de imágenes con conversión a WebP/AVIF y generación de srcsets.

**Instalación:**
```bash
node scripts/skill-add.js image-optimizer
```

**Scripts:**
- `optimize.js` - Optimizar imágenes en batch
- `convert.js` - Convertir formatos

**Características:**
- ✅ Conversión a WebP/AVIF
- ✅ Generación automática de srcsets
- ✅ Compresión sin pérdida visible
- ✅ Backup de originales

---

### `seo-ai-citations`
SEO + AEO (AI Citation Optimization) con Schema.org completo para máxima visibilidad en buscadores y LLMs.

**Instalación:**
```bash
node scripts/skill-add.js seo-ai-citations
```

**Componentes:**
- `SEOHead.astro` - Meta tags completos (Open Graph, Twitter Cards, Canonical, AI Citations)
- `SchemaOrg.astro` - JSON-LD structured data para rich snippets

**Schemas soportados:**
- ✅ Organization, WebSite, LocalBusiness
- ✅ Service, FinancialService (fintech)
- ✅ FAQPage (para AI citations)
- ✅ HowTo, BlogPosting
- ✅ BreadcrumbList, SoftwareApplication

**Uso:**
```astro
---
import { SEOHead, SchemaOrg } from '@skills/community/seo-ai-citations';
---
<head>
  <SEOHead 
    title="Mi Sitio"
    description="Descripción optimizada"
    keywords={["keyword1", "keyword2"]}
  />
  <SchemaOrg type={["Organization", "WebSite"]} />
</head>
```

---

### `webflow-migration`
Skill para migrar sitios Webflow a Astro manteniendo el diseño original.

**Instalación:**
```bash
node scripts/skill-add.js webflow-migration
```

**Flujo de Migración:**
1. Exportar código desde Webflow
2. Copiar CSS/JS/Imágenes a public/
3. Crear Layout.astro con CSS original
4. Componentizar secciones gradualmente

**Características:**
- ✅ Mantiene CSS original de Webflow
- ✅ Migración progresiva
- ✅ Checklist de verificación
- ✅ Solución de problemas comunes

---

### `webflow-effects`
Efectos premium tipo Webflow - GSAP, animaciones, glassmorphism.

**Instalación:**
```bash
node scripts/skill-add.js webflow-effects
npm install gsap --legacy-peer-deps
```

**Componentes:**
- `PremiumHero.astro` - Hero con animaciones
- `PremiumServices.astro` - Servicios con efectos
- `PremiumTestimonials.astro` - Testimonios animados
- `PremiumCTA.astro` - Call-to-action premium

**Efectos CSS incluidos:**
- `.animate-fade-up` - Fade + translate
- `.animate-scale-in` - Scale animation
- `.glass-card` - Glassmorphism
- `.gradient-text` - Texto gradiente
- `.hover-lift` - Elevación hover

**Uso:**
```astro
<PremiumHero 
  title="Tu título"
  highlight="destacado"
  subtitle="Subtítulo"
/>
```

---

## 🎯 Guía de Selección

### Sitio Básico (Startup)
```bash
node scripts/skill-add.js cms-sveltia testimonials contact-form
```

### Sitio con Blog (Content Marketing)
```bash
node scripts/skill-add.js cms-sveltia blog testimonials contact-form
```

### Sitio Premium (Agencia)
```bash
node scripts/skill-add.js cms-sveltia blog testimonials contact-form webflow-effects
```

### Sitio con Testing
```bash
node scripts/skill-add.js browser-automation web-scraper
```

### Sitio con CMS JSON (Sin DB externa)
```bash
node scripts/skill-add.js kinto-cms contact-form
```

### Migración desde Webflow
```bash
node scripts/skill-add.js webflow-migration image-optimizer
```

---

## 📝 Crear Nueva Skill

```bash
node scripts/skill-create.js mi-nueva-skill
```

Esto crea:
- `SKILL.md` - Documentación
- `index.ts` - Exports y config
- `components/MiNuevaSkill.astro` - Componente
- `example/page.astro` - Ejemplo de uso

---

## 🔗 Referencias

- [Guía de Skills](docs/SKILLS.md)
- [AI Generation](docs/AI_GENERATION.md)
- [KINTO.md](KINTO.md) - Guía principal
