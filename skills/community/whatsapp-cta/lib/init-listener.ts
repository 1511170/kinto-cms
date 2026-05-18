/**
 * Listener delegado único para clicks en cualquier `[data-wa-cta]`.
 * Se importa desde `<script>` de los componentes; el module init runs once por bundle.
 */

declare global {
  interface Window {
    __wa_listener_installed?: boolean;
    dataLayer?: any[];
  }
}

if (typeof window !== "undefined" && !window.__wa_listener_installed) {
  window.__wa_listener_installed = true;

  document.addEventListener("click", (e) => {
    const target = e.target as Element | null;
    if (!target) return;
    const link = target.closest("[data-wa-cta]") as HTMLAnchorElement | null;
    if (!link) return;

    const eventName = link.dataset.waEvent;
    if (!eventName) return;

    let payload: Record<string, any> = {};
    try {
      payload = JSON.parse(link.dataset.waPayload ?? "{}");
    } catch {
      payload = {};
    }

    // Enriquecer con contexto de la página al momento del click.
    const enriched = {
      event: eventName,
      page_url: window.location.href,
      page_path: window.location.pathname,
      page_title: document.title,
      ...payload,
    };

    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push(enriched);
    } else {
      // Sin GTM/GA4: log silencioso para debug. No bloquea la navegación.
      // eslint-disable-next-line no-console
      console.debug(
        "[whatsapp-cta] dataLayer no disponible, evento omitido:",
        enriched,
      );
    }
  });
}

export {};
