export interface Product {
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  featuredImage: Image | null;
  images: Image[];
  variants: Variant[];
  collections: string[];
  seo: { title: string; description: string };
  availableForSale: boolean;
  metafields: ProductMetafields;
}

export interface SpecRow {
  label: string;
  value: string;
}

export interface ReviewEntry {
  author: string;
  rating: number;
  date?: string;
  text: string;
  verified?: boolean;
}

export interface FAQEntry {
  question: string;
  answer: string;
}

export interface ProductMetafields {
  specs?: SpecRow[];
  features?: string[];
  reviews?: ReviewEntry[];
  rating?: number;
  reviewCount?: number;
  datasheetUrl?: string;
  faqs?: FAQEntry[];
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
  /** Global identifiers for Google Merchant Center and rich results. */
  gtin?: string;
  mpn?: string;
  /** Google Product Taxonomy category, either ID or full path. */
  googleProductCategory?: string;
}

export interface Variant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: { amount: string; currencyCode: string };
  compareAtPrice: { amount: string; currencyCode: string } | null;
  image: Image | null;
  selectedOptions: { name: string; value: string }[];
  sku: string | null;
}

export interface Image {
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

export interface Collection {
  handle: string;
  title: string;
  description: string;
  image: Image | null;
}

export interface CartLine {
  id: string;
  quantity: number;
  cost: { subtotalAmount: { amount: string; currencyCode: string } };
  merchandise: {
    id: string;
    title: string;
    image: Image | null;
    price: { amount: string; currencyCode: string };
    product: {
      title: string;
      handle: string;
    };
  };
}

export interface CartState {
  id: string;
  checkoutUrl: string;
  lines: CartLine[];
  cost: {
    subtotal: { amount: string; currencyCode: string };
    total: { amount: string; currencyCode: string };
  };
}

export function mapShopifyProduct(raw: any): Product {
  return {
    handle: raw.handle,
    title: raw.title,
    description: raw.description,
    descriptionHtml: raw.descriptionHtml,
    vendor: raw.vendor,
    productType: raw.productType,
    tags: raw.tags,
    featuredImage: raw.featuredImage ?? null,
    images: raw.images?.edges?.map((e: any) => e.node) ?? [],
    variants:
      raw.variants?.edges?.map((e: any) => mapShopifyVariant(e.node)) ?? [],
    collections: raw.collections?.edges?.map((e: any) => e.node.handle) ?? [],
    seo: raw.seo ?? { title: "", description: "" },
    availableForSale: raw.availableForSale,
    metafields: parseMetafields(raw.metafields),
  };
}

function parseMetafields(raw: any): ProductMetafields {
  if (!raw) return {};
  const list: any[] = Array.isArray(raw)
    ? raw
    : (raw.edges?.map((e: any) => e.node) ?? []);
  const result: ProductMetafields = {};

  for (const m of list) {
    if (!m || !m.key) continue;
    const key = m.key as string;
    const value = m.value as string;

    try {
      if (key === "specs") {
        result.specs = parseSpecs(value);
      } else if (key === "features") {
        result.features = parseFeatures(value);
      } else if (key === "reviews") {
        result.reviews = parseReviews(value);
      } else if (key === "rating") {
        result.rating = parseFloat(value);
      } else if (key === "review_count" || key === "reviewCount") {
        result.reviewCount = parseInt(value, 10);
      } else if (key === "datasheet_url" || key === "datasheetUrl") {
        result.datasheetUrl = value;
      } else if (key === "faq" || key === "faqs") {
        result.faqs = parseFaqs(value);
      } else if (key === "application") {
        result.application = parseStringList(value);
      } else if (key === "environment") {
        result.environment = parseStringList(value);
      } else if (key === "band") {
        result.band = parseStringList(value);
      } else if (key === "wifi_standard" || key === "wifiStandard") {
        result.wifiStandard = parseStringList(value);
      } else if (key === "ethernet_ports" || key === "ethernetPorts") {
        result.ethernetPorts = parseInteger(value);
      } else if (key === "sfp_ports" || key === "sfpPorts") {
        result.sfpPorts = parseInteger(value);
      } else if (key === "poe") {
        result.poe = parseStringList(value);
      } else if (key === "topology") {
        result.topology = parseStringList(value);
      } else if (key === "radio_type" || key === "radioType") {
        result.radioType = parseStringList(value);
      } else if (key === "mimo") {
        result.mimo = parseStringList(value);
      } else if (key === "switch_layer" || key === "switchLayer") {
        result.switchLayer = parseStringList(value);
      } else if (key === "throughput") {
        result.throughput = parseStringList(value);
      } else if (key === "mounting") {
        result.mounting = parseStringList(value);
      } else if (key === "gtin") {
        result.gtin = value.trim();
      } else if (key === "mpn") {
        result.mpn = value.trim();
      } else if (
        key === "google_product_category" ||
        key === "googleProductCategory"
      ) {
        result.googleProductCategory = value.trim();
      }
    } catch (err) {
      console.warn(`[product-mapper] Failed to parse metafield ${key}:`, err);
    }
  }

  return result;
}

function parseStringList(value: string): string[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((v) => String(v).trim()).filter(Boolean);
  }
  return trimmed
    .split(/\r?\n|,/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseInteger(value: string): number | undefined {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseSpecs(value: string): SpecRow[] {
  if (!value) return [];
  const trimmed = value.trim();
  // JSON array of {label, value} or object {key: value}
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed))
      return parsed.map((r) => ({
        label: r.label ?? r.name,
        value: String(r.value),
      }));
    return Object.entries(parsed).map(([label, value]) => ({
      label,
      value: String(value),
    }));
  }
  // Lista "key: value\nkey: value"
  return trimmed
    .split("\n")
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx < 0) return { label: line.trim(), value: "" };
      return {
        label: line.slice(0, idx).trim(),
        value: line.slice(idx + 1).trim(),
      };
    })
    .filter((r) => r.label);
}

