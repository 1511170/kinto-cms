/**
 * Shopify CDN image URL transformations.
 * Appends width/height/crop params to Shopify CDN image URLs.
 */

export function shopifyImageUrl(
  url: string | undefined | null,
  options: {
    width?: number;
    height?: number;
    crop?: "center" | "top" | "bottom" | "left" | "right";
  } = {},
): string | undefined {
  if (!url) return undefined;
  if (!url.includes("cdn.shopify.com")) return url;

  const u = new URL(url);
  if (options.width) u.searchParams.set("width", String(options.width));
  if (options.height) u.searchParams.set("height", String(options.height));
  if (options.crop) u.searchParams.set("crop", options.crop);
  return u.toString();
}

/** Generate srcset for a Shopify CDN image */
export function shopifySrcSet(
  url: string | undefined | null,
  widths: number[],
): string | undefined {
  if (!url) return undefined;
  if (!url.includes("cdn.shopify.com")) return undefined;
  return widths.map((w) => `${url}?width=${w} ${w}w`).join(", ");
}

/** Common sizes for responsive images */
export const IMAGE_SIZES = {
  card: { width: 600, height: 750 },
  thumb: { width: 200, height: 200 },
  gallery: { width: 1200, height: 1200 },
  hero: { width: 1400, height: 800 },
  cart: { width: 120, height: 150 },
  search: { width: 80, height: 80 },
} as const;

/** Srcset widths for common use cases */
export const SRCSET_WIDTHS = {
  card: [400, 600, 800],
  gallery: [600, 1200, 1800],
  hero: [800, 1400, 2000],
} as const;
