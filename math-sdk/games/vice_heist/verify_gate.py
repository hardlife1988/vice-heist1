"""Verify generated Vice Heist lookup tables against Stake's 3-star RGS limits.

Reads library/publish_files/lookUpTable_<mode>_0.csv, computes the gate metrics
from the weighted payout distribution, writes library/VERIFY.json, and exits
non-zero if any mode fails. Run from games/vice_heist/.

Metric definitions match the SDK's RGS verification semantics:
  cvar    mean payout (x bet) of the worst-case top 0.1% of outcomes by payout
  etl10k  expected payout contributed by wins >= 10,000x
  etl40b  expected payout contributed by wins >= 40x the mode's cost
  prob5k  probability of a win >= 5,000x
  prob10k probability of a win >= 10,000x
All payout figures are divided by the mode's cost, so a bonus buy is measured
against what it costs rather than against a single unit bet.
"""
from __future__ import annotations

import csv
import glob
import json
import os
import sys

LIMITS = {
    "rtp": 0.967,
    "cvar": 800.0,
    "etl10k": 0.8,
    "etl40b": 0.9,
    "prob5k": 0.01,
    "prob10k": 0.005,
}

# Mode costs must match game_config's BetMode costs.
COSTS = {"base": 1.0, "bonus": 100.0}
TAIL = 0.001  # worst 0.1%


def load(path: str) -> list[tuple[float, float]]:
    """Return [(weight, payout_x_bet), ...]; CSV stores payout in integer cents."""
    rows: list[tuple[float, float]] = []
    with open(path, newline="") as fh:
        for row in csv.reader(fh):
            if not row:
                continue
            if len(row) < 3:
                raise ValueError(f"{path}: malformed row {row!r}")
            w, pay = float(row[1]), float(row[2]) / 100.0
            if w > 0:
                rows.append((w, pay))
    if not rows:
        raise ValueError(f"{path}: no positive-weight rows")
    return rows


def metrics(rows: list[tuple[float, float]], cost: float) -> dict:
    wsum = sum(w for w, _ in rows)
    rtp = sum(w * p for w, p in rows) / wsum / cost
    mx = max(p for _, p in rows) / cost

    ordered = sorted(rows, key=lambda r: -r[1])
    budget = wsum * TAIL
    acc_w = acc_p = 0.0
    tail_from = None
    for w, p in ordered:
        take = min(w, budget - acc_w)
        if take <= 0:
            break
        acc_w += take
        acc_p += take * p
        tail_from = p
        if acc_w >= budget:
            break
    cvar = (acc_p / acc_w / cost) if acc_w else 0.0

    def etl(threshold_x_bet: float) -> float:
        return sum(w * p for w, p in rows if p / cost >= threshold_x_bet) / wsum / cost

    def prob(threshold_x_bet: float) -> float:
        return sum(w for w, p in rows if p / cost >= threshold_x_bet) / wsum

    return {
        "rows": len(rows),
        "max_payout": round(mx, 4),
        "rtp": round(rtp, 6),
        "cvar": round(cvar, 2),
        "tail_starts_at": round((tail_from or 0.0) / cost, 2),
        "etl10k": round(etl(10000), 6),
        "etl40b": round(etl(40 * cost / cost), 6),
        "prob5k": round(prob(5000), 9),
        "prob10k": round(prob(10000), 9),
    }


def judge(m: dict) -> tuple[bool, list[str]]:
    bad = [k for k, lim in LIMITS.items() if m.get(k, 0.0) > lim]
    return (not bad), bad


def main() -> int:
    paths = sorted(glob.glob("library/publish_files/lookUpTable_*_0.csv"))
    if not paths:
        print("FAIL: no lookup tables found in library/publish_files/")
        return 1

    report: dict = {"limits": LIMITS, "modes": {}, "verdict": "unknown"}
    all_ok = True

    for path in paths:
        mode = os.path.basename(path).split("_")[1]
        cost = COSTS.get(mode)
        if cost is None:
            print(f"FAIL: unknown mode {mode!r} -- cost not declared, refusing to judge it")
            return 1
        m = metrics(load(path), cost)
        ok, bad = judge(m)
        m["cost"] = cost
        m["passes"] = ok
        m["violations"] = bad
        report["modes"][mode] = m
        all_ok = all_ok and ok

        print(f"\n[{mode}] cost={cost}")
        for k in ("rows", "max_payout", "rtp", "cvar", "tail_starts_at",
                  "etl10k", "etl40b", "prob5k", "prob10k"):
            lim = LIMITS.get(k)
            suffix = f"   (limit <= {lim})" if lim is not None else ""
            print(f"   {k:<15} {m[k]}{suffix}")
        print(f"   => {'PASSES' if ok else 'FAILS: ' + ', '.join(bad)}")

    report["files"] = {
        os.path.basename(p): os.path.getsize(p)
        for p in sorted(glob.glob("library/publish_files/*"))
    }
    report["verdict"] = "pass" if all_ok else "fail"

    with open("library/VERIFY.json", "w") as fh:
        json.dump(report, fh, indent=2)
    print(f"\nwrote library/VERIFY.json -- verdict: {report['verdict']}")
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
