---
name: tracking-analytics
category: official
version: 1.0.0
description: Google Analytics 4 + GTM dataLayer y wiring de analítica reutilizable para sitios Astro/KINTO
tags: [analytics, ga4, gtm, tracking]
requires: []
needs: []
recommendedFor: [static, ecommerce]
---

# tracking-analytics

Reusable analytics skill for KINTO/Astro sites.

## Components

| Component         | Purpose                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `GoogleAnalytics` | Loads GA4 `gtag.js`, creates `window.dataLayer`, configures the measurement ID, and forwards selected `dataLayer` events to GA4 direct. |

## Usage

Place `GoogleAnalytics` once in the shared layout head, before page-level tracking components push ecommerce events.

```astro
---
import GoogleAnalytics from '@skills-community/tracking-analytics/components/GoogleAnalytics.astro';
---

<head>
  <GoogleAnalytics measurementId="G-XXXXXXXXXX" />
  <slot name="head" />
</head>
```

Recommended site config:

```astro
<GoogleAnalytics measurementId={import.meta.env.GA_MEASUREMENT_ID ?? 'G-XXXXXXXXXX'} />
```

## Event Model

The component forwards these existing `dataLayer.push({ event })` events to GA4:

- `view_item`
- `view_item_list`
- `add_to_cart`
- `remove_from_cart`
- `begin_checkout`
- `whatsapp_click_floating`
- `whatsapp_click_product`

It preserves `dataLayer` so GTM and Littledata can still consume the same events. The bridge is idempotent via `window.__kinto_ga4_data_layer_bridge`.

## Rules

- Load this once per page, normally in `Layout.astro`.
- Do not hardcode client IDs inside this skill; pass `measurementId` from the site.
- GA4 Measurement IDs are public identifiers, not secrets.
- Keep ecommerce-specific payload creation inside ecommerce skills; this skill only loads analytics and forwards events.
