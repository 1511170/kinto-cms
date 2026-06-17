# 🚀 elnorteno - Guía del Proyecto

> **Cliente:** Elnorteno  
> **Industria:** Tu industria aquí  
> **Sitio:** elnorteno.com  
> **CMS:** eln.kinto.info (oculto)

---

## ⚡ Comandos Rápidos

```bash
# Estás en: kinto-cms/sites/elnorteno/

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

**Elnorteno** es una empresa de Tu industria aquí que necesita:

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
sites/elnorteno/
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
    domain: 'elnorteno.com',
    name: 'elnorteno',
    description: 'Sitio web de elnorteno',
    language: 'es'
  },
  cms: {
    enabled: true,
    subdomain: 'eln.kinto.info',
    hidden: true
  }
}
```

---

## 🧩 Skills Recomendadas

| Skill            | Propósito   | Estado       |
| ---------------- | ----------- | ------------ |
| `cms-sveltia`    | Panel admin | ⬜ Pendiente |
| `testimonials`   | Testimonios | ⬜ Pendiente |
| `{CUSTOM_SKILL}` | {PURPOSE}   | ⬜ Crear     |

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
