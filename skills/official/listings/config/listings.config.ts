// Configuración de la skill `listings`. Valores por defecto para Inmobiliaria
// Arauca; se pueden sobreescribir por variables de entorno en build.

export interface ListingsConfig {
  /** Worker SEDI que expone /inmuebles y /inmuebles/{id}. */
  workerUrl: string;
  /** Base pública de R2 donde viven las fotos. */
  r2PublicBase: string;
  /** Datos de marca/contacto para CTAs y SEO. */
  brand: {
    nombre: string;
    sitio: string;
    whatsapp: string; // E.164 sin '+', p.ej. 573001234567
    telefono: string;
    email: string;
    direccion: string;
    ciudad: string;
  };
  /** Cuántos inmuebles destacar en la home. */
  destacadosLimit: number;
}

export const LISTINGS_CONFIG: ListingsConfig = {
  workerUrl:
    process.env.SEDI_WORKER_URL ??
    "https://inmobiliariarauca-api.camilocuadros.workers.dev",
  r2PublicBase:
    process.env.R2_PUBLIC_BASE ??
    "https://pub-d0d64752f0b9405d8d4062e34de1f5c3.r2.dev",
  brand: {
    nombre: "Inmobiliaria Arauca",
    sitio: "https://inmobiliariarauca.com",
    whatsapp: process.env.WHATSAPP_NUMBER ?? "573138624888",
    telefono: "+57 313 862 4888",
    email: "contacto@inmobiliariarauca.com",
    direccion: "Arauca, Arauca",
    ciudad: "Arauca",
  },
  destacadosLimit: 6,
};
