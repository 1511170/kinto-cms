# 🚀 {SITE_NAME} - Guía del Proyecto

> **Cliente:** {CLIENT_NAME}  
> **Industria:** {INDUSTRY}  
> **Sitio:** {DOMAIN}  
> **CMS:** {CMS_SUBDOMAIN} (oculto)

---

## ⚡ Comandos Rápidos

```bash
# Estás en: kinto-cms/sites/{SITE_NAME}/

# Ver skills instaladas
cat skills-active.json

# Instalar skills disponibles
kinto skill add cms-sveltia --site=<sitio>
kinto skill add <skill-name> --site=<sitio>

# Crear skill específica
kinto skill create <skill-name>

# Dev server
npm install
npm run dev

# Build
npm run build
```

---

## 🎯 Brief del Cliente

**{CLIENT_NAME}** es una empresa de {INDUSTRY} que necesita:

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
sites/{SITE_NAME}/
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
    domain: '{DOMAIN}',
    name: '{SITE_NAME}',
    description: '{DESCRIPTION}',
    language: '{LANG}'
  },
  cms: {
    enabled: true,
    subdomain: '{CMS_SUBDOMAIN}',
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
kinto skill add cms-sveltia --site=<sitio>
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
