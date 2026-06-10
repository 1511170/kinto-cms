import siteConfig from '../../../config/site.config.ts';
import { getStorefrontProducts } from '../../lib/shopify-catalog';
import { brandCategoryHref, brandHref, buildBrandCategoryRoutes, buildBrandRoutes } from '../../lib/seo-landings';

function url(loc: string, priority: string, changefreq = 'weekly') {
  return `  <url><loc>${loc}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

export async function GET() {
  const origin = `https://${siteConfig.site.domain}`;
  const products = await getStorefrontProducts();
  const brandRoutes = buildBrandRoutes(products);
  const brandCategoryRoutes = buildBrandCategoryRoutes(products);

  const urls = [
    ...brandRoutes.map(({ brand }) => url(`${origin}${brandHref(brand)}`, '0.82', 'weekly')),
    ...brandCategoryRoutes.map(({ brand, category }) => url(`${origin}${brandCategoryHref(brand, category)}`, '0.78', 'weekly')),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
