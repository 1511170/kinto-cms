---
name: shopify-ecommerce
category: official
version: 1.0.0
description: Storefront headless de Shopify — catálogo, carrito, checkout, búsqueda y SEO vía Worker de Cloudflare
tags: [ecommerce, shopify, cloudflare, search, seo]
requires: []
needs: [shopify, cloudflare-kv]
recommendedFor: [ecommerce]
---

# shopify-ecommerce Skill

Headless Shopify storefront integration for KINTO CMS. Provides product catalog, cart, checkout, search, SEO structured data, and analytics tracking via a Cloudflare Worker API proxy.

## What It Does

- Fetches products and collections from Shopify Storefront API at build time (static HTML)
- Proxies runtime API calls (cart, stock verification) through a Cloudflare Worker with KV cache
- Redirects to Shopify's hosted checkout (same root domain for Littledata tracking)
- Generates a client-side search index using MiniSearch
- Emits structured data (Product, Organization, BreadcrumbList) for SEO and AI citations
- Integrates Littledata Pixel + GTM for server-side analytics
- Debounces Shopify product/collection/inventory webhooks through a Durable Object before triggering rebuilds

## Architecture

```
www.domain.co (Cloudflare Worker)
  ├── Static pages (Astro SSG /dist) ← served by Worker assets binding
  ├── /api/* ← Worker proxy → Shopify Storefront API (KV cached)
  ├── /api/webhooks/shopify → KV invalidation + debounced rebuild queue
  └── /search-index.json ← build-time generated product index

domain.co ← Shopify hosted checkout (same root domain)
```

## Installation

```bash
kinto skill add shopify-ecommerce --site=<sitio>
```

Then configure `config/site.config.ts` with your Shopify settings and deploy the Worker.

## Required Configuration

In `config/site.config.ts`:

```typescript
shopify: {
  storeDomain: 'your-store.myshopify.com',
  storefrontAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  apiVersion: '2026-04',
  currencyCode: 'USD',
  locale: 'en-US',
  collections: { featured: ['collection-handle-1', 'collection-handle-2'] },
  tracking: {
    littledataTrackerId: 'xxx',
    gaMeasurementId: 'G-XXXXXX',
    gtmContainerId: 'GTM-XXXX',
  },
}
```

Environment variable: `SHOPIFY_STOREFRONT_ACCESS_TOKEN` (set in CI/CD and as Worker secret).

## Worker Webhooks and Rebuilds

Webhook secrets:

- `WEBHOOK_SIGNING_SECRET`: Shopify webhook signing secret.
- `DEPLOY_HOOK_URL`: Cloudflare deploy hook or GitHub repository_dispatch endpoint.
- `GITHUB_DEPLOY_TOKEN`: required when `DEPLOY_HOOK_URL` points at GitHub API.

Durable Object debounce binding:

```jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "SHOPIFY_REBUILD_COORDINATOR",
        "class_name": "ShopifyRebuildCoordinator",
      },
    ],
  },
  "migrations": [
    {
      "tag": "v1_shopify_rebuild_coordinator",
      "new_sqlite_classes": ["ShopifyRebuildCoordinator"],
    },
  ],
  "vars": {
    "SHOPIFY_REBUILD_DEBOUNCE_SECONDS": "90",
  },
}
```

If `SHOPIFY_REBUILD_COORDINATOR` is not configured, webhooks keep the legacy behavior and trigger the deploy hook directly.

## Catalog Enrichment

Use the enrichment scripts when product titles, technical metafields, filters, FAQs, and AI citations need to be improved from benchmark/public data.

```bash
# 1. Crawl public benchmark pages into a reviewable JSON dataset.
node skills/community/web-scraper/scripts/sitemap-products.cjs \
  --sitemap=https://www.macrotics.com/sitemap.xml \
  --output=data/macrotics-products.json \
  --include=ubiquiti,mikrotik,tp-link,mimosa,cambium,ruijie,tenda \
  --maxPages=500

# 2. Export current Shopify products with product IDs.
node skills/official/shopify-ecommerce/scripts/export-products.mjs \
  --envFile=sites/<sitio>/.env \
  --output=data/catalog-products.json

# 3. Match Shopify products against the benchmark dataset.
node skills/official/shopify-ecommerce/scripts/build-enrichment.mjs \
  --shopify=data/catalog-products.json \
  --benchmark=data/macrotics-products.json \
  --output=data/enrichment

# 4. Review data/enrichment/match-report.csv, then dry-run Admin API payloads.
node skills/official/shopify-ecommerce/scripts/apply-enrichment.mjs \
  --envFile=sites/<sitio>/.env \
  --payloads=data/enrichment/shopify-admin-payloads.json

# 5. Apply only after review. Requires SHOPIFY_ADMIN_ACCESS_TOKEN.
node skills/official/shopify-ecommerce/scripts/apply-enrichment.mjs \
  --envFile=sites/<sitio>/.env \
  --payloads=data/enrichment/shopify-admin-payloads.json \
  --apply

# Optional policy enforcement: reset non-zero variant prices to catalog mode.
node skills/official/shopify-ecommerce/scripts/reset-zero-prices.mjs \
  --envFile=sites/<sitio>/.env \
  --products=data/catalog-products.json \
  --apply
```

### Operational Policies

1. **Prices stay at `0` until client approval.** The storefront remains in catalog mode (WhatsApp quotes) until explicit pricing is enabled.
2. **`descriptionHtml` is never overwritten** unless the team explicitly decides to do so. The enrichment pipeline updates titles and `kinto.*` metafields only.
3. **Public UI must not show internal metafield setup instructions.** Empty states use generic neutral copy (e.g., "Especificaciones no disponibles"), never "Configura el metafield...".
4. **`llms.txt` and structured data stay aligned** with the catalog data. FAQPage schema appears only when FAQ entries exist; specs/features appear in `llms.txt` only when the product has them.

