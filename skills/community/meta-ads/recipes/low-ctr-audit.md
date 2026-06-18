# Recipe: `low-ctr-audit`

Identifica campañas activas con CTR bajo y spend significativo en los últimos N días — candidatas a pausar o iterar creatives.

## Uso

```bash
KINTO_CLIENT=<slug> source clients/<slug>/.env-meta-ads

# inline
meta -o json ads insights get --date-preset last_14d \
  --level campaign \
  --fields campaign_name,spend,ctr,impressions \
  | jq '[.[] | select((.ctr | tonumber) < 1.0 and (.spend | tonumber) > 50)]'
```

Umbrales sugeridos:

| Vertical          | CTR mínimo aceptable | Spend mínimo para considerar |
| ----------------- | -------------------- | ---------------------------- |
| Ecommerce general | 1.0%                 | $50                          |
| B2B / lead gen    | 0.5%                 | $100                         |
| Brand / awareness | 0.3%                 | n/a (revisar CPM)            |

## Acción recomendada

1. Para cada campaña en la lista:
   - Si **CTR < umbral** y **spend > umbral**: candidata a pausar.
   - **NO pausar automáticamente** — listar al usuario y pedir confirmación (regla BI-4: cambios humanos explícitos).
2. Sugerir alternativa: refrescar creatives (`recipes/ab-paused-launch.md`).

## Versión multi-cliente (todos los clientes en paralelo)

```bash
for slug in $(ls clients | grep -v _template); do
  echo "=== $slug ==="
  KINTO_CLIENT=$slug source clients/$slug/.env-meta-ads
  meta -o json ads insights get --date-preset last_14d --level campaign \
    --fields campaign_name,spend,ctr \
    | jq '[.[] | select((.ctr|tonumber)<1.0 and (.spend|tonumber)>50) | {campaign_name, spend, ctr}]'
done
```

Mejor todavía: ejecutar como subagente paralelo con `Agent` tipo `general-purpose`, uno por cliente.
