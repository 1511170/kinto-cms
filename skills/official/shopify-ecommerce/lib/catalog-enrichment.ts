/**
 * Namespace de los metafields. Debe coincidir con METAFIELD_NAMESPACE de
 * config/shopify.graphql.ts (mantener en sync — default "kinto").
 */
const METAFIELD_NAMESPACE = "kinto";

export interface ShopifyCatalogProduct {
  handle: string;
  title: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  collections?: string[];
  sku?: string | null;
  description?: string;
}

export interface BenchmarkSpec {
  label: string;
  value: string;
}

export interface BenchmarkFacets {
  application?: string[];
  environment?: string[];
  band?: string[];
  wifiStandard?: string[];
  ethernetPorts?: number;
  sfpPorts?: number;
  poe?: string[];
  topology?: string[];
  radioType?: string[];
  mimo?: string[];
  switchLayer?: string[];
  throughput?: string[];
  mounting?: string[];
}

export interface BenchmarkProduct {
  sourceUrl: string;
  title: string;
  brand?: string;
  reference?: string;
  category?: string;
  description?: string;
  features?: string[];
  specs?: BenchmarkSpec[];
  facets?: BenchmarkFacets;
  datasheetUrl?: string;
  aliases?: string[];
  useCases?: string[];
}

export interface CatalogMatch {
  status: "matched" | "ambiguous" | "missing";
  score: number;
  product?: BenchmarkProduct;
  candidates: Array<{
    product: BenchmarkProduct;
    score: number;
    reasons: string[];
  }>;
}

export interface ShopifyMetafieldPayload {
  namespace: string;
  key: string;
  type:
    | "json"
    | "single_line_text_field"
    | "multi_line_text_field"
    | "url"
    | "list.single_line_text_field"
    | "number_integer";
  value: string;
}

export interface ShopifyProductEnrichment {
  handle: string;
  title: string;
  description?: string;
  collections: string[];
  pricePolicy: "keep_zero";
  sourceUrl: string;
  metafields: Record<string, ShopifyMetafieldPayload>;
}

const FACET_META: Record<
  keyof BenchmarkFacets,
  { key: string; type: ShopifyMetafieldPayload["type"] }
> = {
  application: { key: "application", type: "list.single_line_text_field" },
  environment: { key: "environment", type: "list.single_line_text_field" },
  band: { key: "band", type: "list.single_line_text_field" },
  wifiStandard: { key: "wifi_standard", type: "list.single_line_text_field" },
  ethernetPorts: { key: "ethernet_ports", type: "number_integer" },
  sfpPorts: { key: "sfp_ports", type: "number_integer" },
  poe: { key: "poe", type: "list.single_line_text_field" },
  topology: { key: "topology", type: "list.single_line_text_field" },
  radioType: { key: "radio_type", type: "list.single_line_text_field" },
  mimo: { key: "mimo", type: "list.single_line_text_field" },
  switchLayer: { key: "switch_layer", type: "list.single_line_text_field" },
  throughput: { key: "throughput", type: "list.single_line_text_field" },
  mounting: { key: "mounting", type: "list.single_line_text_field" },
};

export function normalizeReference(value?: string | null): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function tokenSet(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/[\s-]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2),
  );
}

function overlapScore(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 || right.size === 0) return 0;
  let overlap = 0;
  for (const token of left) if (right.has(token)) overlap++;
  return overlap / Math.max(left.size, right.size);
}

function referenceTokens(value?: string): Set<string> {
  const tokens = new Set<string>();
  const matches =
    (value ?? "").match(
      /[a-z0-9]+(?:[-+][a-z0-9]+)+|[a-z]+[0-9][a-z0-9+.-]*|[a-z0-9+.-]*[0-9][a-z]+[a-z0-9+.-]*/gi,
    ) ?? [];
  for (const match of matches) {
    const normalized = normalizeReference(match);
    if (normalized.length >= 4) tokens.add(normalized);
  }
  return tokens;
}

