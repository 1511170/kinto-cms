/**
 * Structured API response helpers for the Shopify Worker.
 * All responses use JSON with a consistent envelope:
 *   - Error:   { ok: false, error: string, code: string }
 *   - Success: { ok: true, ...data }
 */
/**
 * Return a JSON error response with the given message, code string, and HTTP status.
 */
export function apiError(message, code, status = 400) {
    const body = { ok: false, error: message, code };
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}
/**
 * Return a JSON success response with the given data spread alongside { ok: true }.
 */
export function apiSuccess(data, status = 200) {
    const body = { ok: true, ...data };
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}
