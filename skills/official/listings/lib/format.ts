// Utilidades de formato y normalización para listados.
import type { Operacion } from "./types.js";

/** Formatea pesos colombianos: 1964019 -> "$1.964.019". */
export function formatPrecio(valor: number | null | undefined): string {
  if (valor == null || valor <= 0) return "Consultar";
  return "$" + Math.round(valor).toLocaleString("es-CO");
}

/** Etiqueta de precio con sufijo de periodicidad según operación. */
export function precioConSufijo(precio: number | null, operacion: Operacion): string {
  const base = formatPrecio(precio);
  if (base === "Consultar") return base;
  return operacion === "arriendo" ? `${base}/mes` : base;
}

/** Title Case respetando palabras en español (APARTAMENTO -> Apartamento). */
export function titleCase(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Normaliza tipoOferta de SEDI a la operación del dominio. */
export function mapOperacion(tipoOferta: string | null | undefined): Operacion {
  const t = (tipoOferta ?? "").toLowerCase();
  if (t.includes("arriendo") && t.includes("venta")) return "arriendo y venta";
  if (t.includes("venta")) return "venta";
  return "arriendo";
}

/** Slug URL-safe a partir de texto. */
export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

/** Link de WhatsApp con mensaje prellenado para un inmueble. */
export function whatsappLink(numero: string, mensaje: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

/** Título legible de un inmueble: "Casa en Arriendo · Villa María". */
export function tituloListing(l: {
  tipo: string;
  operacion: Operacion;
  barrio: string;
  ciudad: string;
}): string {
  const op = l.operacion === "venta" ? "en Venta" : l.operacion === "arriendo" ? "en Arriendo" : "en Arriendo y Venta";
  const lugar = l.barrio || l.ciudad;
  return `${l.tipo} ${op}${lugar ? ` · ${lugar}` : ""}`;
}

/** Resumen corto de specs: "3 hab · 2 baños · 120 m²". */
export function specsResumen(opts: {
  habitaciones?: number | null;
  banos?: number | null;
  area?: number | null;
  parqueaderos?: number | null;
}): string {
  const partes: string[] = [];
  if (opts.habitaciones) partes.push(`${opts.habitaciones} hab`);
  if (opts.banos) partes.push(`${opts.banos} baño${opts.banos === 1 ? "" : "s"}`);
  if (opts.area) partes.push(`${opts.area} m²`);
  if (opts.parqueaderos) partes.push(`${opts.parqueaderos} parq.`);
  return partes.join(" · ");
}
