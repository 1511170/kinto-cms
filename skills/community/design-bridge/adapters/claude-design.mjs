/**
 * Adaptador para Claude Design (STUB).
 *
 * Estado: pendiente de implementación. PRs bienvenidos.
 *
 * Plan:
 *   - Recibir output de Claude Design (HTML/JSX + tokens)
 *   - Parsear estructura de componentes
 *   - Normalizar a la interfaz DesignBundle (ver SKILL.md)
 */

export default {
  id: "claude-design",
  async importDesign(_source, _opts = {}) {
    throw new Error(
      'Adaptador "claude-design" aún no implementado. ' +
        "Contribuye en skills/community/design-bridge/adapters/claude-design.mjs",
    );
  },
};
