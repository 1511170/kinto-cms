// Cliente del Worker SEDI para build-time (SSG). Trae todos los inmuebles
// y su detalle (con fotos de R2) para generar páginas estáticas.
import { LISTINGS_CONFIG } from "../config/listings.config.js";
import { mapListing, type WorkerInmuebleDetalle, type WorkerInmuebleItem } from "./listing-mapper.js";
import type { Listing } from "./types.js";

const BASE = LISTINGS_CONFIG.workerUrl.replace(/\/$/, "");

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`SEDI Worker ${path} HTTP ${res.status}`);
  return (await res.json()) as T;
}

/** Procesa una lista con concurrencia limitada. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/** Lista cruda de inmuebles (sin fotos). */
export async function fetchInmueblesList(): Promise<WorkerInmuebleItem[]> {
  const data = await getJSON<{ items: WorkerInmuebleItem[]; total: number }>("/inmuebles?rows=500");
  return data.items ?? [];
}

/** Detalle de un inmueble (incluye fotos). */
export async function fetchInmuebleDetalle(id: number): Promise<WorkerInmuebleDetalle> {
  return getJSON<WorkerInmuebleDetalle>(`/inmuebles/${id}`);
}

/**
 * Trae TODOS los listings con su detalle+fotos, mapeados. Para SSG.
 * Concurrencia limitada para no saturar el Worker/SEDI.
 */
export async function fetchAllListings(opts: { soloDisponibles?: boolean } = {}): Promise<Listing[]> {
  const items = await fetchInmueblesList();
  const detalles = await mapLimit(items, 6, async (it) => {
    try {
      return await fetchInmuebleDetalle(it.inmuebleId);
    } catch {
      return it as WorkerInmuebleDetalle; // fallback: sin fotos/desc
    }
  });
  let listings = detalles.map(mapListing);
  if (opts.soloDisponibles) listings = listings.filter((l) => l.disponible);
  // Destacar los que tienen fotos (mejor vitrina).
  listings.forEach((l) => {
    l.destacado = l.fotos.length >= 3;
  });
  return listings;
}
