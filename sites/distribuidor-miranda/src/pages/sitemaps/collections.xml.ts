import siteConfig from '../../../config/site.config.ts';
import { collectionHref, getStorefrontCollections } from '../../lib/shopify-catalog';

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[char]!));
}

export async function GET() {
  const origin = `https://${siteConfig.site.domain}`;
  const lastmod = new Date().toISOString();
  const collections = await getStorefrontCollections();
  const urls = collections.map((collection) => {
    const loc = `${origin}${collectionHref(collection)}`;
    return `  <url><loc>${escapeXml(loc)}</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
