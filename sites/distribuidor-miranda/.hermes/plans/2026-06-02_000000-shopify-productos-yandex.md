# Plan — Shopify productos + SEO + fotos Yandex — Distribuidor Miranda

## Objetivo
Actualizar y expandir el catálogo Shopify de Distribuidor Miranda usando Admin API:

1. Mantener conectividad OAuth/Admin API funcional.
2. Auditar productos actuales.
3. Actualizar SEO de productos existentes.
4. Actualizar alt text de imágenes existentes.
5. Preparar subida/upsert masivo desde CSV.
6. Buscar y asignar fotos desde Yandex para productos nuevos o productos sin imagen.
7. Verificar que Shopify y KINTO CMS queden sincronizados.

## Contexto actual

- Proyecto local:
  `/home/k41h4ck3r/work/kinto-miranda/kinto-cms/sites/distribuidor-miranda`
- Store Shopify:
  `distribuidor-miranda.myshopify.com`
- API Admin usada por scripts:
  `2025-01`
- Credenciales:
  `.env`, protegido por `.gitignore`
- Token OAuth `shpca_` funcional para Admin API REST + GraphQL.
- Stack requerido:
  Node.js ESM, cero dependencias npm, solo módulos nativos.
- Preferencia de implementación:
  Reusar scripts existentes / toolkit Shopify, no crear soluciones externas innecesarias.

## Estado completado

### 1. Conexión Shopify Admin API

Archivos creados/actualizados:

- `get-token.js`
- `verify-shopify-admin.js`
- `.env`
- `.gitignore`

Resultado:

- REST `/shop.json`: 200 OK.
- GraphQL `/graphql.json`: 200 OK.
- Token guardado en `.env` como:
  - `SHOPIFY_ACCESS_TOKEN`
  - `SHOPIFY_ADMIN_ACCESS_TOKEN`

### 2. Auditoría de productos actuales

Archivo:

- `audit-products.js`

Resultado detectado:

- Total productos Shopify actuales: 54.
- Activos: 54.
- Con imagen: 54.
- Sin imagen: 0.
- SEO inicialmente incompleto/vacío.

Snapshot generado:

- `shopify-audit/products-2026-06-01.json`

### 3. Actualización SEO + imágenes existentes

Archivo:

- `update-current-products-seo-images.js`

Ejecuciones realizadas:

```bash
node update-current-products-seo-images.js --dry-run
node update-current-products-seo-images.js --apply
```

Resultado:

- Productos procesados: 54.
- OK: 54.
- Errores: 0.

Se actualizó:

- SEO title.
- SEO description.
- `body_html`.
- Alt text de imágenes existentes.

Reporte generado:

- `shopify-audit/apply-seo-yandex-2026-06-01T22-33-19-792Z.json`

### 4. Verificación posterior

Resultado confirmado:

- `missing_seo_title`: 0.
- `missing_image_alt`: 0.
- Todos los productos actuales tienen imagen.

## Inventario completo recibido

Camilo envió:

- `Inventario-2026-05-27.xlsx`

Se copió al proyecto como:

- `/home/k41h4ck3r/work/kinto-miranda/kinto-cms/sites/distribuidor-miranda/Inventario-2026-05-27.xlsx`

Y se convirtió a CSV operativo como:

- `/home/k41h4ck3r/work/kinto-miranda/kinto-cms/sites/distribuidor-miranda/productos_todos.csv`

Datos detectados:

- Hoja: `Stock de Productos`.
- Header real: fila 10.
- Filas de productos: 11,777.
- Productos con stock `Cant. > 0`: 4,249.
- Columnas clave presentes:
  - `Codigo`
  - `Descripcion`
  - `Marca`
  - `Cant.`
  - `PVP`

Se ejecutó dry-run inicial:

```bash
node upload-products-from-csv-yandex.js productos_todos.csv --dry-run --limit=10
```

Resultado:

- Total dry-run: 10 productos con stock.
- Acciones previstas: 10 create.
- Errores: 0.
- Yandex devolvió URL de imagen para los 10.

Reporte:

- `shopify-audit/dry-run-csv-yandex-2026-06-01T22-45-57-432Z.json`

Advertencia: varias imágenes Yandex pueden ser aproximadas o de terceros; antes de un `--apply` masivo conviene revisar visualmente.

## Prueba real de 10 productos completada

Se ejecutó:

```bash
node upload-products-from-csv-yandex.js productos_todos.csv --apply --limit=10
```

Resultado inicial:

- Creados: 10.
- Errores: 0.
- Imágenes: 10/10.

Luego se detectó que el primer create dejaba inventario en 0 porque no estaba seteando inventario administrado por Shopify. Se corrigió `upload-products-from-csv-yandex.js` para:

1. Usar `inventory_management: "shopify"`.
2. Obtener location activa con `/locations.json`.
3. Obtener `inventory_item_id` desde `/variants/{id}.json`.
4. Setear stock real con `/inventory_levels/set.json`.

Se re-ejecutó el apply limitado para actualizar esos 10 productos existentes:

```bash
node upload-products-from-csv-yandex.js productos_todos.csv --apply --limit=10
```

Resultado final:

- Actualizados: 10.
- Errores: 0.
- Stock confirmado según `Cant.` del Excel.
- SEO confirmado.
- Imágenes confirmadas.

Auditoría final:

- Total productos Shopify: 64.
- Activos: 64.
- Con imágenes: 64.
- Sin imágenes: 0.
- SEO faltante: 0.
- Alt text faltante: 0.

Reportes:

- `shopify-audit/apply-csv-yandex-2026-06-01T22-53-19-546Z.json`
- `shopify-audit/apply-seo-yandex-2026-06-01T22-55-35-011Z.json`
- `shopify-audit/apply-csv-yandex-2026-06-01T22-57-05-119Z.json`

