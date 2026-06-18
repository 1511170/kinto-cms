# Distribuidor Miranda — Product page cart, quantity, brand/vendor and payment copy cleanup

## Objetivo
Corregir bugs y UX críticos en páginas de producto y catálogo:

1. `Agregar al carrito` en página de producto no funciona correctamente, mientras `Comprar ahora` sí.
2. Control de unidades en página de producto no permite cambiar cantidad por input ni botones +/-.
3. Mostrar la marca real del repuesto/pieza, no `Distribuidor Miranda` como marca universal.
4. Eliminar textos `Shop Pay` / variantes tipo `Shop Pay 5` del sitio; reemplazar por copy local: pagos seguros, múltiples medios, pago contra entrega cuando aplique.
5. Verificar colección y producto en producción con navegador automatizado antes de cerrar.

## Hipótesis iniciales a validar
- Producto usa listener o selector distinto al catálogo para `data-add-to-cart`, o el botón carece de `data-variant-id` correcto.
- Quantity control puede estar roto por selector `.dm-qty`, input disabled/readonly, overlay, o JS que no se carga en producto.
- Marca real puede estar disponible como vendor/tags/title/SKU metadata en `catalog.ts`/Shopify mapper, pero el schema/UI usa seller/fallback `Distribuidor Miranda`.
- `Shop Pay` viene de labels estáticos en producto/cart/payment strip o desde checkout copy.

## Archivos esperados
- `sites/distribuidor-miranda/src/pages/producto/[id].astro`
- `sites/distribuidor-miranda/src/components/CartDrawer.astro`
- `sites/distribuidor-miranda/src/components/ProductCard.astro`
- `sites/distribuidor-miranda/src/lib/cart-client.ts` o equivalente
- `sites/distribuidor-miranda/src/lib/catalog*` / Shopify mapper
- `sites/distribuidor-miranda/src/styles/global.css`
- scripts de QA Playwright si hace falta

## Pasos
1. Reproducir en producción con Playwright: producto add-to-cart, comprar ahora y cantidad +/-/input.
2. Comparar DOM/listeners/data attributes producto vs colección donde sí funciona.
3. Arreglar raíz del add-to-cart para que producto dispare `cart-add-request` al drawer igual que tarjetas.
4. Arreglar quantity control y asegurar que add-to-cart/buy-now usen la cantidad seleccionada.
5. Investigar fuente de marca/vendor y añadir heurística/mapper para marca real del repuesto, con badge visible junto al precio/meta.
6. Buscar y reemplazar `Shop Pay`, `shop pay`, `ShopPay`, `checa 8 p5`/variantes raras por copy local.
7. Build completo, deploy Cloudflare Worker, verificación producción con screenshot/DOM/console.
8. Commit enfocado y reporte final.

## Verificación mínima
- Producto: `Agregar al carrito` abre drawer, no redirige, crea `lp_cart_id` y muestra item.
- Producto: +/- e input cambian cantidad; add-to-cart respeta cantidad.
- Producto: `Comprar ahora` sigue funcionando.
- Colección: add-to-cart sigue funcionando.
- No hay texto `Shop Pay` o variantes detectadas en HTML generado.
- Marca visible en producto y no aparece todo como `Distribuidor Miranda` cuando hay marca inferida.
- Sin overflow móvil ni errores JS críticos.
