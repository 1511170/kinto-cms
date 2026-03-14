# 🚀 globaldreamers - Guía del Proyecto

> **Cliente:** Globaldreamers  
> **Industria:** Tu industria aquí  
> **Sitio:** globaldreamers.com  
> **CMS:** glo.kinto.info (oculto)  

---

## ⚡ Comandos Rápidos

```bash
# Estás en: kinto-cms/sites/globaldreamers/

# Ver skills instaladas
cat skills-active.json

# Instalar skills disponibles
node scripts/skill-add.js cms-sveltia
node scripts/skill-add.js {SKILL_NAME}

# Crear skill específica
node scripts/skill-create.js {NEW_SKILL}

# Dev server
npm install
npm run dev

# Build
npm run build
```

---

## 🎯 Brief del Cliente

**Globaldreamers** es una empresa de Tu industria aquí que necesita:

### Páginas Requeridas
- [ ] **Home** - Hero, servicios/productos, CTA
- [ ] **Servicios/Productos** - Detalle de ofertas
- [ ] **Nosotros** - Historia, equipo, valores
- [ ] **Blog** - Artículos/Noticias (CMS-editable)
- [ ] **Contacto** - Formulario + info

### Funcionalidades
- [ ] CMS para edición sin código
- [ ] SEO optimizado
- [ ] {FEATURES_CUSTOM}

### Identidad Visual
- **Colores:** {PRIMARY_COLOR}, {SECONDARY_COLOR}
- **Estilo:** {STYLE_DESCRIPTION}
- **Imágenes:** {IMAGE_GUIDELINES}

---

## 📁 Estructura del Sitio

```
sites/globaldreamers/
├── src/
│   ├── pages/           # Rutas
│   ├── layouts/         # Layouts
│   └── components/      # Componentes locales
├── public/              # Assets
├── config/
│   ├── site.config.ts   # Config sitio
│   └── cms.config.yml   # Config CMS
├── scripts/             # Utilidades
└── skills-active.json   # Skills instaladas
```

---

## 🔧 Configuración

### Site Config
```typescript
{
  site: {
    domain: 'globaldreamers.com',
    name: 'globaldreamers',
    description: 'Sitio web de globaldreamers',
    language: 'es'
  },
  cms: {
    enabled: true,
    subdomain: 'glo.kinto.info',
    hidden: true
  }
}
```

---

## 🧩 Skills Recomendadas

| Skill | Propósito | Estado |
|-------|-----------|--------|
| `cms-sveltia` | Panel admin | ⬜ Pendiente |
| `testimonials` | Testimonios | ⬜ Pendiente |
| `{CUSTOM_SKILL}` | {PURPOSE} | ⬜ Crear |

**Instalar:**
```bash
node scripts/skill-add.js cms-sveltia
```

---

## ✅ Checklist de Entrega

- [ ] Páginas principales completas
- [ ] CMS instalado y configurado
- [ ] SEO (schema.org, meta tags)
- [ ] Imágenes optimizadas
- [ ] Build exitoso
- [ ] Deploy en Cloudflare

---

## 🆘 Referencias

- [Guía Principal](../../KINTO.md)
- [AI Generation Guide](../../docs/AI_GENERATION.md)
- [Arquitectura](../../STRUCTURE.md)

---

**Estado:** 🚧 En desarrollo

**Próximo paso:** Configurar site.config.ts y instalar skills necesarias.
