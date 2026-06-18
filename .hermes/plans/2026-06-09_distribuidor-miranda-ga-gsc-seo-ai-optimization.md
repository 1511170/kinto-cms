# Distribuidor Miranda — GA4 + Search Console + SEO Local + AI Citations Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task after Camilo provides Google/GA/GSC access. Keep Shopify image backfill running independently.

**Goal:** Conectar Distribuidor Miranda a medición completa (GA4/GTM/Search Console), activar auditorías CLI y optimizar el sitio para Google, SEO local Ecuador y motores de respuesta IA (ChatGPT, Gemini, Grok, Claude, Perplexity, etc.).

**Architecture:** Mantener el sitio KINTO/Astro estático-first, con tracking configurable por `.env`/`site.config.ts`, scripts CLI propios bajo `scripts/google/` y `scripts/seo/`, y datos estructurados JSON-LD por layout/página. Shopify Admin API queda como fuente para productos/SEO; Google APIs quedan para métricas, inspección URL y monitoreo.

**Tech Stack:** Astro 5, KINTO CMS, Shopify Storefront/Admin API, Cloudflare Worker/Assets, GA4/GTM, Google Search Console API, GA4 Data API, Node.js ESM zero-deps para scripts Shopify/SEO, Python solo para OAuth Google si se reutiliza Hermes google-workspace.

---

## Current State Snapshot — 2026-06-09

- Sitio: `sites/distribuidor-miranda`
- Dominio público configurado: `https://distribuidormiranda.ec`
- Shopify store: `distribuidor-miranda.myshopify.com`
- `Layout.astro` ya tiene SEO base: title, description, canonical, robots, Open Graph, Twitter Card.
- `Layout.astro` ya referencia `/llms.txt`, pero el archivo no existe aún.
- No se detectó GA4/GTM/gtag/Search Console en código.
- No se detectó `robots.txt`, `sitemap.xml`, `llms.txt` ni rutas Astro que los generen.
- `config/site.config.ts` ya tiene campos vacíos:
  - `shopify.tracking.littledataTrackerId`
  - `shopify.tracking.gaMeasurementId`
  - `shopify.tracking.gtmContainerId`
- Hermes Google Workspace no está autenticado: `NOT_AUTHENTICATED`.
- No hay `gws` ni `gcloud`; sí hay `npm`/`npx`.
- Proceso de imágenes Shopify/Yandex sigue corriendo aparte.

---

## Phase 1 — Tracking Base: GA4/GTM/Littledata

### Task 1.1: Add analytics config aliases

**Objective:** Leer IDs desde `.env` sin hardcodear y sin commitear secretos/config privada.

**Files:**
- Modify: `sites/distribuidor-miranda/config/site.config.ts`
- Modify: `sites/distribuidor-miranda/.env.example`
- Do not commit: `sites/distribuidor-miranda/.env`

**Implementation:**

Add/normalize env-backed values:

```ts
tracking: {
  littledataTrackerId: process.env.LITTLEDATA_TRACKER_ID || '',
  gaMeasurementId: process.env.GA4_MEASUREMENT_ID || process.env.GOOGLE_ANALYTICS_ID || '',
  gtmContainerId: process.env.GTM_CONTAINER_ID || '',
}
```

Add to `.env.example`:

```env
# Analytics / Tracking
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GTM_CONTAINER_ID=GTM-XXXXXXX
LITTLEDATA_TRACKER_ID=
GOOGLE_SITE_VERIFICATION=
GOOGLE_SEARCH_CONSOLE_SITE_URL=https://distribuidormiranda.ec/
GA4_PROPERTY_ID=
```

**Verification:**

```bash
cd sites/distribuidor-miranda
npm run build
```

Expected: build succeeds; no tracking script appears unless IDs are set.

---

### Task 1.2: Create Analytics.astro component

**Objective:** Inyectar GA4 or GTM only when configured.

**Files:**
- Create: `sites/distribuidor-miranda/src/components/Analytics.astro`
- Modify: `sites/distribuidor-miranda/src/layouts/Layout.astro`

**Implementation:**

