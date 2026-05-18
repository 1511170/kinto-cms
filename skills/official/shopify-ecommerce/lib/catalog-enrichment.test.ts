import test from "node:test";
import assert from "node:assert/strict";

import {
  buildShopifyProductEnrichment,
  matchCatalogProduct,
  normalizeReference,
  type BenchmarkProduct,
  type ShopifyCatalogProduct,
} from "./catalog-enrichment.ts";

const lpProduct: ShopifyCatalogProduct = {
  handle: "u6-pro",
  title: "U6 Pro",
  vendor: "House Brand",
  productType: "",
  tags: ["WIFI"],
  collections: ["ubiquiti", "wifi"],
  sku: "U6-PRO",
  description: "Access point profesional para interiores.",
};

const benchmark: BenchmarkProduct = {
  sourceUrl: "https://www.macrotics.com/u6-pro",
  title: "Punto de acceso WiFi 6 Ubiquiti UniFi U6 Pro 4x4 MIMO PoE+",
  brand: "Ubiquiti",
  reference: "U6-PRO",
  category: "WiFi",
  description: "Access point UniFi WiFi 6 para empresas.",
  features: ["WiFi 6", "PoE+", "Montaje en techo"],
  specs: [
    { label: "WiFi", value: "WiFi 6" },
    { label: "MIMO", value: "4x4" },
    { label: "Alimentación", value: "PoE+" },
  ],
  facets: {
    application: ["Empresas"],
    environment: ["Interior"],
    wifiStandard: ["WiFi 6"],
    poe: ["PoE+"],
    mimo: ["MIMO 4x4"],
    mounting: ["Techo"],
  },
};

test("normalizeReference removes punctuation and casing noise", () => {
  assert.equal(normalizeReference(" U6-PRO "), "u6pro");
  assert.equal(normalizeReference("RB 750Gr3"), "rb750gr3");
});

test("matchCatalogProduct prefers exact SKU/reference matches", () => {
  const match = matchCatalogProduct(lpProduct, [benchmark]);

  assert.equal(match.status, "matched");
  assert.equal(match.score, 1);
  assert.equal(match.product?.sourceUrl, benchmark.sourceUrl);
});

test("buildShopifyProductEnrichment keeps price zero and maps benchmark data to namespaced metafields", () => {
  const enrichment = buildShopifyProductEnrichment(lpProduct, benchmark);

  assert.equal(enrichment.handle, "u6-pro");
  assert.equal(enrichment.pricePolicy, "keep_zero");
  assert.equal(
    enrichment.title,
    "Punto de acceso WiFi 6 Ubiquiti UniFi U6 Pro 4x4 MIMO PoE+",
  );
  assert.deepEqual(enrichment.collections.sort(), ["ubiquiti", "wifi"]);
  assert.equal(enrichment.metafields["kinto.specs"].type, "json");
  assert.equal(
    enrichment.metafields["kinto.wifi_standard"].value,
    JSON.stringify(["WiFi 6"]),
  );
  assert.equal(
    enrichment.metafields["kinto.poe"].value,
    JSON.stringify(["PoE+"]),
  );
});

test("matchCatalogProduct accepts exact title/reference when benchmark list has one product", () => {
  const match = matchCatalogProduct({ ...lpProduct, sku: null }, [benchmark]);

  assert.equal(match.status, "matched");
  assert.ok(match.score >= 0.55);
});

test("matchCatalogProduct matches model references embedded in benchmark title or URL", () => {
  const match = matchCatalogProduct(
    { ...lpProduct, sku: null, handle: "rb750gr3", title: "RB750GR3" },
    [
      {
        ...benchmark,
        reference: "00000024",
        title:
          "Router MikroTik HEX de 5 puertos gigabit, CPU 880MHz y 256MB RAM",
        description:
          "El router RB750GR3 es uno de los routers mas utilizados en despliegues pequeños.",
        sourceUrl: "https://www.macrotics.com/router-mikrotik-rb750gr3/p",
      },
    ],
  );

  assert.equal(match.status, "matched");
  assert.ok(match.score >= 0.86);
});

test("matchCatalogProduct does not treat a shorter model as a longer variant", () => {
  const match = matchCatalogProduct(
    { ...lpProduct, sku: null, handle: "usw-pro-24", title: "USW-Pro-24" },
    [
      {
        ...benchmark,
        reference: "00000123",
        title: "Switch Ubiquiti UniFi USW-Pro-24-POE Capa 3 de 24 puertos PoE+",
        description: "Switch administrable con referencia USW-Pro-24-POE.",
        sourceUrl:
          "https://www.macrotics.com/switching-routing-ubiquiti-usw-pro-24-poe/p",
      },
    ],
  );

  assert.notEqual(match.status, "matched");
});

test("matchCatalogProduct marks ambiguous when two candidates are too close", () => {
  // Product model appears in both benchmark descriptions with same score
  const match = matchCatalogProduct(
    { ...lpProduct, sku: null, handle: "rb960pgs", title: "RB960PGS" },
    [
      {
        ...benchmark,
        reference: "00000001",
        title: "Router MikroTik de 5 puertos",
        sourceUrl: "https://www.macrotics.com/router-1",
        description: "El RB960PGS es un router compacto de 5 puertos gigabit.",
      },
      {
        ...benchmark,
        reference: "00000002",
        title: "Router MikroTik profesional",
        sourceUrl: "https://www.macrotics.com/router-2",
        description: "El RB960PGS es un router con PoE out y 5 puertos.",
      },
    ],
  );

  assert.equal(match.status, "ambiguous");
  assert.ok(match.score > 0);
  assert.ok(match.candidates.length >= 2);
});

test("matchCatalogProduct handles a real low-band matched product from gap report", () => {
  // sg105 from enrichment-080 gap report: score 0.835, matched
  const match = matchCatalogProduct(
    {
      handle: "sg105",
      title: "SG105",
      vendor: "House Brand",
      collections: ["tenda", "switches"],
      sku: "SG105",
    },
    [
      {
        ...benchmark,
        brand: "Tenda",
        reference: "SG105",
        title: "Switch Gigabit de sobremesa de 5 puertos",
        sourceUrl:
          "https://www.macrotics.com/switches-tenda-sg105-5-puertos-gb-carcaza-plastica/p",
        description: "Switch Tenda SG105 de 5 puertos gigabit.",
      },
    ],
  );

  assert.equal(match.status, "matched");
  assert.ok(match.score >= 0.8);
});
