import {
  isShopifyProduct,
  productAvailable,
  productHref,
  productSku,
  productTitle,
  sortProductsForMerchandising,
  type StorefrontProduct,
} from './shopify-catalog';

export type SeoBrand = {
  slug: string;
  name: string;
  aliases: string[];
  models: string[];
  priority: number;
};

export type SeoPartCategory = {
  slug: string;
  name: string;
  plural: string;
  aliases: string[];
  intent: string;
};

export const SEO_BRANDS: SeoBrand[] = [
  { slug: 'chevrolet', name: 'Chevrolet', aliases: ['chevrolet', 'chevrole', 'chv', 'spark', 'sail', 'aveo', 'd-max', 'dmax', 'tracker', 'optra', 'corsa', 'grand vitara', 'luv'], models: ['Spark GT', 'Sail', 'Aveo', 'D-Max', 'Tracker', 'Optra', 'Grand Vitara'], priority: 1.0 },
  { slug: 'hyundai', name: 'Hyundai', aliases: ['hyundai', 'accent', 'verna', 'tucson', 'elantra', 'i10', 'grand i10', 'h1', 'santa fe', 'creta'], models: ['Accent', 'Tucson', 'Elantra', 'i10', 'Grand i10', 'H1'], priority: 0.95 },
  { slug: 'kia', name: 'Kia', aliases: ['kia', 'rio', 'picanto', 'sportage', 'cerato', 'soluto', 'seltos', 'sorento', 'niro'], models: ['Rio', 'Picanto', 'Sportage', 'Cerato', 'Soluto'], priority: 0.92 },
  { slug: 'toyota', name: 'Toyota', aliases: ['toyota', 'hilux', 'yaris', 'corolla', 'fortuner', 'rav4', 'rush', 'agya'], models: ['Hilux', 'Yaris', 'Corolla', 'Fortuner', 'RAV4'], priority: 0.86 },
  { slug: 'nissan', name: 'Nissan', aliases: ['nissan', 'versa', 'sentra', 'x-trail', 'xtrail', 'tiida', 'navara', 'kicks', 'almera'], models: ['Versa', 'Sentra', 'X-Trail', 'Tiida', 'Kicks'], priority: 0.82 },
  { slug: 'mazda', name: 'Mazda', aliases: ['mazda', 'bt-50', 'bt50', 'b2200', 'b2600', 'cx-3', 'cx-5', 'cx-9', 'allegro'], models: ['BT-50', 'B2200', 'CX-3', 'CX-5'], priority: 0.78 },
  { slug: 'suzuki', name: 'Suzuki', aliases: ['suzuki', 'vitara', 'grand vitara', 'sz', 'swift', 'forsa', 'alto', 's-cross', 'scross'], models: ['Vitara', 'Grand Vitara SZ', 'Swift', 'Forsa', 'Alto'], priority: 0.74 },
  { slug: 'chery', name: 'Chery', aliases: ['chery', 'tiggo', 'arrizo', 'qq', 'practivan'], models: ['Tiggo', 'Tiggo 2', 'Tiggo 7 Pro', 'Arrizo', 'QQ'], priority: 0.72 },
  { slug: 'great-wall', name: 'Great Wall', aliases: ['great wall', 'greatwall', 'wingle', 'voleex', 'haval', 'poer', 'm4', 'c30'], models: ['Wingle', 'Voleex C30', 'Haval M4', 'Poer'], priority: 0.68 },
  { slug: 'jac', name: 'JAC', aliases: ['jac', 't6', 't8', 's2'], models: ['T6', 'T8', 'S2'], priority: 0.64 },
];

export const SEO_PART_CATEGORIES: SeoPartCategory[] = [
  { slug: 'guardachoques', name: 'Guardachoques', plural: 'guardachoques', aliases: ['guardachoque', 'gchoque', 'parachoque', 'bumper'], intent: 'colisión y carrocería' },
  { slug: 'silvines', name: 'Silvines y faros', plural: 'silvines, faros y luces', aliases: ['silvin', 'faro', 'foco', 'luz', 'lamp', 'halogeno'], intent: 'iluminación automotriz' },
  { slug: 'radiadores', name: 'Radiadores', plural: 'radiadores y refrigeración', aliases: ['radiador', 'electroventilador', 'refrigerante', 'tapa radiador', 'termostato'], intent: 'refrigeración' },
  { slug: 'espejos', name: 'Espejos', plural: 'espejos retrovisores', aliases: ['espejo', 'retrovisor'], intent: 'carrocería exterior' },
  { slug: 'capots', name: 'Capots', plural: 'capots y bisagras', aliases: ['capot', 'capó', 'chapa capot', 'bisagra capot'], intent: 'carrocería frontal' },
  { slug: 'guardafangos', name: 'Guardafangos', plural: 'guardafangos y molduras', aliases: ['guardafango', 'guardapolvo', 'salpicadera', 'moldura'], intent: 'carrocería lateral' },
  { slug: 'neblineros', name: 'Neblineros', plural: 'neblineros y biseles', aliases: ['neblinero', 'antiniebla', 'bisel neblinero', 'kit neblinero'], intent: 'iluminación auxiliar' },
  { slug: 'amortiguadores', name: 'Amortiguadores', plural: 'amortiguadores y suspensión', aliases: ['amortiguador', 'suspension', 'suspensión', 'espiral'], intent: 'suspensión' },
];

