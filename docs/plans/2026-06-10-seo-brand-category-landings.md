# SEO Brand + Category Landing Pages Implementation Plan

> **For Hermes:** Implement directly with build/deploy verification.

**Goal:** Add indexable landing pages for high-intent Ecuador auto-parts searches by vehicle brand and brand+part category.

**Architecture:** Use reusable landing metadata in `src/lib/seo-landings.ts`, static Astro routes under `/repuestos/[brand]/` and `/repuestos/[brand]/[category]/`, plus a dedicated sitemap included by the sitemap index. Pages filter the Shopify/local catalog at build time and render product cards, contextual copy, breadcrumbs, CollectionPage schema, FAQ schema, and internal links.

**Tech Stack:** Astro 5, existing Shopify catalog helpers, existing JSON-LD helpers, Cloudflare Workers assets deploy.

---

### Task 1: Add landing metadata/filter helpers

**Files:**
- Create: `sites/distribuidor-miranda/src/lib/seo-landings.ts`

**Steps:**
1. Define priority brands: chevrolet, hyundai, kia, toyota, nissan, mazda, suzuki, chery, great-wall, jac.
2. Define categories: guardachoques, silvines, radiadores, espejos, capots, guardafangos, neblineros, amortiguadores.
3. Add helpers to match product title/description/SKU text, generate hrefs, descriptions, FAQs, and route lists.
4. Verify with `npm run build`.

### Task 2: Add brand and brand-category pages

**Files:**
- Create: `src/pages/repuestos/[brand].astro`
- Create: `src/pages/repuestos/[brand]/[category].astro`

**Steps:**
1. Use `getStaticPaths()` from catalog products.
2. Render SEO copy, product grid, related category/brand links.
3. Add `CollectionPage`, `BreadcrumbList`, and `FAQPage` JSON-LD.
4. Verify representative HTML has schema and canonical `.com.ec`.

### Task 3: Add sitemap coverage and internal links

**Files:**
- Create: `src/pages/sitemaps/seo-landings.xml.ts`
- Modify: `src/pages/sitemap-index.xml.ts`
- Modify: `src/pages/llms-full.txt.ts`
- Modify: `src/components/Footer.astro`

**Steps:**
1. Include landing sitemap in sitemap index.
2. Link high-value brand pages from footer and AI text.
3. Build, deploy with Wrangler, verify production URLs.
4. Submit sitemap index and landing sitemap to Search Console.
