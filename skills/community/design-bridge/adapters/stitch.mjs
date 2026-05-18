/**
 * Adaptador para Google Stitch (STUB).
 *
 * Estado: pendiente de implementación. PRs bienvenidos.
 *
 * Plan:
 *   - Auth contra Stitch (probablemente OAuth de Google)
 *   - Exportar el design como HTML/CSS o JSON
 *   - Normalizar a la interfaz DesignBundle (ver SKILL.md)
 */

export default {
  id: "stitch",
  async importDesign(_source, _opts = {}) {
    throw new Error(
      'Adaptador "stitch" aún no implementado. ' +
        "Contribuye en skills/community/design-bridge/adapters/stitch.mjs",
    );
  },
};
