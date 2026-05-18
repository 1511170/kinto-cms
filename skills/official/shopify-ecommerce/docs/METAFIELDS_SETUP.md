# Metafields Setup — `shopify-ecommerce` skill

El skill `shopify-ecommerce` consume metafields del namespace `kinto` para enriquecer las páginas de producto (PDP) con tabs de Especificaciones, Reviews y enlaces a datasheets. Esta guía explica cómo configurarlos en Shopify Admin.

## TL;DR

Crear definiciones de metafield en Shopify Admin → **Settings** → **Custom data** → **Products** → **Add definition**:

| Namespace.key          | Type                                | Uso                                                        |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------- |
| `kinto.specs`          | JSON o Multi-line text              | Especificaciones técnicas (tabla en PDP > tab Specs)       |
| `kinto.features`       | List of single-line text **o** JSON | Lista de características destacadas                        |
| `kinto.reviews`        | JSON                                | Reviews con autor, rating, fecha, texto                    |
| `kinto.rating`         | Decimal                             | Rating promedio (0.0–5.0)                                  |
| `kinto.review_count`   | Integer                             | Cantidad total de reviews                                  |
| `kinto.datasheet_url`  | URL                                 | Link al PDF datasheet del fabricante                       |
| `kinto.faq`            | JSON o Multi-line text              | Preguntas frecuentes para tab PDP + FAQPage schema         |
| `kinto.application`    | List text                           | Filtro: Hogar, Empresas, ISP, WISP, Operadores, Datacenter |
| `kinto.environment`    | List text                           | Filtro: Interior, Exterior, Interior/Exterior              |
| `kinto.band`           | List text                           | Filtro: 2.4GHz, 5GHz, 6GHz, 60GHz, etc.                    |
| `kinto.wifi_standard`  | List text                           | Filtro: WiFi 4, WiFi 5, WiFi 6, WiFi 6E, WiFi 7            |
| `kinto.ethernet_ports` | Integer                             | Filtro: número de puertos Ethernet                         |
| `kinto.sfp_ports`      | Integer                             | Filtro: número de puertos SFP/SFP+                         |
| `kinto.poe`            | List text                           | Filtro: PoE in, PoE out, PoE+, PoE++, No                   |
| `kinto.topology`       | List text                           | Filtro: PTP, PTMP, PTP/PTMP, Mesh                          |
| `kinto.radio_type`     | List text                           | Filtro: Integrado, Conectorizado, Integrado modular        |
| `kinto.mimo`           | List text                           | Filtro: SISO 1x1, MIMO 2x2, MIMO 4x4, etc.                 |
| `kinto.switch_layer`   | List text                           | Filtro: No administrable, L2, L3                           |
| `kinto.throughput`     | List text                           | Dato técnico para búsqueda y llms.txt                      |
| `kinto.mounting`       | List text                           | Filtro: Techo, Pared, Rack, Poste, Escritorio              |

Una vez creadas, edita cada producto y rellena los campos que correspondan. El skill ya extiende el GraphQL query y los muestra automáticamente en la PDP cuando existan datos.

---

## Paso a paso en Shopify Admin

### 1. Settings → Custom data → Products

Navegá a `https://{tu-tienda}.myshopify.com/admin/settings/custom_data/products`. Click en **Add definition**.

### 2. `kinto.specs` (Especificaciones)

- **Name**: Especificaciones
- **Namespace and key**: `kinto` · `specs`
- **Description**: Tabla técnica de especificaciones (frecuencia, throughput, IP rating, alimentación, etc.).
- **Type**: **Multi-line text** (más simple) o **JSON** (más estructurado).

**Formato si elegís Multi-line text** (una línea por spec, formato `key: value`):

```
Frecuencia: 5 GHz
Throughput: 1.7 Gbps
Antenas: 4×4 MIMO
Alimentación: 802.3af PoE
Temperatura operación: -30 a +75 °C
IP rating: IP67
Peso: 0.45 kg
```

**Formato si elegís JSON** (array de objetos):

```json
[
  { "label": "Frecuencia", "value": "5 GHz" },
  { "label": "Throughput", "value": "1.7 Gbps" },
  { "label": "Antenas", "value": "4×4 MIMO" }
]
```

### 3. `kinto.features` (Características destacadas)

- **Name**: Características
- **Namespace and key**: `kinto` · `features`
- **Type**: **List of single-line text** (recomendado) o **Multi-line text** o **JSON array**.

