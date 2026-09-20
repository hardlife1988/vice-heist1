"""Reweight lookup tables to a target RTP while PINNING the max-win frequency.

No Rust required. Reads library/lookup_tables/lookUpTable_<mode>.csv and
writes library/publish_files/lookUpTable_<mode>_0.csv.

Why this is not a plain exponential tilt
----------------------------------------
The previous version fitted a single global tilt exp(lam * payout) to hit the
RTP target. Because lam must go NEGATIVE to pull raw RTP down to 0.96, a
10,000x row is multiplied by exp(-lam * 10000), i.e. annihilated -- and the
integer-weight step then floored it to 1. A configured max-win rate of 1 in
200,000 was realised as roughly 1 in 10,000,000. The config comment claiming
the quota was "not something the optimizer can reweight away" was simply false
for this pipeline.

This version makes that claim true by construction:

  * max-win rows are removed from the tilt and assigned, together, exactly the
    probability declared in GameConfig.wincap_probability[mode];
  * the remaining rows are tilted to the residual RTP, so the total still lands
    on target:  rtp = p_cap * wincap / cost + (1 - p_cap) * rtp_rest;
  * integer weights are normalised against the TOTAL weight (not the maximum),
    so the published table's probabilities are the ones that were solved for.

It then re-measures the written table and aborts if either the realised RTP or
the realised cap frequency has drifted, so a silent regression cannot ship.
"""
from __future__ import annotations

import csv
import json
import math
import sys
from pathlib import Path

TOTAL_WEIGHT = 10**12
RTP_TOL = 0.0005
CAP_REL_TOL = 0.02  # realised cap probability must be within 2% of target

Row = tuple[int, float, float]  # (id, weight, payout_in_cents_of_x_bet)


# --------------------------------------------------------------------- io
def load_lut(path: Path) -> list[Row]:
    rows: list[Row] = []
    with path.open(newline="") as f:
        for row in csv.reader(f):
            if not row:
                continue
            if len(row) < 3:
                raise ValueError(f"{path}: malformed row {row!r}")
            rows.append((int(row[0]), float(row[1]), float(row[2])))
    if not rows:
        raise ValueError(f"{path}: no rows")
    return rows


