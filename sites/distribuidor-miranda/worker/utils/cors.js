/**
 * CORS helpers for local development and production.
 *
 * - Allows localhost:4321 (Astro dev server) for development.
 * - Same-origin policy for production (empty Access-Control-Allow-Origin
 *   when the request origin is not explicitly allowed).
 * - Handles preflight OPTIONS requests.
 */
/**
 * Orígenes permitidos para CORS.
 *
 * Los de localhost cubren el dev server de Astro. Añade aquí los dominios de
 * producción de tu tienda (dominio público + el *.workers.dev del Worker).
 * También se leen de la env var ALLOWED_ORIGINS (lista separada por comas).
 */
const DEV_ORIGINS = ["http://localhost:4321", "http://127.0.0.1:4321"];
// TODO: reemplaza con los dominios de producción de tu tienda.
const PRODUCTION_ORIGINS = [
// "https://www.tu-tienda.com",
// "https://tu-tienda-store.tu-cuenta.workers.dev",
];
const ENV_ORIGINS = (globalThis.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
const ALLOWED_ORIGINS = [...DEV_ORIGINS, ...PRODUCTION_ORIGINS, ...ENV_ORIGINS];
/**
 * Return CORS headers for the given request origin.
 * If the origin is not in the allow-list, returns an empty ACAO header
 * which the browser treats as "deny" (same-origin).
 */
export function corsHeaders(origin) {
    const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : "";
    return {
        "Access-Control-Allow-Origin": allowed,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
    };
}
/**
 * Handle a CORS preflight (OPTIONS) request.
 * Returns 204 No Content with the appropriate CORS headers.
 */
export function handleCorsPreflight(request) {
    const origin = request.headers.get("Origin") ?? "";
    return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
    });
}
/**
 * Apply CORS headers to an existing response.
 * Creates a new Response with the same body/status but merged headers.
 */
export function withCors(response, request) {
    const origin = request.headers.get("Origin") ?? "";
    const headers = new Headers(response.headers);
    const cors = corsHeaders(origin);
    for (const [key, value] of Object.entries(cors)) {
        headers.set(key, value);
    }
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}
