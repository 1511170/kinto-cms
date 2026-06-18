export { default as ProductCard } from "./components/product/ProductCard.astro";
export { default as ProductGrid } from "./components/product/ProductGrid.astro";
export { default as ProductGallery } from "./components/product/ProductGallery.astro";
export { default as ProductInfo } from "./components/product/ProductInfo.astro";
export { default as ProductSpecs } from "./components/product/ProductSpecs.astro";
export { default as ProductSchema } from "./components/product/ProductSchema.astro";
export { default as ProductFAQ } from "./components/product/ProductFAQ.astro";
export { default as ProductFAQSchema } from "./components/product/ProductFAQSchema.astro";
export { default as ProductReviews } from "./components/product/ProductReviews.astro";
export { default as CollectionHero } from "./components/collection/CollectionHero.astro";
export { default as CollectionGrid } from "./components/collection/CollectionGrid.astro";
export { default as CartDrawer } from "./components/cart/CartDrawer.astro";
export { default as CartItem } from "./components/cart/CartItem.astro";
export { default as CheckoutButton } from "./components/cart/CheckoutButton.astro";
export { default as StoreHeader } from "./components/layout/StoreHeader.astro";
export { default as StoreFooter } from "./components/layout/StoreFooter.astro";
export { default as SearchOverlay } from "./components/layout/SearchOverlay.astro";
export { default as LittledataPixel } from "./components/tracking/LittledataPixel.astro";
export { default as GTMSetup } from "./components/tracking/GTMSetup.astro";
export { default as ProductViewTracker } from "./components/tracking/ProductViewTracker.astro";
export { default as CollectionViewTracker } from "./components/tracking/CollectionViewTracker.astro";
export { default as ProductBreadcrumb } from "./components/seo/ProductBreadcrumb.astro";
export { default as OrganizationSchema } from "./components/seo/OrganizationSchema.astro";

export {
  fetchAllProducts,
  fetchProductByHandle,
  fetchAllCollections,
  fetchCollectionByHandle,
} from "./lib/shopify-fetch";
export {
  mapShopifyProduct,
  mapShopifyCollection,
  mapShopifyCart,
  generateSearchIndex,
} from "./lib/product-mapper";
export { formatPrice } from "./lib/format-price";
export {
  getCart,
  createCart,
  addToCart,
  updateCartLine,
  removeCartLine,
} from "./lib/cart-client";
export {
  buildShopifyProductEnrichment,
  matchCatalogProduct,
  normalizeReference,
} from "./lib/catalog-enrichment";
export { generateMerchantFeed } from "./lib/merchant-feed";

export type {
  Product,
  Variant,
  Image,
  Collection,
  CartLine,
  CartState,
  FAQEntry,
} from "./lib/product-mapper";
export type {
  BenchmarkProduct,
  CatalogMatch,
  ShopifyCatalogProduct,
  ShopifyProductEnrichment,
} from "./lib/catalog-enrichment";

export const config = {
  name: "shopify-ecommerce",
  version: "1.0.0",
  description:
    "Headless Shopify storefront integration with Cloudflare Worker API proxy, product catalog, cart, checkout, search, SEO structured data, and Littledata tracking",
  category: "community",
  author: "AI",
  createdFor: "kinto-cms",
  reusable: true,
  dependencies: [],
  configFields: [
    {
      name: "shopifyDomain",
      type: "string",
      label: "Shopify Store Domain",
      description: "e.g. your-store.myshopify.com",
      required: true,
    },
    {
      name: "storefrontToken",
      type: "string",
      label: "Storefront API Access Token",
      description: "From Shopify Admin > Apps > Develop apps > Storefront API",
      required: true,
    },
    {
      name: "apiVersion",
      type: "string",
      label: "Storefront API Version",
      description: "e.g. 2026-04",
      required: false,
    },
    {
      name: "currencyCode",
      type: "string",
      label: "Currency Code",
      description: "e.g. USD, EUR, COP",
      required: false,
    },
    {
      name: "littledataTrackerId",
      type: "string",
      label: "Littledata Tracker ID",
      description: "From Littledata app settings",
      required: false,
    },
    {
      name: "gaMeasurementId",
      type: "string",
      label: "GA4 Measurement ID",
      description: "e.g. G-XXXXXX",
      required: false,
    },
    {
      name: "gtmContainerId",
      type: "string",
      label: "GTM Container ID",
      description: "e.g. GTM-XXXX",
      required: false,
    },
  ],
};

export function install(context: any) {
  context.addComponent("ProductCard", "./components/product/ProductCard.astro");
  context.addComponent("ProductGrid", "./components/product/ProductGrid.astro");
  context.addComponent(
    "ProductGallery",
    "./components/product/ProductGallery.astro",
  );
  context.addComponent("ProductInfo", "./components/product/ProductInfo.astro");
  context.addComponent(
    "ProductSpecs",
    "./components/product/ProductSpecs.astro",
  );
  context.addComponent(
    "ProductSchema",
    "./components/product/ProductSchema.astro",
  );
  context.addComponent("ProductFAQ", "./components/product/ProductFAQ.astro");
  context.addComponent(
    "ProductFAQSchema",
    "./components/product/ProductFAQSchema.astro",
  );
  context.addComponent(
    "ProductReviews",
    "./components/product/ProductReviews.astro",
  );
  context.addComponent(
    "CollectionHero",
    "./components/collection/CollectionHero.astro",
  );
  context.addComponent(
    "CollectionGrid",
    "./components/collection/CollectionGrid.astro",
  );
  context.addComponent("CartDrawer", "./components/cart/CartDrawer.astro");
  context.addComponent("CartItem", "./components/cart/CartItem.astro");
  context.addComponent(
    "CheckoutButton",
    "./components/cart/CheckoutButton.astro",
  );
  context.addComponent("StoreHeader", "./components/layout/StoreHeader.astro");
  context.addComponent("StoreFooter", "./components/layout/StoreFooter.astro");
  context.addComponent(
    "SearchOverlay",
    "./components/layout/SearchOverlay.astro",
  );
  context.addComponent(
    "LittledataPixel",
    "./components/tracking/LittledataPixel.astro",
  );
  context.addComponent("GTMSetup", "./components/tracking/GTMSetup.astro");
  context.addComponent(
    "ProductViewTracker",
    "./components/tracking/ProductViewTracker.astro",
  );
  context.addComponent(
    "CollectionViewTracker",
    "./components/tracking/CollectionViewTracker.astro",
  );
  context.addComponent(
    "ProductBreadcrumb",
    "./components/seo/ProductBreadcrumb.astro",
  );
  context.addComponent(
    "OrganizationSchema",
    "./components/seo/OrganizationSchema.astro",
  );

  context.addSchemaType("Product");
  context.addSchemaType("Offer");
  context.addSchemaType("AggregateRating");
  context.addSchemaType("BreadcrumbList");
  context.addSchemaType("ItemList");
  context.addSchemaType("FAQPage");

  console.log("Skill shopify-ecommerce instalada");
}