function scoreCandidate(
  product: ShopifyCatalogProduct,
  benchmark: BenchmarkProduct,
) {
  const reasons: string[] = [];
  const productRefs = uniqueStrings(
    [product.sku, product.handle, product.title].filter(Boolean) as string[],
  )
    .map(normalizeReference)
    .filter((ref) => ref.length >= 4);
  const primaryProductRef = normalizeReference(
    product.sku || product.handle || product.title,
  );
  const benchmarkRef = normalizeReference(
    benchmark.reference || benchmark.title,
  );
  const titleAndUrlRefs = new Set([
    ...referenceTokens(benchmark.title),
    ...referenceTokens(benchmark.sourceUrl),
  ]);
  const descriptionRefs = referenceTokens(benchmark.description);

  if (primaryProductRef && benchmarkRef && primaryProductRef === benchmarkRef) {
    return { score: 1, reasons: ["exact_reference"] };
  }

  let score = 0;
  for (const productRef of productRefs) {
    if (benchmarkRef && benchmarkRef === productRef) {
      return { score: 1, reasons: ["exact_reference"] };
    }
    if (titleAndUrlRefs.has(productRef)) {
      score = Math.max(score, 0.86);
      reasons.push("model_reference_in_title_or_url");
    } else if (descriptionRefs.has(productRef)) {
      score = Math.max(score, 0.76);
      reasons.push("model_reference_in_description");
    } else if (benchmarkRef.includes(productRef)) {
      score = Math.max(score, 0.55);
      reasons.push("benchmark_reference_contains_product_reference");
    }
  }

  const titleScore = overlapScore(
    tokenSet(product.title),
    tokenSet(benchmark.title),
  );
  if (titleScore > 0) {
    score += titleScore * 0.4;
    reasons.push("title_token_overlap");
  }

  const collectionTokens = tokenSet(
    [...(product.collections ?? []), ...(product.tags ?? [])].join(" "),
  );
  const benchmarkTokens = tokenSet(
    [benchmark.brand, benchmark.category].filter(Boolean).join(" "),
  );
  const taxonomyScore = overlapScore(collectionTokens, benchmarkTokens);
  if (taxonomyScore > 0) {
    score += taxonomyScore * 0.15;
    reasons.push("taxonomy_overlap");
  }

  return { score: Math.min(0.99, Number(score.toFixed(3))), reasons };
}

export function matchCatalogProduct(
  product: ShopifyCatalogProduct,
  benchmarkProducts: BenchmarkProduct[],
): CatalogMatch {
  const candidates = benchmarkProducts
    .map((candidate) => ({
      product: candidate,
      ...scoreCandidate(product, candidate),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = candidates[0];
  const second = candidates[1];
  if (!best || best.score < 0.55)
    return { status: "missing", score: best?.score ?? 0, candidates };
  if (second && best.score < 1 && best.score - second.score < 0.15) {
    return { status: "ambiguous", score: best.score, candidates };
  }

  return {
    status: "matched",
    score: best.score,
    product: best.product,
    candidates,
  };
}

function metafield(
  key: string,
  type: ShopifyMetafieldPayload["type"],
  value: unknown,
): ShopifyMetafieldPayload {
  return {
    namespace: METAFIELD_NAMESPACE,
    key,
    type,
    value: typeof value === "string" ? value : JSON.stringify(value),
  };
}

function uniqueStrings(values: string[] = []): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function collectionHandle(value?: string): string | null {
  if (!value) return null;
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildShopifyProductEnrichment(
  product: ShopifyCatalogProduct,
  benchmark: BenchmarkProduct,
): ShopifyProductEnrichment {
  const metafields: Record<string, ShopifyMetafieldPayload> = {};

  if (benchmark.specs?.length) {
    metafields[`${METAFIELD_NAMESPACE}.specs`] = metafield(
      "specs",
      "json",
      benchmark.specs,
    );
  }
  if (benchmark.features?.length) {
    metafields[`${METAFIELD_NAMESPACE}.features`] = metafield(
      "features",
      "list.single_line_text_field",
      uniqueStrings(benchmark.features),
    );
  }
  if (benchmark.datasheetUrl) {
    metafields[`${METAFIELD_NAMESPACE}.datasheet_url`] = metafield(
      "datasheet_url",
      "url",
      benchmark.datasheetUrl,
    );
  }

  for (const [facetKey, config] of Object.entries(FACET_META) as Array<
    [
      keyof BenchmarkFacets,
      { key: string; type: ShopifyMetafieldPayload["type"] },
    ]
  >) {
    const value = benchmark.facets?.[facetKey];
    if (value === undefined) continue;
    metafields[`${METAFIELD_NAMESPACE}.${config.key}`] = metafield(
      config.key,
      config.type,
      Array.isArray(value) ? uniqueStrings(value) : value,
    );
  }

  const collections = new Set(product.collections ?? []);
  const brandHandle = collectionHandle(benchmark.brand);
  const categoryHandle = collectionHandle(benchmark.category);
  if (brandHandle) collections.add(brandHandle);
  if (categoryHandle) collections.add(categoryHandle);

  return {
    handle: product.handle,
    title: benchmark.title,
    description: benchmark.description || product.description,
    collections: [...collections],
    pricePolicy: "keep_zero",
    sourceUrl: benchmark.sourceUrl,
    metafields,
  };
}
