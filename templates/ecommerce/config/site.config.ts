/**
 * Configuración del sitio: {SITE_NAME}
 * 
 * Domains:
 * - Public: {DOMAIN}
 * - CMS (oculto): {CMS_SUBDOMAIN}
 */

export interface SiteConfig {
  site: {
    domain: string;
    name: string;
    description: string;
    language: string;
    logo?: string;
    favicon?: string;
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
  skills: {
    // Skills activas se leen de skills-active.json
  };
}

export default {
  site: {
    domain: '{DOMAIN}',
    name: '{SITE_NAME}',
    description: '{DESCRIPTION}',
    language: '{LANG}',
    logo: '/logo.svg',
    favicon: '/favicon.ico'
  },
  cms: {
    enabled: true,
    subdomain: '{CMS_SUBDOMAIN}',
    hidden: true,
    githubRepo: 'kinto-cms/{SITE_NAME}-content',
    authEndpoint: 'https://{CMS_PREFIX}-auth.kinto.workers.dev'
  },
  build: {
    output: 'static',
    compressHTML: true,
    inlineStylesheets: 'auto'
  },
  skills: {}
} satisfies SiteConfig;
