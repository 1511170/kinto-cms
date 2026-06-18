# Recipe: `ab-paused-launch`

Lanza una campaña + adset + creative + ad **todo en PAUSED**, listo para revisión humana antes de activar. Útil para A/B tests rápidos.

## Pre-requisito

`PAGE_ID` del cliente:

```bash
meta ads page list
```

## Script (bash)

```bash
#!/bin/bash
set -euo pipefail
: "${KINTO_CLIENT:?KINTO_CLIENT no está set}"
source "clients/$KINTO_CLIENT/.env-meta-ads"

NAME_PREFIX="${1:-AB-Test}"
PAGE_ID="${2:?Pasar PAGE_ID como segundo argumento}"
LANDING="${3:?Pasar landing URL como tercer argumento}"
IMAGE="${4:?Pasar path a imagen como cuarto argumento}"

# Idempotencia (BI-5): no crear si ya existe
if meta -o plain ads campaign list | grep -q "$NAME_PREFIX-CAMPAIGN"; then
  echo "❌ Ya existe una campaña con prefijo $NAME_PREFIX. Aborta para evitar duplicados."
  exit 1
fi

CAMPAIGN_ID=$(meta -o plain ads campaign create \
  --name "$NAME_PREFIX-CAMPAIGN" \
  --objective OUTCOME_TRAFFIC \
  --daily-budget 1000 | awk '{print $1}')
echo "✅ Campaign $CAMPAIGN_ID (PAUSED)"

ADSET_ID=$(meta -o plain ads adset create "$CAMPAIGN_ID" \
  --name "$NAME_PREFIX-ADSET" \
  --optimization-goal LINK_CLICKS \
  --billing-event IMPRESSIONS --bid-amount 200 \
  --targeting-countries US | awk '{print $1}')
echo "✅ AdSet $ADSET_ID (PAUSED)"

CREATIVE_ID=$(meta -o plain ads creative create \
  --name "$NAME_PREFIX-CREATIVE" \
  --page-id "$PAGE_ID" \
  --image "$IMAGE" \
  --body "Headline body" --title "CTA title" \
  --link-url "$LANDING" --call-to-action SHOP_NOW | awk '{print $1}')
echo "✅ Creative $CREATIVE_ID"

AD_ID=$(meta -o plain ads ad create "$ADSET_ID" \
  --name "$NAME_PREFIX-AD" --creative-id "$CREATIVE_ID" | awk '{print $1}')
echo "✅ Ad $AD_ID (PAUSED)"

echo ""
echo "Para activar (después de revisar visualmente):"
echo "  meta ads campaign update $CAMPAIGN_ID --status ACTIVE"
echo "  meta ads adset update    $ADSET_ID    --status ACTIVE"
echo "  meta ads ad update       $AD_ID       --status ACTIVE"
```

## Reglas

- BI-4: nada se activa automáticamente.
- BI-5: aborta si encuentra un nombre similar.
- BI-6: el usuario es responsable de revisar visualmente en Ads Manager antes del `update --status ACTIVE` (que dispara el hook de audit).
