/**
 * Configuración del sitio: distribuidor-miranda
 * 
 * Domains:
 * - Public: distribuidor-miranda.com
 * - CMS (oculto): dis.kinto.info
 */

export interface SiteConfig {
  site: {
    domain: string;
    name: string;
    description: string;
    language: string;
    logo?: string;
    favicon?: string;
    googleSiteVerification?: string;
  };
  cms: {
    enabled: boolean;
    subdomain: string;
    hidden: boolean;
    githubRepo: string;
    authEndpoint?: string;
  };
  build: {
    output: 'static';
    compressHTML: boolean;
    inlineStylesheets: 'auto' | 'always' | 'never';
  };
  shopify: {
    storeDomain: string;
    storefrontAccessToken: string;
    adminAccessToken: string;
    apiVersion: string;
    currencyCode: string;
    locale: string;
    collections: {
      featured: string[];
    };
    tracking: {
      littledataTrackerId?: string;
      gaMeasurementId?: string;
      gtmContainerId?: string;
    };
  };
  skills: {
    // Skills activas se leen de skills-active.json
  };
}

export default {
  site: {
    domain: 'distribuidormiranda.ec',
    name: 'Distribuidor Miranda',
    description: 'Repuestos de colisión, iluminación y refrigeración para talleres, mayoristas y aseguradoras en Ecuador.',
    language: 'es-EC',
    logo: '/logo.svg',
    favicon: '/favicon.ico',
    googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION || ''
  },
  cms: {
    enabled: true,
    subdomain: 'cms.distribuidormiranda.ec',
        hidden: true,
        githubRepo: 'kinto-cms/distribuidor-miranda-content',
        authEndpoint: 'https://distribuidor-miranda-auth.kinto.workers.dev'
  },
  build: {
    output: 'static',
    compressHTML: true,
    inlineStylesheets: 'auto'
  },
  shopify: {
    storeDomain: 'distribuidor-miranda.myshopify.com',
    storefrontAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || '',
    adminAccessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '',
    apiVersion: '2026-04',
    currencyCode: 'USD',
    locale: 'es-EC',
    collections: {
      featured: []
    },
    tracking: {
      littledataTrackerId: process.env.LITTLEDATA_TRACKER_ID || '',
      gaMeasurementId: process.env.GA4_MEASUREMENT_ID || process.env.GOOGLE_ANALYTICS_ID || '',
      gtmContainerId: process.env.GTM_CONTAINER_ID || ''
    }
  },
  skills: {}
} satisfies SiteConfig;
