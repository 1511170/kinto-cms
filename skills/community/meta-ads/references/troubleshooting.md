# Troubleshooting — Meta Ads CLI + KINTO BI

## Errores del CLI / setup

| Síntoma                                                                       | Causa                                                      | Fix                                                                                                                  |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `meta: command not found`                                                     | `~/.local/bin` no está en PATH                             | `uv tool update-shell` o agregar a `.zshrc`/`.bashrc`                                                                |
| "Elegiste un nombre de usuario del sistema no válido"                         | Nombre con espacios o chars inválidos                      | Usar `kinto-<slug>` (kebab-case)                                                                                     |
| `(#190) Invalid OAuth access token`                                           | Token revocado/expirado                                    | Regenerar (Fase 5 setup) — caducidad **Nunca**                                                                       |
| `(#200) The user must be a system user...`                                    | App no asignada al system user                             | Fase 4.3 — desde Business Suite, no desde developers                                                                 |
| `(#200) Permissions error` al crear ads                                       | Falta `pages_manage_ads` o Page no asignada al system user | Verificar scopes y asignación en Business Suite                                                                      |
| `act_XXX not found`                                                           | System user sin acceso a la cuenta                         | Fase 3.4 — control total                                                                                             |
| Token funciona pero `campaign list` da error 100                              | Falta `ads_management` o `ads_read`                        | Regenerar token con scopes completos                                                                                 |
| `meta auth status` dice "Not authenticated" pese a `.env-meta-ads` correcto   | Shell no cargó el archivo                                  | `set -a && source clients/<slug>/.env-meta-ads && set +a`                                                            |
| `Bid amount must be at least X`                                               | Bid muy bajo para optimization goal/país                   | Subir `--bid-amount` (centavos)                                                                                      |
| Campaña creada sin error pero invisible en Ads Manager                        | UI filtrando por status — está PAUSED                      | Cambiar filtro a "All" o `--status ACTIVE`                                                                           |
| `Invalid parameter` en insights                                               | Field no aplicable al level                                | Ver `insights get --help` por level                                                                                  |
| `--targeting-countries US` no funciona                                        | Versión vieja del CLI                                      | `meta --version` >= 1.0.1                                                                                            |
| Insights vacíos en cuenta nueva                                               | No hay tráfico                                             | `--date-preset maximum` para confirmar                                                                               |
| `No solution found ... no wheels with a matching platform tag (win_amd64)`    | Estás instalando en Windows nativo                         | meta-ads no tiene wheel Windows; usar WSL Ubuntu (ver setup.md fase 1)                                               |
| `Error: No such option: --level`                                              | Estás usando flag de la API HTTP, no del CLI v1.0.1        | El CLI no tiene `--level`. Iterar con `--campaign-id`/`--adset-id`/`--ad-id`                                         |
| `Error: No such option: --campaign_id`                                        | Underscore en lugar de guion                               | El CLI usa `--campaign-id` (kebab-case)                                                                              |
| `Usage: meta ads adset list [OPTIONS] [CAMPAIGN_ID]` al pasar `--campaign-id` | `adset list`/`ad list` toman el ID como **posicional**     | `meta ads adset list <CAMPAIGN_ID>`, `meta ads ad list <ADSET_ID>` — sin flag. `insights get` sí usa `--campaign-id` |
| `Error: No such option: --breakdowns`                                         | Plural no existe                                           | Usar `--breakdown` singular, repetible                                                                               |
| Budget rechazado por alto/bajo factor 100                                     | Confundiste centavos (USD) con valor directo (COP/JPY)     | USD usa centavos (`5000`=$50). COP/JPY/CLP es directo (`16000`=16,000 COP)                                           |
| `wsl.exe -- bash -c "export PATH=..."` rompe con paths Windows                | PowerShell expande variables con espacios antes de pasar   | Escribir el script a archivo `.sh` con LF y `wsl.exe -- bash <archivo>`                                              |
| `jq: command not found` en WSL Ubuntu nuevo                                   | jq no viene preinstalado                                   | `sudo apt-get install -y jq` o usar `python3` para parse JSON (lo que hacen los scripts de la skill)                 |

## Errores específicos de KINTO BI

| Síntoma                                     | Causa                                                | Fix                                                               |
| ------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `KINTO_CLIENT no está set`                  | Olvido del usuario o nueva sesión                    | `export KINTO_CLIENT=<slug>` (regla BI-1)                         |
| `no existe clients/<slug>/.env-meta-ads`    | Cliente no configurado                               | `/new-client <slug>` y completar setup                            |
| Reporte vacío (`{}`) tras `daily-report.sh` | Cliente correcto pero cuenta sin datos en el periodo | Ampliar preset a `last_30d` o `maximum`                           |
| `attribution-diff.py` dice "modo Meta-only" | `client.json` no tiene `sst_source`                  | Configurar `sst_source` (ver `recipes/attribution-validation.md`) |

## Discrepancias Meta vs realidad ⭐

> Sección que `santmun/meta-ads-skills` no cubre y es crítica para el objetivo de KINTO BI.

| Síntoma                                                                     | Causa probable                                                        | Diagnóstico                                                     | Fix                                                                                     |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Meta reporta 5x ROAS, Shopify/SST reporta 1.5x                              | Píxel + CAPI duplicando eventos                                       | Revisar `event_id` único entre Pixel y CAPI                     | Implementar deduplicación con `event_id`/`event_name` consistente                       |
| Meta cuenta compras de usuarios que llegaron por Google                     | Ventana de atribución 7d-click + 1d-view default es laxa              | `meta ads adset get <ID>` para ver attribution_setting          | Cambiar a `1d_click` para campañas direct response; o usar SST como ground truth        |
| Conversiones aparecen en Meta pero el `transaction_id` no existe en Shopify | View-through atribuyendo compras orgánicas                            | `attribution-diff.py` reporta `ghost_revenue` alto              | Confiar en SST; restar ghost del revenue Meta                                           |
| Campañas DPA / catalog ads muestran ROAS irreal                             | Usuarios que ya iban a comprar (retargeting frío)                     | Comparar `purchase_roas` con tasa de nuevos clientes en Shopify | Segmentar por audiencia: nuevos vs retargeting; ajustar bid sólo en nuevos              |
| Eventos `purchase` duplicados en CAPI                                       | Un mismo `event_id` enviado por Pixel **y** server, sin deduplicación | Events Manager → "Diagnósticos" muestra duplicación             | Asegurar `event_id` igual en Pixel y CAPI; Meta deduplica si ambos llegan dentro de 48h |
| `purchase_roas` cae bruscamente al activar iOS 14.5+ ATT                    | Modelado de datos para usuarios opted-out                             | Comparar pre/post fechas de update                              | Esperar 7d para que Meta estabilice modelado; cruzar con SST que sí ve esos usuarios    |

## Cómo investigar una discrepancia paso a paso

1. Correr `attribution-diff.py <slug> last_30d`.
2. Si `ghost_pct > 0.30`: revisar Events Manager del Pixel del cliente para deduplicación.
3. Si `lost_to_other_channels.google > 0`: comprobar UTMs y atribución last non-direct click en GA4.
4. Si todo lo anterior está bien: ajustar la ventana de atribución de las campañas a `1d_click` y volver a medir 7 días después.
5. Documentar el caso en `clients/<slug>/notes.md` con timestamp y conclusión.
