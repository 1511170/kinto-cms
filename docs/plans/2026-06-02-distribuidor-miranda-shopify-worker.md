# Distribuidor Miranda Shopify Storefront + Cloudflare Worker Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Conectar `sites/distribuidor-miranda` con la Storefront API de Shopify y desplegarlo como sitio Astro estático en `/dist` servido por Cloudflare Worker con APIs dinámicas de carrito, productos, colecciones, cache KV y webhooks.

**Architecture:** Mantener Astro como generador estático y usar `skills/official/shopify-ecommerce` como fuente de componentes, fetchers, carrito y Worker. El sitio generará páginas estáticas desde Shopify Storefront en build-time, mientras el Worker sirve `/dist` como assets y expone `/api/*` para carrito, catálogo runtime, cache KV y webhooks Shopify.

**Tech Stack:** KINTO CMS, Astro 5, TypeScript, Shopify Storefront API, Shopify Admin API para carga masiva/scripts, Cloudflare Workers, Workers Assets, KV, Durable Object opcional, Wrangler.

---

## Estado inicial confirmado

- Worktree: `/home/k41h4ck3r/work/kinto-miranda/kinto-cms-distribuidor-shopify-worker`
- Branch: `feature/distribuidor-miranda-shopify-worker`
- Sitio: `sites/distribuidor-miranda`
- Skill activa: `shopify-ecommerce` en `skills-active.json`
- El sitio actual todavía usa catálogo mock/local en `src/data/catalog.ts`
- La carga masiva Shopify corre en paralelo desde el worktree/base original con proceso `proc_22f213897205`
- La integración Storefront/Worker se hará en el worktree para no contaminar la carga masiva

## Variables necesarias

### Build Astro / Storefront

Crear `sites/distribuidor-miranda/.env.example` y configurar `.env` local/no commit:

```env
SHOPIFY_STORE_DOMAIN=distribuidor-miranda.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=<storefront_token>
SHOPIFY_API_VERSION=2026-04
SHOPIFY_CURRENCY_CODE=USD
SHOPIFY_LOCALE=es-EC
SHOPIFY_FEATURED_COLLECTIONS=
SHOPIFY_CHECKOUT_SAME_DOMAIN=false
SHOPIFY_CHECKOUT_SUBDOMAIN=checkout
```

### Cloudflare Worker secrets/bindings

```text
SHOPIFY_STORE_DOMAIN=distribuidor-miranda.myshopify.com
SHOPIFY_API_VERSION=2026-04
SHOPIFY_STOREFRONT_ACCESS_TOKEN=<secret>
WEBHOOK_SIGNING_SECRET=<secret>
DEPLOY_HOOK_URL=<optional>
GITHUB_DEPLOY_TOKEN=<optional only if GitHub dispatch>
SHOPIFY_REBUILD_DEBOUNCE_SECONDS=90
KV binding: SHOPIFY_CACHE
Assets binding: ASSETS -> ./dist
Durable Object optional: SHOPIFY_REBUILD_COORDINATOR -> ShopifyRebuildCoordinator
```

## Gates de calidad

### Gate A — Pre-flight

- `npm install` / `npm ci` funciona en `sites/distribuidor-miranda`
- `npm run build` actual falla solo por dependencias faltantes o errores conocidos, no por cambios nuevos
- Storefront token válido: query mínima a `shop { name }`

### Gate B — Build estático

- `npm run build` genera `sites/distribuidor-miranda/dist`
- `/dist/index.html` existe
- `search-index.json` existe si se implementa búsqueda
- No se commitea `.env`, `dist`, `node_modules`, reportes ni tokens

### Gate C — Worker local

- `wrangler dev` sirve assets y responde:
  - `GET /api/health`
  - `GET /api/products`
  - `GET /api/collections`
- Carrito crea checkout real con Storefront API

### Gate D — Deploy Cloudflare

- `wrangler deploy` o pipeline Cloudflare Pages/Workers pasa
- KV binding configurado
- Secrets configurados
- Webhook Shopify apunta a `/api/webhooks/shopify`

---

## Task 1: Preparar entorno del worktree

**Objective:** Dejar el worktree listo y seguro para trabajar sin tocar el proceso de carga masiva.

**Files:**
- Verify: `.gitignore`
- Create: `sites/distribuidor-miranda/.env.example`
- Create: `sites/distribuidor-miranda/worker/wrangler.jsonc` o `wrangler.jsonc`

**Steps:**
1. Confirmar branch/worktree con `git worktree list` y `git status --short`.
2. Crear `.env.example` sin secretos.
3. Verificar `.gitignore` incluye `.env`, `dist`, `node_modules`, `shopify-audit`, CSV/XLSX de inventario si no deben versionarse.
4. Ejecutar `npm install` en el sitio si falta `node_modules`.
5. Ejecutar build base para tener baseline.

**Verification:**

```bash
cd /home/k41h4ck3r/work/kinto-miranda/kinto-cms-distribuidor-shopify-worker/sites/distribuidor-miranda
npm install
npm run build
```

## Task 2: Crear helper de opciones Shopify para el sitio

**Objective:** Tener una fuente única local que traduce env/config del sitio a opciones de la skill.

**Files:**
- Create: `sites/distribuidor-miranda/src/lib/shopify-options.ts`
- Modify: `sites/distribuidor-miranda/config/site.config.ts` si hace falta alinear `apiVersion`

**Implementation sketch:**