Component behavior:
- If `gtmContainerId` exists, inject GTM `<script>` in `<head>` and `<noscript>` in body.
- Else if `gaMeasurementId` exists, inject GA4 `gtag.js`.
- Add consent-safe defaults later if needed.
- Track ecommerce events from cart/product buttons after the first baseline deploy.

**Verification:**

```bash
GA4_MEASUREMENT_ID=G-TEST123 npm run build
rg "G-TEST123|gtag" dist/
GTM_CONTAINER_ID=GTM-TEST123 npm run build
rg "GTM-TEST123|googletagmanager" dist/
```

---

### Task 1.3: Add ecommerce event hooks

**Objective:** Medir búsquedas, clics a producto, add-to-cart, checkout y WhatsApp/mail quote.

**Files:**
- Modify: `src/components/ProductCard.astro`
- Modify: `src/pages/producto/[id].astro`
- Modify: `src/components/SearchBar.astro`
- Modify: `src/components/CartDrawer` integration only if needed through local wrapper, not core skill edit.

**Events:**

```text
view_item
select_item
search
add_to_cart
begin_checkout
generate_lead / quote_request
whatsapp_click
email_quote_click
filter_apply
```

**Rule:** Use SKU, product handle, category, vendor and availability. Do not send PII.

**Verification:** Browser console with debug mode and GA DebugView after real GA4 ID is installed.

---

## Phase 2 — Google CLI Connection Layer

### Task 2.1: Google OAuth setup for Hermes

**Objective:** Conectar Hermes con Google APIs para Search Console/GA4 reports.

**Need from Camilo:** one of these:

1. OAuth Desktop client JSON from Google Cloud Console, or
2. Existing Google Cloud project/client credentials, or
3. Service account JSON if GA/GSC permissions are granted to that service account.

**Recommended APIs to enable:**

```text
Google Search Console API
Google Analytics Data API
Google Analytics Admin API
Google Indexing API (optional; not generally for ecommerce product pages)
Google Business Profile APIs (optional, if business profile access is available)
Google Drive/Sheets APIs (for market research docs and keyword sheets)
```

**Hermes setup command:**

```bash
GSETUP="python ${HERMES_HOME:-$HOME/.hermes}/skills/productivity/google-workspace/scripts/setup.py"
$GSETUP --client-secret /path/to/google_client_secret.json
$GSETUP --auth-url --services drive,sheets,docs --format json
$GSETUP --auth-code "PASTED_REDIRECT_URL" --format json
$GSETUP --check
```

**Note:** Hermes google-workspace does not include GA/GSC commands yet, so use it for OAuth/Drive docs and create custom GA/GSC CLI below.

---

### Task 2.2: Create custom `scripts/google/google-cli.mjs`

**Objective:** Tener CLI propio para GA4 + Search Console, siguiendo preferencia de Camilo: conectarse por CLI a plataformas.

**Files:**
- Create: `sites/distribuidor-miranda/scripts/google/google-cli.mjs`
- Create: `sites/distribuidor-miranda/scripts/google/google-oauth.mjs` if Node OAuth is preferred over Python.
- Create: `sites/distribuidor-miranda/docs/google/README.md`

**Commands planned:**

```bash
node scripts/google/google-cli.mjs auth:check
node scripts/google/google-cli.mjs gsc:sites
node scripts/google/google-cli.mjs gsc:query --site=https://distribuidormiranda.ec/ --days=28
node scripts/google/google-cli.mjs gsc:index-inspect --url=https://distribuidormiranda.ec/
node scripts/google/google-cli.mjs gsc:sitemaps:list
node scripts/google/google-cli.mjs gsc:sitemaps:submit --sitemap=https://distribuidormiranda.ec/sitemap-index.xml
node scripts/google/google-cli.mjs ga4:properties
node scripts/google/google-cli.mjs ga4:report --property=$GA4_PROPERTY_ID --days=28
node scripts/google/google-cli.mjs ga4:realtime --property=$GA4_PROPERTY_ID
```

**Outputs:** JSON files under:

```text
docs/audits/google/gsc-performance-YYYY-MM-DD.json
docs/audits/google/gsc-index-YYYY-MM-DD.json
docs/audits/google/ga4-report-YYYY-MM-DD.json
```

