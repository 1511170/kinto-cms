# Recipe: `daily-report`

Genera un snapshot de spend/impressions/clicks/CTR/CPC/conversions del cliente activo, para un periodo dado, y lo persiste en `clients/$KINTO_CLIENT/reports/<fecha>-daily.json`.

## Uso

```bash
# vía script
bash skills/integrations/meta-ads/scripts/daily-report.sh <cliente> [date-preset]

# vía slash command
/meta-report <cliente> [date-preset]
```

`date-preset` defaults a `last_7d`. Acepta cualquiera del CLI: `today`, `yesterday`, `last_3d`, `last_7d`, `last_14d`, `last_30d`, `last_90d`, `this_month`, `last_month`, `maximum`.

## Qué hace el script

1. Valida `KINTO_CLIENT` y `clients/<slug>/.env-meta-ads`.
2. `meta auth status` — aborta si falla (manda a `setup.md`).
3. Resumen de cuenta:
   ```bash
   meta -o json ads insights get --date-preset $PRESET \
     --fields spend,impressions,clicks,ctr,cpc,actions,purchase_roas
   ```
4. Por campaña (level=campaign):
   ```bash
   meta -o json ads insights get --date-preset $PRESET --level campaign \
     --fields campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,conversions,purchase_roas
   ```
5. Combina ambos y escribe `clients/<slug>/reports/<YYYY-MM-DD>-daily.json` con shape:
   ```json
   {
     "client": "<slug>",
     "generated_at": "2026-05-13T14:00:00Z",
     "period": "last_7d",
     "account_summary": { ... },
     "campaigns": [ { ... }, ... ]
   }
   ```
6. Imprime un resumen humano corto en consola.

## Lectura recomendada después

- Si hay campañas con CTR bajo: `recipes/low-ctr-audit.md`.
- Para validar que el revenue reportado por Meta es real: `recipes/attribution-validation.md`.
