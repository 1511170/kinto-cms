# Skill: image-optimizer

Optimización automática de imágenes para sitios KINTO. Convierte JPG/PNG a WebP usando Sharp (incluido en Astro) con alta calidad y mínimo peso.

## Qué hace

- Escanea `public/` buscando imágenes JPG/PNG
- Convierte cada imagen a WebP con calidad configurable (default: 82)
- Opcionalmente actualiza todas las referencias en archivos `.astro`, `.html`, `.md`, etc.
- Muestra reporte con tamaño original vs optimizado y % de ahorro

## Instalación

```bash
node scripts/skill-add.js image-optimizer
```

## Uso

```bash
# Preview: muestra qué imágenes se convertirían
npm run images:optimize:dry

# Convertir imágenes a WebP (mantiene originales)
npm run images:optimize

# Convertir + actualizar referencias + eliminar originales
npm run images:optimize:full
```

### Opciones directas del script

```bash
node ../../skills/community/image-optimizer/scripts/optimize.cjs [opciones]

--quality=N       Calidad WebP (1-100, default: 82)
--update-refs     Actualizar src="" en archivos .astro/.html/.md
--clean           Eliminar originales después de convertir (requiere --update-refs)
--dry-run         Solo muestra qué haría sin ejecutar
```

## Resultado esperado

```
🖼️  Image Optimizer - KINTO CMS
─────────────────────────────────
Escaneando public/ ...

  ✅ /images/hero.jpg → hero.webp (300KB → 142KB, -53%)
  ✅ /images/team.png → team.webp (76KB → 31KB, -59%)
  ...

─────────────────────────────────
📊 Total: 14 imágenes | 1.6MB → 720KB | Ahorro: 55%
```

## Configuración

Editar `config/defaults.json`:

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| quality | number | 82 | Calidad WebP (1-100) |
| extensions | string[] | [".jpg", ".jpeg", ".png"] | Extensiones a convertir |
| scanDir | string | "public" | Directorio a escanear |
| refDirs | string[] | ["src"] | Directorios donde buscar refs |
| refExtensions | string[] | [".astro", ".html", ...] | Tipos de archivo con refs |

## Metadata

- **Categoría**: performance
- **Versión**: 1.0.0
- **Reutilizable**: Sí
- **Dependencias**: sharp (incluido en Astro)
