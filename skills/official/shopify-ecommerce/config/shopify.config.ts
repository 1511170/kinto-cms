export interface ShopifyConfig {
  storeDomain: string;
  storefrontAccessToken: string;
  apiVersion: string;
  currencyCode: string;
  locale: string;
  collections: {
    featured: string[];
  };
  tracking: {
    littledataTrackerId: string;
    gaMeasurementId: string;
    gtmContainerId: string;
  };
  checkout: {
    sameDomain: boolean;
    checkoutSubdomain: string;
  };
}

export function getShopifyConfig(): ShopifyConfig {
  const raw = import.meta.env;
  return {
    storeDomain: raw.SHOPIFY_STORE_DOMAIN ?? "",
    storefrontAccessToken: raw.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? "",
    apiVersion: raw.SHOPIFY_API_VERSION ?? "2026-04",
    currencyCode: raw.SHOPIFY_CURRENCY_CODE ?? "USD",
    locale: raw.SHOPIFY_LOCALE ?? "en-US",
    collections: {
      featured:
        raw.SHOPIFY_FEATURED_COLLECTIONS?.split(",").filter(Boolean) ?? [],
    },
    tracking: {
      littledataTrackerId: raw.LITTLEDATA_TRACKER_ID ?? "",
      gaMeasurementId: raw.GA_MEASUREMENT_ID ?? "",
      gtmContainerId: raw.GTM_CONTAINER_ID ?? "",
    },
    checkout: {
      sameDomain: raw.SHOPIFY_CHECKOUT_SAME_DOMAIN === "true",
      checkoutSubdomain: raw.SHOPIFY_CHECKOUT_SUBDOMAIN ?? "checkout",
    },
  };
}
