import {
  fetchAllProducts,
  fetchProductByHandle,
  fetchAllCollections,
  fetchCollectionByHandle,
} from '@skills-official/shopify-ecommerce/lib/shopify-fetch';
import {
  mapShopifyProduct,
  mapShopifyCollection,
  type Product as ShopifyProduct,
  type Collection as ShopifyCollection,
} from '@skills-official/shopify-ecommerce/lib/product-mapper';
import { shopifyOptions, assertShopifyConfig } from './shopify-options';
import {
  PRODUCTS as LOCAL_PRODUCTS,
  CATEGORIES as LOCAL_CATEGORIES,
  type Product as LocalProduct,
} from '../data/catalog';

export type StorefrontProduct = ShopifyProduct | LocalProduct;
export type InferredCollection = { id: string; label: string; description: string; inferred: true; priority: number };
export type StorefrontCollection = ShopifyCollection | typeof LOCAL_CATEGORIES[number] | InferredCollection;

export const INFERRED_CATEGORIES: InferredCollection[] = [
  { id: 'silvines-faros-luces', label: 'Silvines, faros y luces', description: 'Iluminación exterior: silvines, faros, neblineros, stops, direccionales y focos.', inferred: true, priority: 10 },
  { id: 'guardachoques', label: 'Guardachoques', description: 'Parachoques, guardachoques, absorbedores y almas de impacto.', inferred: true, priority: 20 },
  { id: 'radiadores-refrigeracion', label: 'Radiadores y refrigeración', description: 'Radiadores, condensadores, electroventiladores, bombas de agua y mangueras.', inferred: true, priority: 30 },
  { id: 'suspension-direccion', label: 'Suspensión y dirección', description: 'Amortiguadores, terminales, rótulas, cremalleras, brazos y componentes de suspensión.', inferred: true, priority: 40 },
  { id: 'motor-sensores-filtros', label: 'Motor, sensores y filtros', description: 'Sensores, bombas, filtros, aceites, bujías, bandas y componentes de motor.', inferred: true, priority: 50 },
  { id: 'guardafangos', label: 'Guardafangos', description: 'Guardafangos, guardalodos, loderas y aislantes relacionados.', inferred: true, priority: 60 },
  { id: 'parrillas-mascarillas', label: 'Parrillas y mascarillas', description: 'Parrillas, mascarillas, rejillas, emblemas y bases frontales.', inferred: true, priority: 70 },
  { id: 'espejos-retrovisores', label: 'Espejos y retrovisores', description: 'Espejos exteriores, retrovisores, tapas y lunas.', inferred: true, priority: 80 },
  { id: 'capots-cofres', label: 'Capots y cofres', description: 'Capots, cofres, bisagras, varillas y accesorios relacionados.', inferred: true, priority: 90 },
  { id: 'frenos', label: 'Frenos', description: 'Pastillas, zapatas, discos, tambores, bombas, cilindros y cables de freno.', inferred: true, priority: 100 },
  { id: 'puertas-manijas-chapas', label: 'Puertas, manijas y chapas', description: 'Puertas, manijas, cerraduras, chapas, compuertas, bisagras y cauchos.', inferred: true, priority: 110 },
  { id: 'vidrios-parabrisas', label: 'Vidrios y parabrisas', description: 'Parabrisas, vidrios, lunetas, elevavidrios y componentes relacionados.', inferred: true, priority: 120 },
  { id: 'interior-accesorios', label: 'Interior y accesorios', description: 'Consolas, palancas, pedales, tableros y accesorios interiores.', inferred: true, priority: 130 },
  { id: 'carroceria-exteriores', label: 'Carrocería exterior', description: 'Molduras, protectores, estribos, tolvas, spoilers y piezas exteriores.', inferred: true, priority: 140 },
];

