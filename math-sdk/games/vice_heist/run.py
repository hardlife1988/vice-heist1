"""
Vice Heist — Main run file for Stake Engine math SDK.

Usage (from math-sdk/ root):
    python3.12 games/vice_heist/run.py

Outputs all required Stake Engine publish files to:
    games/vice_heist/library/publish_files/
"""

import sys
import os

# Ensure SDK root is on path when run directly
SDK_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if SDK_ROOT not in sys.path:
    sys.path.insert(0, SDK_ROOT)

GAME_DIR = os.path.dirname(__file__)
if GAME_DIR not in sys.path:
    sys.path.insert(0, GAME_DIR)

from gamestate import GameState
from game_config import GameConfig
from game_optimization import OptimizationSetup
from optimization_program.run_script import OptimizationExecution
from utils.game_analytics.run_analysis import create_stat_sheet
from utils.rgs_verification import execute_all_tests
from src.state.run_sims import create_books
from src.write_data.write_configs import generate_configs

if __name__ == "__main__":

    # ── Simulation parameters ───────────────────────────────────────────
    num_threads   = 4         # increase on more powerful machines
    rust_threads  = 20
    batching_size = 5000
    compression   = True      # set False for readable JSON output during debug
    profiling     = False

    num_sim_args = {
        "base":  int(1e4),    # 10 000 base-game rounds
        "bonus": int(1e4),    # 10 000 bonus-buy rounds
    }

    run_conditions = {
        "run_sims":           True,
        "run_optimization":   True,
        "run_analysis":       True,
        "run_format_checks":  True,
    }

    # For a quick debug run, uncomment these overrides:
    # num_threads = 1; compression = False
    # num_sim_args = {"base": 100, "bonus": 100}
    # run_conditions = {"run_sims": True, "run_optimization": False,
    #                   "run_analysis": False, "run_format_checks": False}

    target_modes = list(num_sim_args.keys())

    config    = GameConfig()
    gamestate = GameState(config)

    if run_conditions["run_optimization"] or run_conditions["run_analysis"]:
        optimization_setup = OptimizationSetup(config)

    # ── Generate books + lookup tables ──────────────────────────────────
    if run_conditions["run_sims"]:
        print("Running simulations…")
        create_books(
            gamestate,
            config,
            num_sim_args,
            batching_size,
            num_threads,
            compression,
            profiling,
        )

    generate_configs(gamestate)

    # ── Optimization ────────────────────────────────────────────────────
    if run_conditions["run_optimization"]:
        print("Running optimization…")
        OptimizationExecution().run_all_modes(config, target_modes, rust_threads)
        generate_configs(gamestate)

    # ── Analysis / PAR sheet ────────────────────────────────────────────
    if run_conditions["run_analysis"]:
        print("Generating PAR sheet…")
        custom_keys = [{"symbol": "scatter"}, {"symbol": "bonus"}]
        create_stat_sheet(gamestate, custom_keys=custom_keys)

    # ── Format / RGS checks ─────────────────────────────────────────────
    if run_conditions["run_format_checks"]:
        print("Running RGS format checks…")
        execute_all_tests(config)

    print("\n✅ Vice Heist — all publish files written to:")
    print(f"   {config.publish_path}")
