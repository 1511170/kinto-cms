// Mapea la respuesta del Worker SEDI al modelo Listing de la UI.
import type { Listing, ListingFoto, Operacion } from "./types.js";
import { mapOperacion, slugify, titleCase } from "./format.js";

// Shapes crudas del Worker (inmobiliariarauca-api).
export interface WorkerInmuebleItem {
  inmuebleId: number;
  consecutivo: number;
  tipoInmueble: string | null;
  tipoOferta: string | null;
  estadoInmueble: string | null;
  direccion: string | null;
  ciudad: string | null;
  localidad: string | null;
  barrio: string | null;
  canon: number | null;
  valorVenta: number | null;
  areaConstruida: number | null;
  habitaciones: number | null;
  banos: number | null;
  parqueaderos: number | null;
  activo: boolean;
}

export interface WorkerInmuebleDetalle extends WorkerInmuebleItem {
  usoInmueble?: string | null;
  valorAdministracion?: number | null;
  areaLote?: number | null;
  estrato?: string | null;
  // El Worker expone la descripción backfilleada en `observaciones`
  // (quirk del mapeo del dominio); `descripcion` suele venir vacío.
  descripcion?: string | null;
  observaciones?: string | null;
  fotos?: { url: string; orden: number | null; esPrincipal?: boolean; descripcion?: string | null }[];
}

function precioPrincipal(op: Operacion, canon: number | null, venta: number | null): number | null {
  if (op === "venta") return venta ?? canon;
  return canon ?? venta;
}

function buildSlug(d: WorkerInmuebleItem): string {
  const tipo = d.tipoInmueble ?? "inmueble";
  const barrio = d.barrio ?? d.ciudad ?? "";
  return slugify(`${tipo}-${barrio}-${d.inmuebleId}`);
}

export function mapListing(d: WorkerInmuebleDetalle): Listing {
  const operacion = mapOperacion(d.tipoOferta);
  const fotos: ListingFoto[] = (d.fotos ?? [])
    .map((f) => ({
      url: f.url,
      orden: f.orden ?? 0,
      esPrincipal: Boolean(f.esPrincipal),
      descripcion: f.descripcion ?? null,
    }))
    .sort((a, b) => a.orden - b.orden);
  const principal = fotos.find((f) => f.esPrincipal) ?? fotos[0] ?? null;
  const descripcion = (d.observaciones || d.descripcion || "").trim();

  return {
    id: d.inmuebleId,
    ref: d.consecutivo,
    slug: buildSlug(d),
    tipo: titleCase(d.tipoInmueble),
    operacion,
    estado: d.estadoInmueble,
    direccion: (d.direccion ?? "").replace(/,?\s*Arauca, Arauca\s*$/i, ", Arauca").trim(),
    ciudad: titleCase(d.ciudad),
    barrio: titleCase(d.barrio),
    localidad: titleCase(d.localidad),
    precio: precioPrincipal(operacion, d.canon, d.valorVenta),
    canon: d.canon,
    valorVenta: d.valorVenta,
    valorAdministracion: d.valorAdministracion ?? null,
    area: d.areaConstruida && d.areaConstruida > 0 ? d.areaConstruida : null,
    areaLote: d.areaLote ?? null,
    habitaciones: d.habitaciones && d.habitaciones > 0 ? d.habitaciones : null,
    banos: d.banos && d.banos > 0 ? d.banos : null,
    parqueaderos: d.parqueaderos ?? null,
    estrato: d.estrato ?? null,
    uso: d.usoInmueble ?? null,
    descripcion,
    caracteristicas: [],
    fotos,
    imagenPrincipal: principal?.url ?? null,
    destacado: false,
    disponible: Boolean(d.activo),
  };
}
