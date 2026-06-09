import siteConfig from '../../config/site.config.ts';
import { getStorefrontProducts } from '../lib/shopify-catalog';

const PRODUCT_SITEMAP_SIZE = 2000;

export async function GET() {
  const origin = `https://${siteConfig.site.domain}`;
  const products = await getStorefrontProducts();
  const productPages = Math.max(1, Math.ceil(products.length / PRODUCT_SITEMAP_SIZE));
  const now = new Date().toISOString();

  const sitemapUrls = [
    `${origin}/sitemaps/static.xml`,
    `${origin}/sitemaps/collections.xml`,
    ...Array.from({ length: productPages }, (_, index) => `${origin}/sitemaps/products/${index + 1}.xml`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((loc) => `  <sitemap><loc>${loc}</loc><lastmod>${now}</lastmod></sitemap>`).join('\n')}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
