---
name: whatsapp-cta
category: community
version: 1.0.0
description: Botón flotante de WhatsApp + CTA contextual para PDP con tracking GA4
tags: [whatsapp, cta, conversion, ecommerce]
requires: []
needs: []
recommendedFor: [static, ecommerce]
---

# whatsapp-cta

Skill kinto-cms que agrega botones de WhatsApp con tracking GA4 a cualquier sitio Astro. Provee un botón flotante (FAB) presente en todas las páginas y un CTA contextual para PDP de ecommerce que envía al cliente un mensaje pre-rellenado con el nombre y URL del producto.

## Componentes

| Componente               | Uso                                                                | Slot recomendado                                                           |
| ------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `WhatsappFloatingButton` | FAB fijo bottom-right en todas las páginas                         | `<slot name="bottom" />` del Layout                                        |
| `WhatsappProductCTA`     | Botón en PDP encima del Add-to-Cart, manda nombre+URL del producto | `<slot name="cta-extras" />` del `ProductInfo` (skill `shopify-ecommerce`) |

## Instalación

```bash
kinto skill add whatsapp-cta --site=<sitio>
```

O bien: importar directamente vía alias `@skills-community/whatsapp-cta/...` desde el sitio.

## Uso — botón flotante

```astro
---
import WhatsappFloatingButton from '@skills-community/whatsapp-cta/components/WhatsappFloatingButton.astro';
---
<Layout>
  <WhatsappFloatingButton
    phone="573147908511"
    label="Escribir por WhatsApp"
    slot="bottom"
  />
</Layout>
```

### Props

| Prop       | Tipo                              | Default                                         | Descripción                                            |
| ---------- | --------------------------------- | ----------------------------------------------- | ------------------------------------------------------ |
| `phone`    | `string`                          | _(requerido)_                                   | Teléfono internacional sin signos (ej: `573147908511`) |
| `message`  | `string`                          | `'Hola, quiero información sobre los equipos.'` | Texto pre-rellenado                                    |
| `position` | `'bottom-right' \| 'bottom-left'` | `'bottom-right'`                                | Esquina del FAB                                        |
| `label`    | `string`                          | `'Escribir por WhatsApp'`                       | Tooltip + aria-label                                   |

## Uso — CTA en PDP

```astro
---
import WhatsappProductCTA from '@skills-community/whatsapp-cta/components/WhatsappProductCTA.astro';
---
<ProductInfo product={product}>
  <WhatsappProductCTA
    slot="cta-extras"
    phone="573147908711"
    productName={product.title}
    productUrl={`${Astro.site.origin}/products/${product.handle}`}
    productId={product.variants[0]?.sku ?? product.handle}
    productBrand={product.vendor}
    productCategory={product.productType ?? product.tags?.[0]}
  />
</ProductInfo>
```

### Props

| Prop              | Tipo      | Default                                                 | Descripción                                                       |
| ----------------- | --------- | ------------------------------------------------------- | ----------------------------------------------------------------- |
| `phone`           | `string`  | _(requerido)_                                           | Teléfono sin signos                                               |
| `productName`     | `string`  | _(requerido)_                                           | Nombre exacto del producto (va al mensaje WhatsApp + payload GA4) |
| `productUrl`      | `string`  | _(requerido)_                                           | URL canónica absoluta (va al mensaje + GA4)                       |
| `productId`       | `string?` | —                                                       | SKU o variant ID, se manda como `item_id` en GA4                  |
| `productBrand`    | `string?` | —                                                       | Vendor/marca, `item_brand` en GA4                                 |
| `productCategory` | `string?` | —                                                       | productType o categoría, `item_category` en GA4                   |
| `messageTemplate` | `string?` | `'Hola, me interesa "{name}". ¿Está disponible? {url}'` | Soporta `{name}` y `{url}`                                        |
| `label`           | `string?` | `'Consultar por WhatsApp'`                              | Texto del botón                                                   |

## Eventos GA4 (dataLayer)

Cada click pushea automáticamente al `window.dataLayer` (compatible con GTM/GA4). Si `dataLayer` no existe (sin GTM), no hace nada — no rompe.

### `whatsapp_click_floating` — FAB

```json
{
  "event": "whatsapp_click_floating",
  "click_location": "floating_button",
  "page_url": "https://www.example.com/store/ubiquiti",
  "page_path": "/store/ubiquiti",
  "page_title": "UBIQUITI — Tu Tienda"
}
```

### `whatsapp_click_product` — CTA en PDP

```json
{
  "event": "whatsapp_click_product",
  "click_location": "product_page",
  "page_url": "https://www.example.com/products/u6",
  "page_path": "/products/u6",
  "item_id": "U6PLUS-SKU",
  "item_name": "U6+",
  "item_brand": "Ubiquiti",
  "item_category": "ACCEST POINT"
}
```

### Cómo medirlo en GA4

- **Clicks por producto**: GA4 → Reports → Events → `whatsapp_click_product` → desglosar por `item_name` o `item_id`.
- **Total FAB**: contar `whatsapp_click_floating` y desglosar por `page_path` para ver qué página convierte mejor.
- **Conversiones**: marcar ambos eventos como conversiones en GA4 → Admin → Events.

## Implementación

- Verde WhatsApp `#25D366` clásico (no override-able vía CSS var, parte de la identidad de marca).
- FAB: `position: fixed`, z-index 60 (sobre header sticky, debajo de SearchOverlay y CartDrawer del skill ecommerce).
- Listener único delegado en `document` (`lib/whatsapp-ga4.ts`) — evita N listeners en sitios con muchos botones.
- Compatible SSG: todo el HTML se genera en build, el listener se hidrata client-side.
- Cero dependencias externas.

## Archivos

```
whatsapp-cta/
├── SKILL.md
├── index.ts
├── components/
│   ├── WhatsappFloatingButton.astro
│   ├── WhatsappProductCTA.astro
│   └── WhatsappIcon.astro          (interno, SVG)
└── lib/
    └── whatsapp-ga4.ts              (helpers + listener delegado)
```
