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
export type StorefrontCollection = ShopifyCollection | typeof LOCAL_CATEGORIES[number];

export function isShopifyProduct(product: StorefrontProduct | undefined | null): product is ShopifyProduct {
  return Boolean(product && typeof product === 'object' && 'handle' in product && 'variants' in product);
}

export function isShopifyCollection(collection: StorefrontCollection | undefined | null): collection is ShopifyCollection {
  return Boolean(collection && typeof collection === 'object' && 'handle' in collection && 'title' in collection);
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
    return raw.map(mapShopifyProduct);
  } catch (error) {
    shouldUseFallback(error);
    return LOCAL_PRODUCTS;
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
    const mapped = raw.map(mapShopifyCollection).filter((collection) => collection.handle !== 'frontpage');
    return mapped.length ? mapped : LOCAL_CATEGORIES;
  } catch (error) {
    shouldUseFallback(error);
    return LOCAL_CATEGORIES;
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
      const products = raw.products?.edges?.map((edge: any) => mapShopifyProduct(edge.node)) ?? [];
      return { collection, products };
    }
  } catch (error) {
    shouldUseFallback(error);
  }

  const collection = LOCAL_CATEGORIES.find((cat) => cat.id === handleOrId);
  return {
    collection,
    products: collection ? LOCAL_PRODUCTS.filter((product) => product.catId === collection.id) : [],
  };
}

export function productHref(product: StorefrontProduct) {
  return `/producto/${isShopifyProduct(product) ? product.handle : product.id}/`;
}

export function collectionHref(collection: StorefrontCollection) {
  return `/catalogo/${isShopifyCollection(collection) ? collection.handle : collection.id}/`;
}