**Verification:** CLI returns JSON and exits non-zero on auth/API failures.

---

## Phase 3 — Search Console Setup + Technical SEO

### Task 3.1: Site verification meta tag

**Objective:** Permitir verificación de Google Search Console por meta tag if DNS/file verification is not used.

**Files:**
- Modify: `src/layouts/Layout.astro`
- Modify: `config/site.config.ts`

**Implementation:**

Add:

```astro
{siteConfig.site.googleSiteVerification && (
  <meta name="google-site-verification" content={siteConfig.site.googleSiteVerification} />
)}
```

Config reads `GOOGLE_SITE_VERIFICATION`.

---

### Task 3.2: Generate robots.txt

**Objective:** Bloquear nada importante y declarar sitemap.

**Files:**
- Create: `src/pages/robots.txt.ts`

**Content:**

```text
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /cart/
Sitemap: https://distribuidormiranda.ec/sitemap-index.xml
```

**Verification:**

```bash
npm run build
cat dist/robots.txt
```

---

### Task 3.3: Generate sitemap index + paginated product sitemaps

**Objective:** Soportar ~11.800 productos sin un sitemap gigante único.

**Files:**
- Create: `src/pages/sitemap-index.xml.ts`
- Create: `src/pages/sitemaps/products/[page].xml.ts`
- Create: `src/pages/sitemaps/collections.xml.ts`
- Create: `src/pages/sitemaps/static.xml.ts`

**Rules:**
- Max 2.000 URLs por product sitemap.
- Include product URL, collection URL, home, catalogo/todos.
- Use Shopify product `updatedAt` if available; otherwise build date.
- Include images later if product image data is reliable.

**Verification:**

```bash
npm run build
curl -s http://localhost:4321/sitemap-index.xml | head
```

---

### Task 3.4: Submit sitemap to GSC CLI

**Objective:** Después del deploy, enviar sitemap a Search Console y guardar resultado.

**Command:**

```bash
node scripts/google/google-cli.mjs gsc:sitemaps:submit --site=https://distribuidormiranda.ec/ --sitemap=https://distribuidormiranda.ec/sitemap-index.xml
```

**Verification:**

```bash
node scripts/google/google-cli.mjs gsc:sitemaps:list --site=https://distribuidormiranda.ec/
```

---

## Phase 4 — Structured Data / Schema.org

### Task 4.1: Organization + LocalBusiness + AutoPartsStore schema

**Objective:** Dejar claro para Google/IA que Distribuidor Miranda vende autopartes en Ecuador.

**Files:**
- Create: `src/components/StructuredData.astro`
- Modify: `src/layouts/Layout.astro`

**Schema types:**

```text
Organization
LocalBusiness
AutoPartsStore
WebSite
SearchAction
```

**Local SEO fields:**
- Name: Distribuidor Miranda
- Country: Ecuador
- Area served: Ecuador, Guayaquil, Quito, Cuenca, Manta, Ambato, Santo Domingo, Machala, Portoviejo.
- Product categories: repuestos de colisión, iluminación, refrigeración, carrocería, guardachoques, capots, radiadores, faros/silvines, espejos.
- Phone/WhatsApp/email must be confirmed before hardcoding.

---

### Task 4.2: Product schema on product pages

**Objective:** Cada producto debe tener JSON-LD `Product` con SKU, marca, categoría, imagen y oferta/cotización.

**Files:**
- Modify: `src/pages/producto/[id].astro`
- Create helper: `src/lib/seo/schema.ts`

**Fields:**

```text
@type: Product
name
description
sku
mpn if SKU/OEM available
brand
category
image
offers: price/currency/availability/url when price > 0
seller: Distribuidor Miranda
areaServed: Ecuador
```

**Verification:** Use Rich Results Test manually and local HTML grep.

---

### Task 4.3: CollectionPage + Breadcrumb schema

**Objective:** Categorías/colecciones deben ser entendibles y citables.

**Files:**
- Modify: `src/pages/catalogo/[cat].astro`
- Create helper: `src/lib/seo/schema.ts`

**Schema types:**

```text
CollectionPage
ItemList
BreadcrumbList
```

---

## Phase 5 — Programmatic SEO for Ecuador