```ts
import siteConfig from '../../config/site.config';

export const shopifyOptions = {
  storeDomain: import.meta.env.SHOPIFY_STORE_DOMAIN || siteConfig.shopify.storeDomain,
  storefrontAccessToken: import.meta.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || siteConfig.shopify.storefrontAccessToken,
  apiVersion: import.meta.env.SHOPIFY_API_VERSION || siteConfig.shopify.apiVersion,
  currencyCode: import.meta.env.SHOPIFY_CURRENCY_CODE || siteConfig.shopify.currencyCode,
  locale: import.meta.env.SHOPIFY_LOCALE || siteConfig.shopify.locale,
};

export function assertShopifyConfig() {
  if (!shopifyOptions.storeDomain) throw new Error('SHOPIFY_STORE_DOMAIN missing');
  if (!shopifyOptions.storefrontAccessToken) throw new Error('SHOPIFY_STOREFRONT_ACCESS_TOKEN missing');
}
```

**Verification:** build should fail clearly if token missing, or pass with `.env` present.

## Task 3: Migrar home a datos Shopify

**Objective:** Reemplazar productos/categorías mock en home con Shopify Storefront.

**Files:**
- Modify: `sites/distribuidor-miranda/src/pages/index.astro`

**Steps:**
1. Importar `fetchAllProducts`, `fetchAllCollections`, mappers/componentes de `@skills-official/shopify-ecommerce`.
2. Obtener productos/colecciones en build-time.
3. Mantener contenido de marca Distribuidor Miranda.
4. Usar `ProductCard` de la skill o adaptar card local al tipo Shopify.
5. Incluir `SearchOverlay` y `CartDrawer`.

**Verification:** `npm run build` genera home con productos Shopify reales.

## Task 4: Migrar rutas de producto a handles Shopify

**Objective:** Reemplazar `/producto/p1` por productos reales Shopify vía handle, manteniendo URL en español si se desea.

**Files:**
- Modify/Rename: `sites/distribuidor-miranda/src/pages/producto/[id].astro`

**Steps:**
1. Reinterpretar `[id]` como `handle`, o crear `[handle].astro` y redirect si conviene.
2. `getStaticPaths()` desde `fetchAllProducts`.
3. Renderizar `ProductGallery`, `ProductInfo`, `ProductSchema`, breadcrumb y carrito.
4. Probar productos con y sin precio/stock.

**Verification:** páginas `/producto/{handle}/` existen en `dist`.

## Task 5: Migrar catálogo/colecciones a Shopify

**Objective:** Reemplazar categorías locales por colecciones Shopify.

**Files:**
- Modify: `sites/distribuidor-miranda/src/pages/catalogo/[cat].astro`
- Modify: `Header.astro`, `Footer.astro`

**Steps:**
1. `getStaticPaths()` con `fetchAllCollections`.
2. Renderizar productos de colección con `CollectionHero` y `CollectionGrid`.
3. Adaptar header/footer para recibir colecciones o consumir lista generada.
4. Mantener rutas `/catalogo/{handle}`.

**Verification:** páginas `/catalogo/{handle}/` existen y muestran productos reales.

## Task 6: Crear search index Storefront

**Objective:** Habilitar búsqueda client-side sobre productos Shopify.

**Files:**
- Create: `sites/distribuidor-miranda/src/pages/search-index.json.ts`

**Steps:**
1. Copiar/adaptar ejemplo de `skills/official/shopify-ecommerce/example/pages/search-index.json.ts`.
2. Usar `fetchAllProducts`, `mapShopifyProduct`, `generateSearchIndex`.
3. Conectar `SearchOverlay`.

**Verification:** `/search-index.json` existe en build y contiene productos reales.

## Task 7: Worker Cloudflare para assets + APIs dinámicas

**Objective:** Servir `/dist` y `/api/*` con el Worker de la skill.

**Files:**
- Create: `sites/distribuidor-miranda/worker/index.ts` o usar import directo desde skill
- Create: `sites/distribuidor-miranda/wrangler.jsonc`
- Create: `sites/distribuidor-miranda/worker/package.json` si se aísla worker

**Steps:**
1. Configurar Worker entrypoint basado en `skills/official/shopify-ecommerce/worker/index.ts`.
2. Configurar assets directory `./dist`.
3. Configurar KV `SHOPIFY_CACHE`.
4. Configurar secrets.
5. Probar `wrangler dev`.

**Verification:** `GET /api/health` OK y rutas no-API sirven assets.

## Task 8: Webhooks y rebuild dinámico

**Objective:** Hacer que Shopify invalide cache y opcionalmente dispare rebuild/deploy.

**Files:**
- Worker config
- Shopify Admin webhook setup via script or manual

**Steps:**
1. Configurar `WEBHOOK_SIGNING_SECRET`.
2. Crear webhook Shopify para `/api/webhooks/shopify`.
3. Topics: products/collections/inventory.
4. Si hay deploy hook, configurar `DEPLOY_HOOK_URL`.
5. Durable Object opcional para debounce.

**Verification:** webhook test devuelve 2xx y KV se invalida.

## Task 9: Verificación final

**Objective:** Confirmar que la tienda funciona como estático + dinámico.

**Commands:**

```bash
npm run build
npx wrangler dev
curl http://localhost:8787/api/health
curl http://localhost:8787/api/products
```

**Checks:**
- Home renderiza productos Shopify.
- PDP renderiza imágenes/precios/stock/CTA.
- Catálogo renderiza colecciones.
- Search abre y busca.
- CartDrawer agrega producto y checkout URL funciona.
- Worker sirve assets desde `/dist`.
- Secrets no están versionados.

---

## Pendientes que debo pedirle a Camilo

- Token Storefront API si no está ya en `.env`.
- Cuenta/permiso Cloudflare: Account ID, nombre Worker, dominio/ruta deseada.
- KV namespace o permiso para crearlo con Wrangler.
- Webhook signing secret deseado o permiso para generarlo.
- Deploy hook si quiere rebuild automático.
- Confirmar dominio final: `distribuidormiranda.ec` y subdominio checkout si aplica.