Ejemplos:

```
WiFi 6 (802.11ax)
PoE+ alimentación
Outdoor IP67
Mesh network ready
Cloud management
```

### 4. `kinto.reviews` (Reviews)

- **Name**: Reviews
- **Namespace and key**: `kinto` · `reviews`
- **Type**: **JSON**

Formato:

```json
[
  {
    "author": "Juan Pérez",
    "rating": 5,
    "date": "2026-04-15",
    "verified": true,
    "text": "Excelente equipo. Lo instalé en una torre de 30m y tengo throughput estable a 12km."
  },
  {
    "author": "María López",
    "rating": 4,
    "date": "2026-03-22",
    "verified": true,
    "text": "Buena cobertura, fácil de configurar. Le bajaría una estrella por el precio."
  }
]
```

### 5. `kinto.rating` (Rating promedio)

- **Name**: Rating promedio
- **Namespace and key**: `kinto` · `rating`
- **Type**: **Decimal**
- **Validations**: min 0, max 5, máximo 1 decimal

Ejemplo: `4.7`

> Si dejás vacío y existen reviews, el skill calcula el promedio automáticamente.

### 6. `kinto.review_count` (Conteo de reviews)

- **Name**: Cantidad de reviews
- **Namespace and key**: `kinto` · `review_count`
- **Type**: **Integer**

Ejemplo: `127`

> Si dejás vacío, el skill usa `reviews.length`.

### 7. `kinto.datasheet_url` (Datasheet PDF)

- **Name**: Datasheet URL
- **Namespace and key**: `kinto` · `datasheet_url`
- **Type**: **URL**

Ejemplo: `https://dl.ubnt.com/datasheets/u6-pro/u6_pro_ds.pdf`

### 8. `kinto.faq` (Preguntas frecuentes)

- **Name**: Preguntas frecuentes
- **Namespace and key**: `kinto` · `faq`
- **Type**: **JSON** (recomendado) o **Multi-line text**
- **Uso**: Alimenta el tab "Preguntas frecuentes", el schema `FAQPage` y el `llms.txt`.

**Formato recomendado JSON**:

```json
[
  {
    "question": "¿Qué incluye en la caja?",
    "answer": "Access Point, placa de montaje y tornillos."
  },
  {
    "question": "¿Necesita PoE?",
    "answer": "Sí, requiere alimentación PoE compatible según la ficha técnica del fabricante."
  }
]
```

También acepta claves cortas:

```json
[{ "q": "¿Tiene garantía?", "a": "Sí, garantía oficial del fabricante." }]
```

**Formato Multi-line text**:

```text
Q: ¿Qué incluye en la caja?
A: Access Point, placa de montaje y tornillos.

Q: ¿Necesita PoE?
A: Sí, requiere alimentación PoE compatible según la ficha técnica del fabricante.
```

---

## 9. Taxonomía competitiva para colecciones y filtros

Tu tienda debe organizar Shopify con una taxonomía propia, inspirada en cómo compra el mercado de networking profesional en Colombia. Macrotics se usó como benchmark público para detectar familias y facetas, pero el contenido no debe copiarse.

### Colecciones principales recomendadas

Crear o normalizar estas collections en Shopify Admin:

| Handle         | Título       | Uso                                                   |
| -------------- | ------------ | ----------------------------------------------------- |
| `routers`      | Routers      | Gateways, balanceadores, routers ISP/empresa/hogar    |
| `switches`     | Switches     | Switches PoE/no PoE, L2/L3, rack/escritorio           |
| `wifi`         | WiFi         | Access points, mesh, indoor/outdoor                   |
| `enlaces`      | Enlaces      | Radios PtP/PtMP, CPE, estaciones base, antenas        |
| `fibra-optica` | Fibra óptica | ONT/ONU, módulos, patch cords, accesorios fibra       |
| `cableado-utp` | Cableado UTP | Cable, conectores, patch cords, canalización          |
| `lte-5g`       | LTE / 5G     | Routers celulares, gateways industriales, antenas LTE |
| `accesorios`   | Accesorios   | Fuentes, PoE injectors, soportes, pigtails            |
| `outlet`       | Outlet       | Liquidación, descuentos, unidades especiales          |

Colecciones secundarias útiles: `ubiquiti`, `mikrotik`, `tp-link-omada`, `aruba`, `mimosa`, `cambium`, `ruijie`, `tenda`, `poe`, `wifi-6`, `wifi-7`, `exterior`, `isp-wisp`.

