/**
 * URL-state-managed filters for collection listing.
 * Bookmarkable: filters serializan a query params, refresh mantiene estado.
 */

export interface ListingFilters {
  category: string[]; // productType
  brand: string[]; // vendor
  application: string[];
  environment: string[];
  band: string[];
  wifiStandard: string[];
  ethernetPorts: string[];
  sfpPorts: string[];
  poe: string[];
  topology: string[];
  radioType: string[];
  mimo: string[];
  switchLayer: string[];
  mounting: string[];
  priceMin?: number;
  priceMax?: number;
  inStockOnly: boolean;
  saleOnly: boolean;
  sort: SortKey;
  q?: string;
}

export type SortKey =
  | "relevance"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "newest";

export const DEFAULT_FILTERS: ListingFilters = {
  category: [],
  brand: [],
  application: [],
  environment: [],
  band: [],
  wifiStandard: [],
  ethernetPorts: [],
  sfpPorts: [],
  poe: [],
  topology: [],
  radioType: [],
  mimo: [],
  switchLayer: [],
  mounting: [],
  priceMin: undefined,
  priceMax: undefined,
  inStockOnly: false,
  saleOnly: false,
  sort: "relevance",
  q: undefined,
};

export function createDefaultFilters(): ListingFilters {
  return {
    ...DEFAULT_FILTERS,
    category: [],
    brand: [],
    application: [],
    environment: [],
    band: [],
    wifiStandard: [],
    ethernetPorts: [],
    sfpPorts: [],
    poe: [],
    topology: [],
    radioType: [],
    mimo: [],
    switchLayer: [],
    mounting: [],
  };
}

export function readFiltersFromURL(
  url: URL = new URL(window.location.href),
): ListingFilters {
  const sp = url.searchParams;
  const out: ListingFilters = createDefaultFilters();
  const cat = sp.get("cat");
  if (cat) out.category = cat.split(",").filter(Boolean);
  const brand = sp.get("brand");
  if (brand) out.brand = brand.split(",").filter(Boolean);
  const application = sp.get("app");
  if (application) out.application = application.split(",").filter(Boolean);
  const environment = sp.get("env");
  if (environment) out.environment = environment.split(",").filter(Boolean);
  const band = sp.get("band");
  if (band) out.band = band.split(",").filter(Boolean);
  const wifi = sp.get("wifi");
  if (wifi) out.wifiStandard = wifi.split(",").filter(Boolean);
  const eth = sp.get("eth");
  if (eth) out.ethernetPorts = eth.split(",").filter(Boolean);
  const sfp = sp.get("sfp");
  if (sfp) out.sfpPorts = sfp.split(",").filter(Boolean);
  const poe = sp.get("poe");
  if (poe) out.poe = poe.split(",").filter(Boolean);
  const topology = sp.get("topo");
  if (topology) out.topology = topology.split(",").filter(Boolean);
  const radio = sp.get("radio");
  if (radio) out.radioType = radio.split(",").filter(Boolean);
  const mimo = sp.get("mimo");
  if (mimo) out.mimo = mimo.split(",").filter(Boolean);
  const layer = sp.get("layer");
  if (layer) out.switchLayer = layer.split(",").filter(Boolean);
  const mounting = sp.get("mount");
  if (mounting) out.mounting = mounting.split(",").filter(Boolean);
  const pmin = sp.get("pmin");
  if (pmin) out.priceMin = Number(pmin);
  const pmax = sp.get("pmax");
  if (pmax) out.priceMax = Number(pmax);
  out.inStockOnly = sp.get("stock") === "1";
  out.saleOnly = sp.get("sale") === "1";
  const sort = sp.get("sort") as SortKey;
  if (
    sort &&
    ["relevance", "price-asc", "price-desc", "name-asc", "newest"].includes(
      sort,
    )
  )
    out.sort = sort;
  const q = sp.get("q");
  if (q) out.q = q;
  return out;
}

