/**
 * verify — Verifica un sitio completo: registry + build + checks de estructura.
 *
 * Uso: kinto verify --site=<nombre>
 *
 * Composite usado por el slash command `/verify` y por CI. Corre en secuencia:
 *   1. `skill validate`     → regenera y valida `skills/registry.json`
 *   2. `npm run build`      → build estático del sitio
 *   3. checks de estructura → skills-active.json, astro.config.mjs, package.json,
 *                             y `.env.example` si el sitio tiene skills que lo aportan.
 *
 * Exit code: 0 si todo OK, 1 si algo falla. Pensado para correrlo antes de
 * un deploy o como gate en CI.
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { findRoot } from "../lib/paths.js";
import { resolveSite } from "../lib/site.js";
import { log } from "../lib/log.js";
import skill from "./skill.js";

export default async function verify({ flags }) {
  const root = findRoot();
  const site = resolveSite(flags, root);
  let failed = 0;

  // 1. Registry de skills.
  log.step("Validando registry de skills");
  try {
    await skill({ _: ["validate"], flags: {} });
  } catch (err) {
    log.error(`skill validate falló: ${err.message}`);
    failed++;
  }

  // 2. Build del sitio.
  log.step(`Build: ${site.name}`);
  try {
    execSync("npm run build", { cwd: site.path, stdio: "inherit" });
    log.ok("Build correcto.");
  } catch {
    log.error("Build falló.");
    failed++;
  }

  // 3. Checks de estructura.
  log.step("Checks de estructura");
  for (const rel of [
    "skills-active.json",
    "astro.config.mjs",
    "package.json",
  ]) {
    if (existsSync(join(site.path, rel))) {
      log.ok(rel);
    } else {
      log.error(`Falta ${rel}`);
      failed++;
    }
  }

  // .env.example: solo se exige si alguna skill instalada aporta env vars.
  const activePath = join(site.path, "skills-active.json");
  if (existsSync(activePath)) {
    const active = JSON.parse(readFileSync(activePath, "utf8"));
    const needsEnv = (active.skills || []).some(
      (s) =>
        existsSync(join(root, "skills/official", s, ".env.example")) ||
        existsSync(join(root, "skills/community", s, ".env.example")),
    );
    if (needsEnv && !existsSync(join(site.path, ".env.example"))) {
      log.warn(
        ".env.example: una skill activa aporta env vars pero el archivo no está. " +
          "Reinstala la skill o copia su .env.example manualmente.",
      );
    } else if (existsSync(join(site.path, ".env.example"))) {
      log.ok(".env.example presente");
    }
  }

  log.info("");
  if (failed) {
    throw new Error(`Verify falló (${failed} error(es)). Revisa lo anterior.`);
  }
  log.ok(`Sitio "${site.name}" verificado.`);
}