const CATEGORY_PATTERNS: Array<[string, RegExp]> = [
  ['guardachoques', /guardachoque|gchoque|parachoque|bumper|absorbedor impacto|alma impacto/i],
  ['silvines-faros-luces', /silvin|faro|neblin|neblinero|stop|calavera|luz |lampara|lámpara|direccional|halogeno|halógeno|foco/i],
  ['radiadores-refrigeracion', /radiador|condensador|electroventilador|ventilador|refriger|manguera agua|termostato|bomba agua|deposito agua|depósito agua/i],
  ['espejos-retrovisores', /espejo|retrovisor/i],
  ['capots-cofres', /capot|cofre/i],
  ['guardafangos', /guardafango|guardapolvo|guardalodo|lodera/i],
  ['parrillas-mascarillas', /parrilla|mascarilla|rejilla/i],
  ['suspension-direccion', /amortiguador|terminal|rotula|rótula|cremallera|brazo |mesa |barra estabilizadora|bieleta|suspension|suspensión|muñon|muñón|muleta/i],
  ['motor-sensores-filtros', /sensor|bomba gasolina|bomba aceite|bujia|bujía|bobina|inyector|filtro|depurador|aceite|motor|map |maf |valvula|válvula|empaque/i],
  ['frenos', /pastilla|zapata|disco freno|tambor|bomba freno|mordaza|caliper|freno/i],
  ['puertas-manijas-chapas', /puerta|manija|chapa|aldaba|cerradura|bisagra puerta|elevaluna|compuerta/i],
  ['vidrios-parabrisas', /parabrisas|vidrio|luneta|elevavidrio/i],
  ['carroceria-exteriores', /spoiler|moldura|tolva|protector|faldon|faldón|estribo|cubre|tapabarro|plumilla|brazo limpia|apron/i],
  ['interior-accesorios', /tablero|consola|manubrio|tapiz|alfombra|cenicero|guantera|palanca|pedal/i],
];

export function isInferredCollection(collection: StorefrontCollection | undefined | null): collection is InferredCollection {
  return Boolean(collection && typeof collection === 'object' && 'inferred' in collection);
}

export function inferProductCategoryId(product: StorefrontProduct) {
  const text = isShopifyProduct(product)
    ? `${product.title || ''} ${product.productType || ''} ${product.tags?.join(' ') || ''}`
    : `${product.name || product.label || ''} ${product.catLabel || ''}`;
  return CATEGORY_PATTERNS.find(([, pattern]) => pattern.test(text))?.[0] || 'sin-clasificar';
}

export function isShopifyProduct(product: StorefrontProduct | undefined | null): product is ShopifyProduct {
  return Boolean(product && typeof product === 'object' && 'handle' in product && 'variants' in product);
}

export function isShopifyCollection(collection: StorefrontCollection | undefined | null): collection is ShopifyCollection {
  return Boolean(collection && typeof collection === 'object' && 'handle' in collection && 'title' in collection);
}

export function productKey(product: StorefrontProduct) {
  return isShopifyProduct(product) ? (product.id || product.handle) : product.id;
}

export function productSku(product: StorefrontProduct) {
  if (isShopifyProduct(product)) return product.variants?.[0]?.sku || product.handle;
  return product.sku || product.code || product.id;
}

export function productTitle(product: StorefrontProduct) {
  if (isShopifyProduct(product)) return product.title || product.handle || 'Producto';
  return product.label || product.name || product.title || product.id || 'Producto';
}

export function productAvailable(product: StorefrontProduct) {
  if (!isShopifyProduct(product)) return true;
  return Boolean(product.availableForSale || product.variants?.some((variant) => variant.availableForSale));
}

export function productImage(product: StorefrontProduct) {
  if (!isShopifyProduct(product)) return null;
  return product.featuredImage ?? product.variants?.find((variant) => variant.image)?.image ?? product.images?.[0] ?? null;
}

export function productImageUrl(product: StorefrontProduct, width = 640) {
  const image = productImage(product);
  if (!image?.url) return '';
  try {
    const url = new URL(image.url);
    url.searchParams.set('width', String(width));
    return url.toString();
  } catch {
    return image.url;
  }
}

export function productPlaceholder(product: StorefrontProduct) {
  const title = productTitle(product);
  const sku = productSku(product);
  const category = isShopifyProduct(product) ? `${product.productType || product.collections?.[0] || title}` : product.catLabel;
  const text = `${title} ${category}`.toLowerCase();
  const code = `${sku || title || 'DM'}`.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase() || 'DM';
  let label = 'REPUESTO';
  let accent: 'warm'|'cool'|'olive'|'steel' = 'steel';
  if (/faro|silvin|neblin|luz|lamp|ilumin/.test(text)) { label = 'ILUMINACIÓN'; accent = 'warm'; }
  else if (/radiador|bomba agua|manguera|refriger|termost/.test(text)) { label = 'REFRIG.'; accent = 'cool'; }
  else if (/guardachoque|parachoque|capot|guardafango|carrocer/.test(text)) { label = 'CARROCERÍA'; accent = 'steel'; }
  else if (/amort|terminal|cremallera|suspens|direcci/.test(text)) { label = 'SUSPENSIÓN'; accent = 'olive'; }
  else if (/aceite|filtro|banda|bujia|sensor|motor/.test(text)) { label = 'MOTOR'; accent = 'warm'; }
  return { code, label, accent };
}

