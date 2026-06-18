# Reference: `--optimization-goal` (Meta Ads CLI)

Por adset. Compatible con el `--objective` de la campaña padre.

| Goal                  | Compatible con objective | Para qué                                                 |
| --------------------- | ------------------------ | -------------------------------------------------------- |
| `LINK_CLICKS`         | TRAFFIC, ENGAGEMENT      | Clicks al link del ad                                    |
| `LANDING_PAGE_VIEWS`  | TRAFFIC, SALES, LEADS    | LPV reales (mejor que clicks)                            |
| `IMPRESSIONS`         | AWARENESS, TRAFFIC       | Maximizar impresiones                                    |
| `REACH`               | AWARENESS                | Alcance único                                            |
| `OFFSITE_CONVERSIONS` | SALES, LEADS             | Conversiones fuera del sitio (Pixel/CAPI)                |
| `LEAD_GENERATION`     | LEADS                    | Lead Ads form fills                                      |
| `THRUPLAY`            | AWARENESS, ENGAGEMENT    | Vídeo: 15s o video completo                              |
| `POST_ENGAGEMENT`     | ENGAGEMENT               | Likes, comments, shares                                  |
| `VALUE`               | SALES                    | Optimiza por valor de la conversión (requiere histórico) |

## `--billing-event` típicos

- `IMPRESSIONS` — paga por CPM (default seguro).
- `LINK_CLICKS` — paga por CPC (riesgoso si tu CTR es alto).

## Bid amounts

En **centavos** de la moneda del ad account. Ejemplo: `--bid-amount 250` en cuenta USD = $2.50.

Para cuentas nuevas, el CLI puede rechazar bids muy bajos con `Bid amount must be at least X`. Subir hasta el mínimo que indique el error.
