#!/usr/bin/env python3
"""
historical-analysis.py — análisis profundo Meta Ads para un cliente KINTO BI.

Uso:
  python skills/integrations/meta-ads/scripts/historical-analysis.py <slug> <subcmd> [opts]

Subcomandos:
  quick      overview + monthly + breakdowns cuenta. Sin adsets/ads. (~2-3 min)
  overview   una sola ventana grande.
  monthly    cortes mensuales que toquen el rango.
  biweekly   ventanas de 15d hacia atrás desde --until.
  all        overview + monthly + biweekly + breakdowns + scoring + markdown.

Opciones comunes:
  --since YYYY-MM-DD       (default: 90 días atrás desde hoy o desde --until)
  --until YYYY-MM-DD       (default: hoy)
  --margin FLOAT           (default: leído de client.json o 0.30)
  --throttle SECONDS       (default: 0.4)
  --no-cache               fuerza refetch
  --max-campaigns INT      (default: 100; protege de cuentas con miles de campañas)
  --top-n INT              (default: 5; cuántas top-campañas profundizar a adset/ad)

Lee:
  clients/<slug>/client.json
  clients/<slug>/.env-meta-ads     (ACCESS_TOKEN, AD_ACCOUNT_ID)

Escribe:
  clients/<slug>/reports/<YYYY-MM-DD>-historical-<label>.json
  clients/<slug>/reports/raw/<entity>-<id>-<since>_<until>[-<bd>].json   (cache)
  clients/<slug>/analysis/<YYYY-MM-DD>-<label>-summary.md                (en `all`)
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[4]
DEFAULT_WEIGHTS = {"roas": 0.35, "cpa": 0.25, "roi": 0.20, "ctr": 0.10, "cpc": 0.10}
DEFAULT_THRESHOLDS = {
    "min_spend": 50_000.0,
    "min_purchases": 3,
    "min_ctr": 1.0,
    "outlier_ctr": 20.0,
}


def die(msg: str, code: int = 1) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(code)


def load_client(slug: str) -> dict:
    cdir = ROOT / "clients" / slug
    if not cdir.exists():
        die(f"no existe clients/{slug}/")
    cfg = json.loads((cdir / "client.json").read_text(encoding="utf-8"))
    env_path = cdir / ".env-meta-ads"
    if not env_path.exists():
        die(f"no existe {env_path} — completa setup.md primero")
    for line in env_path.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    os.environ["KINTO_CLIENT"] = slug
    return cfg


def cache_path(slug: str, key: str) -> Path:
    p = ROOT / "clients" / slug / "reports" / "raw"
    p.mkdir(parents=True, exist_ok=True)
    safe = key.replace("/", "_").replace(":", "_")
    return p / f"{safe}.json"


def meta_call(
    slug: str, args: list[str], cache_key: str, throttle: float, no_cache: bool
) -> Any:
    cp = cache_path(slug, cache_key)
    if cp.exists() and not no_cache:
        try:
            return json.loads(cp.read_text(encoding="utf-8"))
        except Exception:
            pass

    cmd = ["meta", "-o", "json", *args]
    try:
        out = subprocess.check_output(cmd, text=True, stderr=subprocess.PIPE)
    except FileNotFoundError:
        die("`meta` CLI no está instalado. Ver setup.md")
    except subprocess.CalledProcessError as e:
        print(f"WARN: {' '.join(cmd[:7])}... falló: {e.stderr.strip()[:200]}", file=sys.stderr)
        time.sleep(throttle)
        return None

    time.sleep(throttle)
    try:
        data = json.loads(out) if out.strip() else None
    except json.JSONDecodeError:
        return None
    cp.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return data


def insights_data(raw: Any) -> list[dict]:
    if raw is None:
        return []
    if isinstance(raw, dict) and "data" in raw:
        return raw["data"] or []
    if isinstance(raw, list):
        return raw
    return []


def list_data(raw: Any) -> list[dict]:
    """`meta ads <X> list` retorna a veces lista directa, a veces dict con data."""
    return insights_data(raw)


def extract_creative_id(creative: Any) -> str | None:
    """`ad list` devuelve `creative` como dict o como repr string `<AdCreative> {...}`."""
    if isinstance(creative, dict):
        return creative.get("id")
    if isinstance(creative, str):
        m = re.search(r'"id"\s*:\s*"?(\d+)"?', creative)
        if m:
            return m.group(1)
    return None


def to_float(x: Any) -> float:
    try:
        return float(x)
    except (TypeError, ValueError):
        return 0.0


def to_int(x: Any) -> int:
    try:
        return int(float(x))
    except (TypeError, ValueError):
        return 0


def extract_metrics(row: dict, margin: float) -> dict:
    spend = to_float(row.get("spend"))
    impressions = to_int(row.get("impressions"))
    clicks = to_int(row.get("clicks"))
    reach = to_int(row.get("reach"))
    ctr = to_float(row.get("ctr"))
    cpc = to_float(row.get("cpc"))

    actions = {a.get("action_type"): to_float(a.get("value")) for a in row.get("actions") or []}
    avalues = {a.get("action_type"): to_float(a.get("value")) for a in row.get("action_values") or []}

    purchases = int(actions.get("purchase") or actions.get("omni_purchase") or 0)
    revenue = avalues.get("purchase") or avalues.get("omni_purchase") or 0.0
    lpv = int(actions.get("landing_page_view") or actions.get("omni_landing_page_view") or 0)
    atc = int(actions.get("add_to_cart") or actions.get("omni_add_to_cart") or 0)
    ic = int(actions.get("initiate_checkout") or actions.get("omni_initiated_checkout") or 0)

    roas = (revenue / spend) if spend > 0 else 0.0
    cpa = (spend / purchases) if purchases > 0 else None
    roi_margin = ((revenue * margin) / spend - 1.0) if spend > 0 else None
    cpm = (spend / impressions * 1000.0) if impressions > 0 else 0.0
    cp_lpv = (spend / lpv) if lpv > 0 else None

    return {
        "spend": round(spend, 2),
        "impressions": impressions,
        "clicks": clicks,
        "reach": reach,
        "ctr": round(ctr, 4),
        "cpc": round(cpc, 2),
        "cpm": round(cpm, 2),
        "purchases": purchases,
        "revenue": round(revenue, 2),
        "atc": atc,
        "initiate_checkout": ic,
        "lpv": lpv,
        "roas_meta": round(roas, 4),
        "cpa": round(cpa, 2) if cpa else None,
        "cp_lpv": round(cp_lpv, 2) if cp_lpv else None,
        "roi_margin": round(roi_margin, 4) if roi_margin is not None else None,
    }


def build_windows(since: dt.date, until: dt.date) -> dict:
    overview = {
        "label": f"{since.isoformat()}..{until.isoformat()}",
        "since": since.isoformat(),
        "until": until.isoformat(),
    }
    monthly: list[dict] = []
    cur = dt.date(since.year, since.month, 1)
    while cur <= until:
        nxt_month = cur.replace(day=28) + dt.timedelta(days=4)
        last_day = (nxt_month.replace(day=1)) - dt.timedelta(days=1)
        m_since = max(cur, since)
        m_until = min(last_day, until)
        if m_since <= m_until:
            label = f"{cur.year}-{cur.month:02d}"
            if last_day > until:
                label += "-MTD"
            monthly.append({"label": label, "since": m_since.isoformat(), "until": m_until.isoformat()})
        cur = (cur.replace(day=28) + dt.timedelta(days=4)).replace(day=1)

    biweekly: list[dict] = []
    end = until
    while end >= since:
        start = end - dt.timedelta(days=14)
        if start < since:
            start = since
        biweekly.append({
            "label": f"{start.isoformat()}..{end.isoformat()}",
            "since": start.isoformat(),
            "until": end.isoformat(),
        })
        if start == since:
            break
        end = start - dt.timedelta(days=1)
    biweekly.reverse()

    return {"overview": overview, "monthly": monthly, "biweekly": biweekly}


FIELDS = "spend,impressions,clicks,reach,ctr,cpc,actions,action_values,purchase_roas"


def fetch_insights(
    slug: str, scope: dict, since: str, until: str, throttle: float, no_cache: bool
) -> dict | None:
    """scope: {'level': 'account|campaign|adset|ad', 'id': str | None}"""
    args = ["ads", "insights", "get", "--since", since, "--until", until, "--fields", FIELDS]
    key_parts = ["insights", scope["level"]]
    if scope["id"]:
        flag = {"campaign": "--campaign-id", "adset": "--adset-id", "ad": "--ad-id"}[scope["level"]]
        args += [flag, scope["id"]]
        key_parts.append(scope["id"])
    key_parts += [since, until]
    raw = meta_call(slug, args, "-".join(key_parts), throttle, no_cache)
    rows = insights_data(raw)
    return rows[0] if rows else None


def fetch_breakdown(
    slug: str, dimension: str, since: str, until: str, throttle: float, no_cache: bool,
    campaign_id: str | None = None,
) -> list[dict]:
    args = ["ads", "insights", "get", "--since", since, "--until", until,
            "--breakdown", dimension, "--fields", FIELDS]
    key_parts = ["bd", dimension]
    if campaign_id:
        args += ["--campaign-id", campaign_id]
        key_parts.append(campaign_id)
    key_parts += [since, until]
    raw = meta_call(slug, args, "-".join(key_parts), throttle, no_cache)
    return insights_data(raw)


def list_campaigns(slug: str, throttle: float, no_cache: bool) -> list[dict]:
    raw = meta_call(slug, ["ads", "campaign", "list", "--limit", "500"],
                    "campaigns-list", throttle, no_cache)
    return list_data(raw)


def list_adsets(slug: str, campaign_id: str, throttle: float, no_cache: bool) -> list[dict]:
    raw = meta_call(slug, ["ads", "adset", "list", campaign_id, "--limit", "200"],
                    f"adsets-{campaign_id}", throttle, no_cache)
    return list_data(raw)


def list_ads(slug: str, adset_id: str, throttle: float, no_cache: bool) -> list[dict]:
    raw = meta_call(slug, ["ads", "ad", "list", adset_id, "--limit", "200"],
                    f"ads-{adset_id}", throttle, no_cache)
    return list_data(raw)


def normalize(values: list[float], invert: bool = False) -> list[float]:
    if not values:
        return []
    lo, hi = min(values), max(values)
    if hi == lo:
        return [0.5 for _ in values]
    out = [(v - lo) / (hi - lo) for v in values]
    if invert:
        out = [1.0 - x for x in out]
    return out


def score_cohort(items: list[dict], weights: dict, thresholds: dict) -> None:
    """Mutates each item in-place: sets metrics_overview['score'] and ['verdict']."""
    if not items:
        return
    metric_fn = lambda i: i.get("overview", {}).get("metrics", {})
    roas = [to_float(metric_fn(i).get("roas_meta")) for i in items]
    cpa_vals = [metric_fn(i).get("cpa") for i in items]
    cpa_inv = [(1.0 / v) if v and v > 0 else 0.0 for v in cpa_vals]
    roi = [to_float(metric_fn(i).get("roi_margin") or 0) for i in items]
    ctr = [to_float(metric_fn(i).get("ctr")) for i in items]
    cpc = [to_float(metric_fn(i).get("cpc")) for i in items]

    n_roas, n_cpa, n_roi, n_ctr, n_cpc = (
        normalize(roas), normalize(cpa_inv), normalize(roi),
        normalize(ctr), normalize(cpc),
    )

    scores = []
    for i in range(len(items)):
        s = (
            weights["roas"] * n_roas[i]
            + weights["cpa"] * n_cpa[i]
            + weights["roi"] * n_roi[i]
            + weights["ctr"] * n_ctr[i]
            - weights["cpc"] * n_cpc[i]
        )
        s = max(0.0, min(1.0, s)) * 100.0
        scores.append(round(s, 2))

    sorted_scores = sorted(scores)
    n = len(sorted_scores)
    p20 = sorted_scores[int(n * 0.2)] if n else 0
    p40 = sorted_scores[int(n * 0.4)] if n else 0
    p80 = sorted_scores[int(n * 0.8)] if n else 0

    for idx, item in enumerate(items):
        m = metric_fn(item)
        score = scores[idx]
        verdict, reason = classify(m, score, p20, p40, p80, thresholds)
        item["overview"]["score"] = score
        item["overview"]["verdict"] = verdict
        item["overview"]["reason"] = reason


def classify(m: dict, score: float, p20: float, p40: float, p80: float,
             thresholds: dict) -> tuple[str, str]:
    spend = to_float(m.get("spend"))
    purchases = to_int(m.get("purchases"))
    roas = to_float(m.get("roas_meta"))
    ctr = to_float(m.get("ctr"))

    if spend < thresholds["min_spend"] or purchases < thresholds["min_purchases"]:
        return "INSUFFICIENT_DATA", (
            f"spend={int(spend):,} purchases={purchases} "
            f"(< min_spend {int(thresholds['min_spend']):,} o min_purchases {thresholds['min_purchases']})"
        )
    if ctr > thresholds["outlier_ctr"]:
        return "REVIEW", f"CTR {ctr:.1f}% — outlier sospechoso (bot/engagement-bait)"
    if score >= p80 and roas >= 3.0 and purchases >= 10:
        return "SCALE", f"top score {score:.0f}; ROAS={roas:.2f}x; purchases={purchases}"
    if score <= p20 and spend > thresholds["min_spend"] and (roas < 1.0 or purchases < 3):
        return "PAUSE", f"bottom score {score:.0f}; ROAS={roas:.2f}x; spend={int(spend):,}"
    if ctr < thresholds["min_ctr"] and spend > thresholds["min_spend"]:
        return "REVIEW", f"CTR {ctr:.2f}% < {thresholds['min_ctr']}% con spend {int(spend):,}"
    if 1.0 <= roas <= 1.5:
        return "REVIEW", f"ROAS marginal {roas:.2f}x"
    if p40 <= score <= p80 and 1.5 <= roas <= 3.0:
        return "KEEP", f"score {score:.0f}; ROAS={roas:.2f}x"
    return "KEEP", f"score {score:.0f}; ROAS={roas:.2f}x"


def fmt_money(v: float, currency: str) -> str:
    return f"{currency} {v:,.0f}"


def render_markdown(report: dict) -> str:
    slug = report["client"]
    cur = report["currency"]
    margin = report["margin_assumption"]
    acc_o = report["account"]["overview"]["metrics"]
    monthly = report["account"]["monthly"]
    biweekly = report["account"]["biweekly"]
    rankings = report["rankings"]

    lines = []
    lines.append(f"# Cougar — Análisis Meta Ads ({report['windows']['overview']['since']} → {report['windows']['overview']['until']})")
    lines.append("")
    lines.append(f"_Generado: {report['generated_at']}_  ·  _Margen asumido: {int(margin*100)}%_  ·  _Moneda: {cur}_")
    lines.append("")

    lines.append("## 1. TL;DR")
    lines.append("")
    lines.append(f"- **Spend total**: {fmt_money(acc_o['spend'], cur)}")
    lines.append(f"- **Compras (Meta)**: {acc_o['purchases']}  ·  **Revenue Meta**: {fmt_money(acc_o['revenue'], cur)}")
    lines.append(f"- **ROAS Meta**: {acc_o['roas_meta']:.2f}x  ·  **CPA**: {fmt_money(acc_o['cpa'] or 0, cur)}")
    lines.append(f"- **ROI con margen {int(margin*100)}%**: {(acc_o['roi_margin'] or 0)*100:.1f}%  ·  **CTR cuenta**: {acc_o['ctr']:.2f}%")
    n_scale = len(rankings.get("scale_candidates", []))
    n_pause = len(rankings.get("pause_candidates", []))
    n_review = len(rankings.get("review_candidates", []))
    lines.append(f"- **Acción**: {n_scale} candidatos a escalar · {n_pause} a pausar · {n_review} a revisar")
    lines.append("")

    lines.append("## 2. Vista del periodo")
    lines.append("")
    lines.append("### Top 5 campañas por score")
    lines.append("")
    lines.append("| # | Campaña | Spend | Purch | ROAS | CTR | Score | Verdict |")
    lines.append("|---|---|---:|---:|---:|---:|---:|---|")
    sorted_camps = sorted(report["campaigns"], key=lambda c: -c["overview"].get("score", 0))
    for i, c in enumerate(sorted_camps[:5], 1):
        m = c["overview"]["metrics"]
        lines.append(f"| {i} | {c['name'][:60]} | {fmt_money(m['spend'], cur)} | {m['purchases']} | {m['roas_meta']:.2f}x | {m['ctr']:.2f}% | {c['overview'].get('score',0):.0f} | {c['overview'].get('verdict','-')} |")
    lines.append("")

    lines.append("### Bottom 5 campañas por score (con spend significativo)")
    lines.append("")
    lines.append("| # | Campaña | Spend | Purch | ROAS | CTR | Score | Verdict |")
    lines.append("|---|---|---:|---:|---:|---:|---:|---|")
    significant = [c for c in sorted_camps if c["overview"]["metrics"]["spend"] > 0]
    for i, c in enumerate(list(reversed(significant))[:5], 1):
        m = c["overview"]["metrics"]
        lines.append(f"| {i} | {c['name'][:60]} | {fmt_money(m['spend'], cur)} | {m['purchases']} | {m['roas_meta']:.2f}x | {m['ctr']:.2f}% | {c['overview'].get('score',0):.0f} | {c['overview'].get('verdict','-')} |")
    lines.append("")

    if monthly:
        lines.append("## 3. Tendencia mensual (cuenta)")
        lines.append("")
        lines.append("| Mes | Spend | Purchases | ROAS Meta | CTR | CPA |")
        lines.append("|---|---:|---:|---:|---:|---:|")
        for w in monthly:
            mm = w["metrics"]
            lines.append(f"| {w['label']} | {fmt_money(mm['spend'], cur)} | {mm['purchases']} | {mm['roas_meta']:.2f}x | {mm['ctr']:.2f}% | {fmt_money(mm['cpa'] or 0, cur)} |")
        lines.append("")

    if biweekly:
        lines.append("## 4. Tendencia bi-semanal (15d)")
        lines.append("")
        lines.append("| Ventana | Spend | Purchases | ROAS | CTR |")
        lines.append("|---|---:|---:|---:|---:|")
        for w in biweekly:
            mm = w["metrics"]
            lines.append(f"| {w['label']} | {fmt_money(mm['spend'], cur)} | {mm['purchases']} | {mm['roas_meta']:.2f}x | {mm['ctr']:.2f}% |")
        lines.append("")

    deep_camps = [c for c in sorted_camps if c.get("adsets")]
    if deep_camps:
        lines.append("## 5. Diagnóstico por nivel (AdSets / Ads)")
        lines.append("")
        for c in sorted(deep_camps, key=lambda x: -x["overview"]["metrics"]["spend"])[:3]:
            lines.append(f"### {c['name'][:60]}")
            lines.append("")
            adsets = sorted(c["adsets"], key=lambda a: -a["overview"]["metrics"]["spend"])
            lines.append("| AdSet | Spend | Purch | ROAS | CTR | Score | Verdict |")
            lines.append("|---|---:|---:|---:|---:|---:|---|")
            for a in adsets:
                m = a["overview"]["metrics"]
                lines.append(f"| {(a.get('name') or a['id'])[:40]} | {fmt_money(m['spend'], cur)} | {m['purchases']} | {m['roas_meta']:.2f}x | {m['ctr']:.2f}% | {a['overview'].get('score',0):.0f} | {a['overview'].get('verdict','-')} |")
            lines.append("")
            camp_spend = c["overview"]["metrics"]["spend"]
            if adsets and camp_spend > 0:
                top_share = adsets[0]["overview"]["metrics"]["spend"] / camp_spend
                lines.append(f"_Concentración: el AdSet líder absorbe {top_share*100:.0f}% del spend de la campaña._")
                lines.append("")
            ads = sorted(c.get("ads", []), key=lambda x: -x["overview"].get("score", 0))
            if ads:
                lines.append("**Ads — top 3 creativos:**")
                lines.append("")
                lines.append("| Ad | Spend | Purch | ROAS | CTR | Score |")
                lines.append("|---|---:|---:|---:|---:|---:|")
                for a in ads[:3]:
                    m = a["overview"]["metrics"]
                    lines.append(f"| {(a.get('name') or a['id'])[:40]} | {fmt_money(m['spend'], cur)} | {m['purchases']} | {m['roas_meta']:.2f}x | {m['ctr']:.2f}% | {a['overview'].get('score',0):.0f} |")
                lines.append("")
                retire = [a for a in ads if a["overview"].get("verdict") in ("PAUSE", "REVIEW")]
                if retire:
                    lines.append("**Ads a retirar/iterar:** " + ", ".join(
                        f"{(a.get('name') or a['id'])[:30]} ({a['overview'].get('verdict')})" for a in retire[:5]))
                    lines.append("")

    bd = report.get("breakdowns", {}).get("account_overview", {})
    if bd:
        lines.append("## 6. Breakdowns demográficos (cuenta, periodo overview)")
        lines.append("")
        for dim, label in [("age", "Edad"), ("gender", "Género"),
                           ("publisher_platform", "Placement"), ("device_platform", "Device")]:
            rows = bd.get(dim, [])
            if not rows:
                continue
            lines.append(f"### {label}")
            lines.append("")
            lines.append(f"| {label} | Spend | Purchases | ROAS | CTR |")
            lines.append("|---|---:|---:|---:|---:|")
            for r in rows[:8]:
                m = r["metrics"]
                lines.append(f"| {r['key']} | {fmt_money(m['spend'], cur)} | {m['purchases']} | {m['roas_meta']:.2f}x | {m['ctr']:.2f}% |")
            lines.append("")

    lines.append("## 7. Recomendaciones")
    lines.append("")
    if rankings.get("scale_candidates"):
        lines.append("### 🚀 Escalar (subir presupuesto)")
        lines.append("")
        for c in rankings["scale_candidates"][:10]:
            lines.append(f"- **{c['name']}** (`{c['id']}`) — {c['reason']}")
        lines.append("")
    if rankings.get("pause_candidates"):
        lines.append("### 🛑 Pausar")
        lines.append("")
        for c in rankings["pause_candidates"][:10]:
            lines.append(f"- **{c['name']}** (`{c['id']}`) — {c['reason']}")
        lines.append("")
    if rankings.get("review_candidates"):
        lines.append("### 🔍 Revisar")
        lines.append("")
        for c in rankings["review_candidates"][:10]:
            lines.append(f"- **{c['name']}** (`{c['id']}`) — {c['reason']}")
        lines.append("")

    lines.append("## 8. Caveats")
    lines.append("")
    lines.append(f"- **Margen del ROI es placeholder ({int(margin*100)}%)**. Ajustar en `clients/{slug}/client.json` → `margin_assumption`.")
    lines.append("- **ROAS Meta no está validado contra Server-Side Tracking** todavía. Cuando esté el SST de Cougar, correr `/attribution-check` para obtener el ROAS ajustado y reemplazar este caveat.")
    lines.append("- AdSets/Ads solo se profundizan para las top 5 campañas por spend (parámetro `--top-n`).")
    lines.append("- CTR > 20% se marca como REVIEW (outlier sospechoso de bot/engagement-bait).")
    lines.append("")
    return "\n".join(lines)


def run(slug: str, subcmd: str, since: dt.date, until: dt.date, margin: float,
        throttle: float, no_cache: bool, max_campaigns: int, top_n: int) -> dict:
    print(f"→ Cliente: {slug}  ·  Periodo: {since} → {until}  ·  Margen: {margin}", file=sys.stderr)

    cfg = load_client(slug)
    currency = cfg.get("currency", "USD")
    weights = {**DEFAULT_WEIGHTS, **(cfg.get("scoring_weights") or {})}
    thresholds = {**DEFAULT_THRESHOLDS, **(cfg.get("thresholds") or {})}

    windows = build_windows(since, until)
    do_monthly = subcmd in ("monthly", "all", "quick")
    do_biweekly = subcmd in ("biweekly", "all")
    do_breakdowns = subcmd in ("all", "quick")
    do_deep = subcmd == "all"  # adsets + ads

    print("→ Account insights (overview)...", file=sys.stderr)
    acc_overview_raw = fetch_insights(slug, {"level": "account", "id": None},
                                       windows["overview"]["since"], windows["overview"]["until"],
                                       throttle, no_cache)
    acc_overview_metrics = extract_metrics(acc_overview_raw or {}, margin)

    acc_monthly = []
    if do_monthly:
        for w in windows["monthly"]:
            print(f"→ Account monthly {w['label']}...", file=sys.stderr)
            row = fetch_insights(slug, {"level": "account", "id": None},
                                 w["since"], w["until"], throttle, no_cache)
            acc_monthly.append({**w, "metrics": extract_metrics(row or {}, margin)})

    acc_biweekly = []
    if do_biweekly:
        for w in windows["biweekly"]:
            print(f"→ Account biweekly {w['label']}...", file=sys.stderr)
            row = fetch_insights(slug, {"level": "account", "id": None},
                                 w["since"], w["until"], throttle, no_cache)
            acc_biweekly.append({**w, "metrics": extract_metrics(row or {}, margin)})

    print("→ Listing campaigns...", file=sys.stderr)
    campaigns_raw = list_campaigns(slug, throttle, no_cache)
    campaigns_raw = campaigns_raw[:max_campaigns]
    print(f"   {len(campaigns_raw)} campañas encontradas", file=sys.stderr)

    campaigns: list[dict] = []
    for i, c in enumerate(campaigns_raw, 1):
        cid = c.get("id")
        cname = c.get("name", "(sin nombre)")
        print(f"→ ({i}/{len(campaigns_raw)}) Campaign {cname[:50]}...", file=sys.stderr)
        ov = fetch_insights(slug, {"level": "campaign", "id": cid},
                            windows["overview"]["since"], windows["overview"]["until"],
                            throttle, no_cache)
        if ov is None:
            continue
        cmetrics = extract_metrics(ov, margin)

        c_monthly = []
        if do_monthly:
            for w in windows["monthly"]:
                row = fetch_insights(slug, {"level": "campaign", "id": cid},
                                     w["since"], w["until"], throttle, no_cache)
                if row:
                    c_monthly.append({**w, "metrics": extract_metrics(row, margin)})

        c_biweekly = []
        if do_biweekly:
            for w in windows["biweekly"]:
                row = fetch_insights(slug, {"level": "campaign", "id": cid},
                                     w["since"], w["until"], throttle, no_cache)
                if row:
                    c_biweekly.append({**w, "metrics": extract_metrics(row, margin)})

        campaigns.append({
            "id": cid,
            "name": cname,
            "objective": c.get("objective"),
            "status": c.get("effective_status") or c.get("status"),
            "daily_budget": c.get("daily_budget"),
            "lifetime_budget": c.get("lifetime_budget"),
            "overview": {"metrics": cmetrics},
            "monthly": c_monthly,
            "biweekly": c_biweekly,
            "adsets": [],
            "ads": [],
        })

    score_cohort(campaigns, weights, thresholds)

    if do_deep:
        sorted_by_spend = sorted(campaigns, key=lambda c: -c["overview"]["metrics"]["spend"])
        for camp in sorted_by_spend[:top_n]:
            print(f"→ Deep dive AdSets de {camp['name'][:40]}...", file=sys.stderr)
            adsets_raw = list_adsets(slug, camp["id"], throttle, no_cache)
            for asd in adsets_raw[:20]:
                aid = asd.get("id")
                ov = fetch_insights(slug, {"level": "adset", "id": aid},
                                    windows["overview"]["since"], windows["overview"]["until"],
                                    throttle, no_cache)
                if ov is None:
                    continue
                camp["adsets"].append({
                    "id": aid,
                    "name": asd.get("name"),
                    "status": asd.get("effective_status") or asd.get("status"),
                    "overview": {"metrics": extract_metrics(ov, margin)},
                })
            score_cohort(camp["adsets"], weights, thresholds)

            top_adsets = sorted(camp["adsets"], key=lambda a: -a["overview"]["metrics"]["spend"])[:top_n]
            for asd in top_adsets:
                ads_raw = list_ads(slug, asd["id"], throttle, no_cache)
                for ad in ads_raw[:20]:
                    adid = ad.get("id")
                    ov = fetch_insights(slug, {"level": "ad", "id": adid},
                                        windows["overview"]["since"], windows["overview"]["until"],
                                        throttle, no_cache)
                    if ov is None:
                        continue
                    camp["ads"].append({
                        "id": adid,
                        "name": ad.get("name"),
                        "creative_id": extract_creative_id(ad.get("creative")),
                        "adset_id": asd["id"],
                        "status": ad.get("effective_status") or ad.get("status"),
                        "overview": {"metrics": extract_metrics(ov, margin)},
                    })
            score_cohort(camp["ads"], weights, thresholds)

    breakdowns = {}
    if do_breakdowns:
        bd_acc = {}
        for dim in ("age", "gender", "publisher_platform", "device_platform"):
            print(f"→ Breakdown {dim} (account)...", file=sys.stderr)
            rows = fetch_breakdown(slug, dim, windows["overview"]["since"],
                                   windows["overview"]["until"], throttle, no_cache)
            bd_acc[dim] = [{"key": r.get(dim, "(n/a)"), "metrics": extract_metrics(r, margin)} for r in rows]
        breakdowns["account_overview"] = bd_acc

    rankings = {
        "scale_candidates": [
            {"id": c["id"], "name": c["name"], "score": c["overview"].get("score"),
             "reason": c["overview"].get("reason")}
            for c in campaigns if c["overview"].get("verdict") == "SCALE"
        ],
        "pause_candidates": [
            {"id": c["id"], "name": c["name"], "score": c["overview"].get("score"),
             "reason": c["overview"].get("reason")}
            for c in campaigns if c["overview"].get("verdict") == "PAUSE"
        ],
        "review_candidates": [
            {"id": c["id"], "name": c["name"], "score": c["overview"].get("score"),
             "reason": c["overview"].get("reason")}
            for c in campaigns if c["overview"].get("verdict") == "REVIEW"
        ],
    }

    return {
        "client": slug,
        "currency": currency,
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "margin_assumption": margin,
        "weights": weights,
        "thresholds": thresholds,
        "windows": windows,
        "account": {
            "overview": {**windows["overview"], "metrics": acc_overview_metrics},
            "monthly": acc_monthly,
            "biweekly": acc_biweekly,
        },
        "campaigns": campaigns,
        "breakdowns": breakdowns,
        "rankings": rankings,
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument("slug")
    p.add_argument("subcmd", choices=["quick", "overview", "monthly", "biweekly", "all"])
    p.add_argument("--since")
    p.add_argument("--until")
    p.add_argument("--margin", type=float)
    p.add_argument("--throttle", type=float, default=0.4)
    p.add_argument("--no-cache", action="store_true")
    p.add_argument("--max-campaigns", type=int, default=100)
    p.add_argument("--top-n", type=int, default=5)
    args = p.parse_args()

    today = dt.date.today()
    until = dt.date.fromisoformat(args.until) if args.until else today
    since = dt.date.fromisoformat(args.since) if args.since else (until - dt.timedelta(days=90))

    cfg_margin = None
    cfg_path = ROOT / "clients" / args.slug / "client.json"
    if cfg_path.exists():
        try:
            cfg_margin = json.loads(cfg_path.read_text(encoding="utf-8")).get("margin_assumption")
        except Exception:
            pass
    margin = args.margin if args.margin is not None else (cfg_margin if cfg_margin is not None else 0.30)

    report = run(args.slug, args.subcmd, since, until, margin,
                 args.throttle, args.no_cache, args.max_campaigns, args.top_n)

    label = {"quick": "quick", "overview": "overview", "monthly": "monthly",
             "biweekly": "biweekly", "all": "90d"}[args.subcmd]
    out_dir = ROOT / "clients" / args.slug / "reports"
    out_dir.mkdir(parents=True, exist_ok=True)
    today_str = today.isoformat()
    json_out = out_dir / f"{today_str}-historical-{label}.json"
    json_out.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n✅ JSON: {json_out}", file=sys.stderr)

    if args.subcmd in ("all", "quick"):
        analysis_dir = ROOT / "clients" / args.slug / "analysis"
        analysis_dir.mkdir(parents=True, exist_ok=True)
        md_out = analysis_dir / f"{today_str}-{label}-summary.md"
        md_out.write_text(render_markdown(report), encoding="utf-8")
        print(f"✅ Markdown: {md_out}", file=sys.stderr)

    acc = report["account"]["overview"]["metrics"]
    print(f"\nResumen ({since} → {until}):", file=sys.stderr)
    print(f"  spend     = {acc['spend']:,.0f}", file=sys.stderr)
    print(f"  purchases = {acc['purchases']}", file=sys.stderr)
    print(f"  ROAS Meta = {acc['roas_meta']:.2f}x", file=sys.stderr)
    print(f"  CPA       = {acc['cpa']}", file=sys.stderr)
    print(f"  ROI({int(margin*100)}%) = {acc['roi_margin']}", file=sys.stderr)
    print(f"  campañas analizadas = {len(report['campaigns'])}", file=sys.stderr)
    print(f"  scale={len(report['rankings']['scale_candidates'])} "
          f"pause={len(report['rankings']['pause_candidates'])} "
          f"review={len(report['rankings']['review_candidates'])}", file=sys.stderr)


if __name__ == "__main__":
    main()
