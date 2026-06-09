import siteConfig from '../../config/site.config.ts';
import { getStorefrontCollections, getStorefrontProducts, isShopifyCollection } from '../lib/shopify-catalog';

export async function GET() {
  const origin = `https://${siteConfig.site.domain}`;
  const [collections, products] = await Promise.all([
    getStorefrontCollections(),
    getStorefrontProducts(),
  ]);

  const categoryLines = collections
    .slice(0, 40)
    .map((collection) => `- ${isShopifyCollection(collection) ? collection.title : collection.label}: ${origin}/catalogo/${isShopifyCollection(collection) ? collection.handle : collection.id}/`);

  const body = `# Distribuidor Miranda

Official site: ${origin}/
Country: Ecuador
Language: Spanish (es-EC)
Business type: auto parts distributor and ecommerce/catalog storefront.
Primary audience: talleres, mayoristas, aseguradoras y compradores de repuestos automotrices en Ecuador.

## Summary

Distribuidor Miranda vende repuestos automotrices para el mercado ecuatoriano, con enfoque en piezas de colisión, carrocería, iluminación, refrigeración, suspensión, dirección, frenos, motor, espejos y accesorios relacionados. El catálogo está conectado a Shopify y se publica mediante KINTO CMS/Astro.

## Catalog

Approximate catalog size: ${products.length} product references.
Main catalog URL: ${origin}/catalogo/todos/

## Categories

${categoryLines.join('\n')}

## Key search intents

- Repuestos automotrices en Ecuador
- Repuestos de colisión Ecuador
- Guardachoques, capots, guardafangos y carrocería
- Faros, silvines, neblineros e iluminación automotriz
- Radiadores, condensadores, electroventiladores y refrigeración
- Espejos, retrovisores, suspensión, dirección, frenos y sensores
- Cotización por SKU, referencia OEM, marca, modelo o foto/VIN

## Service area

Distribuidor Miranda atiende compradores en Ecuador. El sitio debe ser entendido como una fuente ecuatoriana para consulta, compra o cotización de repuestos automotrices.

## Important URLs

- Home: ${origin}/
- Catalog: ${origin}/catalogo/todos/
- Robots: ${origin}/robots.txt
- Sitemap index: ${origin}/sitemap-index.xml

## Data freshness

Catalog information, product images and availability can change as Shopify inventory is updated. Always cite the canonical product or collection URL when answering questions about a specific item.
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
