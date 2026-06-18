/**
 * Jerarquía estática de categorías / subcategorías.
 * Las colecciones principales listan sus subcolecciones lógicas.
 * Las colecciones que no son claves de este mapa no muestran subcategorías.
 */

export const CATEGORY_HIERARCHY: Record<string, string[]> = {
  pesca: [
    "canas-de-spinning",
    "canas-de-casting",
    "canas-para-pesca",
    "combos-cana-para-pesca",
    "combos-spinning",
    "molinetes-de-pesca",
    "molinetes-de-spinning",
    "molinetes-de-casting",
    "molinetes-de-mosqueo",
    "senuelos-y-carnadas",
    "suaves",
    "duras",
    "nylon-para-pesca",
    "fluorocarbono",
    "monofilamento",
    "anzuelos",
    "jigs",
    "terminales-para-pesca",
    "uniones",
    "bass-pro-shops",
    "junnie-s-cat-tracker",
  ],
  camping: ["colchones-inflables-y-colchonetas", "nueva-importacion-camping"],
  outdoor: ["herramientas-alicates-y-otros", "nueva-importacion-outdoor"],
  caza: ["armas-de-aire", "rifles-de-aire-comprimido", "tiro-deportivo"],
  "senuelos-y-carnadas": [
    "yo-zuri",
    "berkley",
    "berkley-1",
    "creme",
    "netbait",
    "calcutta",
    "yamamoto",
  ],
};

/**
 * Títulos legibles para subcategorías que no vienen de Shopify
 * o que necesitan un nombre más limpio.
 */
export const CATEGORY_LABELS: Record<string, string> = {
  "canas-de-spinning": "Cañas de Spinning",
  "canas-de-casting": "Cañas de Casting",
  "canas-para-pesca": "Cañas para Pesca",
  "combos-cana-para-pesca": "Combos Caña",
  "combos-spinning": "Combos Spinning",
  "molinetes-de-pesca": "Molinetes",
  "molinetes-de-spinning": "Molinetes Spinning",
  "molinetes-de-casting": "Molinetes Casting",
  "molinetes-de-mosqueo": "Molinetes Mosqueo",
  "senuelos-y-carnadas": "Señuelos y Carnadas",
  "nylon-para-pesca": "Nylon",
  fluorocarbono: "Fluorocarbono",
  monofilamento: "Monofilamento",
  anzuelos: "Anzuelos",
  jigs: "Jigs",
  "terminales-para-pesca": "Terminales",
  uniones: "Uniones",
  "bass-pro-shops": "Bass Pro Shops",
  "junnie-s-cat-tracker": "Junnie's Cat Tracker",
  suaves: "Señuelos Suaves",
  duras: "Señuelos Duros",
  "yo-zuri": "Yo-Zuri",
  berkley: "Berkley",
  "berkley-1": "Berkley (alt)",
  creme: "Creme",
  netbait: "Netbait",
  calcutta: "Calcutta",
  yamamoto: "Yamamoto",
  "colchones-inflables-y-colchonetas": "Colchones Inflables",
  "nueva-importacion-camping": "Nueva Importación Camping",
  "herramientas-alicates-y-otros": "Herramientas",
  "nueva-importacion-outdoor": "Nueva Importación Outdoor",
  "armas-de-aire": "Armas de Aire",
  "rifles-de-aire-comprimido": "Rifles de Aire",
  "tiro-deportivo": "Tiro Deportivo",
};
