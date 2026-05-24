import type { APIRoute } from "astro";
import { getCachedProducts } from "../lib/build-data";

export const GET: APIRoute = async () => {
  const products = await getCachedProducts();
  // Formato compacto que MiniSearch espera (ver skill SearchOverlay.astro):
  // h=handle, t=title, p=price, img=featured, b=vendor, sku, c=productType, col=collections[]
  const docs = (products as any[]).map((p) => ({
    h: p.handle,
    t: p.title,
    p: p.price ?? 0,
    img: p.featuredImage?.url ?? "",
    b: p.vendor ?? "",
    sku: p.variants?.[0]?.sku ?? "",
    c: p.productType ?? "",
    col: Array.isArray(p.collections) ? p.collections : [],
  }));
  return new Response(JSON.stringify(docs), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