### Facetas técnicas normalizadas

Usar valores consistentes. Evitar duplicados como `WIFI6`, `WIFI 6`, `Wi-Fi 6`; elegir siempre `WiFi 6`.

| Metafield       | Valores sugeridos                                              |
| --------------- | -------------------------------------------------------------- |
| `application`   | `Hogar`, `Empresas`, `ISP`, `WISP`, `Operadores`, `Datacenter` |
| `environment`   | `Interior`, `Exterior`, `Interior/Exterior`                    |
| `band`          | `2.4GHz`, `5GHz`, `6GHz`, `60GHz`, `900MHz`, `4.9-6.4GHz`      |
| `wifi_standard` | `WiFi 4`, `WiFi 5`, `WiFi 6`, `WiFi 6E`, `WiFi 7`              |
| `poe`           | `PoE in`, `PoE out`, `PoE+`, `PoE++`, `No`                     |
| `topology`      | `PTP`, `PTMP`, `PTP/PTMP`, `Mesh`                              |
| `radio_type`    | `Integrado`, `Conectorizado`, `Integrado modular`              |
| `mimo`          | `SISO 1x1`, `MIMO 2x2`, `MIMO 3x3`, `MIMO 4x4`, `MIMO 8x8`     |
| `switch_layer`  | `No administrable`, `L2`, `L3`                                 |
| `mounting`      | `Techo`, `Pared`, `Rack`, `Poste`, `Escritorio`                |

### Priorización de carga

1. Ubiquiti UniFi/U6/U7.
2. MikroTik routers y switches.
3. NanoStation, LiteBeam, airMAX y radios PtP/PtMP.
4. TP-Link Omada.
5. Mimosa, Cambium, Ruijie y Tenda.

Los filtros del storefront aparecen automáticamente solo cuando al menos un producto de la colección tiene el metafield cargado.

---

## Verificación

1. Editá un producto (ej. `tu-tienda.myshopify.com/admin/products/u6`).
2. En la sección **Metafields** abajo, completá los campos.
3. Save.
4. Rebuild del sitio: `npm run build` desde `sites/{cliente}/`.
5. Visitar `/products/{handle}` en el sitio. La PDP debería mostrar:
   - Tab "Especificaciones" con la tabla.
   - Tab "Reviews" con stars + distribución.
   - Header con rating (4.7 — 127 reviews).
   - Tab "Preguntas frecuentes" con accordion si `kinto.faq` tiene datos.
   - JSON-LD `FAQPage` en el HTML si `kinto.faq` tiene datos.
6. Visitar `/store/routers`, `/store/switches`, `/store/wifi` o `/store/enlaces`.
7. Confirmar que los filtros técnicos aparecen cuando hay metafields cargados y que la URL cambia con parámetros como `?wifi=WiFi%206&env=Interior`.

Si no aparecen, verificar:

- El namespace y key son **exactamente** `kinto.specs` etc.
- El JSON parsea válido (probar en jsonlint.com).
- El access token de Storefront API tiene scope `unauthenticated_read_metaobjects` activado.

---

## Bulk import (opcional)

Para llenar 322 productos rápido, podés exportar el CSV desde Shopify Admin (`Products → Export`), agregar columnas para los metafields:

- `Metafield: kinto.specs [multi_line_text_field]`
- `Metafield: kinto.features [list.single_line_text_field]`
- `Metafield: kinto.application [list.single_line_text_field]`
- `Metafield: kinto.environment [list.single_line_text_field]`
- `Metafield: kinto.band [list.single_line_text_field]`
- `Metafield: kinto.wifi_standard [list.single_line_text_field]`
- `Metafield: kinto.ethernet_ports [number_integer]`
- `Metafield: kinto.sfp_ports [number_integer]`
- `Metafield: kinto.poe [list.single_line_text_field]`
- etc.

Y reimportar. Shopify acepta JSON inline en las celdas para los tipos `json` y multi-line text.

---

## Por qué namespace `kinto`

El skill usa este namespace fijo para que la convención sea reusable entre clientes que adopten el mismo skill. Si querés un namespace distinto (`mi-marca` por ejemplo), modificá `skills/official/shopify-ecommerce/config/shopify.graphql.ts` (busca `METAFIELD_NAMESPACE`) y `lib/product-mapper.ts` (la función `parseMetafields`).
