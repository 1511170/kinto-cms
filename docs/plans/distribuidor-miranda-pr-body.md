## Resumen

Este PR integra la storefront completa de Distribuidor Miranda sobre KINTO CMS + Astro + Shopify + Cloudflare Workers, incluyendo las mejoras recientes de catálogo móvil, carrito, páginas de producto, marca real de repuesto, SEO/GEO y verificación automatizada.

## Cambios principales

### Storefront KINTO + Shopify
- Añade el sitio `sites/distribuidor-miranda/` con Astro, Tailwind/CSS custom y configuración ecommerce.
- Integra catálogo Shopify Storefront API y Worker Cloudflare con endpoints de productos, colecciones, carrito, webhooks/cache y assets estáticos.
- Añade configuración `wrangler.jsonc`, Worker routes, health checks y scripts de deploy/verificación.

### Catálogo y navegación
- Catálogo completo con rutas `/catalogo/[cat]/` y `/producto/[id]/`.
- Paginación/filtrado para catálogo grande.
- Mega menú agrupado por intención de compra para autopartes.
- Shortcuts de subcategorías vía filtros `?q=` sin crear rutas/colecciones innecesarias.
- Alias de taxonomía para evitar categorías duplicadas y mostrar nombres amigables.

### UX móvil
- Rediseña header móvil para que no ocupe casi toda la pantalla.
- Convierte mega menú móvil en sheet compacto.
- Mantiene catálogo móvil en 2 columnas cuando el ancho lo permite.
- Añade script de auditoría móvil `scripts/mobile-audit.mjs` para medir:
  - alto de header
  - % de viewport usado
  - primer producto visible
  - overflow horizontal
  - productos visibles en primer viewport
  - screenshots before/after

### Carrito y checkout
- Integra `CartDrawer` como dueño único del flujo add-to-cart.
- Evita redirects directos a checkout desde cards/product pages.
- Product cards y páginas de producto despachan/usan el flujo centralizado.
- Checkout solo ocurre desde el drawer.
- Copy localizado para Ecuador: envío nacional, múltiples medios de pago, tarjeta/transferencia/pago contra entrega.

### Página de producto
- Corrige `Agregar al carrito` en producto:
  - si hay variante vendible, agrega al carrito y abre drawer
  - si el producto requiere consulta de stock/precio, muestra `Cotizar disponibilidad` y va a WhatsApp
- Corrige selector de unidades:
  - input editable `type="number"`
  - botones `+`/`−`
  - lectura correcta de cantidad para carrito/compra
- Muestra marca real/inferida del repuesto en una tarjeta visible, separando:
  - marca del repuesto: TYC, DEPO, KRC, GM, Mobis, Maxfit, etc.
  - vendedor/importador: Distribuidor Miranda

### SEO/GEO/AI citations
- Product JSON-LD enriquecido con `brand` del repuesto y `seller` Distribuidor Miranda.
- Category/collection pages con schema y breadcrumbs.
- Landings SEO por marca/categoría.
- `llms.txt`, `llms-full.txt`, sitemap index y sitemaps segmentados.
- Integración de Analytics/Search Console scripts y eventos ecommerce.

### Limpieza de copy interno
- Elimina copy visible de cliente tipo:
  - `Shop Pay`
  - `Shopify`
  - `Pago via Shopify`
  - `Checkout Shopify`
  - `Collection Shopify`
  - variantes mal transcritas tipo `chopey` / `checa 8 p5`
- Reemplaza por mensajes locales de pago/envío.

### QA, auditorías y scripts
- Añade script `scripts/product-cart-qa.mjs` para verificar:
  - botón de producto
  - variant id
  - cantidad editable
  - marca visible
  - ausencia de copy Shop Pay/Shopify
  - add-to-cart en colección
  - drawer abierto y cart id
- Añade auditorías de catálogo, imágenes, productos sin colección y taxonomía Shopify.
- Añade scripts de backfill/verificación de Shopify y Cloudflare.

## Verificación realizada

### Build
- `npm run build` en `sites/distribuidor-miranda` completado correctamente.
- Astro generó catálogo, productos, landings y sitemaps.

### Deploy producción
- Worker desplegado correctamente con assets Cloudflare.
- Último deploy verificado:
  - Worker: `distribuidor-miranda-storefront`
  - Version ID: `a427ed0a-863f-407d-8d08-5a20dd6690e9`

### QA producción producto
Producto probado:
`/producto/neblinero-chevrolet-aveo-emotion-08-18-optra-advance-lh-tyc/`

Resultado:
- Marca visible: `TYC`
- Cantidad editable: sí
- `+` sube de 1 a 2
- escritura manual permite 3
- producto sin disponibilidad real muestra `Cotizar disponibilidad`
- no expone variante para carrito roto
- redirige a WhatsApp para cotización
- sin overflow horizontal
- sin copy visible `Shop Pay`/`Shopify`

### QA producción colección
Colección probada:
`/catalogo/silvin/?q=neblinero`

Resultado:
- botón `Agregar al carrito` visible funciona
- cart id creado
- drawer abre correctamente
- 1 producto / 1 unidad
- subtotal correcto
- copy local de pagos/envío correcto

## Notas

- Este PR incluye una integración amplia del sitio Distribuidor Miranda, no solo un fix aislado.
- Algunos archivos de auditoría generados localmente quedaron sin trackear y no fueron incluidos si no pertenecían directamente al PR.
- Tokens reales y secrets no se commitean; se usan `.env`, Worker secrets o variables Cloudflare.

## Checklist

- [x] Build Astro pasa
- [x] Deploy Cloudflare Worker probado
- [x] Producto con consulta de stock no rompe carrito
- [x] Colección sigue agregando al carrito
- [x] Cantidad editable en página de producto
- [x] Marca real de repuesto visible
- [x] Seller separado como Distribuidor Miranda
- [x] Copy Shop Pay/Shopify eliminado de UI cliente
- [x] QA script agregado
- [x] Plan/documentación incluida
