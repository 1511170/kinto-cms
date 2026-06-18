/**
 * Structured API response helpers for the Shopify Worker.
 * All responses use JSON with a consistent envelope:
 *   - Error:   { ok: false, error: string, code: string }
 *   - Success: { ok: true, ...data }
 */

interface ApiErrorBody {
  ok: false;
  error: string;
  code: string;
}

interface ApiSuccessBody {
  ok: true;
  [key: string]: unknown;
}

/**
 * Return a JSON error response with the given message, code string, and HTTP status.
 */
export function apiError(
  message: string,
  code: string,
  status: number = 400,
): Response {
  const body: ApiErrorBody = { ok: false, error: message, code };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Return a JSON success response with the given data spread alongside { ok: true }.
 */
export function apiSuccess(
  data: Record<string, unknown>,
  status: number = 200,
): Response {
  const body: ApiSuccessBody = { ok: true, ...data };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
