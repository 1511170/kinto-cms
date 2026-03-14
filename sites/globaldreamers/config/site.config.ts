/**
 * Configuración del sitio: Global Dreamers
 *
 * Domains:
 * - Public: globaldreamers.com
 * - CMS (oculto): glo.kinto.info
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
    domain: 'globaldreamers.com',
    name: 'Global Dreamers',
    description: 'Agencia de estudios internacionales dedicada a hacer realidad tus sueños de vivir y trabajar en el exterior.',
    language: 'es',
    logo: '/logo.svg',
    favicon: '/favicon.ico'
  },
  cms: {
    enabled: true,
    subdomain: 'glo.kinto.info',
    hidden: true,
    githubRepo: 'kinto-cms/globaldreamers-content',
    authEndpoint: 'https://glo-auth.kinto.workers.dev'
  },
  build: {
    output: 'static',
    compressHTML: true,
    inlineStylesheets: 'auto'
  },
  skills: {}
} satisfies SiteConfig;
