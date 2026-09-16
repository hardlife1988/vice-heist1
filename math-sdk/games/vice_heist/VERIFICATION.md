# Vice Heist math — verification log

## 2026-09-16: reel strips + multiplier rebalance for Stake review

BR0 scatter was still ~11.5% of cells (dense enough that `draw_board` spent most of its time redrawing to avoid a natural 3-scatter). New strips:

| Strip | stops | scatter | wild |
| --- | --- | --- | --- |
| BR0 | 80 | 1.25% | 2.50% |
| FR0 | 64 | 1.56% | 10.94% |
| FRWCAP | 48 | 0% | 33.33% |

FRWCAP is no longer a copy of FR0. Freegame wild multipliers dropped the 20x/50x weights on the regular FS path (`2:140, 3:90, 4:25, 5:10, 10:4`). Wincap still uses a heavy multiplier table because that path is force-capped at 900x.

`run.py` now defaults to **100,000 sims per mode**. Regenerating `library/publish_files/` is required before the next math publish — the 115 MB bonus pack on ACP was built from the old strips.

After `python run.py`, confirm in the ACP that base and bonus RTP are both ~96% and within 0.5% of each other. If not, adjust `game_optimization.py` quotas and rerun. Do not publish math that is still at 19.7x / 1.1%.

## 2026-07-13: fixed the free-spin hang + payout-format crash

**Bug 1 — free-spin retrigger never terminated (blocked every simulation run).**
The freegame retrigger threshold was 2+ scatters, paired with an ~12%
per-cell scatter density on `FR0.csv`/`FRWCAP.csv`. That combination made the
expected retrigger spin-gain exceed the spin-cost, so `run_freespin()`'s
`while self.fs < self.tot_fs` loop never terminated.

Fix: raised the freegame retrigger floor from 2 to 3 scatters.

**Bug 2 — paytable precision violated the RGS payout-granularity rule.**
`verify_lookup_format` requires every payout to be an integer multiple of 10
cents (0.10x). Paytable was rounded to 0.10x.

**Known remaining issue (pre-2026-09-16 strips):** realized RTP was ~19.7x on
base and ~1.1% on bonus, and bonus CVaR exceeded 800. That is why the
strips/multipliers above were rewritten. Confirm with a fresh 100k run.
