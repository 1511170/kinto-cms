// Geocoding gratuito con Nominatim (OpenStreetMap) en build-time, con cache en
// disco para no repetir consultas (y no saturar Nominatim en CI).
// Respeta el límite de 1 req/seg y envía User-Agent como exige su política.
import fs from "node:fs";
import path from "node:path";

// Ruta estable basada en el cwd del build (raíz del proyecto), para que el
// cache persista en src/ y no en dist/ (que se borra en cada build).
const CACHE_PATH = path.join(process.cwd(), "src/lib/listings/geocode-cache.json");
// Centro de Arauca (fallback cuando no se puede geocodificar la dirección).
const ARAUCA = { lat: 7.0844, lon: -70.7591 };

export interface GeoResult {
  lat: number;
  lon: number;
  exact: boolean; // true si se geocodificó la dirección; false si es fallback ciudad
}

let cache: Record<string, GeoResult> = {};
try {
  cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
} catch {
  cache = {};
}

let lastReq = 0;
async function nominatim(q: string): Promise<{ lat: number; lon: number } | null> {
  const wait = 1100 - (Date.now() - lastReq);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastReq = Date.now();
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=co&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "inmobiliariarauca-web/1.0 (contacto@inmobiliariarauca.com)" },
    });
    if (!res.ok) return null;
    const arr = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (Array.isArray(arr) && arr[0]) return { lat: +arr[0].lat, lon: +arr[0].lon };
  } catch {
    /* red caída: usar fallback */
  }
  return null;
}

export async function geocode(direccion: string, ciudad: string, barrio: string): Promise<GeoResult> {
  const key = `${direccion}|${ciudad}`;
  if (cache[key]) return cache[key];

  const ciu = ciudad || "Arauca";
  let hit = await nominatim(`${direccion}, ${ciu}, Arauca, Colombia`);
  if (!hit && barrio) hit = await nominatim(`${barrio}, ${ciu}, Arauca, Colombia`);

  const result: GeoResult = hit ? { ...hit, exact: true } : { ...ARAUCA, exact: false };
  cache[key] = result;
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
  return result;
}
