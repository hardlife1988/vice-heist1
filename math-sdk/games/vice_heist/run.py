"""Generate Vice Heist math files for Stake Engine.

Production approval wants 100k–1M simulations per mode.
Default here is 100_000. Override with env VICE_HEIST_NUM_SIMS.

After this finishes, upload from:
  math-sdk/games/vice_heist/library/publish_files/
    index.json
    books_base.jsonl.zst
    books_bonus.jsonl.zst
    lookUpTable_base_0.csv
    lookUpTable_bonus_0.csv
"""
import os
from gamestate import GameState
from game_config import GameConfig
from src.state.run_sims import create_books
from src.state.compression import compress_values
from optimization_program.run_script import OptimizationExecution


if __name__ == "__main__":

    num_threads = int(os.environ.get("VICE_HEIST_THREADS", "4"))
    rust_threads = 8
    batching_size = 5000
    compression = True
    profiling = False

    num_sim_args = {
        "base": int(os.environ.get("VICE_HEIST_NUM_SIMS", "100000")),
        "bonus": int(os.environ.get("VICE_HEIST_NUM_SIMS", "100000")),
    }

    config = GameConfig()
    gamestate = GameState(config)
    if config.output_compression:
        compress_values(gamestate)

    create_books(
        gamestate,
        config,
        num_sim_args,
        batching_size,
        num_threads,
        compression,
        profiling,
    )

    OptimizationExecution().run_all_modes(config, rust_threads)
    print("Vice Heist math generation finished.")