The enrichment flow writes titles and `kinto.*` metafields only for confident matches; ambiguous and missing matches stay in the report for manual review. Benchmark text should be rewritten for your brand and verified against official manufacturer specs before any description overwrite is enabled.

## QA: Mobile Audit

`scripts/mobile-audit.mjs` mide la experiencia móvil de una vitrina: alto de header, % de viewport usado por el primer producto, overflow horizontal, y captura screenshots con/sin mega-menú abierto. Útil como gate antes de un release.

```bash
# Requiere `npm i -D playwright` en el sitio (no se instala por defecto).
node ../../skills/official/shopify-ecommerce/scripts/mobile-audit.mjs \
  https://localhost:4321/store/todos /tmp/audit-mobile
```

Genera `*-closed.png`, `*-open.png` y un JSON con métricas. La URL es positional, sin default — si no la pasas, sale con error claro.

## Google Merchant Center Feed

The skill includes a reusable RSS 2.0 feed generator for Google Merchant Center, Meta Commerce, and similar catalog systems:

```ts
import { generateMerchantFeed } from "../lib/merchant-feed";

const xml = generateMerchantFeed(products, {
  siteUrl: "https://www.example.com",
  title: "Example Store catalog",
  description: "Product catalog for free listings and shopping feeds.",
  countryCode: "CO",
  contentLanguage: "es",
  defaultShipping: { country: "CO", service: "Ground", price: "0 COP" },
});
```

Copy `example/pages/merchant-feed.xml.ts` into a site to expose `/merchant-feed.xml` and submit that URL in Merchant Center as a scheduled feed. Products with `price <= 0` are intentionally omitted so catalog/quote-mode stores do not publish invalid Merchant Center items until real prices are available.

For stronger product eligibility and rich results, the Storefront API query now supports these optional metafields in the configured namespace:

- `gtin`
- `mpn`
- `google_product_category`

## Components

| Component            | Description                                     | Props                                           |
| -------------------- | ----------------------------------------------- | ----------------------------------------------- |
| `ProductCard`        | Card for product grids                          | `product: Product`                              |
| `ProductGrid`        | Grid with filter/sort controls                  | `products: Product[], categories?: string[]`    |
| `ProductGallery`     | Image gallery for PDP                           | `images: Image[], selected?: number`            |
| `ProductInfo`        | PDP right column (price, variants, add-to-cart) | `product: Product, selectedVariant?: number`    |
| `ProductSpecs`       | Specs table                                     | `specs: Record<string, string>`                 |
| `ProductReviews`     | Review summary + list                           | `reviews: Review[]`                             |
| `ProductSchema`      | Product JSON-LD with rich-result fields         | `product: Product, url: string, sellerName?`    |
| `CollectionHero`     | Collection header with description              | `title: string, description?: string`           |
| `CollectionGrid`     | Products within a collection                    | `products: Product[], collectionHandle: string` |
| `CartDrawer`         | Slide-out cart drawer                           | _(reads from localStorage + Worker)_            |
| `CartItem`           | Single line item in cart                        | `line: CartLine`                                |
| `CheckoutButton`     | Redirect to Shopify checkout                    | `checkoutUrl: string`                           |
| `StoreHeader`        | Header with cart count, search, nav             | `collections: Collection[]`                     |
| `StoreFooter`        | Footer with links                               | `collections: Collection[]`                     |
| `SearchOverlay`      | Full-screen search modal                        | `collections: Collection[]`                     |
| `LittledataPixel`    | Littledata pixel initialization                 | `trackerId: string`                             |
| `GTMSetup`           | Google Tag Manager container                    | `containerId: string`                           |
| `ProductBreadcrumb`  | BreadcrumbList schema + nav                     | `items: BreadcrumbItem[]`                       |
| `OrganizationSchema` | Organization + WebSite schema                   | `config: SiteConfig`                            |

## Types

```typescript
interface Product {
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  featuredImage: Image | null;
  images: Image[];
  variants: Variant[];
  collections: string[];
  seo: { title: string; description: string };
  availableForSale: boolean;
  rating: number | null;
  reviewCount: number | null;
}

interface Variant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: { amount: string; currencyCode: string };
  compareAtPrice: { amount: string; currencyCode: string } | null;
  image: Image | null;
  selectedOptions: { name: string; value: string }[];
  sku: string | null;
}

interface Image {
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

interface Collection {
  handle: string;
  title: string;
  description: string;
  image: Image | null;
}

interface CartLine {
  id: string;
  merchandise: {
    id: string;
    title: string;
    image: Image | null;
    price: { amount: string; currencyCode: string };
  };
  quantity: number;
  cost: { subtotalAmount: { amount: string; currencyCode: string } };
}

interface CartState {
  id: string;
  checkoutUrl: string;
  lines: CartLine[];
  cost: {
    subtotal: { amount: string; currencyCode: string };
    total: { amount: string; currencyCode: string };
  };
}
```

## Dependencies

- `minisearch` — client-side fuzzy search (~6KB gzip)
- `@cloudflare/workers-types` — Worker type definitions

## Schema.org Types

- `Product` (with `Offer`, `AggregateRating`)
- `BreadcrumbList`
- `Organization`
- `WebSite` (with `SearchAction`)
- `ItemList`
- `FAQPage`