export function sortProductsForMerchandising(products: StorefrontProduct[]) {
  return [...products].sort((a, b) => {
    const score = (product: StorefrontProduct) =>
      (productAvailable(product) ? 100 : 0) +
      (productImage(product) ? 20 : 0) +
      (isShopifyProduct(product) && Number(product.variants?.[0]?.price?.amount ?? 0) > 0 ? 5 : 0);
    return score(b) - score(a) || productTitle(a).localeCompare(productTitle(b), 'es');
  });
}

let fallbackWarned = false;
let productsPromise: Promise<StorefrontProduct[]> | null = null;
let collectionsPromise: Promise<StorefrontCollection[]> | null = null;

function shouldUseFallback(error: unknown) {
  if (fallbackWarned) return;
  fallbackWarned = true;
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[shopify-catalog] Usando catálogo local temporal: ${message}`);
}

async function loadProducts(): Promise<StorefrontProduct[]> {
  try {
    assertShopifyConfig();
    const raw = await fetchAllProducts(shopifyOptions);
    return sortProductsForMerchandising(raw.map(mapShopifyProduct));
  } catch (error) {
    shouldUseFallback(error);
    return sortProductsForMerchandising(LOCAL_PRODUCTS);
  }
}

export async function getStorefrontProducts(options: { limit?: number } = {}): Promise<StorefrontProduct[]> {
  productsPromise ??= loadProducts();
  const products = await productsPromise;
  return typeof options.limit === 'number' ? products.slice(0, options.limit) : products;
}

export async function getStorefrontProduct(handleOrId: string): Promise<StorefrontProduct | undefined> {
  const products = await getStorefrontProducts();
  const product = products.find((item) => isShopifyProduct(item) ? item.handle === handleOrId : item.id === handleOrId);
  if (product) return product;

  try {
    assertShopifyConfig();
    const raw = await fetchProductByHandle(shopifyOptions, handleOrId);
    if (raw) return mapShopifyProduct(raw);
  } catch (error) {
    shouldUseFallback(error);
  }
  return undefined;
}

async function loadCollections(): Promise<StorefrontCollection[]> {
  try {
    assertShopifyConfig();
    const raw = await fetchAllCollections(shopifyOptions);
    const mapped = raw.map(mapShopifyCollection).filter((collection: any) => collection.handle !== 'frontpage');
    const shopifyHandles = new Set(mapped.map((collection: any) => collection.handle));
    const inferred = INFERRED_CATEGORIES.filter((category) => !shopifyHandles.has(category.id));
    return mapped.length ? [...mapped, ...inferred] : [...LOCAL_CATEGORIES, ...INFERRED_CATEGORIES];
  } catch (error) {
    shouldUseFallback(error);
    return [...LOCAL_CATEGORIES, ...INFERRED_CATEGORIES];
  }
}

export async function getStorefrontCollections(): Promise<StorefrontCollection[]> {
  collectionsPromise ??= loadCollections();
  return collectionsPromise;
}

export async function getStorefrontCollection(handleOrId: string): Promise<{
  collection: StorefrontCollection | undefined;
  products: StorefrontProduct[];
}> {
  try {
    assertShopifyConfig();
    const raw = await fetchCollectionByHandle(shopifyOptions, handleOrId);
    if (raw) {
      const collection = mapShopifyCollection(raw);
      const products = sortProductsForMerchandising(raw.products?.edges?.map((edge: any) => mapShopifyProduct(edge.node)) ?? []);
      return { collection, products };
    }
  } catch (error) {
    shouldUseFallback(error);
  }

  const inferredCollection = INFERRED_CATEGORIES.find((cat) => cat.id === handleOrId);
  if (inferredCollection) {
    const products = await getStorefrontProducts();
    return {
      collection: inferredCollection,
      products: sortProductsForMerchandising(products.filter((product) => inferProductCategoryId(product) === inferredCollection.id)),
    };
  }

  const collection = LOCAL_CATEGORIES.find((cat) => cat.id === handleOrId);
  return {
    collection,
    products: sortProductsForMerchandising(collection ? LOCAL_PRODUCTS.filter((product) => product.catId === collection.id) : []),
  };
}

export function productHref(product: StorefrontProduct) {
  return `/producto/${isShopifyProduct(product) ? product.handle : product.id}/`;
}

export function collectionHref(collection: StorefrontCollection) {
  return `/catalogo/${isShopifyCollection(collection) ? collection.handle : collection.id}/`;
}
