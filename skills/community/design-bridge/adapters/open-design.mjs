/**
 * Adaptador para open-design.ai
 *
 * Contrato:
 *   importDesign(source, opts) -> { tokens, components, assets }
 *
 * Requiere variable de entorno OPEN_DESIGN_API_KEY.
 *
 * NOTA: El endpoint y formato exactos pueden evolucionar. Este adaptador asume
 * un API REST que devuelve un manifest con tokens y nodos de componente — si
 * open-design.ai cambia, se ajusta solo este archivo.
 */

const API_BASE =
  process.env.OPEN_DESIGN_API_BASE || "https://api.open-design.ai/v1";

async function fetchManifest(source, apiKey) {
  const res = await fetch(
    `${API_BASE}/projects/${encodeURIComponent(source)}/manifest`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    },
  );
  if (!res.ok) {
    throw new Error(`open-design.ai: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function normalizeTokens(raw = {}) {
  const out = {};
  for (const [group, values] of Object.entries(raw)) {
    if (values && typeof values === "object") {
      for (const [k, v] of Object.entries(values)) {
        out[`--${group}-${k}`.replace(/[^a-z0-9-]/gi, "-").toLowerCase()] =
          String(v);
      }
    }
  }
  return out;
}

function normalizeComponents(nodes = []) {
  return nodes.map((n) => ({
    name: n.name || "Unnamed",
    type: n.type || "div",
    children: n.children || [],
    styles: n.styles || {},
  }));
}

export default {
  id: "open-design",
  async importDesign(source, opts = {}) {
    const apiKey = opts.apiKey || process.env.OPEN_DESIGN_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPEN_DESIGN_API_KEY no configurada. Añádela a .env del sitio.",
      );
    }
    const manifest = await fetchManifest(source, apiKey);
    return {
      tokens: normalizeTokens(manifest.tokens),
      components: normalizeComponents(manifest.components),
      assets: manifest.assets || [],
      meta: {
        adapter: "open-design",
        sourceId: source,
        importedAt: new Date().toISOString(),
      },
    };
  },
};
