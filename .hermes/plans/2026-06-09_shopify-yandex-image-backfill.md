# Shopify Yandex Image Backfill Implementation Plan

> **For Hermes:** Implement directly in small commits; do not replace existing images unless Camilo explicitly requests it.

**Goal:** Completar automáticamente las imágenes faltantes de todos los productos Shopify de Distribuidor Miranda usando búsqueda Yandex y subida REST a Shopify, para que el sitio web deje de mostrar placeholders.

**Architecture:** Crear un runner Node.js ESM, sin dependencias npm, que consulta Admin API 2025-01, filtra productos sin imágenes, busca candidatos en Yandex, prueba varios URLs por producto, sube la primera imagen aceptada a Shopify, guarda checkpoint/reportes y permite reanudar por offset/límite. El storefront ya consume imágenes desde Shopify, así que después de cargar imágenes basta auditar/build/deploy para verlas.

**Tech Stack:** Node.js ESM, módulos nativos `https`, `fs`, `path`, `url`; Shopify Admin REST/GraphQL API 2025-01; Yandex Images HTML scrape; Astro build; Cloudflare Worker deploy.

---

## Current Context

- Build actual: 11.808 productos.
- Con imagen principal: 552.
- Sin imagen/placeholder: 11.256.
- Categorías visibles como `espejos`, `silvin`, `guardachoques`, `radiadores`, `capot` muestran 0 imágenes en las primeras cards porque esos productos no tienen imagen en Shopify.
- Hay scripts previos:
  - `sites/distribuidor-miranda/scripts/utils/update-current-products-seo-images.js`
  - `sites/distribuidor-miranda/scripts/utils/upload-products-from-csv-yandex.js`
- Problema del script viejo: está mezclado con SEO/body/product upsert y busca `.env` en `scripts/utils/.env`; para esta tarea conviene un runner dedicado a imágenes faltantes.

---

## Task 1: Crear runner dedicado `backfill-missing-images-yandex.js`

**Objective:** Implementar un script reutilizable y resumible que solo agregue imágenes a productos sin imagen.

**Files:**
- Create: `sites/distribuidor-miranda/scripts/shopify/backfill-missing-images-yandex.js`

**Requirements:**
- Leer credenciales desde:
  - `sites/distribuidor-miranda/.env`
  - opcionalmente `scripts/shopify/.env`
  - variables de entorno del proceso
- Soportar claves:
  - `SHOPIFY_STORE` o `SHOPIFY_STORE_DOMAIN`
  - `SHOPIFY_ACCESS_TOKEN` o `SHOPIFY_ADMIN_ACCESS_TOKEN`
- No imprimir secretos.
- Consultar todos los productos con GraphQL:
  - id, legacyResourceId, title, handle, productType, vendor, variants sku, images/featuredMedia.
- Filtrar productos sin imágenes.
- Soportar CLI:
  - `--dry-run`
  - `--apply`
  - `--limit=N`
  - `--offset=N`
  - `--delay-ms=N`
  - `--max-candidates=N`
  - `--only-product-type=Texto`
  - `--checkpoint=path`
  - `--retry-failed`
- Buscar candidatos con Yandex usando query:
  - `<sku> <title> <vendor>`
  - fallback: `<sku> <title>`
  - fallback: `<title> repuesto automotriz`
- Filtrar URLs malas:
  - logo, favicon, sprite, placeholder, no-image, svg, webp thumbnails dudosos, vpn, base64.
- Probar varios candidatos por producto.
- Subir con REST:
  - `POST /admin/api/2025-01/products/{productId}/images.json`
  - body `{ image: { src, alt } }`
- Guardar JSONL de progreso por fila.
- Guardar summary JSON final.

**Verification:**

```bash
node sites/distribuidor-miranda/scripts/shopify/backfill-missing-images-yandex.js --dry-run --limit=3
```

Expected:
- No modifica Shopify.
- Lista productos sin imagen.
- Muestra candidatos encontrados o `no_candidates`.
- Escribe reporte en `docs/audits/image-backfill/`.

---

## Task 2: Ejecutar dry-run pequeño

**Objective:** Confirmar que el motor consulta Shopify/Yandex sin errores y que no toca productos.

**Command:**

```bash
cd sites/distribuidor-miranda
node scripts/shopify/backfill-missing-images-yandex.js --dry-run --limit=5 --max-candidates=5
```

**Expected:**
- `mode: dry-run`
- `processed: 5`
- `wouldUpload` en productos con candidato.
- 0 writes a Shopify.

---

## Task 3: Ejecutar apply piloto

**Objective:** Subir imágenes a un lote controlado antes de correr masivo.

**Command:**

```bash
cd sites/distribuidor-miranda
node scripts/shopify/backfill-missing-images-yandex.js --apply --limit=10 --max-candidates=5 --delay-ms=800
```

**Expected:**
- Productos sin imagen reciben una imagen Shopify.
- Errores 422 por URL remota fallida no detienen el lote; prueba el siguiente candidato.
- Reporte JSONL contiene `uploaded` o `failed` por producto.

---

## Task 4: Auditar después del piloto

**Objective:** Confirmar disminución real de productos sin imagen.

**Commands:**

```bash
cd sites/distribuidor-miranda
node scripts/shopify/catalog-image-audit.js
npm run build
```

**Expected:**
- `productsMissingImage` baja al menos por la cantidad de subidas exitosas.
- Build pasa y el HTML generado muestra más `has-real-image`.

---

## Task 5: Ejecutar job masivo autónomo en background

**Objective:** Completar las 11.256 imágenes restantes sin perder progreso.

**Command pattern:**

```bash
cd sites/distribuidor-miranda
node scripts/shopify/backfill-missing-images-yandex.js --apply --max-candidates=5 --delay-ms=900
```

**Execution mode:**
- Ejecutar con Hermes `terminal(background=true, notify_on_complete=true)` para que el proceso siga corriendo y notifique al terminar.
- Si se corta, reanudar con `--checkpoint=<último-jsonl>` o usando `--offset` según summary.

---

## Task 6: Build y deploy final

**Objective:** Hacer visible el resultado en el storefront.

**Commands:**

```bash
cd sites/distribuidor-miranda
npm run build
set -a; source .cf.env; set +a; npx wrangler deploy
```

**Verification:**
- Abrir:
  - `/catalogo/silvin/`
  - `/catalogo/guardachoques/`
  - `/catalogo/radiadores/`
  - `/catalogo/capot/`
  - `/catalogo/espejos/`
- Confirmar cards con imagen real.
- Confirmar `/api/products` refleja imágenes.

---

## Risks and Mitigations

- **Yandex devuelve imágenes incorrectas:** priorizar SKU en query, usar varios candidatos, no reemplazar existentes, reportar URL fuente.
- **Shopify no puede descargar algunas URLs:** probar hasta 5 candidatos; marcar `image_upload_failed` y seguir.
- **Rate limits:** delay configurable 800–1200ms; sleeps entre GraphQL/Yandex/REST.
- **Proceso largo:** JSONL checkpoint por producto, resumible.
- **Credenciales faltantes:** script falla temprano sin imprimir secretos.
- **Imágenes legal/calidad variable:** para B2B catálogo, se usa como enriquecimiento automático; conservar reporte para revisión posterior.

---

## Commit Plan

1. `docs: add Shopify Yandex image backfill plan`
2. `feat: add resumable Yandex image backfill runner`
3. `chore: record image backfill pilot report`
4. `chore: deploy image backfill storefront update`
