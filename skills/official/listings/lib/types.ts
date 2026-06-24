// Modelo de dominio del sitio de listados (directorio inmobiliario).
// Mapea la respuesta del Worker SEDI (inmobiliariarauca-api) a un shape
// estable y orientado a la UI. Las fotos vienen de Cloudflare R2.

export type Operacion = "arriendo" | "venta" | "arriendo y venta";

export interface ListingFoto {
  url: string;
  orden: number;
  esPrincipal: boolean;
  descripcion: string | null;
}

export interface Listing {
  /** InmuebleID en SEDI (clave estable). */
  id: number;
  /** Consecutivo legible (referencia pública del inmueble). */
  ref: number;
  /** Slug único para la URL de detalle. */
  slug: string;

  tipo: string; // "Casa", "Apartamento", "Local", ... (Title Case)
  operacion: Operacion;
  estado: string | null; // estadoInmueble (Disponible, Arrendado, ...)

  direccion: string;
  ciudad: string;
  barrio: string;
  localidad: string;

  /** Precio principal según operación (canon si arriendo, valorVenta si venta). */
  precio: number | null;
  canon: number | null;
  valorVenta: number | null;
  valorAdministracion: number | null;

  area: number | null; // areaConstruida (m²)
  areaLote: number | null;
  habitaciones: number | null;
  banos: number | null;
  parqueaderos: number | null;
  estrato: string | null;
  uso: string | null;

  descripcion: string;
  caracteristicas: string[];

  fotos: ListingFoto[];
  imagenPrincipal: string | null;

  destacado: boolean;
  disponible: boolean;
}

/** Filtros soportados por la UI de listado. */
export interface ListingFilters {
  operacion?: Operacion | "todos";
  tipo?: string[];
  barrio?: string;
  precioMin?: number;
  precioMax?: number;
  habitacionesMin?: number;
  banosMin?: number;
  areaMin?: number;
  texto?: string;
}

export type SortKey = "recientes" | "precio-asc" | "precio-desc" | "area-desc";
