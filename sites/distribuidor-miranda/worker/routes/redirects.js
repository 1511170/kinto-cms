const EXACT_REDIRECTS = {
    "/shop": "/store",
    "/shop/": "/store",
    "/tienda": "/store",
    "/tienda/": "/store",
    "/contactanos": "/contacto",
    "/contactanos/": "/contacto",
    "/quienes-somos": "/",
    "/quienes-somos/": "/",
    "/terminos-y-condiciones": "/terminos",
    "/terminos-y-condiciones/": "/terminos",
    "/gracias-por-su-orden": "/",
    "/gracias-por-su-orden/": "/",
    // Brand landing pages from old WordPress site
    "/ubiquiti": "/store/ubiquiti",
    "/ubiquiti/": "/store/ubiquiti",
    "/mikrotik": "/store/mikrotik",
    "/mikrotik/": "/store/mikrotik",
    "/edgemax": "/store/ubiquiti",
    "/edgemax/": "/store/ubiquiti",
    "/airfiber": "/store/ubiquiti",
    "/airfiber/": "/store/ubiquiti",
    "/airvision": "/store/ubiquiti",
    "/airvision/": "/store/ubiquiti",
    "/unifi": "/store/ubiquiti",
    "/unifi/": "/store/ubiquiti",
};
export function getRedirect(pathname) {
    if (EXACT_REDIRECTS[pathname])
        return EXACT_REDIRECTS[pathname];
    // /product/{slug} or /product/{slug}/ → /products/{slug}
    const productMatch = pathname.match(/^\/product\/([^/]+)\/?$/);
    if (productMatch)
        return `/products/${productMatch[1]}`;
    // /product-category/{slug} or /product-category/{slug}/ → /store/{slug}
    const categoryMatch = pathname.match(/^\/product-category\/([^/]+)\/?$/);
    if (categoryMatch)
        return `/store/${categoryMatch[1]}`;
    // /shop/page/{n}/ → /store (pagination collapse)
    if (/^\/shop\/page\/\d+\/?$/.test(pathname))
        return "/store";
    return null;
}
