---
name: meta-ads
category: community
version: 1.0.0
description: Meta Ads CLI multi-cliente para KINTO — setup, operaciones CRUD, recipes (daily report, low-CTR audit, budget alerts) y validador de atribución vs Server-Side Tracking. Patrón clients/<slug>/ con env var KINTO_CLIENT.
tags: [bi, ads, meta, attribution]
requires: []
needs: [meta-ads-cli, meta-system-user-token, python]
recommendedFor: []
---

# Skill `meta-ads` — Meta Ads CLI para KINTO BI

Operación profesional del [Meta Ads CLI](https://developers.facebook.com/docs/marketing-api/ads-cli) integrada a la arquitectura multi-cliente de KINTO BI. Mejora sustancialmente sobre [`santmun/meta-ads-skills`](https://github.com/santmun/meta-ads-skills) en cuatro dimensiones:

1. **Multi-cliente nativo** — credenciales por cliente en `clients/<slug>/`, env var `KINTO_CLIENT` obligatoria.
2. **Validación de atribución vs SST** — recipe `attribution-validation` que cruza insights de Meta con eventos del Server-Side Tracking del cliente y emite ROAS ajustado.
3. **Slash commands** — `/meta-report`, `/attribution-check`, `/new-client` integrados en `.claude/commands/`.
4. **Hooks de auditoría** — todo cambio de status `ACTIVE` queda registrado en `clients/<slug>/reports/audit.log`.

---

## 🚦 Cuándo usar esta skill

Triggers automáticos (frontmatter): "meta ads", "validar atribución", "reporte ads cliente X", "configurar meta cli", `/meta-report`, `/attribution-check`, "ROAS real", "Meta vs SST".

**Antes de hacer cualquier cosa**, validar:

```bash
# 1. ¿Está set el cliente?
echo $KINTO_CLIENT
# si está vacío → STOP. Pedir al usuario que elija cliente con `/new-client` o `export KINTO_CLIENT=<slug>`

# 2. ¿El CLI está instalado y autenticado para ese cliente?
meta auth status
# si falla → ir a setup.md
# si OK → ir a operations.md
```

---

## 📚 Índice

| Documento                                                                   | Para qué                                                                                                                 |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [`setup.md`](setup.md)                                                      | Instalación end-to-end del CLI + System User Meta + token + multi-cliente. **Empezar aquí si `meta auth status` falla.** |
| [`operations.md`](operations.md)                                            | Cheatsheet diario: auth, listing, insights, CRUD campaigns/adsets/ads/creatives, catalogs, datasets. Output formats.     |
| [`recipes/daily-report.md`](recipes/daily-report.md)                        | Reporte de los últimos N días por cliente, exportado a JSON versionado.                                                  |
| [`recipes/historical-analysis.md`](recipes/historical-analysis.md) ⭐       | **Análisis profundo 30/90/180d**: campaign+adset+ad+breakdowns, scoring, recomendaciones de escalar/pausar/iterar.       |
| [`recipes/attribution-validation.md`](recipes/attribution-validation.md) ⭐ | **El recipe estrella**: cruza Meta vs SST, emite ROAS ajustado y transacciones fantasma.                                 |
| [`recipes/low-ctr-audit.md`](recipes/low-ctr-audit.md)                      | Identifica campañas activas con CTR bajo y spend significativo.                                                          |
| [`recipes/ab-paused-launch.md`](recipes/ab-paused-launch.md)                | Lanza campaña + adset + creative + ad en PAUSED listo para A/B.                                                          |
| [`recipes/budget-alerts.md`](recipes/budget-alerts.md)                      | Alertas de spend anormal con `/schedule`.                                                                                |
| [`references/objectives.md`](references/objectives.md)                      | Tabla de `--objective` y cuándo usar cada uno.                                                                           |
| [`references/optimization-goals.md`](references/optimization-goals.md)      | `--optimization-goal` válidos por objective.                                                                             |
| [`references/scoring.md`](references/scoring.md)                            | Modelo de scoring (pesos, umbrales, veredictos) usado por `historical-analysis`.                                         |
| [`references/troubleshooting.md`](references/troubleshooting.md)            | Errores frecuentes (incluye discrepancias Meta vs realidad).                                                             |

---

## 🧭 Decisión rápida

```
¿`meta auth status` OK?
   ├─ NO  → setup.md
   └─ SÍ  → ¿qué quieres hacer?
            ├─ Reporte de los últimos N días     → recipes/daily-report.md o /meta-report
            ├─ Validar atribución contra SST     → recipes/attribution-validation.md o /attribution-check
            ├─ Encontrar campañas que sangran    → recipes/low-ctr-audit.md
            ├─ Lanzar A/B en PAUSED              → recipes/ab-paused-launch.md
            ├─ Configurar alertas de budget      → recipes/budget-alerts.md
            └─ Otra operación CRUD               → operations.md (cheatsheet)
```

---

## 🛡️ Reglas de oro (resumen, ver `AGENTS.md` "Modo BI" para detalle)

- **`KINTO_CLIENT=<slug>` obligatorio** antes de cualquier `meta`.
- **Tokens nunca al chat** — `Write` directo a `clients/<slug>/.env-meta-ads`.
- **Todo se crea PAUSED**.
- **Idempotencia**: listar antes de crear.
- **SST es ground truth**, no Meta.
- **Reportes versionados** en `clients/<slug>/reports/`.

---

## 🔗 Referencias externas

- CLI oficial: https://developers.facebook.com/docs/marketing-api/ads-cli
- Marketing API: https://developers.facebook.com/docs/marketing-api
- Skill de inspiración (mejorada acá): https://github.com/santmun/meta-ads-skills
