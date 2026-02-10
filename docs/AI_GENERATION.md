# Guía de Generación con IA

Esta guía es para modelos de IA (Kimi Code, Claude Code, etc.) que generan sitios con KINTO CMS.

## 🎯 Principios Fundamentales

### 1. CORE PRIMERO
- Siempre empieza con el core limpio (Astro + Tailwind)
- NO añadas funcionalidad que ya existe como skill

### 2. REUSAR SKILLS
- Antes de escribir código, revisa: `kinto-cms/skills/`
- Si existe una skill similar, úsala o extiéndela

### 3. CREAR SKILLS PARA REUSO
- Si necesitas funcionalidad nueva, crea una skill
- Documenta en `SKILL.md` para futuros proyectos
- Una skill creada = disponible para todos los sitios

## 🚀 Workflow de Generación

### Paso 1: Analizar Brief

```
Cliente: Serviworld Logistics (empresa logística)
Necesita:
- Página inicio con hero, servicios, testimonios
- Página de servicios detallada
- Formulario de contacto
- Blog para noticias
- CMS para que editen contenido
```

### Paso 2: Revisar Skills Existentes

```bash
cd kinto-cms/sites/serviworldlogistics
node scripts/skill-list.js
```

**Skills disponibles:**
- `cms-sveltia` (official) - CMS básico
- `testimonials` (community) - Testimonios con schema.org

### Paso 3: Instalar Skills Necesarias

```bash
# Skills que ya existen y necesitamos
node scripts/skill-add.js cms-sveltia
node scripts/skill-add.js testimonials
```

### Paso 4: Crear Skills Faltantes

```bash
# Skills que NO existen y debemos crear
node scripts/skill-create.js services-grid
node scripts/skill-create.js contact-form
node scripts/skill-create.js blog-static
```

### Paso 5: Generar Sitio

Ahora sí, generar el código del sitio usando las skills instaladas:

```astro
---
// pages/index.astro
import Layout from '../layouts/Layout.astro';
import TestimonialsGrid from '@skills/community/testimonials/components/TestimonialsGrid.astro';
import ServicesGrid from '@skills/community/services-grid/components/ServicesGrid.astro';
---

<Layout title="Serviworld Logistics">
  <Hero />
  <ServicesGrid />
  <TestimonialsGrid limit={6} />
  <ContactCTA />
</Layout>
```

## 📝 Prompt Template para IA

Cuando un usuario te pide generar un sitio, usa este prompt interno:

```
=== KINTO CMS GENERATION SESSION ===

CONTEXTO:
- Proyecto: [NOMBRE_DEL_SITIO]
- Ubicación: kinto-cms/sites/[NOMBRE]/
- Core: Astro 5 + Tailwind 4
- Estado actual: Core limpio (0 skills activas)

MISIÓN:
Generar sitio web estático empresarial completo.

RESTRICCIONES:
1. ANTES de escribir código, revisa skills/ existentes
2. Si una skill existe, ÚSALA (no repitas código)
3. Si necesitas funcionalidad nueva, CREA una skill
4. NUNCA copies código entre sitios - usa skills
5. Todo debe ser estático 100% (SSG)

PASOS:

[ ] 1. Analizar requerimientos y hacer lista de funcionalidades
[ ] 2. Mapear funcionalidades a skills existentes
[ ] 3. Instalar skills existentes necesarias
[ ] 4. Crear skills faltantes (con SKILL.md completo)
[ ] 5. Generar páginas Astro usando skills
[ ] 6. Configurar CMS según skills activas
[ ] 7. Verificar Lighthouse 95+ y Core Web Vitals

SKILLS A CONSIDERAR:
- seo-ai-citations: Schema.org, meta tags, llms.txt
- cms-sveltia: Panel de admin
- forms-cloudflare: Forms sin backend
- testimonials: Testimonios con schema.org
- blog-static: Sistema de blog
- gallery-lightbox: Galerías
- analytics-plausible: Analytics

OUTPUT ESPERADO:
1. Lista de skills instaladas/usadas
2. Lista de skills nuevas creadas (con justificación)
3. Estructura de archivos generada
4. Configuración de CMS
```

## 🧩 Catálogo de Skills por Categoría

### CMS & Content
- `cms-sveltia` - Panel de admin visual
- `blog-static` - Sistema de blog completo
- `pages-dynamic` - Páginas editables vía CMS

### SEO & AI Citations
- `seo-ai-citations` - Schema.org, meta tags, llms.txt
- `sitemap-auto` - Sitemap.xml automático
- `robots-txt` - Configuración robots.txt

### UI Components
- `testimonials` - Testimonios con schema.org
- `services-grid` - Grid de servicios
- `gallery-lightbox` - Galería con lightbox
- `team-members` - Página de equipo
- `faq-accordion` - FAQ con schema.org
- `stats-counter` - Contadores animados

