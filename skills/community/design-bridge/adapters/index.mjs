/**
 * Registro de adaptadores de diseño.
 * Cada adaptador cumple la interfaz DesignAdapter (ver SKILL.md).
 */
import openDesign from "./open-design.mjs";
import stitch from "./stitch.mjs";
import claudeDesign from "./claude-design.mjs";

export const adapters = {
  "open-design": openDesign,
  stitch: stitch,
  "claude-design": claudeDesign,
};

export function getAdapter(id) {
  const a = adapters[id];
  if (!a) {
    const list = Object.keys(adapters).join(", ");
    throw new Error(`Adaptador desconocido: "${id}". Disponibles: ${list}`);
  }
  return a;
}
