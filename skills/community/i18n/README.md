# Skill: i18n

Internacionalización para sitios Astro con KINTO CMS. Soporta múltiples idiomas con routing por URL sin dependencias externas.

## Patrón de routing

- `/` o `/en/...` → idioma por defecto (sin prefijo)
- `/es/...` → idioma secundario

## Instalación

1. Copia `example/en.json` y `example/es.json` a `src/i18n/` en tu sitio.
2. Copia `example/i18n-setup.ts` a `src/i18n/index.ts` y ajusta los imports.
3. Usa `LanguageToggle.astro` en tu navbar/layout.

## Uso básico

```ts
// src/i18n/index.ts
import { createI18n } from '@skills/community/i18n';
import en from './en.json';
import es from './es.json';

export const { t, getLocaleFromUrl, getLocalizedPath, getPathWithoutLocale, getLocales } =
  createI18n({ translations: { en, es }, defaultLocale: 'en' });

export type SiteLocale = 'en' | 'es';
```

```astro
---
// src/pages/[...slug].astro o Layout.astro
import { getLocaleFromUrl, getLocalizedPath, getPathWithoutLocale, getLocales, t } from '@/i18n';
import LanguageToggle from '@skills/community/i18n/components/LanguageToggle.astro';

const locale = getLocaleFromUrl(Astro.url);
const i18n = t(locale);

const alternates = getLocales()
  .filter((l) => l !== locale)
  .map((l) => ({
    code: l,
    label: l.toUpperCase(),
    href: getLocalizedPath(getPathWithoutLocale(Astro.url.pathname), l),
  }));
---

<LanguageToggle currentLocale={locale} currentPath={Astro.url.pathname} alternates={alternates} />
```

## Routing con páginas duplicadas

Crea una carpeta `src/pages/es/` que replique la estructura de `src/pages/` pero pasando `locale="es"` al componente de contenido. El idioma por defecto no necesita prefijo.

```
src/pages/
  index.astro        → <HomeContent locale="en" />
  es/
    index.astro      → <HomeContent locale="es" />
```

## API

### `createI18n(config)`

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `translations` | `Record<string, Record<string, unknown>>` | Objeto con todos los idiomas |
| `defaultLocale` | `string` | Idioma por defecto (sin prefijo en URL) |

Retorna: `{ t, getLocaleFromUrl, getLocalizedPath, getPathWithoutLocale, getLocales, getDefaultLocale }`

### `LanguageToggle.astro`

| Prop | Tipo | Descripción |
|------|------|-------------|
| `currentLocale` | `string` | Locale activo |
| `currentPath` | `string` | `Astro.url.pathname` |
| `alternates` | `Array<{ code, label, href, flagSrc? }>` | Idiomas alternativos con sus rutas |
| `sticky` | `boolean` | Muestra como botón flotante (solo móvil) |

## Estructura de archivos

```
skills/community/i18n/
  index.ts                    ← barrel de exportaciones
  utils/
    utils.ts                  ← createI18n() y helpers
  components/
    LanguageToggle.astro      ← componente de cambio de idioma
  example/
    en.json                   ← ejemplo de traducciones en inglés
    es.json                   ← ejemplo de traducciones en español
    i18n-setup.ts             ← ejemplo de src/i18n/index.ts
```
