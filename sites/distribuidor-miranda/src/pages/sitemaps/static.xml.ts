import siteConfig from '../../../config/site.config.ts';

function url(loc: string, priority: string, changefreq = 'weekly') {
  const lastmod = new Date().toISOString();
  return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

export function GET() {
  const origin = `https://${siteConfig.site.domain}`;
  const urls = [
    url(`${origin}/`, '1.0', 'daily'),
    url(`${origin}/catalogo/todos/`, '0.9', 'daily'),
    url(`${origin}/sobre-distribuidor-miranda/`, '0.8', 'monthly'),
    url(`${origin}/contacto/`, '0.8', 'monthly'),
    url(`${origin}/preguntas-frecuentes/`, '0.7', 'monthly'),
    url(`${origin}/llms.txt`, '0.4', 'weekly'),
    url(`${origin}/llms-full.txt`, '0.4', 'weekly'),
  ];

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
