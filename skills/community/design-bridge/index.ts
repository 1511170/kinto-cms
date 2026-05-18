/**
 * Skill: design-bridge
 * Puente opt-in entre herramientas de diseño y KINTO CMS.
 * Adaptador principal: open-design.ai. Stubs: stitch, claude-design.
 */

export { default as DesignTokens } from "./components/DesignTokens.astro";

export const config = {
  name: "design-bridge",
  version: "0.1.0",
  description:
    "Importa diseños de open-design.ai (y stubs Stitch/Claude Design) a tokens CSS y componentes Astro",
  category: "design",
  reusable: true,
};

export function install(context: any) {
  context.addComponent("DesignTokens", "./components/DesignTokens.astro");
  console.log("✅ Skill design-bridge instalada");
  console.log(
    "   Próximo paso: node skills/community/design-bridge/scripts/import.mjs --help",
  );
}
