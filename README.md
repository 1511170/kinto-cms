# KINTO Content Management System (kinto-cms)

Sistema generador de sitios web estáticos empresariales con arquitectura de skills/plugins bajo demanda.

## 🎯 Filosofía: Core Mínimo + Skills Bajo Demanda

```
┌─────────────────────────────────────────────┐
│           KINTO CMS Architecture            │
├─────────────────────────────────────────────┤
│  CORE (Astro + Tailwind) - Mínimo, limpio   │
│  └── Sin skills activas por defecto         │
├─────────────────────────────────────────────┤
│  SKILLS - Se instalan SOLO cuando se        │
│  necesitan via: kinto skill add [name]      │
│  └── Una vez creada, disponible para todos  │
└─────────────────────────────────────────────┘
```

## 🏗️ Estructura

```
kinto-cms/
├── core/                    # Motor mínimo (sin skills)
├── skills/                  # Marketplace de skills
│   ├── official/            # Skills oficiales (SEO, CMS, etc)
│   └── community/           # Skills creadas por IA/usuarios
├── sites/                   # Sitios de clientes
│   └── [client]/            # Cada sitio = core + skills activas
└── templates/               # Templates base
```

## 🚀 Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Astro 5 (SSG) |
| Styling | Tailwind CSS 4 |
| CMS | Sveltia CMS (Git-based) |
| Hosting | Cloudflare Pages |

## 🧩 Sistema de Skills

### Principios

1. **Zero skills por defecto** - El core es puro Astro + Tailwind
2. **Instalación bajo demanda** - `kinto skill add [nombre]`
3. **Reutilización** - Una skill creada queda disponible para todos los sitios
4. **Composición** - Skills pueden depender de otras skills

### Comandos de Skills

```bash
# Ver skills disponibles
kinto skills:list

# Instalar skill en un sitio
kinto skill add seo-ai-citations --site=serviworldlogistics

# Crear nueva skill (con ayuda de IA)
kinto skill:create testimonials --site=serviworldlogistics
# → Crea en skills/community/testimonials/
# → Disponible para todos los sitios futuros

# Remover skill
kinto skill remove testimonials --site=serviworldlogistics
```

### Estructura de una Skill

```
skills/community/testimonials/
├── SKILL.md                 # Doc: qué hace, cómo usar
├── index.ts                 # Entry point
├── components/              # Componentes Astro
├── cms-fields.yml           # Config de campos para Sveltia
└── example/                 # Ejemplo de uso
    └── page.astro
```

## 📝 Workflow de Generación con IA

### 1. Inicializar Sitio (Core limpio)

```bash
kinto init serviworldlogistics
# Crea: sites/serviworldlogistics/ con solo Astro + Tailwind
```

### 2. IA Analiza y Sugiere Skills

```
IA: "Este sitio necesita:
  - seo-ai-citations (para AI citations)
  - cms-sveltia (para que el cliente edite)
  - forms-cloudflare (formulario de contacto)
  - testimonials (testimonios con schema.org)"
```

### 3. Instalar Skills Necesarias

```bash
kinto skill add seo-ai-citations cms-sveltia forms-cloudflare --site=serviworldlogistics
```

### 4. Si no existe una skill → Crearla

```bash
# IA crea nueva skill que luego se reutiliza
kinto skill:create fleet-tracker --site=serviworldlogistics
# → Guardado en skills/community/fleet-tracker/
# → Disponible para logistics-future.com, etc.
```

## 🎨 Generación con Modelos de IA

### Prompt para Kimi Code / Claude Code

```
Estás usando KINTO CMS - sistema de sitios estáticos con skills.

CONTEXTO ACTUAL:
- Ubicación: /home/5toai/kinto-cms/
- Site de trabajo: sites/serviworldlogistics/
- Core: Astro 5 + Tailwind 4 (sin skills activas)
- Skills disponibles: [ver en skills/]

REGLAS DE ORO:
1. CORE PRIMERO: Usa solo Astro + Tailwind nativo
2. SKILL SI EXISTE: Si necesitas funcionalidad, revisa skills/ primero
3. CREAR SKILL SI NO EXISTE: Si no hay skill similar, créala en skills/community/
4. NUNCA repitas código entre sitios - usa/refina skills existentes

TAREA:
Generar sitio completo para [DESCRIPCIÓN]

PASOS:
1. Revisa skills/ para ver qué funcionalidades ya existen
2. Instala las skills necesarias
3. Si falta alguna funcionalidad → crea nueva skill documentada
4. Genera el sitio usando skills instaladas + código específico

OUTPUT:
- Qué skills usaste/instalaste
- Qué skills nuevas creaste (si aplica)
- Estructura del sitio generado
```

## 🔐 CMS Oculto Configurable

En `sites/[client]/config/site.config.ts`:

```typescript
export default {
  site: {
    domain: 'serviworldlogistics.com',
    name: 'Serviworld Logistics'
  },
  cms: {
    enabled: true,
    subdomain: 'swl.kinto.info',  // Oculto, no enlazado públicamente
    hidden: true,
    // Skills activas definen las colecciones disponibles
    collections: ['pages', 'blog']  // Auto-populado por skills
  }
};
```

## 📁 Estructura de un Sitio

```
sites/serviworldlogistics/
├── src/
│   ├── components/          # Componentes específicos (sin skills)
│   ├── layouts/
│   ├── pages/               # Rutas Astro
│   ├── content/             # Contenido editable (definido por skills)
│   └── styles/
├── public/
├── skills-active.json       # Skills activas para ESTE sitio
├── config/
│   ├── site.config.ts
│   └── cms.config.yml       # Auto-generado de skills activas
└── package.json
```

## 🛠️ Ejemplo: Flujo Completo

```bash
# 1. Nuevo cliente de logística
kinto init serviworldlogistics

# 2. IA analiza y decide skills necesarias
#    - seo-ai-citations (sí existe)
#    - cms-sveltia (sí existe)
#    - tracking-map (NO existe)

# 3. Instalar existentes
kinto skill add seo-ai-citations cms-sveltia

# 4. Crear skill nueva (IA genera)
kinto skill:create tracking-map
# IA crea: skills/community/tracking-map/
#          con componente de mapa, CMS fields, schema.org

# 5. Instalar skill nueva
kinto skill add tracking-map

# 6. IA genera el sitio completo
# Usa: core + skills activas + código específico del cliente

# 7. Deploy
kinto deploy
```

**Resultado**: La skill `tracking-map` ahora existe y puede usarse en:
- `logistics-corp.com`
- `transport-x.com`
- Cualquier sitio futuro que necesite tracking

## 📚 Documentación

- [Guía de Skills](docs/SKILLS.md) - Crear y usar skills
- [Catálogo de Skills](docs/SKILLS_CATALOG.md) - Skills disponibles
- [AI Generation](docs/AI_GENERATION.md) - Workflows con IA
- [CMS Setup](docs/CMS_SETUP.md)

---
**KINTO CMS**: Core mínimo + Skills bajo demanda = Sitios ultra-rápidos, escalables.
