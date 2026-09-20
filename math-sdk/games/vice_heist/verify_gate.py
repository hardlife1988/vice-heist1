"""Verify generated Vice Heist lookup tables against Stake 3-star RGS limits.

Reads library/publish_files/lookUpTable_<mode>_0.csv plus library/cap_targets.json
(written by optimize_rtp.py), writes library/VERIFY.json, and exits non-zero if
any mode fails. Run from games/vice_heist/.

UNIT CONVENTIONS -- this is where the previous version of this file was wrong.
It divided every payout by the mode's cost and then compared the result against
absolute x-bet thresholds, which silently understated the 100x bonus buy by a
factor of 100 (it reported bonus CVaR as 6.08 when the x-bet figure is ~608).
The conventions used here are stated per metric and both views are reported:

  rtp      x-cost.  Return per unit staked. A 100x buy returning 96x bet is 0.96.
  cvar     x-bet.   Mean payout of the worst-case top 0.1% of outcomes, measured
                    in absolute bet multiples. This is an exposure measure, so it
                    is NOT normalised by cost. The 596.84 figure recorded in the
                    repo for the old 900x build is an x-bet figure, which is the
                    evidence this convention is the intended one.
  etl10k   x-cost.  Expected payout contributed by outcomes >= 10,000x bet.
  etl40b   x-cost.  Expected payout contributed by outcomes >= 40x the mode cost.
  prob5k   -        Probability of an outcome >= 5,000x bet.
  prob10k  -        Probability of an outcome >= 10,000x bet.

Both an x-bet and an x-cost value are recorded for every magnitude metric, so a
reviewer can re-judge under the other convention without regenerating anything.
The gate applies the limits to the convention named above. These definitions are
inferred from the repo's own recorded figures, not from Stake's verifier source,
so VERIFY.json marks them as such.
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
GATE_CONVENTION = {
    "rtp": "x_cost",
    "cvar": "x_bet",
    "etl10k": "x_cost",
    "etl40b": "x_cost",
    "prob5k": "probability",
    "prob10k": "probability",
}
TAIL = 0.001           # worst 0.1%
CAP_REL_TOL = 0.05     # realised cap frequency must be within 5% of declared


def load(path: str) -> list[tuple[float, float]]:
    """Return [(weight, payout_in_x_bet), ...]; CSV stores payout in cents."""
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
    mean_xbet = sum(w * p for w, p in rows) / wsum
    mx_xbet = max(p for _, p in rows)

    # CVaR over the worst (highest-paying) TAIL fraction of probability mass.
    ordered = sorted(rows, key=lambda r: -r[1])
    budget = wsum * TAIL
    acc_w = acc_p = 0.0
    tail_from = 0.0
    for w, p in ordered:
        take = min(w, budget - acc_w)
        if take <= 0:
            break
        acc_w += take
        acc_p += take * p
        tail_from = p
        if acc_w >= budget:
            break
    cvar_xbet = acc_p / acc_w if acc_w else 0.0

    def exp_above(threshold_xbet: float) -> float:
        """Expected x-bet payout contributed by outcomes at/above a threshold."""
        return sum(w * p for w, p in rows if p >= threshold_xbet) / wsum

    def prob_above(threshold_xbet: float) -> float:
        return sum(w for w, p in rows if p >= threshold_xbet) / wsum

    etl10k_xbet = exp_above(10000.0)
    etl40b_xbet = exp_above(40.0 * cost)

    return {
        "rows": len(rows),
        "cost": cost,
        "rtp": round(mean_xbet / cost, 6),
        "max_payout_x_bet": round(mx_xbet, 4),
        "max_payout_x_cost": round(mx_xbet / cost, 4),
        "cvar_x_bet": round(cvar_xbet, 2),
        "cvar_x_cost": round(cvar_xbet / cost, 4),
        "tail_starts_at_x_bet": round(tail_from, 2),
        "etl10k_x_bet": round(etl10k_xbet, 6),
        "etl10k_x_cost": round(etl10k_xbet / cost, 6),
        "etl40b_x_bet": round(etl40b_xbet, 6),
        "etl40b_x_cost": round(etl40b_xbet / cost, 6),
        "prob5k": round(prob_above(5000.0), 10),
        "prob10k": round(prob_above(10000.0), 10),
    }


def gated(m: dict) -> dict:
    """Pick the value each limit is judged against, per GATE_CONVENTION."""
    return {
        "rtp": m["rtp"],
        "cvar": m["cvar_x_bet"],
        "etl10k": m["etl10k_x_cost"],
        "etl40b": m["etl40b_x_cost"],
        "prob5k": m["prob5k"],
        "prob10k": m["prob10k"],
    }


def main() -> int:
    if not os.path.isfile("library/cap_targets.json"):
        print("FAIL: library/cap_targets.json missing -- cannot verify the "
              "declared max-win frequency, so the design intent is unverifiable")
        return 1
    with open("library/cap_targets.json") as fh:
        targets = json.load(fh)

    paths = sorted(glob.glob("library/publish_files/lookUpTable_*_0.csv"))
    if not paths:
        print("FAIL: no lookup tables in library/publish_files/")
        return 1

    report = {
        "limits": LIMITS,
        "gate_convention": GATE_CONVENTION,
        "definitions_source": "inferred from repository-recorded figures, not "
                              "from Stake's verifier source -- confirm against "
                              "the official RGS verification before submission",
        "rtp_target": targets.get("rtp_target"),
        "modes": {},
        "verdict": "unknown",
    }
    all_ok = True

    for path in paths:
        mode = os.path.basename(path).split("_")[1]
        spec = (targets.get("modes") or {}).get(mode)
        if not spec:
            print(f"FAIL: cap_targets.json has no entry for mode {mode!r} -- "
                  f"refusing to judge a mode whose cost and cap are undeclared")
            return 1

        m = metrics(load(path), float(spec["cost"]))
        g = gated(m)
        violations = [k for k, lim in LIMITS.items() if g[k] > lim]

        # The defect this build exists to fix: does the PUBLISHED table actually
        # realise the declared max-win frequency?
        declared = float(spec["p_cap_target"])
        realised = m["prob10k"]
        cap_drift_ok = abs(realised - declared) <= CAP_REL_TOL * declared
        if not cap_drift_ok:
            violations.append("cap_frequency_drift")

        ok = not violations
        all_ok = all_ok and ok
        m["p_cap_declared"] = declared
        m["p_cap_realised"] = realised
        m["cap_one_in"] = round(1.0 / realised) if realised > 0 else None
        m["gated_values"] = g
        m["violations"] = violations
        m["passes"] = ok
        report["modes"][mode] = m

        print(f"\n[{mode}] cost={spec['cost']}")
        print(f"   rows                 {m['rows']}")
        print(f"   rtp                  {m['rtp']}          (limit <= {LIMITS['rtp']})")
        print(f"   max payout           {m['max_payout_x_bet']}x bet "
              f"/ {m['max_payout_x_cost']}x cost")
        print(f"   cvar                 {m['cvar_x_bet']} x bet   "
              f"(limit <= {LIMITS['cvar']})   [{m['cvar_x_cost']} x cost]")
        print(f"   tail starts at       {m['tail_starts_at_x_bet']}x bet")
        print(f"   etl10k               {m['etl10k_x_cost']} x cost  (limit <= {LIMITS['etl10k']})")
        print(f"   etl40b               {m['etl40b_x_cost']} x cost  (limit <= {LIMITS['etl40b']})")
        print(f"   prob5k               {m['prob5k']}       (limit <= {LIMITS['prob5k']})")
        print(f"   prob10k              {m['prob10k']}       (limit <= {LIMITS['prob10k']})")
        print(f"   cap frequency        declared {declared:.3e} vs realised "
              f"{realised:.3e}  -> {'MATCH' if cap_drift_ok else 'DRIFTED'}")
        if realised > 0:
            print(f"                        1 in {1.0 / realised:,.0f}")
        print(f"   => {'PASSES' if ok else 'FAILS: ' + ', '.join(violations)}")

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
