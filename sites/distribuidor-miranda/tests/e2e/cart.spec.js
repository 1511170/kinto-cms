/**
 * Script de prueba para verificar el carrito y checkout
 * Usa Playwright para probar el flujo completo
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_URL || 'http://localhost:4321';

test.describe('Carrito y Checkout', () => {
  test('debe añadir producto al carrito', async ({ page }) => {
    // Navegar a un producto
    await page.goto(`${BASE_URL}/producto/capot-chevrolet-aveo-05-chevy-taxi-05-aveo-family-05/`);
    
    // Esperar que cargue el botón
    await page.waitForSelector('[data-add-to-cart]');
    
    // Click en añadir al carrito
    await page.click('[data-add-to-cart]');
    
    // Esperar que se abra el drawer del carrito
    await page.waitForSelector('[data-cart-drawer]:not([hidden])', { timeout: 5000 });
    
    // Verificar que hay items en el carrito
    const cartItems = await page.locator('.cart-item').count();
    expect(cartItems).toBeGreaterThan(0);
    
    // Verificar que el subtotal no sea $0
    const subtotal = await page.locator('[data-cart-subtotal]').textContent();
    expect(subtotal).not.toBe('$0');
  });

  test('debe redirigir al checkout de Shopify', async ({ page }) => {
    // Navegar a un producto y añadirlo
    await page.goto(`${BASE_URL}/producto/capot-chevrolet-aveo-05-chevy-taxi-05-aveo-family-05/`);
    await page.waitForSelector('[data-add-to-cart]');
    await page.click('[data-add-to-cart]');
    
    // Esperar el drawer
    await page.waitForSelector('[data-cart-drawer]:not([hidden])', { timeout: 5000 });
    
    // Click en checkout
    const checkoutUrl = await page.locator('[data-checkout-button]').getAttribute('href');
    expect(checkoutUrl).toContain('shopify.com');
  });

  test('debe mostrar productos agotados al final', async ({ page }) => {
    // Navegar a una categoría
    await page.goto(`${BASE_URL}/catalogo/todos/`);
    
    // Esperar que carguen los productos
    await page.waitForSelector('.dm-product-grid');
    
    // Verificar que los productos agotados estén al final
    const products = await page.locator('.dm-card').all();
    let foundOutOfStock = false;
    
    for (const product of products) {
      const isOutOfStock = await product.locator('.dm-badge-agotado').count() > 0;
      if (isOutOfStock) {
        foundOutOfStock = true;
      } else if (foundOutOfStock) {
        // Si encontramos un producto en stock después de uno agotado, falla
        throw new Error('Productos agotados no están al final');
      }
    }
  });
});
