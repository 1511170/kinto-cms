# CLAUDE.md — KINTO CMS

> **Lee `AGENTS.md` primero.** Es la guía maestra y la fuente única de verdad
> para cualquier agente (Claude, Kimi, Qwen, Codex, Cursor). Este archivo solo
> añade lo específico de Claude Code.

## Específico de Claude Code

- **Slash commands:** `.claude/commands/` — `/create-site`, `/add-skill`,
  `/create-skill`, `/build`, `/verify`, `/simplify`, `/start`, `/marketplace`,
  `/deploy`, `/doctor`, `/update`.
- **Subagentes:** `.claude/agents/` — site-creator, skill-creator,
  skill-installer, verify-build, seo-auditor.
- **Agent-skills:** `.claude/skills/` — `boris` (metodología, activa) y
  `graphify` (knowledge graph, opt-in, requiere `pip install graphifyy`).
- **Hooks:** `.claude/settings.json` — formato scoped al archivo editado
  (`.claude/hooks/format-file.mjs`), recordatorio de principios al iniciar
  sesión, validación del registry al cerrar.

## Reglas críticas (resumen — el detalle está en AGENTS.md)

1. Planifica antes de tocar 3+ archivos (entra en plan mode).
2. Verifica con `kinto build` antes de terminar. Siempre.
3. Skills > código ad-hoc. Reutiliza o crea con `kinto skill create`.
4. Nunca modifiques `core/`. Nunca hardcodees valores de cliente.
5. Commits incrementales, pequeños y bien documentados.
6. Si Claude comete un error y lo corrige → actualiza `AGENTS.md`
   (sección Anti-Patrones) para que no se repita.

## Primera acción en cualquier tarea

1. Lee `AGENTS.md`.
2. `kinto doctor` para verificar el entorno.
3. Revisa `sites/<sitio>/skills-active.json` para ver qué hay instalado.
