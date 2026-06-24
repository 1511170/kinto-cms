// Filtrado y ordenamiento de listings (compartido entre build y cliente).
import type { Listing, ListingFilters, SortKey } from "./types.js";
import { tituloListing } from "./format.js";

function norm(s: string): string {
  return (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function filtrar(listings: Listing[], f: ListingFilters): Listing[] {
  return listings.filter((l) => {
    if (f.operacion && f.operacion !== "todos") {
      if (f.operacion === "arriendo" && !l.operacion.includes("arriendo")) return false;
      if (f.operacion === "venta" && !l.operacion.includes("venta")) return false;
    }
    if (f.tipo && f.tipo.length && !f.tipo.map(norm).includes(norm(l.tipo))) return false;
    if (f.barrio && norm(l.barrio) !== norm(f.barrio)) return false;
    if (f.precioMin != null && (l.precio ?? 0) < f.precioMin) return false;
    if (f.precioMax != null && (l.precio ?? Infinity) > f.precioMax) return false;
    if (f.habitacionesMin != null && (l.habitaciones ?? 0) < f.habitacionesMin) return false;
    if (f.banosMin != null && (l.banos ?? 0) < f.banosMin) return false;
    if (f.areaMin != null && (l.area ?? 0) < f.areaMin) return false;
    if (f.texto) {
      const t = norm(f.texto);
      const blob = norm(`${tituloListing(l)} ${l.direccion} ${l.barrio} ${l.tipo} ${l.descripcion}`);
      if (!t.split(/\s+/).every((w) => blob.includes(w))) return false;
    }
    return true;
  });
}

export function ordenar(listings: Listing[], sort: SortKey): Listing[] {
  const arr = [...listings];
  switch (sort) {
    case "precio-asc":
      return arr.sort((a, b) => (a.precio ?? Infinity) - (b.precio ?? Infinity));
    case "precio-desc":
      return arr.sort((a, b) => (b.precio ?? 0) - (a.precio ?? 0));
    case "area-desc":
      return arr.sort((a, b) => (b.area ?? 0) - (a.area ?? 0));
    case "recientes":
    default:
      return arr.sort((a, b) => b.ref - a.ref);
  }
}

/** Lista de barrios únicos (para el dropdown de filtros). */
export function barriosUnicos(listings: Listing[]): string[] {
  return [...new Set(listings.map((l) => l.barrio).filter(Boolean))].sort();
}

/** Tipos únicos (para chips de filtro). */
export function tiposUnicos(listings: Listing[]): string[] {
  return [...new Set(listings.map((l) => l.tipo).filter(Boolean))].sort();
}
