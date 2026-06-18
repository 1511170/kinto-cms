# Plan Completo: Auditoría y Mejoras del Sitio Distribuidor Miranda

## Estado Actual de la Carga
- **Proceso:** `proc_22f213897205`
- **Progreso:** ~5,600 / 11,776 productos (~48%)
- **Tiempo restante estimado:** ~4.5 horas

---

## FASE 1: AUDITORÍA COMPLETA DEL SITIO (Inmediato)

### 1.1 Navegación y Menú
- [ ] Verificar que todos los links del menú principal funcionen
- [ ] Verificar links del footer
- [ ] Verificar breadcrumbs en páginas internas
- [ ] Verificar que el logo redirija al home

### 1.2 Home Page
- [ ] **Hero section:** Verificar que el buscador por vehículo funcione (marca/modelo/año)
- [ ] **Categorías:** Verificar que las 6 categorías principales se vean bien y redirijan correctamente
- [ ] **Productos destacados:** Verificar que carguen desde Shopify y se vean bien
- [ ] **Nuevos arribos:** Verificar que carguen y se vean bien
- [ ] **Marcas:** Verificar que el grid de marcas se vea correctamente
- [ ] **CTA Mayoristas:** Verificar que el formulario/mailto funcione

### 1.3 Páginas de Categoría
- [ ] Verificar que todas las categorías carguen productos
- [ ] Verificar filtros (precio, marca, disponibilidad)
- [ ] **CRÍTICO:** Productos agotados deben aparecer al final de la lista
- [ ] Verificar paginación si hay muchos productos
- [ ] Verificar ordenamiento (por defecto, precio, nombre)

### 1.4 Páginas de Producto
- [ ] Verificar que la galería de imágenes funcione
- [ ] Verificar selector de variantes (si aplica)
- [ ] Verificar que el precio se muestre correctamente
- [ ] Verificar stock/disponibilidad
- [ ] **CRÍTICO:** Botón "Agregar al carrito" debe funcionar
- [ ] Verificar tabs de descripción/especificaciones
- [ ] Verificar productos relacionados

### 1.5 Buscador
- [ ] Verificar que el buscador del header funcione
- [ ] Verificar resultados de búsqueda
- [ ] Verificar filtros en resultados de búsqueda
- [ ] Verificar búsqueda por código OEM
- [ ] Verificar búsqueda por VIN (si aplica)

### 1.6 Carrito
- [ ] Verificar que se pueda añadir productos al carrito
- [ ] Verificar que el drawer del carrito se abra
- [ ] Verificar que se puedan eliminar productos
- [ ] Verificar que se pueda cambiar cantidades
- [ ] **CRÍTICO:** Verificar que el checkout redirija a Shopify correctamente
- [ ] Verificar que el subtotal se calcule bien

### 1.7 Responsive y Diseño
- [ ] Verificar en desktop (1920px, 1440px, 1280px)
- [ ] Verificar en tablet (768px)
- [ ] Verificar en mobile (375px, 414px)
- [ ] **CRÍTICO:** Aumentar tamaño general ~30% (texto, botones, cards)
- [ ] Verificar que no se vea "boxed" o encajonado
- [ ] Verificar que ocupe todo el ancho de pantalla

---

## FASE 2: MEJORAS DE DISEÑO Y UX

### 2.1 Aumentar Tamaño General (~30%)
- [ ] Aumentar tamaño de fuente base (de ~16px a ~18-20px)
- [ ] Aumentar altura de botones (de 44px a ~52-56px)
- [ ] Aumentar padding en cards y secciones
- [ ] Aumentar max-width del contenedor (de 1440px a ~1600-1680px)
- [ ] Aumentar tamaño de imágenes en cards de producto
- [ ] Aumentar espaciado entre elementos

### 2.2 Mejorar Home
- [ ] Hacer el hero más impactante (imagen de fondo o video)
- [ ] Mejorar el buscador por vehículo (más prominente)
- [ ] Agregar banner de promociones/destacados
- [ ] Mejorar visualización de productos (más grandes, mejor info)
- [ ] Agregar sección de "Más vendidos"
- [ ] Agregar testimonials/reseñas
- [ ] Agregar badge de "Envío gratis" o "Garantía"