export const MIN_BRAND_PRODUCTS = 12;
export const MIN_BRAND_CATEGORY_PRODUCTS = 5;

function normalize(value = '') {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function productSearchText(product: StorefrontProduct) {
  const shopify = isShopifyProduct(product);
  const parts = [
    productTitle(product),
    productSku(product),
    shopify ? product.vendor : product.brand,
    shopify ? product.productType : product.catLabel,
    shopify ? product.description : product.desc,
    shopify ? product.descriptionHtml : '',
    shopify ? product.tags?.join(' ') : '',
    shopify ? product.collections?.join(' ') : '',
  ];
  return normalize(parts.filter(Boolean).join(' '));
}

function aliasesMatch(text: string, aliases: string[]) {
  return aliases.some((alias) => {
    const needle = normalize(alias);
    if (!needle) return false;
    return new RegExp(`(^| )${needle.replace(/ /g, ' +')}( |$)`).test(text);
  });
}

export function productMatchesBrand(product: StorefrontProduct, brand: SeoBrand) {
  return aliasesMatch(productSearchText(product), brand.aliases);
}

export function productMatchesPartCategory(product: StorefrontProduct, category: SeoPartCategory) {
  return aliasesMatch(productSearchText(product), category.aliases);
}

export function filterProductsForBrand(products: StorefrontProduct[], brand: SeoBrand) {
  return sortProductsForMerchandising(products.filter((product) => productMatchesBrand(product, brand)));
}

export function filterProductsForBrandCategory(products: StorefrontProduct[], brand: SeoBrand, category: SeoPartCategory) {
  return sortProductsForMerchandising(products.filter((product) => productMatchesBrand(product, brand) && productMatchesPartCategory(product, category)));
}

export function brandHref(brand: SeoBrand) {
  return `/repuestos/${brand.slug}/`;
}

export function brandCategoryHref(brand: SeoBrand, category: SeoPartCategory) {
  return `/repuestos/${brand.slug}/${category.slug}/`;
}

export function brandTitle(brand: SeoBrand) {
  return `Repuestos ${brand.name} en Ecuador`;
}

export function brandCategoryTitle(brand: SeoBrand, category: SeoPartCategory) {
  return `${category.name} ${brand.name} en Ecuador`;
}

export function brandDescription(brand: SeoBrand, count: number) {
  const models = brand.models.slice(0, 5).join(', ');
  return `Catálogo de repuestos ${brand.name} para Ecuador: ${models} y más modelos. Consulta disponibilidad de ${count.toLocaleString('es-EC')} referencias con despacho para talleres, aseguradoras, mayoristas y compradores finales.`;
}

export function brandCategoryDescription(brand: SeoBrand, category: SeoPartCategory, count: number) {
  const models = brand.models.slice(0, 4).join(', ');
  return `${category.name} ${brand.name} en Ecuador para ${models} y otros modelos. Revisa ${count.toLocaleString('es-EC')} referencias de ${category.intent}, confirma compatibilidad por VIN, foto o código y cotiza disponibilidad con Distribuidor Miranda.`;
}

export function landingFaqs(brand: SeoBrand, category?: SeoPartCategory) {
  const target = category ? `${category.plural} ${brand.name}` : `repuestos ${brand.name}`;
  return [
    {
      question: `¿Distribuidor Miranda vende ${target} en Ecuador?`,
      answer: `Sí. Distribuidor Miranda publica catálogo de ${target} para compradores en Ecuador y permite confirmar disponibilidad antes de comprar o cotizar.`,
    },
    {
      question: `¿Cómo confirmo si un repuesto ${brand.name} calza en mi vehículo?`,
      answer: `Envía el modelo, año, foto de la pieza, código o VIN por WhatsApp. El equipo valida compatibilidad antes del despacho para reducir errores de compra.`,
    },
    {
      question: `¿Los precios y stock de ${target} siempre están actualizados?`,
      answer: `El catálogo se actualiza desde Shopify, pero para repuestos automotrices es recomendable confirmar disponibilidad, lado, versión y referencia antes de instalar.`,
    },
  ];
}

export function buildBrandRoutes(products: StorefrontProduct[]) {
  return SEO_BRANDS.map((brand) => ({ brand, products: filterProductsForBrand(products, brand) }))
    .filter((route) => route.products.length >= MIN_BRAND_PRODUCTS)
    .sort((a, b) => b.brand.priority - a.brand.priority || b.products.length - a.products.length);
}

export function buildBrandCategoryRoutes(products: StorefrontProduct[]) {
  return SEO_BRANDS.flatMap((brand) => SEO_PART_CATEGORIES.map((category) => ({
    brand,
    category,
    products: filterProductsForBrandCategory(products, brand, category),
  })))
    .filter((route) => route.products.length >= MIN_BRAND_CATEGORY_PRODUCTS)
    .sort((a, b) => b.products.length - a.products.length);
}

export function topAvailableProducts(products: StorefrontProduct[], limit = 24) {
  return sortProductsForMerchandising(products)
    .filter((product) => productAvailable(product) || productHref(product))
    .slice(0, limit);
}
