# Kinto CMS

Sistema de gestión de contenidos ligero basado en archivos JSON para sitios Astro.

## Uso Rápido

```bash
# Crear colección
./create-collection.sh <nombre>

# Agregar contenido
./add-content.sh <colección>
```

## Estructura

```
sites/mi-sitio/
├── src/
│   ├── content/
│   │   └── [colecciones]/     # Datos JSON
│   └── lib/kinto/
│       ├── client.ts          # Cliente API
│       └── types.ts           # Tipos TypeScript
├── data/                      # Backup de datos
└── kinto.config.json          # Configuración
```

## Configuración

### 1. Configurar kinto.config.json

```json
{
  "collections": {
    "pages": {
      "fields": ["title", "slug", "content", "seo"],
      "required": ["title", "slug"]
    },
    "posts": {
      "fields": ["title", "slug", "excerpt", "content", "date", "author"],
      "required": ["title", "slug", "date"]
    }
  },
  "site": {
    "name": "Mi Sitio",
    "url": "https://misitio.com"
  }
}
```

### 2. Crear cliente

```typescript
// src/lib/kinto/client.ts
export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  seo?: {
    title?: string;
    description?: string;
  };
}

export async function getCollection<T>(name: string): Promise<T[]> {
  const data = await import(`../content/${name}.json`);
  return data.default || [];
}

export async function getItem<T>(
  collection: string,
  slug: string
): Promise<T | undefined> {
  const items = await getCollection<T>(collection);
  return items.find((item: any) => item.slug === slug);
}
```

## Scripts

### create-collection.sh

```bash
#!/bin/bash
# Crear nueva colección

COLLECTION=$1
SITE_DIR="sites/mi-sitio"

mkdir -p "$SITE_DIR/src/content/$COLLECTION"
echo "[]" > "$SITE_DIR/src/content/$COLLECTION/data.json"

echo "Colección '$COLLECTION' creada"
```

### add-content.sh

```bash
#!/bin/bash
# Agregar contenido a colección

COLLECTION=$1
SITE_DIR="sites/mi-sitio"
DATA_FILE="$SITE_DIR/src/content/$COLLECTION/data.json"

# Leer datos actuales
DATA=$(cat "$DATA_FILE")

# Crear nuevo item (ejemplo)
NEW_ITEM='{
  "id": "'$(uuidgen)'",
  "title": "Nuevo Item",
  "slug": "nuevo-item",
  "createdAt": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
}'

# Agregar al array
echo "$DATA" | jq ". + [$NEW_ITEM]" > "$DATA_FILE"

echo "Item agregado a '$COLLECTION'"
```

## Uso en Astro

### Página dinámica

```astro
---
// src/pages/[...slug].astro
import { getCollection, getItem } from '../lib/kinto/client';
import type { Page } from '../lib/kinto/client';

export async function getStaticPaths() {
  const pages = await getCollection<Page>('pages');
  return pages.map(page => ({
    params: { slug: page.slug },
    props: { page }
  }));
}

const { page } = Astro.props;
---

<h1>{page.title}</h1>
<article set:html={page.content} />
```

### Listado

```astro
---
// src/pages/blog.astro
import { getCollection } from '../lib/kinto/client';
import type { Post } from '../lib/kinto/client';

const posts = await getCollection<Post>('posts');
---

<ul>
  {posts.map(post => (
    <li>
      <a href={`/blog/${post.slug}`}>{post.title}</a>
    </li>
  ))}
</ul>
```

## Flujo de Trabajo

### Desarrollo

1. **Crear colección:** `./create-collection.sh pages`
2. **Definir schema:** Editar `kinto.config.json`
3. **Agregar contenido:** `./add-content.sh pages`
4. **Usar en Astro:** Importar cliente y tipos

### Producción

- Los datos JSON se incluyen en el build
- No requiere base de datos externa
- Funciona en Cloudflare Pages

## Ventajas

- ✅ **Simple:** Solo archivos JSON
- ✅ **Rápido:** Sin queries de DB
- ✅ **Type-safe:** TypeScript
- ✅ **Git-friendly:** Version control
- ✅ **Gratis:** Sin costos de hosting

## Limitaciones

- ❌ No edición en tiempo real (usa CMS headless para eso)
- ❌ No relaciones complejas
- ❌ No búsqueda full-text nativa

## Alternativas

Para necesidades más complejas:
- **Sanity:** CMS headless con API
- **Strapi:** CMS self-hosted
- **Contentful:** CMS enterprise
- **Decap CMS (Netlify CMS):** Git-based CMS

## Recursos

- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [JSON Schema](https://json-schema.org/)
