"""Generate Vice Heist math files for Stake Engine.

This must match the official SDK sample runner (games/0_0_lines/run.py).
The previous version imported a non-existent `src.state.compression` module
and called OptimizationExecution.run_all_modes with the wrong arguments, so
`python run.py` crashed before any books were written.

Production approval wants 100k–1M simulations per mode.
Default here is 100_000. Override with env VICE_HEIST_NUM_SIMS.

After this finishes, upload from:
  math-sdk/games/vice_heist/library/publish_files/
    index.json
    books_base.jsonl.zst
    books_bonus.jsonl.zst
    lookUpTable_base_0.csv
    lookUpTable_bonus_0.csv

Skip the Rust optimizer (copies unoptimized lookUpTable_* → *_0.csv) with:
  VICE_HEIST_SKIP_OPT=1 python run.py
"""
import os
from gamestate import GameState
from game_config import GameConfig
from game_optimization import OptimizationSetup
from optimization_program.run_script import OptimizationExecution
from src.state.run_sims import create_books
from src.write_data.write_configs import generate_configs
from utils.game_analytics.run_analysis import create_stat_sheet
from utils.rgs_verification import execute_all_tests


if __name__ == "__main__":

    num_threads = int(os.environ.get("VICE_HEIST_THREADS", "4"))
    rust_threads = int(os.environ.get("VICE_HEIST_RUST_THREADS", "8"))
    batching_size = 5000
    compression = True
    profiling = False

    num_sim_args = {
        "base": int(os.environ.get("VICE_HEIST_NUM_SIMS", "100000")),
        "bonus": int(os.environ.get("VICE_HEIST_NUM_SIMS", "100000")),
    }

    skip_opt = os.environ.get("VICE_HEIST_SKIP_OPT", "").strip() in {"1", "true", "True", "yes"}
    skip_checks = os.environ.get("VICE_HEIST_SKIP_CHECKS", "").strip() in {"1", "true", "True", "yes"}

    run_conditions = {
        "run_sims": True,
        "run_optimization": not skip_opt,
        "run_analysis": True,
        "run_format_checks": not skip_checks,
    }
    target_modes = list(num_sim_args.keys())

    config = GameConfig()
    gamestate = GameState(config)
    if run_conditions["run_optimization"] or run_conditions["run_analysis"]:
        OptimizationSetup(config)

    if run_conditions["run_sims"]:
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

    if run_conditions["run_optimization"]:
        OptimizationExecution().run_all_modes(config, target_modes, rust_threads)
        generate_configs(gamestate)

    if run_conditions["run_analysis"]:
        custom_keys = [{"symbol": "scatter"}]
        create_stat_sheet(gamestate, custom_keys=custom_keys)

    if run_conditions["run_format_checks"]:
        execute_all_tests(config)

    print("Vice Heist math generation finished.")
    print("Upload these from library/publish_files/:")
    print("  index.json")
    print("  books_base.jsonl.zst")
    print("  books_bonus.jsonl.zst")
    print("  lookUpTable_base_0.csv")
    print("  lookUpTable_bonus_0.csv")