### 2.3 Mejorar Categorías
- [ ] Mejorar grid de productos (más grande, mejor info)
- [ ] Agregar quick-view al hover
- [ ] Agregar badge de "Nuevo", "Agotado", "Oferta"
- [ ] Mejorar filtros (más visibles, mejor UX)
- [ ] Agregar vista de lista además de grid

### 2.4 Mejorar Páginas de Producto
- [ ] Mejorar galería (zoom, thumbnails verticales)
- [ ] Destacar el precio y disponibilidad
- [ ] Mejorar descripción del producto
- [ ] Agregar tabla de compatibilidad
- [ ] Agregar preguntas frecuentes
- [ ] Mejorar productos relacionados

### 2.5 Mejorar Buscador
- [ ] Agregar búsqueda predictiva/autocomplete
- [ ] Agregar filtros rápidos
- [ ] Mejorar resultados vacíos (sugerencias)
- [ ] Agregar búsqueda reciente

---

## FASE 3: FUNCIONALIDAD CRÍTICA

### 3.1 Checkout de Shopify
- [ ] Configurar dominio personalizado para checkout
- [ ] Verificar que el carrito se sincronice con Shopify
- [ ] Verificar que los precios sean correctos
- [ ] Verificar que el envío se calcule bien
- [ ] Verificar que funcione en mobile

### 3.2 Productos Agotados
- [ ] **CRÍTICO:** En listados, productos agotados al final
- [ ] Mostrar badge "Agotado" claramente
- [ ] Permitir "Notificarme cuando haya stock"
- [ ] Ocultar botón de comprar en agotados

### 3.3 Performance
- [ ] Optimizar imágenes (WebP, lazy loading)
- [ ] Verificar Core Web Vitals
- [ ] Optimizar CSS crítico
- [ ] Verificar tiempos de carga

---

## FASE 4: TESTING AUTOMATIZADO

### 4.1 Tests con Playwright
- [ ] Test de navegación completa
- [ ] Test de búsqueda
- [ ] Test de carrito
- [ ] Test de checkout
- [ ] Test responsive
- [ ] Test de accesibilidad

### 4.2 Tests de Integración
- [ ] Test de conexión Shopify Storefront
- [ ] Test de cache KV
- [ ] Test de webhooks

---

## FASE 5: COMPONENTIZACIÓN ASTRO + TAILWIND

### 5.1 Componentes Reutilizables
- [ ] Crear componente `ProductCard` mejorado
- [ ] Crear componente `CategoryCard`
- [ ] Crear componente `SearchBar`
- [ ] Crear componente `FilterSidebar`
- [ ] Crear componente `Pagination`
- [ ] Crear componente `Breadcrumbs`
- [ ] Crear componente `PriceDisplay`
- [ ] Crear componente `StockBadge`

### 5.2 Layouts
- [ ] Layout base con header/footer
- [ ] Layout de categoría
- [ ] Layout de producto

### 5.3 Utilidades
- [ ] Helper de formato de precio
- [ ] Helper de formato de stock
- [ ] Helper de URLs

---

## PRIORIDADES

### P0 (Bloqueante - Hoy)
1. Verificar que el sitio cargue en el dominio correcto
2. Verificar que productos se vean en el home
3. Verificar que categorías funcionen
4. Verificar que el carrito funcione
5. Verificar que el checkout redirija bien

### P1 (Crítico - Esta semana)
1. Aumentar tamaño general ~30%
2. Productos agotados al final
3. Mejorar buscador por vehículo
4. Mejorar visualización de productos
5. Tests automatizados básicos

### P2 (Importante - Próxima semana)
1. Mejorar páginas de producto
2. Agregar quick-view
3. Mejorar filtros
4. Optimizar performance
5. Tests completos

### P3 (Mejoras - Futuro)
1. Personalización avanzada
2. Recomendaciones
3. Reviews
4. Wishlist
5. Comparador

---

## NOTAS
- Todo se hace bajo las guías de KINTO CMS
- Usar Astro + Tailwind para todos los componentes
- Mantener compatibilidad con Shopify Storefront API
- El sitio debe funcionar sin JavaScript (progresivo)
- Mobile-first approach