### Task 5.1: Product SEO template upgrade

**Objective:** Mejorar title/description por producto de forma consistente.

**Pattern examples:**

```text
Title: {pieza} {marca/vehiculo} {sku} en Ecuador | Distribuidor Miranda
Description: Compra/cotiza {pieza} SKU {sku} para {aplicaciones}. Repuestos de colisión, iluminación y refrigeración con despacho en Ecuador.
```

**Files:**
- Modify: `src/pages/producto/[id].astro`
- Modify: Shopify SEO update script or create `scripts/shopify/backfill-product-seo.mjs`

**Important:** For Shopify SEO fields, use Admin API and checkpoint; do not overwrite hand-written SEO if already strong unless `--force`.

---

### Task 5.2: Collection/category SEO templates

**Objective:** Optimizar colecciones para búsquedas como “guardachoques Chevrolet Ecuador”, “radiador Toyota Ecuador”.

**Files:**
- Modify: `src/pages/catalogo/[cat].astro`
- Create: `scripts/shopify/backfill-collection-seo.mjs`

**Output audit:**

```text
docs/audits/seo/collections-seo-audit.json
```

---

### Task 5.3: Local landing pages

**Objective:** Crear páginas estratégicas para SEO local sin spam.

**Files:**
- Create: `src/pages/repuestos/[ciudad].astro`
- Create: `src/data/seo/ecuador-cities.ts`

**Cities initial:**

```text
Guayaquil
Quito
Cuenca
Manta
Ambato
Santo Domingo
Machala
Portoviejo
Loja
Ibarra
```

**Content rule:** Each page must have useful copy, category links, WhatsApp/contact, shipping promise, no keyword stuffing.

---

### Task 5.4: Vehicle + part intent pages

**Objective:** Capturar búsquedas tipo “dónde conseguir faro para Aveo en Ecuador”.

**Files:**
- Create: `src/pages/repuestos/[marca]/[tipo].astro`
- Generate only high-volume / high-inventory combinations from Shopify data.

**Examples:**

```text
/repuestos/chevrolet/faros/
/repuestos/hyundai/guardachoques/
/repuestos/toyota/radiadores/
/repuestos/kia/espejos/
```

---

## Phase 6 — AI Search / GEO / LLM Citations

### Task 6.1: Create llms.txt

**Objective:** Dar a motores IA una ficha limpia y citables del negocio.

**Files:**
- Create: `src/pages/llms.txt.ts`

**Content sections:**

```text
# Distribuidor Miranda
Official site
Business summary
Products and categories
Service area: Ecuador
How to buy/cotizar
Important URLs
Contact
Data freshness note
```

---

### Task 6.2: Create AI citation facts page

**Objective:** Página HTML para que bots/IA entiendan la entidad y oferta.

**Files:**
- Create: `src/pages/sobre-distribuidor-miranda.astro`
- Link from footer.

**Content:**
- Quiénes somos.
- Qué vendemos.
- Marcas/vehículos/categorías.
- Cobertura Ecuador.
- Cómo verificar compatibilidad.
- Política de disponibilidad/fotos/VIN.

---

### Task 6.3: Add machine-readable catalog summary

**Objective:** Exponer resumen no sensible del catálogo para citación y monitoreo.

**Files:**
- Create: `src/pages/catalogo-resumen.json.ts`

**Includes:**

```json
{
  "business": "Distribuidor Miranda",
  "country": "Ecuador",
  "categories": [...],
  "productCount": 11800,
  "updatedAt": "...",
  "topBrands": [...],
  "contactUrl": "..."
}
```

---

## Phase 7 — SEO Audits and Monitoring

### Task 7.1: Build local SEO audit CLI

**Objective:** Auditar todas las páginas generadas antes/después de deploy.

**Files:**
- Create: `scripts/seo/audit-built-site.mjs`

**Checks:**

```text
title exists and length sane
description exists and length sane
canonical exists and matches domain
robots index/follow where expected
OG tags exist
JSON-LD parses
Product pages have Product schema
Collection pages have CollectionPage/ItemList schema
Images have alt text
No placeholder image when Shopify image exists
No duplicate titles across top N pages
```

