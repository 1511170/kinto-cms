---
name: listings
category: official
version: 1.0.0
description: Directorio de listados (inmobiliaria/clasificados) — catálogo, filtros, búsqueda y SEO desde un ERP vía Worker de Cloudflare + R2
tags: [listings, directory, real-estate, inmobiliaria, cloudflare, seo]
requires: []
needs: [sedi-worker, cloudflare-r2]
recommendedFor: [listings, directory, real-estate]
---

# listings Skill

Skill de **directorio de listados** para KINTO CMS. Derivada de
`shopify-ecommerce` pero para inmuebles/clasificados: en vez de
producto/carrito/checkout, maneja inmueble/contacto/lead. Pensada para
Inmobiliaria Arauca pero genérica para cualquier directorio respaldado por un
ERP.

## Qué hace

- Trae los listados (inmuebles) en build-time desde un **Worker de Cloudflare**
  que envuelve el ERP (SEDI). Genera HTML estático (SSG con Astro).
- Resuelve las **fotos desde Cloudflare R2** (URLs públicas que el ERP
  almacena por inmueble).
- Catálogo con **filtros en cliente** (operación, tipo, zona, precio, hab,
  baños, área, texto) y ordenamiento.
- Páginas de **detalle** por inmueble con galería, especificaciones,
  descripción y **CTA de contacto (WhatsApp/llamada/correo)** — sin carrito.
- **SEO**: JSON-LD `RealEstateListing` + `Organization`/`BreadcrumbList`.

## Arquitectura

```
ERP (SEDI)  ──>  Worker Cloudflare (/inmuebles, /inmuebles/{id})  ──>  build SSG (Astro)
fotos       ──>  Cloudflare R2 (público)  ──────────────────────────>  <img> en el sitio
```

El backfill de datos/fotos al ERP y la subida a R2 viven en el repo del ERP
(`inmobiliariarauca-api/scripts/backfill-curado`), fuera de esta skill.

## Configuración

`config/listings.config.ts` (overridable por env):

- `SEDI_WORKER_URL` — base del Worker (default: Worker prod de Arauca).
- `R2_PUBLIC_BASE` — base pública del bucket R2.
- `WHATSAPP_NUMBER` — número E.164 sin `+` para los CTAs.
- `brand.*` — nombre, contacto, ciudad.

## Capa de datos (lib/)

| Archivo | Rol |
| --- | --- |
| `types.ts` | `Listing`, `ListingFoto`, `ListingFilters`, `SortKey`. |
| `sedi-client.ts` | `fetchAllListings()` / `fetchInmuebleDetalle()` (build-time). |
| `listing-mapper.ts` | shape del Worker → `Listing` (precio según operación, fotos R2, descripción desde `observaciones`). |
| `format.ts` | `formatPrecio` (COP), `precioConSufijo`, `tituloListing`, `slugify`, `whatsappLink`, `specsResumen`. |
| `filter-sort.ts` | `filtrar`, `ordenar`, `barriosUnicos`, `tiposUnicos`. |

## Uso en un sitio Astro

```astro
---
import { fetchAllListings } from "@lib/listings/sedi-client";
const listings = await fetchAllListings({ soloDisponibles: true });
---
{listings.map((l) => <ListingCard listing={l} />)}
```

Para detalle estático:

```astro
export async function getStaticPaths() {
  const listings = await fetchAllListings({ soloDisponibles: true });
  return listings.map((l) => ({ params: { slug: l.slug }, props: { listing: l } }));
}
```

## Modelo `Listing` (resumen)

`id, ref, slug, tipo, operacion (arriendo|venta|arriendo y venta), estado,
direccion, ciudad, barrio, precio, canon, valorVenta, area, habitaciones,
banos, parqueaderos, estrato, descripcion, fotos[], imagenPrincipal,
destacado, disponible`.

## Notas de implementación

- La descripción del ERP viaja en el campo `observaciones` del Worker (el
  mapper usa `observaciones || descripcion`).
- `cantidadFotos` del listado es poco fiable; la verdad son las `fotos[]` del
  detalle.
- Los filtros se aplican en cliente sobre todas las tarjetas renderizadas
  (rápido para catálogos de cientos de items; para miles, paginar/SSR).
