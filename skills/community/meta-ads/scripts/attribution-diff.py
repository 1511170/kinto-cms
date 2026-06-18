#!/usr/bin/env python3
"""
attribution-diff.py — cruza insights de Meta Ads con eventos del Server-Side Tracking
del cliente y emite ROAS ajustado + transacciones fantasma.

Uso:
  python skills/integrations/meta-ads/scripts/attribution-diff.py <slug> [date-preset]

Lee:
  - clients/<slug>/client.json    (sst_source + attribution_window_days)
  - clients/<slug>/.env-meta-ads  (ACCESS_TOKEN, AD_ACCOUNT_ID)

Llama al CLI `meta` para insights; carga eventos SST según el adapter configurado.

Escribe:
  clients/<slug>/reports/<YYYY-MM-DD>-attribution.json

Adapters soportados (fase 1):
  - type: "json"  (path a un dump local)
  - type: "bigquery" / "rest"  → placeholders, levantan NotImplementedError
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path


def die(msg: str, code: int = 1):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(code)


def run_meta(args: list[str]) -> list[dict]:
    """Ejecuta `meta -o json <args>` y retorna la lista parseada."""
    cmd = ["meta", "-o", "json", *args]
    try:
        out = subprocess.check_output(cmd, text=True)
    except FileNotFoundError:
        die("`meta` CLI no está instalado. Ver skills/integrations/meta-ads/setup.md")
    except subprocess.CalledProcessError as e:
        die(f"`meta {' '.join(args)}` falló: {e}", code=4)
    try:
        return json.loads(out) if out.strip() else []
    except json.JSONDecodeError:
        die(f"output no era JSON válido:\n{out[:500]}")


def load_sst_events(client_cfg: dict, root: Path) -> list[dict]:
    src = client_cfg.get("sst_source") or {}
    stype = src.get("type")
    if stype == "json":
        path = src.get("path")
        if not path:
            die("client.json: sst_source.type=json requiere sst_source.path")
        p = (root / path).resolve()
        if not p.exists():
            die(f"no existe el dump SST en {p}")
        with p.open() as f:
            return json.load(f)
    if stype in ("bigquery", "rest"):
        raise NotImplementedError(f"adapter '{stype}' aún no implementado (fase 2)")
    if stype is None:
        print("WARN: client.json no define sst_source — corriendo en modo Meta-only.", file=sys.stderr)
        return []
    die(f"sst_source.type desconocido: {stype}")


def categorize(meta_campaigns: list[dict], sst_events: list[dict], window_days: int) -> dict:
    """Categoriza conversiones Meta como validated / overlap_lost / ghost."""
    sst_by_txid = {ev["transaction_id"]: ev for ev in sst_events if "transaction_id" in ev}
    sst_by_fbclid = {ev["fbclid"]: ev for ev in sst_events if ev.get("fbclid")}

    spend_total = 0.0
    revenue_meta_reported = 0.0
    revenue_validated = 0.0
    ghost_revenue = 0.0
    lost_to_other: dict[str, float] = {}
    per_campaign = []

    for c in meta_campaigns:
        spend = float(c.get("spend") or 0)
        spend_total += spend

        # Suma de purchase value reportado por Meta para esta campaña
        rev_meta = 0.0
        for av in c.get("action_values") or []:
            if av.get("action_type") in ("purchase", "omni_purchase"):
                rev_meta += float(av.get("value") or 0)
        revenue_meta_reported += rev_meta

        # Sin SST events no podemos validar — todo cuenta como reportado
        if not sst_events:
            per_campaign.append({
                "campaign_id": c.get("campaign_id"),
                "campaign_name": c.get("campaign_name"),
                "spend": spend,
                "revenue_meta": rev_meta,
                "revenue_validated": None,
                "verdict": "UNVALIDATED_NO_SST",
            })
            continue

        # NOTA fase 1: Meta CLI no expone 1:1 las transactions individuales con fbclid/txid
        # vía `insights get`. Este script asume un endpoint complementario (Conversions API
        # o un adapter que enriquezca el insight con tx_ids) — por ahora hace una estimación
        # proporcional usando el campo `actions[purchase].value` y las SST events del periodo.
        # Cuando integremos el endpoint de eventos detallados (fase 2), el match será exacto.

        # Estimación simple: si SST tiene N events Meta-attributed con sum(value)=X y los
        # totales de Meta para la cuenta también son ~X, asumimos coincidencia. Caso contrario
        # el delta se reparte.
        per_campaign.append({
            "campaign_id": c.get("campaign_id"),
            "campaign_name": c.get("campaign_name"),
            "spend": spend,
            "revenue_meta": rev_meta,
            "revenue_validated": None,
            "verdict": "PENDING_PER_TX_DATA",
            "note": "Validación exacta requiere ingesta de transactions individuales (fase 2)."
        })

    # Validación a nivel cuenta usando SST events globales
    if sst_events:
        sst_meta_revenue = sum(float(e.get("value") or 0) for e in sst_events
                                if (e.get("channel") or "").lower() in ("meta", "facebook", "instagram", "fb_ads"))
        revenue_validated = sst_meta_revenue
        ghost_revenue = max(0.0, revenue_meta_reported - sst_meta_revenue)

        for ev in sst_events:
            ch = (ev.get("channel") or "").lower()
            if ch in ("meta", "facebook", "instagram", "fb_ads"):
                continue
            # Si el fbclid del evento existe pero el canal real fue otro → robada
            if ev.get("fbclid"):
                lost_to_other.setdefault(ch or "unknown", 0.0)
                lost_to_other[ch or "unknown"] += float(ev.get("value") or 0)

    roas_reported = (revenue_meta_reported / spend_total) if spend_total else 0
    roas_adjusted = (revenue_validated / spend_total) if (spend_total and sst_events) else None

    return {
        "spend_total": round(spend_total, 2),
        "revenue_meta_reported": round(revenue_meta_reported, 2),
        "revenue_validated_sst": round(revenue_validated, 2) if sst_events else None,
        "ghost_revenue": round(ghost_revenue, 2) if sst_events else None,
        "lost_to_other_channels": {k: round(v, 2) for k, v in lost_to_other.items()},
        "roas_meta_reported": round(roas_reported, 2),
        "roas_adjusted_sst": round(roas_adjusted, 2) if roas_adjusted is not None else None,
        "campaigns": per_campaign,
    }


def main():
    if len(sys.argv) < 2:
        die("Uso: attribution-diff.py <slug> [date-preset]")
    slug = sys.argv[1]
    preset = sys.argv[2] if len(sys.argv) > 2 else "last_30d"

    root = Path(__file__).resolve().parents[3]
    client_dir = root / "clients" / slug
    if not client_dir.exists():
        die(f"no existe clients/{slug}/")
    cfg = json.loads((client_dir / "client.json").read_text())
    env_path = client_dir / ".env-meta-ads"
    if not env_path.exists():
        die(f"no existe {env_path} — completa setup primero")

    # Cargar env
    for line in env_path.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())
    os.environ["KINTO_CLIENT"] = slug

    window_days = int(cfg.get("attribution_window_days", 7))

    print(f"→ Pulling Meta insights ({preset}, level=campaign)...", file=sys.stderr)
    campaigns = run_meta([
        "ads", "insights", "get",
        "--date-preset", preset,
        "--level", "campaign",
        "--fields",
        "campaign_id,campaign_name,spend,impressions,clicks,actions,action_values,purchase_roas",
    ])

    print("→ Loading SST events...", file=sys.stderr)
    sst_events = load_sst_events(cfg, root)

    result = categorize(campaigns, sst_events, window_days)
    result["client"] = slug
    result["period"] = preset
    result["generated_at"] = datetime.now(timezone.utc).isoformat()

    out_dir = client_dir / "reports"
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f"{datetime.now(timezone.utc).strftime('%Y-%m-%d')}-attribution.json"
    out.write_text(json.dumps(result, indent=2))

    # Summary humano
    print(f"\n✅ Reporte: {out}\n")
    print(f"Cliente: {slug} | Periodo: {preset}")
    print(f"Spend Meta:               ${result['spend_total']:>12,.2f}")
    print(f"Revenue Meta reportado:   ${result['revenue_meta_reported']:>12,.2f}  (ROAS {result['roas_meta_reported']}x)")
    if result["revenue_validated_sst"] is not None:
        print(f"Revenue validado por SST: ${result['revenue_validated_sst']:>12,.2f}  (ROAS ajustado {result['roas_adjusted_sst']}x)")
        print(f"  - Conversiones fantasma: ${result['ghost_revenue']:>12,.2f}")
        if result["lost_to_other_channels"]:
            parts = " · ".join(f"{k} ${v:,.2f}" for k, v in result["lost_to_other_channels"].items())
            print(f"  - Robadas a otros canales: {parts}")
    else:
        print("(Sin SST configurado — solo se reportan métricas Meta. Configura sst_source en client.json para validar.)")


if __name__ == "__main__":
    main()
