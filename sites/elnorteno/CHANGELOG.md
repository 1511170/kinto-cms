# Changelog · El Norteño

Sitio Astro 5 SSG + Cloudflare Workers + Shopify Storefront API.

Deploy: <https://elnorteno.camilocuadros.workers.dev>

---

## Fase 5 — Bugfixes, filtros mobile, WhatsApp + GA, contacto limpio

### Bugfixes críticos

- **Precios en 0 (todos los productos)** — `Product` del skill no expone `price` a nivel raíz; vive en `variants[0].price.amount`. Solución: `enrichProduct()` en `src/lib/build-data.ts` agrega `price` y `compareAtPrice` derivados al cachear. 4293/4311 productos con precio real (los 18 restantes son 0 en Shopify).
- **Vendor / productType vacíos** — script `scripts/enrich-products.mjs` enriqueció **3814 productos** vía Admin API:
  - Vendor derivado de título (50+ marcas conocidas: Shakespeare, Berkley, Rapala, Mustad, Coleman, Eagle Claw, Yo-Zuri, Gamo…) o de collection si es una marca.
  - ProductType derivado de las collections (Caña, Molinete, Anzuelo, Señuelo, Línea, Combo, Arma de aire, Camping…).
  - Modo dry-run por defecto; aplicar con `--apply`.

### Copy real (la usuaria reportó copy ficticio)

- Reseñas con fechas futuras → meses pasados de 2026 (15 abr, 22 mar, 8 feb).
- "3 cuotas sin interés" eliminado (no aplica en Colombia) → "Atención multicanal".
- Promo banner "30% en abrigo" eliminado → reemplazado por colección real (`nueva-importacion-pesca`) con 4 productos en vivo.

### Filtros mejorados

- **Quitado**: "Marca" y "Tipo" (Shopify devolvía valores vacíos → filtros inútiles).
- **Agregado**: Búsqueda inline, Subcolecciones (un producto puede estar en `["pesca","anzuelos","duras"]`), Solo disponibles.
- **Mobile bottom-sheet** (`<dialog>` desde abajo): botón "Filtros (N)" en toolbar abre sheet con el aside completo + footer sticky "Limpiar todo" / "Ver N productos". Mueve el aside dinámicamente al `<dialog>` para no duplicar HTML.

### Página /contacto

- Eliminada CTA repetida ("3 botones WhatsApp" después de las cards).
- Agregado **mapa Leaflet único** con 3 marcadores (Bucaramanga, Medellín, Valledupar) y popups con WhatsApp click-to-chat.

### Skills activadas

- **WhatsApp FAB** (`@skills-community/whatsapp-cta`) — botón flotante bottom-right en todas las páginas, mensaje pre-rellenado. Tracking GA4 incluido (`whatsapp_click_floating`).
- **Google Analytics** (`@skills-official/tracking-analytics`) — `gtag.js` cargado con `G-B4053WKJ7H`, forwardea eventos del dataLayer (view*item, add_to_cart, whatsapp_click*\*).

### UI

- **Footer contraste** — texto subido a `var(--sand)` con opacidad ≥0.85 (antes 0.5-0.7 = ilegibles sobre fondo oscuro). Border-top de 0.12 → 0.22.

### Infra

- Worker `wrangler.jsonc`: `SHOPIFY_API_VERSION` alineado a `2025-10` (igual que el sitio).

---

## Fase 4 — Buscador funcional, megamenu y copy real

- **Buscador** — creado `src/pages/search-index.json.ts` (genera 1.1 MB de índice MiniSearch al build con los 4311 productos). El `SearchOverlay` del skill ya lo consume.
- **Megamenu Tienda** — 5 columnas (Pesca · Camping · Tiro Deportivo · Outdoor · Otros) con subcategorías reales. `src/lib/categories.ts` mapea handles de Shopify a la jerarquía visible.
- **Mobile drawer** — `<details>/<summary>` expandibles por main category.
- **Página /contacto** — datos reales de las 3 tiendas (Bucaramanga, Medellín, Valledupar), telefonos clicables, WhatsApp, link Google Maps.
- **Footer site-level** (`src/components/layout/StoreFooter.astro`) — bloque "Visítanos" con las 3 tiendas + nav con 5 main cats.
- **Copy correcto** — "Bucaramanga · Medellín · Valledupar" en todos lados (antes decía "Bogotá · Cali"), eliminado "Envío gratis sobre $300.000" (no es verdad).

---