function parseFeatures(value: string): string[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (trimmed.startsWith("[")) return JSON.parse(trimmed);
  return trimmed
    .split("\n")
    .map((s) => s.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
}

function parseReviews(value: string): ReviewEntry[] {
  if (!value) return [];
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) return [];
  return parsed.map((r) => ({
    author: r.author ?? r.name ?? "Anónimo",
    rating: Number(r.rating ?? 5),
    date: r.date,
    text: r.text ?? r.body ?? "",
    verified: Boolean(r.verified),
  }));
}

function parseFaqs(value: string): FAQEntry[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((r: any) => ({
        question: String(r.question ?? r.q ?? "").trim(),
        answer: String(r.answer ?? r.a ?? "").trim(),
      }))
      .filter((f) => f.question && f.answer);
  }

  return trimmed
    .split(/\n\s*\n/)
    .map((block) => {
      const qMatch = block.match(/^Q:\s*(.+)$/m);
      const aMatch = block.match(/^A:\s*([\s\S]+)$/m);
      return {
        question: qMatch?.[1]?.trim() ?? "",
        answer: aMatch?.[1]?.trim() ?? "",
      };
    })
    .filter((f) => f.question && f.answer);
}

function mapShopifyVariant(raw: any): Variant {
  return {
    id: raw.id,
    title: raw.title,
    availableForSale: raw.availableForSale,
    price: raw.price,
    compareAtPrice: raw.compareAtPrice ?? null,
    image: raw.image ?? null,
    selectedOptions: raw.selectedOptions ?? [],
    sku: raw.sku ?? null,
  };
}

export function mapShopifyCollection(raw: any): Collection {
  return {
    handle: raw.handle,
    title: raw.title,
    description: raw.description,
    image: raw.image ?? null,
  };
}

export function mapShopifyCart(raw: any): CartState {
  const lines =
    raw.lines?.edges?.map((e: any) => mapShopifyCartLine(e.node)) ?? [];
  return {
    id: raw.id,
    checkoutUrl: raw.checkoutUrl,
    lines,
    cost: {
      subtotal: raw.cost.subtotalAmount,
      total: raw.cost.totalAmount,
    },
  };
}

function mapShopifyCartLine(raw: any): CartLine {
  return {
    id: raw.id,
    quantity: raw.quantity,
    cost: { subtotalAmount: raw.cost.subtotalAmount },
    merchandise: {
      id: raw.merchandise.id,
      title: raw.merchandise.title,
      image: raw.merchandise.image ?? null,
      price: raw.merchandise.price,
      product: {
        title: raw.merchandise.product?.title ?? raw.merchandise.title,
        handle: raw.merchandise.product?.handle ?? "",
      },
    },
  };
}

export function generateSearchIndex(products: Product[]) {
  return products.map((p) => ({
    h: p.handle,
    t: p.title,
    d: p.description.slice(0, 120),
    p: parseFloat(p.variants[0]?.price.amount ?? "0"),
    c: [p.productType, ...p.tags].filter(Boolean),
    col: p.collections,
    b: p.vendor,
    sku: p.variants[0]?.sku ?? "",
    img: p.featuredImage?.url ?? "",
    tech: [
      ...(p.metafields?.application ?? []),
      ...(p.metafields?.environment ?? []),
      ...(p.metafields?.band ?? []),
      ...(p.metafields?.wifiStandard ?? []),
      ...(p.metafields?.poe ?? []),
      ...(p.metafields?.topology ?? []),
      ...(p.metafields?.radioType ?? []),
      ...(p.metafields?.mimo ?? []),
      ...(p.metafields?.switchLayer ?? []),
      ...(p.metafields?.throughput ?? []),
      ...(p.metafields?.mounting ?? []),
      p.metafields?.ethernetPorts
        ? `${p.metafields.ethernetPorts} puertos ethernet`
        : "",
      p.metafields?.sfpPorts ? `${p.metafields.sfpPorts} puertos SFP` : "",
    ].filter(Boolean),
  }));
}
