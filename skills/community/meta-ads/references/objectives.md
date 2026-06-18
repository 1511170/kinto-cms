# Reference: `--objective` (Meta Ads CLI)

| Objective               | Cuándo usarlo                                      |
| ----------------------- | -------------------------------------------------- |
| `OUTCOME_TRAFFIC`       | Llevar gente al sitio (clicks, landing page views) |
| `OUTCOME_AWARENESS`     | Reach / brand recall / impressions                 |
| `OUTCOME_ENGAGEMENT`    | Interacciones, comentarios, follows, mensajes      |
| `OUTCOME_LEADS`         | Form leads (Lead Ads), conversiones de lead        |
| `OUTCOME_SALES`         | Conversiones de compra (requiere Pixel/CAPI)       |
| `OUTCOME_APP_PROMOTION` | Instalaciones / engagement de app                  |

Notas:

- Solo `OUTCOME_SALES` y `OUTCOME_LEADS` permiten optimizar por conversiones — necesitan Pixel + eventos válidos.
- Para validar atribución contra SST: usar `OUTCOME_SALES` + tener Pixel deduplicando con CAPI vía `event_id`.
