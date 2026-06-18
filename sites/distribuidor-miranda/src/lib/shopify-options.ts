import siteConfig from '../../config/site.config';

export const shopifyOptions = {
  storeDomain: import.meta.env.SHOPIFY_STORE_DOMAIN || siteConfig.shopify.storeDomain,
  storefrontAccessToken:
    import.meta.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || siteConfig.shopify.storefrontAccessToken,
  apiVersion: import.meta.env.SHOPIFY_API_VERSION || siteConfig.shopify.apiVersion,
  currencyCode: import.meta.env.SHOPIFY_CURRENCY_CODE || siteConfig.shopify.currencyCode,
  locale: import.meta.env.SHOPIFY_LOCALE || siteConfig.shopify.locale,
};

export function assertShopifyConfig() {
  if (!shopifyOptions.storeDomain) {
    throw new Error('SHOPIFY_STORE_DOMAIN no configurado');
  }
  if (!shopifyOptions.storefrontAccessToken) {
    throw new Error('SHOPIFY_STOREFRONT_ACCESS_TOKEN no configurado');
  }
}