**Output:**

```text
docs/audits/seo/site-seo-audit-YYYY-MM-DD.json
docs/audits/seo/site-seo-issues-YYYY-MM-DD.csv
```

---

### Task 7.2: GA4/GSC weekly monitor

**Objective:** Reporte recurrente de performance e indexación.

**Metrics:**

```text
GSC: clicks, impressions, CTR, avg position by query/page
GSC: pages not indexed / indexed count via URL inspection sample
GA4: users, sessions, conversions, search events, add_to_cart, checkout
SEO gaps: pages with impressions but low CTR, ranking positions 8-20, missing schema/images
```

**Potential cron:**

```text
Weekly Monday 08:00 America/Guayaquil -> send Telegram report to Camilo
```

Only create cron after Google auth is complete and Camilo approves.

---

## Phase 8 — Research Inputs from Ahrefs/Semrush/etc.

### Task 8.1: Research ingestion folder

**Objective:** Cuando Camilo pase documentos de investigación, convertirlos en acciones SEO.

**Files:**
- Create folder: `sites/distribuidor-miranda/docs/research/`
- Create script: `scripts/seo/ingest-keyword-research.mjs`

**Accepted inputs:**

```text
CSV/XLSX/PDF/Markdown from Ahrefs, Semrush, Google Keyword Planner, Search Console exports, competitor sheets.
```

**Output:**

```text
docs/research/keyword-map.json
docs/research/content-priorities.md
docs/audits/seo/keyword-to-url-map.csv
```

**Mapping rules:**
- Keyword intent -> product page / collection / local landing / vehicle+part landing.
- Ecuador modifiers prioritized.
- Avoid thin pages; create pages only when inventory and search intent justify them.

---

## Access / Data Needed from Camilo

For full connection, need these values or files:

1. **GA4 Measurement ID**: `G-XXXXXXXXXX`.
2. **GA4 Property ID**: numeric ID for reporting API.
3. **GTM Container ID** if using GTM: `GTM-XXXXXXX`.
4. **Google Search Console property**: ideally domain property for `distribuidormiranda.ec`, or URL property `https://distribuidormiranda.ec/`.
5. **Google OAuth Desktop JSON** or Service Account JSON with access to GA4/GSC.
6. **Search Console verification token** if meta-tag verification is chosen.
7. Confirm business contact data for schema:
   - WhatsApp/phone
   - business email
   - physical address or service-area-only wording
   - social profiles
   - opening hours if any
8. Market research docs from Ahrefs/Semrush/other platforms.

---

## Immediate Implementation Order

1. Keep image backfill running until complete.
2. Implement config/env + Analytics component + no-ID-safe build.
3. Add robots.txt + sitemap index + product/collection sitemaps.
4. Add `llms.txt` + Organization/LocalBusiness schema.
5. Add Product/Collection/Breadcrumb schema.
6. Deploy and verify production HTML.
7. Complete Google OAuth/GSC/GA4 CLI once Camilo provides Google credentials.
8. Submit sitemap to Search Console.
9. Run first SEO audit + GSC baseline.
10. Use research docs to prioritize local/vehicle/category landing pages.

---

## Success Criteria

- GA4/GTM installed and visible in production source.
- GA4 realtime receives visits/events.
- Search Console property verified.
- Sitemap index submitted and accepted.
- `robots.txt`, `llms.txt`, sitemaps and schema live.
- Product pages expose Product JSON-LD.
- Collection pages expose CollectionPage/ItemList/Breadcrumb JSON-LD.
- SEO audit report has no critical failures.
- Weekly CLI report can show GSC + GA4 metrics.
- AI-citation surfaces have clear brand/entity facts and canonical URLs.

---

## Notes

- Do not claim “SEO complete” after adding tags only. SEO completion requires: deploy, crawlability, Search Console verification, sitemap submission, structured data validation, and baseline monitoring.
- Do not spam thousands of thin landing pages. Generate programmatic SEO pages only where inventory + query intent justify them.
- Do not commit tokens, Google credential JSON, `.env`, `.cf.env`, or OAuth token files.
- Prefer CLI/API integrations over dashboards where possible, matching Camilo’s workflow preference.