## Fase 3 — Páginas internas (catálogo, colección, PDP)

- `src/components/product/ProductGallery.astro` — override del skill: thumbs verticales 80px a la izquierda, imagen principal 4:5.
- `src/pages/products/[handle].astro` — PDP completo: breadcrumb + galería + ProductInfo + 4 trust badges + tabs (Detalles · Specs · Reseñas · Envío) + productos relacionados. Related computado en render por página (no en `getStaticPaths`) para no agotar memoria con 4311 productos.
- `src/pages/store/[handle].astro` — sidebar sticky 280px + grid de productos con filtrado client-side (data-attrs + JS vanilla).
- `src/pages/store.astro` — landing del catálogo con cards de colecciones (cat-grid) + grid completo.
- `public/shopify-tokens.css` — +440 líneas con todo el CSS de páginas internas.

---

## Fase 2 — Diseño El Norteño en home

- Tokens remapeados (`public/shopify-tokens.css`): paleta pine/terra/sand, fuentes Anton/Manrope/JetBrains Mono cargadas vía Google Fonts.
- `src/components/layout/StoreHeader.astro` — header site-level con announcement bar marquee y EL NORTEÑO centrado en Anton.
- `src/pages/index.astro` — rediseño completo: Hero 2 cols (texto + panel pine con stamp circular), stat-bar, categorías grid, featured products, promo banner, newsletter.
- `tailwind.config.mjs` — paleta pine/terra/sand/ink/slate/gold + font families.

---

## Fase 1 — Infraestructura

- **Cloudflare Worker** desplegado en `https://elnorteno.camilocuadros.workers.dev` con KV cache + Durable Object para coordinar rebuilds.
- **Cache de build** — `src/lib/build-data.ts` con singletons module-level que cachea la respuesta de Shopify durante todo el build. Bajó tiempo de build de **70 min → 65s** (66×).
- Shopify Storefront API `2025-10` con token del cliente.

---

## Stack y arquitectura

- **Frontend**: Astro 5 SSG, vanilla JS para interactividad, Tailwind (limitado a tokens custom).
- **Skill `shopify-ecommerce`** (no se modifica) provee: ProductInfo, ProductCard, CartDrawer, SearchOverlay, GraphQL queries, cart-client.
- **Site-level overrides** en `src/components/` y `src/pages/` reemplazan componentes del skill que necesitan look El Norteño.
- **Tokens CSS** en `public/shopify-tokens.css` remapean las CSS vars que usa el skill (`--fg`, `--bg`, `--accent`, etc.) a valores El Norteño — los componentes del skill adoptan los nuevos colores sin que tengamos que tocarlos.
- **Worker `worker/`** (del skill) maneja `/api/cart`, `/api/collections`, `/api/products/:handle` y webhooks de Shopify.

## Scripts del sitio

| Script                                     | Descripción                                                          |
| ------------------------------------------ | -------------------------------------------------------------------- |
| `npm run dev`                              | Dev server local (Astro).                                            |
| `npm run build`                            | Build SSG (~65s, 4355 páginas).                                      |
| `npm run preview`                          | Sirve `dist/` localmente.                                            |
| `npm run worker:dev`                       | Wrangler dev del Worker.                                             |
| `npm run deploy`                           | `build && wrangler deploy`.                                          |
| `node scripts/enrich-products.mjs`         | **Dry-run**: propone vendor + productType para productos de Shopify. |
| `node scripts/enrich-products.mjs --apply` | Aplica los cambios vía Admin API.                                    |

## Variables de entorno (`.env` — NO commitear)

```
SHOPIFY_STORE_DOMAIN=elnorteno.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxx     # Admin API (enrich-products.mjs)
SHOPIFY_STOREFRONT_ACCESS_TOKEN=xxxxxxx     # Storefront API (build + cart)
SHOPIFY_API_VERSION=2025-10
SHOPIFY_CURRENCY_CODE=COP
SHOPIFY_LOCALE=es-CO
GA_MEASUREMENT_ID=G-B4053WKJ7H
```

## Pendientes futuros

- Configurar `elnorteno.com` como zona en Cloudflare → descomentar `routes` en `wrangler.jsonc`.
- Configurar webhooks de Shopify apuntando a `https://elnorteno.camilocuadros.workers.dev/api/webhooks/shopify` (auto-rebuild cuando cambian productos).
- 1363 productos siguen con vendor "El Norteño" porque el título no contenía marca conocida — revisión manual en Shopify Admin si interesa.
