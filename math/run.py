"""
Vice Heist — Main entry point.
Runs RTP simulation and writes all Stake-ready publish files.
"""
import os
import sys
import json
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

from game_config import GameConfig
from gamestate import GameState
from simulator import Simulator
from reels import get_reel_counts

OUT_DIR = os.path.join(os.path.dirname(__file__), "library", "publish_files")


def save(filename: str, data: dict):
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, filename)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"  ✅ {filename}")
    return path


def main():
    print("=" * 55)
    print("  Vice Heist Math — Full RTP Simulation")
    print("=" * 55)

    config = GameConfig()

    # ── 1. game_config.json ────────────────────────────────────────────
    save("game_config.json", config.to_dict())

    # ── 2. paytable.json ──────────────────────────────────────────────
    paytable = {
        "payline_pays": {sym: pays for sym, pays in config.payline_pays.items()},
        "scatter_pays": {str(k): v for k, v in config.scatter_pays.items()},
        "free_spin_awards": {str(k): v for k, v in config.free_spin_awards.items()},
        "free_spin_multiplier": config.free_spin_multiplier,
        "wild_substitutes_for": "all symbols except SCATTER",
        "pays_on": "left to right, minimum 3 of a kind",
    }
    save("paytable.json", paytable)

    # ── 3. reel_strips.json ───────────────────────────────────────────
    reel_counts = get_reel_counts()
    reel_data = {
        "reel_count": config.reels,
        "row_count": config.rows,
        "strips": config.reel_strips,
        "stop_counts": [len(r) for r in config.reel_strips],
        "symbol_frequencies": [
            {sym: count for sym, count in reel.items()}
            for reel in reel_counts
        ],
    }
    save("reel_strips.json", reel_data)

    # ── 4. paylines.json ──────────────────────────────────────────────
    save("paylines.json", {
        "count": config.num_paylines,
        "type": "fixed",
        "direction": "left_to_right",
        "patterns": [
            {"id": i + 1, "rows": pattern}
            for i, pattern in enumerate(config.paylines)
        ],
    })

    # ── 5. Run RTP simulation ─────────────────────────────────────────
    print("\nRunning simulation (1,000,000 base spins)…")
    sim = Simulator(config, num_spins=1_000_000, bet_per_line=1.0)
    report = sim.run(verbose=True)

    # ── 6. math_report.json ───────────────────────────────────────────
    report["generated_at"] = datetime.utcnow().isoformat() + "Z"
    save("math_report.json", report)

    # ── 7. math_sheet.json — single combined file for Stake review ────
    math_sheet = {
        "game": config.name,
        "version": config.version,
        "generated_at": report["generated_at"],
        "config": config.to_dict(),
        "paytable": paytable,
        "reel_data": reel_data,
        "simulation_report": report,
    }
    save("math_sheet.json", math_sheet)

    print(f"\nAll files written to: {OUT_DIR}")
    print(f"Simulated RTP: {report['results']['rtp_percent']:.4f}%")
    print(f"Target RTP:    {config.rtp * 100:.2f}%")

    diff = abs(report["results"]["rtp_percent"] - config.rtp * 100)
    if diff > 1.0:
        print(f"\n⚠️  RTP is {diff:.2f}% off target — reel strips need tuning.")
    else:
        print(f"✅ RTP within acceptable range of target.")


if __name__ == "__main__":
    main()
