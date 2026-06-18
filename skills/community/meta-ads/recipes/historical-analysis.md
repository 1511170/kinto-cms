# Recipe: `historical-analysis` ⭐

> Análisis de inteligencia de negocio sobre 30/90/180 días de Meta Ads. Responde: **¿qué escalar, qué pausar, qué iterar, qué tipo de campaña montar nueva?**

## Cuándo usarlo

Triggers automáticos: "análisis histórico meta", "estudio últimos 3 meses", "qué pausar qué escalar", "performance review meta ads", "auditoría meta cougar", "análisis profundo cougar", "/meta-analysis".

## Uso

```bash
# vía slash command (recomendado)
/meta-analysis cougar 90d

# vía script directo
python skills/integrations/meta-ads/scripts/historical-analysis.py cougar all \
  --since 2026-02-01 --until 2026-05-14 --margin 0.30
```

Subcomandos del script:

| Subcomando | Para qué                                                                          |
| ---------- | --------------------------------------------------------------------------------- |
| `quick`    | Solo overview + monthly + breakdowns cuenta. ~2-3 min. Para iterar rápido.        |
| `overview` | Una sola ventana grande. Sin desgloses temporales.                                |
| `monthly`  | Cortes mensuales. Útil para ver tendencia.                                        |
| `biweekly` | Ventanas de 15 días. Detecta fatiga de creatives.                                 |
| `all`      | overview + monthly + biweekly + breakdowns + scoring + markdown. **El completo.** |

## Estructura del análisis

### Niveles

1. **Cuenta** — métricas agregadas por ventana.
2. **Campaña** — todas las del periodo (activas + pausadas siempre que tengan data).
3. **AdSet** — solo de las top 5 campañas por spend (para no saturar).
4. **Ad** — solo de los top 5 adsets por spend (idem).
5. **Breakdowns** — age, gender, placement, device a nivel cuenta + top 3 campañas.

### Ventanas

- **overview**: rango total (default 90d).
- **monthly**: meses calendario que tocan el rango (mes en curso queda etiquetado MTD).
- **biweekly**: lapsos de 15 días contiguos hacia atrás desde `--until`.

### Scoring y veredicto

Cada entidad obtiene `score` y `verdict` por ventana. Modelo: ver [`references/scoring.md`](../references/scoring.md). El veredicto del overview es el que importa para el ranking ejecutivo.

## Outputs

```
clients/<slug>/reports/<YYYY-MM-DD>-historical-90d.json    # estructura completa
clients/<slug>/reports/raw/...                              # cache (gitignored)
clients/<slug>/analysis/<YYYY-MM-DD>-90d-summary.md        # resumen ejecutivo
```

El JSON sigue el shape documentado en el plan. El Markdown tiene 8 secciones:

1. **TL;DR** (5 viñetas)
2. **Vista 90d** (resumen + top/bottom 5)
3. **Tendencia mensual**
4. **Tendencia bi-semanal**
5. **Diagnóstico por nivel** (campaign/adset/ad)
6. **Breakdowns demográficos**
7. **Recomendaciones** (escalar / pausar / iterar / tipos nuevos)
8. **Caveats** (margen placeholder, SST pendiente)

## Cómo se llama al CLI por debajo

Para cada (entidad, ventana) hace:

```bash
meta -o json ads insights get \
  --since YYYY-MM-DD --until YYYY-MM-DD \
  [--campaign-id ID | --adset-id ID | --ad-id ID] \
  --fields spend,impressions,clicks,reach,ctr,cpc,actions,action_values,purchase_roas
```

Y para breakdowns:

```bash
meta -o json ads insights get --since ... --until ... \
  --breakdown age \
  --fields spend,impressions,actions,action_values
```

(El CLI v1.0.1 no acepta múltiples breakdowns en una sola llamada — ver `operations.md`. Se hacen N llamadas, una por dimensión.)

## Caching

Cada llamada se cachea en `clients/<slug>/reports/raw/<entity_type>-<entity_id>-<since>_<until>[-<breakdown>].json`. Re-correr el mismo análisis lee del cache (segundos en lugar de 20 min). Para forzar refetch: borrar `reports/raw/` o pasar `--no-cache`.

## Throttling

Default 0.4s entre calls (~9k/h, holgura sobre el rate limit de Marketing API). Configurable con `--throttle SECONDS`.

## Cuándo NO usarlo

- Para spot-check de "spend de hoy" → usa `/meta-report` (es 1 call).
- Para validar atribución contra SST → usa `/attribution-check` (cuando esté SST configurado).
- Para iterar copy/creative → este recipe te muestra QUÉ iterar; ejecutar A/B usa `recipes/ab-paused-launch.md`.

## Limitaciones

1. **ROI con margen es estimación**. Margen viene de `client.json` (`margin_assumption`). Si Cougar tiene márgenes muy distintos por SKU, este número es un proxy.
2. **ROAS Meta no está validado contra SST aún**. El reporte lo declara explícitamente en la sección Caveats.
3. **Breakdowns solo a nivel cuenta + top 3 campañas** para mantener el volumen de calls manejable. Para profundizar en una campaña específica: re-correr con `--focus-campaign <ID>` (todavía por implementar).