export function writeFiltersToURL(
  filters: ListingFilters,
  base: URL = new URL(window.location.href),
) {
  const sp = new URLSearchParams();
  if (filters.category.length) sp.set("cat", filters.category.join(","));
  if (filters.brand.length) sp.set("brand", filters.brand.join(","));
  if (filters.application.length) sp.set("app", filters.application.join(","));
  if (filters.environment.length) sp.set("env", filters.environment.join(","));
  if (filters.band.length) sp.set("band", filters.band.join(","));
  if (filters.wifiStandard.length)
    sp.set("wifi", filters.wifiStandard.join(","));
  if (filters.ethernetPorts.length)
    sp.set("eth", filters.ethernetPorts.join(","));
  if (filters.sfpPorts.length) sp.set("sfp", filters.sfpPorts.join(","));
  if (filters.poe.length) sp.set("poe", filters.poe.join(","));
  if (filters.topology.length) sp.set("topo", filters.topology.join(","));
  if (filters.radioType.length) sp.set("radio", filters.radioType.join(","));
  if (filters.mimo.length) sp.set("mimo", filters.mimo.join(","));
  if (filters.switchLayer.length)
    sp.set("layer", filters.switchLayer.join(","));
  if (filters.mounting.length) sp.set("mount", filters.mounting.join(","));
  if (filters.priceMin !== undefined) sp.set("pmin", String(filters.priceMin));
  if (filters.priceMax !== undefined) sp.set("pmax", String(filters.priceMax));
  if (filters.inStockOnly) sp.set("stock", "1");
  if (filters.saleOnly) sp.set("sale", "1");
  if (filters.sort !== "relevance") sp.set("sort", filters.sort);
  if (filters.q) sp.set("q", filters.q);
  const newUrl = `${base.pathname}${sp.toString() ? "?" + sp.toString() : ""}`;
  window.history.replaceState(null, "", newUrl);
}

export interface FilterableProduct {
  handle: string;
  title: string;
  productType: string;
  vendor: string;
  tags: string[];
  availableForSale: boolean;
  price: number;
  compareAtPrice: number | null;
  createdAt?: string;
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
  mounting?: string[];
}

export function applyFilters(
  products: FilterableProduct[],
  f: ListingFilters,
): FilterableProduct[] {
  let out = products.slice();

  if (f.category.length) {
    const cats = new Set(f.category.map((c) => c.toLowerCase()));
    out = out.filter((p) => cats.has((p.productType || "").toLowerCase()));
  }
  if (f.brand.length) {
    const brands = new Set(f.brand.map((b) => b.toLowerCase()));
    out = out.filter((p) => brands.has((p.vendor || "").toLowerCase()));
  }
  out = filterByList(out, f.application, (p) => p.application);
  out = filterByList(out, f.environment, (p) => p.environment);
  out = filterByList(out, f.band, (p) => p.band);
  out = filterByList(out, f.wifiStandard, (p) => p.wifiStandard);
  out = filterByList(out, f.ethernetPorts, (p) =>
    p.ethernetPorts === undefined ? [] : [String(p.ethernetPorts)],
  );
  out = filterByList(out, f.sfpPorts, (p) =>
    p.sfpPorts === undefined ? [] : [String(p.sfpPorts)],
  );
  out = filterByList(out, f.poe, (p) => p.poe);
  out = filterByList(out, f.topology, (p) => p.topology);
  out = filterByList(out, f.radioType, (p) => p.radioType);
  out = filterByList(out, f.mimo, (p) => p.mimo);
  out = filterByList(out, f.switchLayer, (p) => p.switchLayer);
  out = filterByList(out, f.mounting, (p) => p.mounting);
  if (f.priceMin !== undefined) out = out.filter((p) => p.price >= f.priceMin!);
  if (f.priceMax !== undefined) out = out.filter((p) => p.price <= f.priceMax!);
  if (f.inStockOnly) out = out.filter((p) => p.availableForSale);
  if (f.saleOnly)
    out = out.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price);
  if (f.q) {
    const q = f.q.toLowerCase();
    out = out.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.vendor.toLowerCase().includes(q) ||
        p.productType.toLowerCase().includes(q),
    );
  }

  // Sort
  switch (f.sort) {
    case "price-asc":
      out.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      out.sort((a, b) => b.price - a.price);
      break;
    case "name-asc":
      out.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "newest":
      out.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      break;
    case "relevance":
    default:
      // dejar en orden original
      break;
  }
  return out;
}

function filterByList(
  products: FilterableProduct[],
  selected: string[],
  valuesOf: (product: FilterableProduct) => Array<string | number> | undefined,
) {
  if (!selected.length) return products;
  const selectedValues = new Set(selected.map((value) => value.toLowerCase()));
  return products.filter((product) =>
    (valuesOf(product) ?? []).some((value) =>
      selectedValues.has(String(value).toLowerCase()),
    ),
  );
}

export function debounce<F extends (...args: any[]) => void>(
  fn: F,
  ms: number,
): F {
  let t: number | null = null;
  return ((...args: any[]) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), ms);
  }) as F;
}
