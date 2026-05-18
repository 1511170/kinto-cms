import type { CartState } from "./product-mapper";

const CART_ID_KEY = "lp_cart_id";

function getStoredCartId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(CART_ID_KEY);
  } catch {
    return null;
  }
}

function setStoredCartId(id: string): void {
  try {
    localStorage.setItem(CART_ID_KEY, id);
  } catch (err) {
    console.warn(
      "[cart-client] No se pudo guardar cartId en localStorage:",
      err,
    );
  }
}

function clearStoredCartId(): void {
  try {
    localStorage.removeItem(CART_ID_KEY);
  } catch {}
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const json = (await res.json().catch(() => null)) as any;

  if (!res.ok || !json || json.ok === false) {
    const msg = json?.error ?? res.statusText ?? `API error: ${res.status}`;
    throw new Error(msg);
  }

  // Worker envelope: { ok: true, cart: {...} } — unwrap if present.
  return json.cart ?? json;
}

export async function getCart(): Promise<CartState | null> {
  const cartId = getStoredCartId();
  if (!cartId) return null;

  try {
    return await apiFetch(`/cart/${encodeURIComponent(cartId)}`);
  } catch {
    clearStoredCartId();
    return null;
  }
}

export async function createCart(
  variantId: string,
  quantity: number = 1,
): Promise<CartState> {
  const data = await apiFetch("/cart", {
    method: "POST",
    body: JSON.stringify({
      lines: [{ merchandiseId: variantId, quantity }],
    }),
  });

  setStoredCartId(data.id);
  return data;
}

export async function addToCart(
  variantId: string,
  quantity: number = 1,
): Promise<CartState> {
  const cartId = getStoredCartId();
  if (!cartId) return createCart(variantId, quantity);

  try {
    return await apiFetch(`/cart/${encodeURIComponent(cartId)}/lines`, {
      method: "POST",
      body: JSON.stringify({
        lines: [{ merchandiseId: variantId, quantity }],
      }),
    });
  } catch (err) {
    // Cart expirado o inválido en Shopify: limpiamos id y reintentamos creando uno nuevo.
    console.warn("[cart-client] addToCart falló, recreando cart:", err);
    clearStoredCartId();
    return createCart(variantId, quantity);
  }
}

export async function updateCartLine(
  lineId: string,
  quantity: number,
): Promise<CartState> {
  const cartId = getStoredCartId();
  if (!cartId) throw new Error("No cart found");

  return apiFetch(
    `/cart/${encodeURIComponent(cartId)}/lines/${encodeURIComponent(lineId)}`,
    {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    },
  );
}

export async function removeCartLine(lineId: string): Promise<CartState> {
  const cartId = getStoredCartId();
  if (!cartId) throw new Error("No cart found");

  return apiFetch(
    `/cart/${encodeURIComponent(cartId)}/lines/${encodeURIComponent(lineId)}`,
    {
      method: "DELETE",
    },
  );
}

export function getCartId(): string | null {
  return getStoredCartId();
}
