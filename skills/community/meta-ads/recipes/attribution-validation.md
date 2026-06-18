# Recipe: `attribution-validation` ⭐

> **El recipe central de KINTO BI.** Responde la pregunta que motiva todo el proyecto: _¿las conversiones que Meta se atribuye son reales, o se está robando ventas que en realidad vinieron de Google, orgánico u otro canal?_

## Idea

Meta atribuye una compra a una campaña con un modelo bastante laxo (view-through 1d, click-through 7d por defecto). Eso infla el ROAS reportado. Si el cliente tiene **Server-Side Tracking** (CAPI propio, GTM server-side, dataLayer enriquecido), tenemos la **ground truth**: cada `purchase` con su `transaction_id`, `channel` real (last non-direct click), `value`, y opcionalmente `fbclid`.

Cruzando ambos, podemos:

1. Marcar como **fantasma** las conversiones que Meta reporta y SST no ve (probablemente view-through fraudulenta o cookie-based atribuible a otro canal).
2. Marcar como **overlap** las que Meta y SST reclaman; cuando SST dice que el canal real fue Google/orgánico, ganan ellos.
3. Calcular el **ROAS ajustado** = `spend Meta / revenue de transacciones validadas por SST como Meta-attributed`.

## Uso

```bash
# vía script
python skills/integrations/meta-ads/scripts/attribution-diff.py <cliente> [date-preset]

# vía slash command
/attribution-check <cliente> [date-preset]
```

## Pre-requisitos en `clients/<slug>/client.json`

```json
{
  "name": "Mi Cliente",
  "currency": "USD",
  "timezone": "America/Bogota",
  "sst_source": {
    "type": "json", // "json" | "bigquery" | "rest"
    "path": "clients/mi-cliente/sst-events.json",
    "query": null,
    "endpoint": null
  },
  "attribution_window_days": 7
}
```

Adapters soportados (fase 1):

- `type: json` — un dump local con shape `[{ transaction_id, value, channel, fbclid?, occurred_at }, ...]`.
- `type: bigquery` — placeholder; se completa en fase 2 cuando un cliente lo necesite.
- `type: rest` — placeholder; idem.

## Flujo del script

1. Pull insights de Meta por campaña y por ad (level=ad), incluyendo `actions`, `action_values`, `purchase_roas`, ventana del cliente.
2. Pull eventos SST según el adapter.
3. Match:
   - **Match fuerte** por `fbclid` cuando existe.
   - **Match débil** por `transaction_id` + ventana temporal (cliente.attribution_window_days).
4. Categoriza cada conversión Meta:
   - `validated_meta` — SST confirma Meta como canal.
   - `overlap_lost_to_other` — SST dice otro canal (Google, orgánico…). Restar del revenue Meta.
   - `ghost_no_sst` — SST no tiene ese transaction_id. Sospechosa.
5. Outputs `clients/<slug>/reports/<YYYY-MM-DD>-attribution.json`:
   ```json
   {
     "client": "<slug>",
     "period": "last_30d",
     "spend_total": 12345.67,
     "revenue_meta_reported": 56789.0,
     "revenue_validated_sst": 31200.5,
     "ghost_revenue": 18450.0,
     "lost_to_other_channels": {
       "google": 5400.5,
       "organic": 1738.0
     },
     "roas_meta_reported": 4.6,
     "roas_adjusted_sst": 2.53,
     "campaigns": [
       {
         "campaign_id": "...",
         "campaign_name": "...",
         "spend": 1500,
         "revenue_meta": 7800,
         "revenue_validated": 3200,
         "ghost_pct": 0.41,
         "overlap_lost": { "google": 1100, "organic": 240 },
         "verdict": "INFLATED"
       }
     ]
   }
   ```
6. Imprime resumen humano:
   ```
   Cliente: <slug> | Periodo: last_30d
   Spend Meta:               $12,345.67
   Revenue Meta reportado:   $56,789.00  (ROAS 4.6x)
   Revenue validado por SST: $31,200.50  (ROAS ajustado 2.53x)
     - Conversiones fantasma: $18,450.00 (32% del reportado)
     - Robadas a otros canales: Google $5,400.50 · Orgánico $1,738.00
   ```

## Cuando SST y Meta coinciden razonablemente

`ghost_pct < 0.10` y `overlap_lost / revenue_meta < 0.15` → atribución sana. Reportar al usuario.

## Cuando hay discrepancia grave

`ghost_pct > 0.30` → algo está mal:

- Píxel no deduplica con CAPI (eventos contados doble).
- Ventana de atribución demasiado laxa (cambiar a 7d-click 1d-view).
- Campañas de catálogo/DPA atribuyendo a usuarios que ya iban a comprar.

Revisar `references/troubleshooting.md` sección "discrepancias Meta vs realidad".

## Salida de ejemplo

Ver `clients/_template/reports/example-attribution.json` (placeholder; se rellena tras la primera corrida real).
