#!/usr/bin/env node
/**
 * Importer CLI para design-bridge.
 *
 * Uso:
 *   node skills/community/design-bridge/scripts/import.mjs \
 *     --adapter=open-design --source=<id> --site=<site>
 */
import { writeFile, mkdir } from "node:fs/promises";
import { resolve, join, dirname } from "node:path";
import { existsSync } from "node:fs";
import { getAdapter } from "../adapters/index.mjs";

function parseArgs(argv) {
  const out = {};
  for (const a of argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
    else if (a.startsWith("--")) out[a.slice(2)] = true;
  }
  return out;
}

function tokensToCss(tokens) {
  const lines = [":root {"];
  for (const [k, v] of Object.entries(tokens)) lines.push(`  ${k}: ${v};`);
  lines.push("}");
  return lines.join("\n") + "\n";
}

function componentToAstro(c) {
  const safeName = c.name.replace(/[^A-Za-z0-9]/g, "");
  const inlineStyles = Object.entries(c.styles || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
  return `---\n// Componente importado por design-bridge\n// Origen: ${c.name}\n---\n<${c.type} style="${inlineStyles}"><slot /></${safeName === c.name ? c.type : c.type}>\n`;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.adapter || !args.source || !args.site) {
    console.log("Uso: --adapter=<id> --source=<projectId> --site=<site>");
    console.log(
      "Adaptadores: open-design, stitch (stub), claude-design (stub)",
    );
    process.exit(args.help ? 0 : 1);
  }

  const adapter = getAdapter(args.adapter);
  const siteRoot = resolve(process.cwd(), "sites", args.site);
  if (!existsSync(siteRoot)) {
    console.error(`❌ No existe el sitio: ${siteRoot}`);
    process.exit(1);
  }

  console.log(
    `▸ Importando con adaptador "${adapter.id}" desde "${args.source}"…`,
  );
  const bundle = await adapter.importDesign(args.source);

  const tokensPath = join(siteRoot, "src/styles/design-tokens.css");
  await mkdir(dirname(tokensPath), { recursive: true });
  await writeFile(tokensPath, tokensToCss(bundle.tokens), "utf8");
  console.log(`✅ Tokens: ${tokensPath}`);

  const compDir = join(siteRoot, "src/components/_imported");
  await mkdir(compDir, { recursive: true });
  for (const c of bundle.components) {
    const file = join(compDir, `${c.name.replace(/[^A-Za-z0-9]/g, "")}.astro`);
    await writeFile(file, componentToAstro(c), "utf8");
  }
  console.log(`✅ Componentes: ${bundle.components.length} en ${compDir}`);

  console.log(
    `✅ Assets detectados: ${bundle.assets.length} (descarga manual por ahora)`,
  );
  console.log(
    "💡 Importa <DesignTokens /> en tu layout para inyectar los tokens.",
  );
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
