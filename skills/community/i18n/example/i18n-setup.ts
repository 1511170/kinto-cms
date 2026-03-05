/**
 * Ejemplo: src/i18n/index.ts
 *
 * Copia este archivo a tu sitio en src/i18n/index.ts y ajusta los imports.
 * Luego importa los helpers desde '@/i18n' o la ruta que prefieras.
 */
import { createI18n } from '@skills/community/i18n';
import en from './en.json';
import es from './es.json';

export const {
  t,
  getLocaleFromUrl,
  getLocalizedPath,
  getPathWithoutLocale,
  getLocales,
  getDefaultLocale,
} = createI18n({
  translations: { en, es },
  defaultLocale: 'en',
});

// Tipo conveniente para usarlo en los props de componentes y páginas
export type SiteLocale = 'en' | 'es';
