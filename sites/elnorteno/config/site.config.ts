/**
 * Configuración del sitio: elnorteno
 *
 * Domains:
 * - Public: elnorteno.com
 * - CMS (oculto): eln.kinto.info
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
    output: "static";
    compressHTML: boolean;
    inlineStylesheets: "auto" | "always" | "never";
  };
  skills: {
    // Skills activas se leen de skills-active.json
  };
}

export default {
  site: {
    domain: "elnorteno.com",
    name: "elnorteno",
    description: "Sitio web de elnorteno",
    language: "es",
    logo: "/logo.svg",
    favicon: "/favicon.ico",
  },
  cms: {
    enabled: true,
    subdomain: "eln.kinto.info",
    hidden: true,
    githubRepo: "kinto-cms/elnorteno-content",
    authEndpoint: "https://eln-auth.kinto.workers.dev",
  },
  build: {
    output: "static",
    compressHTML: true,
    inlineStylesheets: "auto",
  },
  skills: {},
} satisfies SiteConfig;