def write_lut(path: Path, rows: list[Row]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as f:
        for i, w, p in rows:
            f.write(f"{int(i)},{int(w)},{int(p)}\n")


# ------------------------------------------------------------------ maths
def rtp_of(rows: list[Row], cost: float) -> float:
    wsum = sum(w for _i, w, _p in rows if w > 0)
    psum = sum(w * (p / 100.0) for _i, w, p in rows if w > 0)
    return (psum / wsum) / cost if wsum else 0.0


def tilt(rows: list[Row], lam: float) -> list[Row]:
    """Exponential tilt, peak-shifted so exp() cannot overflow."""
    xs = [p / 100.0 for _i, _w, p in rows]
    peak = max((lam * x for x in xs), default=0.0)
    return [
        (i, w * math.exp(lam * x - peak), p)
        for (i, w, p), x in zip(rows, xs)
    ]


def solve_lam(rows: list[Row], cost: float, target: float) -> float:
    """Bisect the tilt parameter. rtp_of(tilt(rows, lam)) rises with lam."""
    def f(lam: float) -> float:
        return rtp_of(tilt(rows, lam), cost)

    lo, hi = -1.0, 1.0
    for _ in range(80):
        if f(lo) <= target <= f(hi):
            break
        lo *= 2.0
        hi *= 2.0
        if abs(lo) > 1e9:
            raise ValueError(
                f"cannot bracket RTP {target:.6f}: achievable range is "
                f"[{f(lo):.6f}, {f(hi):.6f}] -- the non-cap rows cannot reach it"
            )
    for _ in range(200):
        mid = (lo + hi) / 2.0
        if f(mid) < target:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2.0


def to_int_weights(rows: list[Row], budget: int) -> list[Row]:
    """Scale float weights to integers summing to ~budget, preserving ratios."""
    wsum = sum(w for _i, w, _p in rows if w > 0)
    if wsum <= 0:
        raise ValueError("no positive weight to distribute")
    out: list[Row] = []
    for i, w, p in rows:
        iw = int(round(w / wsum * budget)) if w > 0 else 0
        out.append((i, float(max(iw, 1)), p))
    return out


def build_mode(
    rows: list[Row],
    cost: float,
    wincap: float,
    p_cap: float,
    target_rtp: float,
) -> tuple[list[Row], dict]:
    cap_cents = wincap * 100.0
    cap_rows = [r for r in rows if abs(r[2] - cap_cents) < 0.5]
    rest = [r for r in rows if abs(r[2] - cap_cents) >= 0.5]

    if not cap_rows:
        raise ValueError(
            f"no max-win row at {wincap}x in the raw table -- the wincap "
            f"distribution produced no books, so the cap is unreachable"
        )
    if not rest:
        raise ValueError("table contains only max-win rows")

    cap_contrib = p_cap * wincap / cost
    if cap_contrib >= target_rtp:
        raise ValueError(
            f"max-win alone contributes {cap_contrib:.6f} RTP at p={p_cap:g}, "
            f"which meets or exceeds the {target_rtp:.6f} target: lower "
            f"wincap_probability for this mode"
        )

    target_rest = (target_rtp - cap_contrib) / (1.0 - p_cap)
    print(f"  cap rows {len(cap_rows)}  p_cap {p_cap:g}  "
          f"cap RTP share {cap_contrib:.6f}")
    print(f"  raw RTP {rtp_of(rows, cost):.6f} -> residual target "
          f"{target_rest:.6f} over {len(rest)} non-cap rows")

    lam = solve_lam(rest, cost, target_rest)
    tilted = tilt(rest, lam)
    print(f"  lambda {lam:.6f}  residual RTP {rtp_of(tilted, cost):.6f}")

    cap_budget = int(round(p_cap * TOTAL_WEIGHT))
    if cap_budget < len(cap_rows):
        raise ValueError(
            f"cap probability {p_cap:g} is too small to represent across "
            f"{len(cap_rows)} cap rows at weight scale {TOTAL_WEIGHT}"
        )
    rest_budget = TOTAL_WEIGHT - cap_budget

    final = to_int_weights(tilted, rest_budget) + to_int_weights(cap_rows, cap_budget)
    final.sort(key=lambda r: r[0])

    wsum = sum(w for _i, w, _p in final)
    realised_cap = sum(w for _i, w, p in final if abs(p - cap_cents) < 0.5) / wsum
    stats = {
        "cost": cost,
        "wincap": wincap,
        "rtp": rtp_of(final, cost),
        "p_cap_target": p_cap,
        "p_cap_realised": realised_cap,
        "cap_rows": len(cap_rows),
        "rows": len(final),
        "lambda": lam,
    }

    if abs(stats["rtp"] - target_rtp) > RTP_TOL:
        raise ValueError(
            f"published RTP {stats['rtp']:.6f} missed target {target_rtp:.6f}"
        )
    if abs(realised_cap - p_cap) > CAP_REL_TOL * p_cap:
        raise ValueError(
            f"published cap frequency {realised_cap:.3e} missed target "
            f"{p_cap:.3e} -- weight normalisation is wrong"
        )
    print(f"  published RTP {stats['rtp']:.6f}  cap 1 in "
          f"{1.0 / realised_cap:,.0f}")
    return final, stats


# ------------------------------------------------------------------ driver
def mode_specs(game_dir: Path) -> dict:
    """Read cost / wincap / cap probability from GameConfig (one source of truth)."""
    sys.path.insert(0, str(game_dir))
    from game_config import GameConfig  # singleton; already built by run.py

    cfg = GameConfig()
    probs = getattr(cfg, "wincap_probability", None)
    if not isinstance(probs, dict):
        raise ValueError(
            "GameConfig.wincap_probability is missing: the published max-win "
            "frequency is undeclared, refusing to guess it"
        )
    specs = {}
    for bm in cfg.bet_modes:
        name = bm.get_name()
        if name not in probs:
            raise ValueError(f"wincap_probability has no entry for mode {name!r}")
        specs[name] = {
            "cost": bm.get_cost(),
            "wincap": float(cfg.wincap),
            "p_cap": float(probs[name]),
        }
    return specs


def optimize_game(game_dir: Path, target: float = 0.96) -> None:
    game_dir = Path(game_dir)
    lookup = game_dir / "library" / "lookup_tables"
    publish = game_dir / "library" / "publish_files"
    publish.mkdir(parents=True, exist_ok=True)

    specs = mode_specs(game_dir)
    report = {"rtp_target": target, "modes": {}}

    for mode, spec in specs.items():
        src = lookup / f"lookUpTable_{mode}.csv"
        dst = publish / f"lookUpTable_{mode}_0.csv"
        if not src.exists():
            raise FileNotFoundError(
                f"{src} is missing: mode {mode!r} is declared in GameConfig but "
                f"no raw lookup table was generated for it"
            )
        print(f"optimizing {mode}...")
        final, stats = build_mode(
            load_lut(src), spec["cost"], spec["wincap"], spec["p_cap"], target
        )
        write_lut(dst, final)
        report["modes"][mode] = stats
        print(f"  wrote {dst}")

    out = game_dir / "library" / "cap_targets.json"
    out.write_text(json.dumps(report, indent=2))
    print(f"wrote {out}")


if __name__ == "__main__":
    optimize_game(Path(__file__).resolve().parent)
