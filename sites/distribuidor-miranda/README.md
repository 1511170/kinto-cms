# Distribuidor Miranda - Ecommerce

**URL:** https://distribuidor-miranda-storefront.camilocuadros.workers.dev  
**Dominio:** distribuidormiranda.com.ec / www.distribuidormiranda.com.ec  
**Stack:** KINTO CMS (Astro 5) + Shopify Storefront API + Cloudflare Workers

## Estructura del Proyecto

```
├── .env                  # Credenciales (NO commitear)
├── .env.example          # Plantilla de configuración
├── .cf.env               # Token Cloudflare para deploys
├── wrangler.jsonc        # Configuración Cloudflare Worker
├── astro.config.mjs      # Configuración Astro
├── tailwind.config.mjs   # Configuración Tailwind
├── package.json          # Dependencias
│
├── src/                  # Código fuente del sitio
│   ├── components/       # Componentes Astro reutilizables
│   ├── layouts/          # Layouts de páginas
│   ├── pages/            # Rutas del sitio (SSG)
│   ├── styles/           # CSS global
│   ├── data/             # Datos estáticos (marcas, catálogo local)
│   └── lib/              # Utilidades (shopify-catalog, format-price, etc.)
│
├── worker/               # Cloudflare Worker (API proxy + lógica dinámica)
│   ├── index.ts          # Entry point del Worker
│   ├── routes/           # Handlers de rutas API
│   ├── shopify-client.ts # Cliente Shopify Storefront API
│   └── utils/            # Utilidades del Worker
│
├── scripts/              # Scripts de utilidad
│   ├── shopify/          # Scripts de conexión Shopify
│   ├── cloudflare/       # Scripts de deploy Cloudflare
│   └── utils/            # Scripts de procesamiento de datos
│
├── tests/                # Tests automatizados
│   ├── e2e/              # Tests end-to-end (Playwright)
│   └── shopify/          # Tests de integración Shopify
│
├── data/                 # Datos del proyecto
│   ├── config/           # Configuraciones
│   └── *.csv             # Inventario, catálogos
│
├── docs/                 # Documentación
├── public/               # Assets estáticos
└── dist/                 # Build output (generado por Astro)
```

## Comandos

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo local

# Build
npm run build            # Generar sitio estático (dist/)

# Deploy
source .cf.env && npx wrangler deploy   # Deploy a Cloudflare

# Tests
npx playwright test      # Ejecutar tests E2E
```

## Credenciales

Todas las credenciales están en `.env` (ver `.env.example` para la plantilla).

**NUNCA commitear `.env` o `.cf.env`.**

## Estado del Proyecto

- ✅ 11,776 productos cargados en Shopify
- ✅ SEO completo (títulos, descripciones, alt text)
- ✅ Carrito con checkout Shopify
- ✅ Buscador por vehículo funcional
- ✅ Productos agotados al final
- ✅ Tamaño aumentado ~30%

## Próximos Pasos

- [ ] Arreglar links rotos
- [ ] Páginas de categoría funcionales
- [ ] Buscador global
- [ ] Imágenes de productos
- [ ] Tests automatizados completos
