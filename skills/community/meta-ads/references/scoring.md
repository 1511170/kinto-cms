# Reference: scoring de campañas / adsets / ads

> Fuente única del modelo. Cualquier cambio de pesos/umbrales se hace acá y en `client.json` → `scoring_weights`. Ningún script debe hardcodear pesos.

## Score compuesto (0-100)

```
score = 100 × (
    w_roas    · norm(ROAS_meta)
  + w_cpa     · norm(1 / CPA)
  + w_roi     · norm(ROI_margin)
  + w_ctr     · norm(CTR)
  - w_cpc     · norm(CPC)
)
```

Donde `norm(x)` = min-max normalization sobre el cohort (todas las entidades del mismo nivel y mismo periodo). Se clipa a [0, 1] antes de pesar.

### Pesos default

| Peso     | Valor | Razón                                                              |
| -------- | ----- | ------------------------------------------------------------------ |
| `w_roas` | 0.35  | Métrica principal de eficiencia comercial.                         |
| `w_cpa`  | 0.25  | Diagnostica si una campaña sin valor de compra es eficiente igual. |
| `w_roi`  | 0.20  | Filtra falsos positivos cuando el margen es bajo.                  |
| `w_ctr`  | 0.10  | Indicador temprano de creative health.                             |
| `w_cpc`  | 0.10  | Penaliza campañas caras de tráfico.                                |

Sobrescribir en `clients/<slug>/client.json`:

```json
{
  "scoring_weights": {
    "roas": 0.4,
    "cpa": 0.25,
    "roi": 0.15,
    "ctr": 0.1,
    "cpc": 0.1
  },
  "margin_assumption": 0.3
}
```

## Métricas derivadas

```
CPA      = spend / purchases                              (si purchases > 0)
ROAS     = action_values[purchase] / spend                (de Meta)
ROI(m)   = (action_values[purchase] × m) / spend - 1      (m = margen 0..1)
CPM      = spend / impressions × 1000
CP-LPV   = spend / landing_page_view
```

## Veredicto

Aplicado por **nivel** (campaña / adset / ad) y **ventana** (overview_90d, mensual, etc). El veredicto del overview_90d es el que cuenta para el ranking ejecutivo.

| Veredicto           | Condición                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `SCALE`             | score en top 20% del cohort **Y** ROAS ≥ 3 **Y** purchases ≥ 10 en periodo                                               |
| `KEEP`              | score en percentil 40-80 **Y** ROAS 1.5-3.0                                                                              |
| `REVIEW`            | (CTR < umbral_ctr **AND** spend > umbral_min_spend) **OR** ROAS 1.0-1.5 **OR** outlier (CTR > 20% — bot/bait sospechoso) |
| `PAUSE`             | score en bottom 20% **Y** spend > umbral_min_spend **AND** (ROAS < 1.0 **OR** purchases < 3)                             |
| `INSUFFICIENT_DATA` | purchases < umbral_min_purchases **OR** spend < umbral_min_spend                                                         |

## Umbrales por defecto (Cougar ecommerce COP)

| Umbral                 | Valor      | Configurable en client.json |
| ---------------------- | ---------- | --------------------------- |
| `umbral_min_spend`     | 50,000 COP | `thresholds.min_spend`      |
| `umbral_min_purchases` | 3          | `thresholds.min_purchases`  |
| `umbral_ctr`           | 1.0%       | `thresholds.min_ctr`        |
| `umbral_outlier_ctr`   | 20%        | `thresholds.outlier_ctr`    |

> Para clientes USD ajustar `min_spend` (ej. 50). Para B2B/lead-gen subir `min_purchases` y bajar `min_ctr` a 0.5%.

## Razones que se reportan en `rankings.*[].reason`

- `"top score; ROAS=4.5x; purchases=42"` → SCALE
- `"bottom score; ROAS=0.3x; spend=180k COP"` → PAUSE
- `"CTR 72.8% — outlier sospechoso (bot/engagement-bait)"` → REVIEW
- `"CTR 0.4% < 1% con spend 300k COP"` → REVIEW
- `"solo 1 purchase en 90d con spend 80k"` → INSUFFICIENT_DATA

Las razones son texto libre pero deben mencionar las métricas que activaron la regla — sin eso el reporte ejecutivo pierde valor.
