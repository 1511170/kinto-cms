import siteConfig from '../../../../config/site.config.ts';
import { getStorefrontProducts, productHref, productImage, productTitle } from '../../../lib/shopify-catalog';

const PRODUCT_SITEMAP_SIZE = 2000;

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[char]!));
}

export async function getStaticPaths() {
  const products = await getStorefrontProducts();
  const pages = Math.max(1, Math.ceil(products.length / PRODUCT_SITEMAP_SIZE));
  return Array.from({ length: pages }, (_, index) => ({
    params: { page: String(index + 1) },
  }));
}

export async function GET({ params }: { params: { page: string } }) {
  const origin = `https://${siteConfig.site.domain}`;
  const page = Math.max(1, Number(params.page || 1));
  const products = await getStorefrontProducts();
  const slice = products.slice((page - 1) * PRODUCT_SITEMAP_SIZE, page * PRODUCT_SITEMAP_SIZE);
  const lastmod = new Date().toISOString();

  const urls = slice.map((product) => {
    const loc = `${origin}${productHref(product)}`;
    const image = productImage(product);
    const imageXml = image?.url
      ? `\n    <image:image><image:loc>${escapeXml(image.url)}</image:loc><image:title>${escapeXml(productTitle(product))}</image:title></image:image>`
      : '';
    return `  <url><loc>${escapeXml(loc)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority>${imageXml}</url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