## Lote de 100 productos completado

Después de validar visualmente los primeros 10, se ejecutó el siguiente lote:

```bash
node upload-products-from-csv-yandex.js productos_todos.csv --apply --limit=100
```

Resultado:

- Creados nuevos: 90.
- Actualizados existentes: 10.
- Errores en upsert: 0.

Luego se aplicó SEO/alt text a todo el catálogo:

```bash
node update-current-products-seo-images.js --apply
```

Durante el primer pase aparecieron 5 productos sin imagen porque Shopify no pudo descargar algunas URLs devueltas por Yandex. Se mejoró `update-current-products-seo-images.js` para usar múltiples candidatos Yandex y reintentar hasta encontrar una URL que Shopify sí pueda descargar.

Re-ejecución final:

- Productos procesados: 154.
- OK: 154.
- Errores: 0.

Auditoría final post-lote 100:

- Total productos Shopify: 154.
- Activos: 154.
- Con imágenes: 154.
- Sin imágenes: 0.
- SEO faltante: 0.
- Alt text faltante: 0.

Reportes:

- `shopify-audit/apply-csv-yandex-2026-06-02T01-18-16-194Z.json`
- `shopify-audit/apply-seo-yandex-2026-06-02T01-23-19-432Z.json`
- `shopify-audit/apply-seo-yandex-2026-06-02T01-29-12-537Z.json`

Próximo lote recomendado: subir a `--limit=500` para crear los siguientes ~400 productos nuevos, auditar, y luego decidir si correr el resto completo.

Archivo creado:

- `upload-products-from-csv-yandex.js`

Uso planeado:

```bash
node upload-products-from-csv-yandex.js productos_todos.csv --dry-run --limit=10
node upload-products-from-csv-yandex.js productos_todos.csv --apply --limit=10
node upload-products-from-csv-yandex.js productos_todos.csv --apply
```

Funciones esperadas:

1. Leer CSV.
2. Normalizar SKU desde `Codigo`.
3. Buscar producto existente por SKU.
4. Si existe, actualizar título/precio/inventario/SEO/body.
5. Si no existe, crear producto.
6. Si no tiene imagen, buscar imagen candidata en Yandex.
7. Subir/asignar imagen en Shopify.
8. Aplicar rate limit entre requests.
9. Generar reporte de ejecución.

## Fotos Yandex

Estado actual:

- Los 54 productos actuales ya tienen imágenes, así que no se reemplazaron agresivamente.
- Se actualizó alt text SEO de imágenes existentes.
- El flujo Yandex queda reservado para:
  - productos nuevos desde CSV,
  - productos existentes sin imagen,
  - casos donde se decida reemplazar manualmente una imagen mala.

Riesgo conocido:

- Yandex Images usa HTML dinámico; el scraping directo puede devolver previews o URLs codificadas, no siempre imágenes finales limpias.

Plan para robustecer búsqueda Yandex:

1. Probar parser con `serp-item` y datos JSON embebidos.
2. Extraer URLs candidatas reales, no solo previews.
3. Validar cada URL con HEAD/GET:
   - status 200,
   - content-type `image/*`,
   - tamaño mínimo razonable,
   - extensión aceptable.
4. Descargar temporalmente imagen si es necesario.
5. Subir a Shopify.
6. Si Yandex falla, dejar producto creado sin imagen y reportarlo para revisión manual.

## Validaciones antes de aplicar CSV completo

Antes de subir miles de productos:

1. Confirmar columnas reales del CSV.
2. Ejecutar dry-run de 10 productos:

```bash
node upload-products-from-csv-yandex.js productos_todos.csv --dry-run --limit=10
```

3. Revisar reporte generado.
4. Ejecutar apply limitado:

```bash
node upload-products-from-csv-yandex.js productos_todos.csv --apply --limit=10
```

5. Auditar en Shopify:

```bash
node audit-products.js
```

6. Validar visualmente en Admin Shopify o tienda.
7. Recién después correr:

```bash
node upload-products-from-csv-yandex.js productos_todos.csv --apply
```

## Archivos relevantes

- `.env` — credenciales Shopify, no commitear.
- `.gitignore` — protege `.env`.
- `get-token.js` — OAuth Authorization Code.
- `verify-shopify-admin.js` — prueba REST + GraphQL.
- `audit-products.js` — auditoría productos Shopify.
- `update-current-products-seo-images.js` — actualización SEO/alt de productos actuales.
- `upload-products-from-csv-yandex.js` — upsert masivo desde CSV + fotos Yandex.
- `shopify-audit/` — reportes JSON.
- `config/site.config.ts` — configuración KINTO CMS / Shopify.

## Próximo paso exacto

Camilo debe enviar o ubicar el archivo de inventario completo.

Cuando exista el archivo:

```bash
cd /home/k41h4ck3r/work/kinto-miranda/kinto-cms/sites/distribuidor-miranda
node upload-products-from-csv-yandex.js productos_todos.csv --dry-run --limit=10
```

Si el dry-run sale correcto, aplicar primero 10 productos reales y auditar.

## Notas importantes

- No usar dependencias npm nuevas.
- No usar `dotenv`; leer `.env` manualmente con `fs`.
- No confiar en `legacyResourceId` para imágenes GraphQL; usar `image.id.split("/").pop()` si se necesita ID numérico.
- Mantener delay de 500ms entre productos/requests relevantes.
- No reemplazar imágenes existentes automáticamente salvo que se indique explícitamente.
- Para productos sin imagen, intentar Yandex y reportar fallos en JSON.
