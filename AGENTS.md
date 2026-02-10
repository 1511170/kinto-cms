# 🤖 AGENTS.md - Inicio Rápido para Cualquier IA

> **Para:** Kimi Code, Claude Code, Cursor, o cualquier IA agente

## 🎯 Tú Entras Aquí y Lees ESTO Primero

### Contexto Inmediato
- **Sistema**: KINTO CMS - Generador de sitios estáticos con arquitectura de skills
- **Stack**: Astro 5 + Tailwind 4 + Sveltia CMS
- **Sitio activo**: `sites/serviworldlogistics/` (empresa de logística)
- **Estado**: Core limpio, sin skills instaladas aún

### Tu Misión (Si eliges aceptarla)
Generar el sitio web completo para Serviworld Logistics:
1. Instalar skills necesarias
2. Crear páginas: Home, Servicios, Nosotros, Blog, Contacto
3. Configurar CMS para que el cliente edite contenido

---

## ⚡ Empezar (Flujo Paso a Paso)

### Paso 1: Leer el Brief del Cliente
```bash
cat sites/serviworldlogistics/KINTO.md
```

### Paso 2: Ver Skills Disponibles
```bash
cd sites/serviworldlogistics
node scripts/skill-list.js
```

### Paso 3: Instalar Skills Necesarias
```bash
node scripts/skill-add.js cms-sveltia
node scripts/skill-add.js testimonials
```

### Paso 4: Generar Contenido
- Editar `src/pages/index.astro`
- Crear páginas adicionales
- Configurar CMS en `config/site.config.ts`

---

## 📁 Estructura Importante

```
kinto-cms/
├── KINTO.md              # ← Guía completa del sistema (léela)
├── sites/
│   └── serviworldlogistics/
│       ├── KINTO.md      # ← Brief del cliente (léelo)
│       └── src/pages/    # ← Aquí trabajas
└── skills/
    ├── official/         # Skills oficiales
    └── community/        # Skills comunitarias
```

---

## 🔗 Referencias

- Guía sistema completa: `KINTO.md`
- Brief del proyecto: `sites/serviworldlogistics/KINTO.md`
- Arquitectura: `STRUCTURE.md`

---

**TL;DR**: Entra a `sites/serviworldlogistics`, lee su `KINTO.md`, instala skills, genera el sitio.
