# Recipe: `budget-alerts`

Detecta spend anormal por cliente y dispara una alerta. Pensado para correr cada hora vía `/schedule` o `/loop`.

## Uso interactivo

```bash
KINTO_CLIENT=<slug> source clients/<slug>/.env-meta-ads
meta -o json ads insights get --date-preset today \
  --fields spend,actions \
  | jq '.[0]'
```

## Programado con `/schedule`

```
/schedule "0 * * * *" /meta-report <cliente> today --check-budget
```

(El flag `--check-budget` es interpretado por `daily-report.sh`: si `spend_today` supera el `daily_budget_alert_threshold` definido en `clients/<slug>/client.json`, escribe a `clients/<slug>/reports/alerts.log` y opcionalmente notifica.)

## Configuración por cliente

En `clients/<slug>/client.json`:

```json
{
  "alerts": {
    "daily_budget_alert_threshold": 200,
    "channel": null
  }
}
```

`channel` (futuro): `slack:#canal`, `notion:db-id`, etc. — fase 4.

## Detección sin schedule

Si el usuario simplemente quiere chequear ahora:

```bash
LIMIT=200
SPENT=$(meta -o json ads insights get --date-preset today --fields spend | jq -r '.[0].spend // "0"')
awk "BEGIN { exit !($SPENT > $LIMIT) }" \
  && echo "⚠️ Spend de hoy ($SPENT) supera límite ($LIMIT)" \
  || echo "OK ($SPENT / $LIMIT)"
```
