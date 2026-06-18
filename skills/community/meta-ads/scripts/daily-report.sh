#!/usr/bin/env bash
# daily-report.sh — genera reporte diario para el cliente activo.
# Uso:
#   bash skills/integrations/meta-ads/scripts/daily-report.sh <slug> [date-preset]

set -euo pipefail

SLUG="${1:?Uso: daily-report.sh <slug> [date-preset]}"
PRESET="${2:-last_7d}"

ENV_FILE="clients/${SLUG}/.env-meta-ads"
[ -f "$ENV_FILE" ] || { echo "ERROR: no existe $ENV_FILE" >&2; exit 1; }

export KINTO_CLIENT="$SLUG"
set -a; . "$ENV_FILE"; set +a

# Verifica auth (BI-3)
if ! meta auth status > /dev/null 2>&1; then
  echo "ERROR: meta auth status falló para cliente '$SLUG'." >&2
  echo "       Revisa el token en $ENV_FILE o ve al setup." >&2
  exit 3
fi

REPORT_DIR="clients/${SLUG}/reports"
mkdir -p "$REPORT_DIR"
DATE="$(date -u +%Y-%m-%d)"
OUT="${REPORT_DIR}/${DATE}-daily.json"

# 1) Resumen de cuenta
ACCOUNT_JSON="$(meta -o json ads insights get --date-preset "$PRESET" \
  --fields spend,impressions,clicks,ctr,cpc,reach,actions,purchase_roas)"

# 2) Lista de campañas activas
CAMPAIGNS_LIST_JSON="$(meta -o json ads campaign list)"

# 3) Insights por campaña (iterando — el CLI no expone --level)
PER_CAMPAIGN_JSON="$(python3 - "$CAMPAIGNS_LIST_JSON" "$PRESET" <<'PYEOF'
import json, subprocess, sys
campaigns = json.loads(sys.argv[1]).get("data", []) if sys.argv[1].strip().startswith('{') else json.loads(sys.argv[1])
preset = sys.argv[2]
out = []
for c in campaigns:
    cid = c.get("id")
    if not cid: continue
    try:
        raw = subprocess.check_output([
            "meta","-o","json","ads","insights","get",
            "--campaign-id", cid,
            "--date-preset", preset,
            "--fields","spend,impressions,clicks,ctr,cpc,actions,purchase_roas",
        ], text=True, stderr=subprocess.DEVNULL)
        data = json.loads(raw).get("data", []) if raw.strip().startswith('{') else json.loads(raw)
        if data:
            row = data[0]
            row["campaign_id"] = cid
            row["campaign_name"] = c.get("name")
            row["status"] = c.get("effective_status")
            row["objective"] = c.get("objective")
            row["daily_budget"] = c.get("daily_budget")
            out.append(row)
    except Exception as e:
        print(f"WARN: campaign {cid} insights failed: {e}", file=sys.stderr)
print(json.dumps(out))
PYEOF
)"

# 4) Combina con python (jq no está garantizado en WSL nuevo)
python3 - "$OUT" "$SLUG" "$PRESET" "$ACCOUNT_JSON" "$PER_CAMPAIGN_JSON" <<'PYEOF'
import json, sys, datetime
out_path, slug, preset, acc_raw, camps_raw = sys.argv[1:6]
acc = json.loads(acc_raw)
acc_data = acc.get("data", []) if isinstance(acc, dict) else acc
campaigns = json.loads(camps_raw)

report = {
  "client": slug,
  "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
  "period": preset,
  "account_summary": acc_data[0] if acc_data else {},
  "campaigns": campaigns,
}
with open(out_path, "w") as f:
    json.dump(report, f, indent=2, ensure_ascii=False)
print(f"OK -> {out_path}")
print(f"Campaigns analyzed: {len(campaigns)}")
if acc_data:
    a = acc_data[0]
    print(f"Account ({preset}):")
    print(f"  spend       = {a.get('spend')}")
    print(f"  impressions = {a.get('impressions')}")
    print(f"  clicks      = {a.get('clicks')}")
    print(f"  ctr         = {a.get('ctr')}")
    print(f"  cpc         = {a.get('cpc')}")
    if a.get("purchase_roas"):
        for r in a["purchase_roas"]:
            print(f"  ROAS ({r.get('action_type')}) = {r.get('value')}")
    purchases = next((act["value"] for act in a.get("actions",[]) if act.get("action_type")=="purchase"), None)
    if purchases: print(f"  purchases   = {purchases}")
top = sorted([c for c in campaigns if c.get("spend")], key=lambda c: -float(c.get("spend") or 0))[:5]
if top:
    print("\nTop 5 campañas por spend:")
    for c in top:
        roas = ""
        if c.get("purchase_roas"):
            roas = f" ROAS={c['purchase_roas'][0].get('value')}"
        print(f"  - {c.get('campaign_name')} | spend={c.get('spend')} ctr={c.get('ctr')}{roas}")
PYEOF

echo ""
echo "✅ Reporte: $OUT"