### Forms & Interactivity
- `forms-cloudflare` - Forms via Cloudflare Workers
- `newsletter-subscribe` - Suscripción newsletter
- `calendly-embed` - Integración Calendly

### Analytics
- `analytics-plausible` - Privacy-first analytics
- `analytics-umami` - Self-hosted analytics

### Industry-Specific
- `fleet-tracker` - Tracking de flota (logística)
- `property-listings` - Listados inmobiliarios
- `menu-restaurant` - Menú para restaurantes
- `booking-system` - Sistema de reservas

## 🔍 Cómo Revisar Skills Existentes

```bash
# Listar todas las skills
cd kinto-cms/sites/serviworldlogistics
node scripts/skill-list.js

# Ver documentación de una skill
cat ../../skills/community/testimonials/SKILL.md

# Ver componentes de una skill
ls ../../skills/community/testimonials/components/
```

## 🛠️ Crear Nueva Skill (Paso a Paso)

### Cuándo crear una skill:
- ✅ La funcionalidad NO existe en skills/
- ✅ Es reutilizable en otros sitios
- ✅ Tiene componentes + posiblemente CMS

### Cómo crear:

```bash
# 1. Crear estructura
node scripts/skill-create.js mi-nueva-skill

# 2. Implementar componentes
# Editar: skills/community/mi-nueva-skill/components/

# 3. Implementar lógica
# Editar: skills/community/mi-nueva-skill/index.ts

# 4. Documentar
# Editar: skills/community/mi-nueva-skill/SKILL.md

# 5. Instalar en sitio
node scripts/skill-add.js mi-nueva-skill
```

### Ejemplo: Skill de Hero Section Reutilizable

```typescript
// skills/community/hero-section/index.ts
export const config = {
  name: 'hero-section',
  version: '1.0.0',
  description: 'Hero section con CTA, imagen de fondo, y schema.org',
  category: 'ui',
  reusable: true
};

export function install(context) {
  context.addComponent('Hero', './components/Hero.astro');
  
  context.addCMSField('hero', {
    label: 'Hero Section',
    fields: [
      { name: 'title', label: 'Título', widget: 'string' },
      { name: 'subtitle', label: 'Subtítulo', widget: 'text' },
      { name: 'cta_text', label: 'Texto CTA', widget: 'string' },
      { name: 'cta_link', label: 'Link CTA', widget: 'string' },
      { name: 'background', label: 'Imagen Fondo', widget: 'image' }
    ]
  });
}
```

```astro
---
// skills/community/hero-section/components/Hero.astro
interface Props {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  background?: string;
}
const { title, subtitle, ctaText, ctaLink, background } = Astro.props;
---

<section 
  class="relative h-[600px] flex items-center justify-center"
  style={background ? `background-image: url(${background})` : ''}
>
  <div class="relative z-10 text-center text-white px-4">
    <h1 class="text-5xl font-bold mb-4">{title}</h1>
    {subtitle && <p class="text-xl mb-8">{subtitle}</p>}
    {ctaText && ctaLink && (
      <a href={ctaLink} class="bg-blue-600 px-8 py-3 rounded-lg">
        {ctaText}
      </a>
    )}
  </div>
</section>
```

## ✅ Checklist de Calidad

Antes de entregar un sitio generado:

- [ ] Core limpio + skills necesarias instaladas
- [ ] Sin código duplicado entre sitios (usa skills)
- [ ] Schema.org markup donde aplique
- [ ] Meta tags SEO completos
- [ ] Imágenes optimizadas
- [ ] Core Web Vitals: LCP < 2.5s, CLS < 0.1
- [ ] Lighthouse Score: 95+ en todos
- [ ] CMS configurado según skills activas
- [ ] Build estático exitoso (`npm run build`)
- [ ] Todas las skills documentadas en SKILL.md

## 🚀 Ejemplo Completo

```bash
# 1. Setup
cd kinto-cms/sites/serviworldlogistics

# 2. IA revisa skills disponibles
node scripts/skill-list.js

# 3. IA instala skills necesarias
node scripts/skill-add.js seo-ai-citations
node scripts/skill-add.js cms-sveltia
node scripts/skill-add.js testimonials

# 4. IA crea skills específicas que faltan
node scripts/skill-create.js logistics-services
# IA implementa: components/, CMS fields, etc.

# 5. IA genera el sitio usando las skills
# - Crea páginas Astro
# - Usa componentes de skills
# - Configura CMS

# 6. Build y verificación
npm run build
# IA verifica Lighthouse 95+

# 7. Listo para deploy
```

---

**Recuerda**: La magia está en las skills. Reusar > Recrear siempre.
