# `meta-ads` — Operations cheatsheet

Comandos del CLI `meta` que se usan a diario, agrupados por intención. **Asume que `KINTO_CLIENT` está set y `meta auth status` retorna OK** (si no, ir a [`setup.md`](setup.md)).

> **Recordatorio importante**: la regla "budgets/bids en centavos" del CLI **depende de la moneda del ad account**. Verificar con `meta ads adaccount list` el `currency`. Para cuentas USD: sí, en centavos (`5000` = `$50`). Para cuentas COP/CLP/JPY (sin decimales): el valor es directo en la moneda (`16000` = $16,000 COP). Validar con un caso conocido antes de crear.

> Ad account IDs siempre con prefijo `act_`.

> **CLI v1.0.1**: `meta ads insights get` **no tiene** flag `--level`. Para insights por campaña: usar `--campaign-id <ID>` (snake-case con guion, no underscore). Para varias campañas: iterar.

---

## Auth

```bash
meta auth status
```

## Listing (lecturas)

```bash
meta ads adaccount list
meta ads page list
meta ads campaign list
meta ads adset list
meta ads ad list
meta ads creative list
```

> **Paginación**: `campaign list` / `adset list` / `ad list` traen un límite por
> defecto (~50 filas). Cuentas con histórico largo (ej. Cougar tiene 30+ campañas)
> se truncan silenciosamente. Pasar `--limit 200` explícito al iterar para análisis
> histórico. El script `historical-analysis.py` ya lo hace en `list_adsets`/`list_ads`.

## Insights (lecturas con métricas)

```bash
# Resumen de cuenta últimos 7d
meta ads insights get --date-preset last_7d \
  --fields spend,impressions,clicks,ctr,cpc,actions

# Por campaña últimos 30d
meta ads insights get --campaign-id <ID> --date-preset last_30d \
  --fields spend,conversions,purchase_roas

# Breakdowns demográficos (CLI v1.0.1 acepta solo --breakdown singular, repetible)
meta ads insights get --date-preset last_7d \
  --breakdown age --breakdown gender \
  --fields spend,impressions,ctr
```

Breakdowns útiles: `age`, `gender`, `country`, `region`, `publisher_platform`, `platform_position`, `device_platform`, `placement`.

## Crear (todo nace PAUSED)

```bash
# Campaign
meta ads campaign create \
  --name "..." --objective OUTCOME_SALES --daily-budget 5000

# AdSet
meta ads adset create <CAMPAIGN_ID> \
  --name "..." --optimization-goal LINK_CLICKS \
  --billing-event IMPRESSIONS --bid-amount 500 \
  --targeting-countries US

# Creative (necesita PAGE_ID — `meta ads page list`)
meta ads creative create \
  --name "..." --page-id <PAGE_ID> \
  --image ./hero.jpg --body "..." --title "..." \
  --link-url "https://..." --call-to-action SHOP_NOW

# Ad
meta ads ad create <ADSET_ID> --name "..." --creative-id <CREATIVE_ID>
```

> Antes de crear: `meta ads campaign list -o plain | grep -i "<nombre>"` para evitar duplicados (regla BI-5: idempotencia).

## Activar / Pausar

```bash
meta ads campaign update <ID> --status ACTIVE
meta ads adset update    <ID> --status ACTIVE
meta ads ad update       <ID> --status ACTIVE
# y --status PAUSED para revertir
```

> Estos cambios disparan el hook `PostToolUse` que registra una línea en `clients/$KINTO_CLIENT/reports/audit.log`.

## Catálogos

```bash
meta ads catalog create --name "..."
meta ads product-item create --catalog-id <ID> \
  --retailer-id <SKU> --name "..." --url "..." \
  --price "999" --currency USD --image-url "..."
meta ads product-set list --catalog-id <ID>
```

## Datasets (Pixels / CAPI)

```bash
meta ads dataset create --name "..."
meta ads dataset connect <DATASET_ID> \
  --ad-account-id <AD_ACC_ID> --catalog-id <CATALOG_ID>
```

## Targeting search

```bash
meta ads targeting search --query "yoga"
# → encuentra interest IDs para usar en --targeting-interests
```

## Output formats (flag global)

```bash
meta ads campaign list           # tabla legible (default)
meta -o json ads campaign list   # JSON para jq
meta -o plain ads campaign list  # tab-separated para awk/cut/sort
```

## Modo no interactivo (CI / scripts)

```bash
meta --no-input --force ads ...
# Exit codes: 0 = ok, 3 = auth, 4 = API, 1 = generic
```

## Debug

```bash
meta --debug ads ...   # imprime el HTTP request al endpoint Meta
```

---

## Referencias

- [`references/objectives.md`](references/objectives.md) — tabla `--objective`.
- [`references/optimization-goals.md`](references/optimization-goals.md) — `--optimization-goal` válidos.
- [`references/troubleshooting.md`](references/troubleshooting.md) — errores comunes.
