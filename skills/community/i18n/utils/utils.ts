/**
 * Skill: i18n
 * Utilidades de internacionalización para sitios Astro con KINTO CMS
 *
 * Patrón de routing:
 *   / o /en/... → idioma por defecto (normalmente inglés)
 *   /es/...     → idioma secundario
 *
 * Las claves de idioma y el idioma por defecto se configuran al instanciar.
 */

// ─── Tipos ───────────────────────────────────────────────────────────────────

/**
 * Configuración de la instancia i18n.
 * Importa tus archivos JSON de traducciones y pásalos aquí.
 *
 * @example
 * import en from '../i18n/en.json';
 * import es from '../i18n/es.json';
 * const { t, getLocaleFromUrl, getLocalizedPath } = createI18n({ en, es });
 */
export interface I18nConfig<T extends Record<string, Record<string, unknown>>> {
  /** Objeto con todos los idiomas: { en: {...}, es: {...} } */
  translations: T;
  /** Idioma por defecto (sin prefijo en la URL). Por defecto: primera clave. */
  defaultLocale?: keyof T & string;
}

export type Locale<T extends Record<string, unknown>> = keyof T & string;

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Crea un conjunto de helpers i18n tipados para tu sitio.
 *
 * @example
 * // src/i18n/index.ts
 * import en from './en.json';
 * import es from './es.json';
 * export const { t, getLocaleFromUrl, getLocalizedPath, getPathWithoutLocale, getLocales } = createI18n({ translations: { en, es }, defaultLocale: 'en' });
 * export type SiteLocale = ReturnType<typeof getLocales>[number];
 */
export function createI18n<T extends Record<string, Record<string, unknown>>>(
  config: I18nConfig<T>
) {
  const { translations, defaultLocale } = config;
  const locales = Object.keys(translations) as (keyof T & string)[];
  const def = defaultLocale ?? locales[0];

  /**
   * Retorna el objeto de traducciones para el locale dado.
   */
  function t(locale: keyof T & string): T[typeof locale] {
    return translations[locale];
  }

  /**
   * Detecta el locale a partir de la URL de Astro.
   * La URL /es/... retorna 'es'. Cualquier otra URL retorna el locale por defecto.
   */
  function getLocaleFromUrl(url: URL): keyof T & string {
    const [, first] = url.pathname.split('/');
    if (first && locales.includes(first as keyof T & string) && first !== def) {
      return first as keyof T & string;
    }
    return def;
  }

  /**
   * Convierte una ruta base en su equivalente para el locale dado.
   * El locale por defecto no tiene prefijo.
   *
   * @example
   * getLocalizedPath('/about', 'es') // → '/es/about'
   * getLocalizedPath('/about', 'en') // → '/about'
   */
  function getLocalizedPath(path: string, locale: keyof T & string): string {
    const clean = getPathWithoutLocale(path);
    if (locale === def) return clean;
    return `/${locale}${clean === '/' ? '' : clean}`;
  }

  /**
   * Elimina el prefijo de locale de una ruta.
   *
   * @example
   * getPathWithoutLocale('/es/about') // → '/about'
   * getPathWithoutLocale('/about')    // → '/about'
   */
  function getPathWithoutLocale(pathname: string): string {
    for (const locale of locales) {
      if (locale === def) continue;
      const stripped = pathname.replace(new RegExp(`^\\/${locale}(\\/|$)`), '/');
      if (stripped !== pathname) return stripped || '/';
    }
    return pathname || '/';
  }

  /**
   * Retorna todos los locales configurados.
   */
  function getLocales(): (keyof T & string)[] {
    return locales;
  }

  /**
   * Retorna el locale por defecto.
   */
  function getDefaultLocale(): keyof T & string {
    return def;
  }

  return {
    t,
    getLocaleFromUrl,
    getLocalizedPath,
    getPathWithoutLocale,
    getLocales,
    getDefaultLocale,
  };
}
