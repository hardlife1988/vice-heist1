# Vice Heist math — verification log

## 2026-07-13: fixed the free-spin hang + payout-format crash

**Bug 1 — free-spin retrigger never terminated (blocked every simulation run).**
The freegame retrigger threshold was 2+ scatters, paired with an ~12%
per-cell scatter density on `FR0.csv`/`FRWCAP.csv`. That combination made the
expected retrigger spin-gain exceed the spin-cost, so `run_freespin()`'s
`while self.fs < self.tot_fs` loop never terminated — confirmed by direct
reproduction (a session that should end after ~15-20 spins was still
retriggering after 3,000+ iterations, `tot_fs` still climbing). This affected
every mode: `run.py` (or any simulation batch, even a 5-spin smoke test)
hung indefinitely and never produced lookup tables or publish files.

Fix: raised the freegame retrigger floor from 2 to 3 scatters, and cut the
scatter density on `FR0.csv`/`FRWCAP.csv` from ~12% to ~4% so retriggers stay
rare bonus events. Verified: the freegame distribution's free-spin loop now
terminates cleanly in every trial (10-20 spins), and a full `run.py`-style
pass (sims → optimization → PAR sheet → RGS format checks) completes
end-to-end for the first time.

**Bug 2 — paytable precision violated the RGS payout-granularity rule.**
Once the hang was fixed, the pipeline reached `execute_all_tests` for the
first time and immediately failed: `verify_lookup_format` requires every
payout to be an integer multiple of 10 "cents" (0.10x) once scaled to the
lookup-table's integer format, but several paytable entries had 3 decimal
places (e.g. `0.021`, `0.043`, `0.086`), which don't round to a multiple of
10. Fixed by rounding the whole paytable to the nearest 0.10x (minimum
non-zero 0.10x).

**Status after both fixes:** `run.py`'s full pipeline (simulate → optimize →
PAR sheet → RGS format checks) now runs to completion and writes
`library/publish_files/`.

## Known remaining issue — RTP is not close to the declared 0.96 and volatility fails Stake's 3-star limit

Running the full pipeline end-to-end for the first time exposed real
balance numbers that were never reachable before (the hang always blocked
`run.py` before this point):

- Base mode's realized RTP is drastically **above** the declared 0.96 (per-
  thread reads of ~1000-3600% RTP during simulation; the full lookup-table
  weighted average lands around **19.7x the intended RTP**).
- Bonus (buy-feature) mode's realized RTP is drastically **below** target
  (~1.1% against a declared 0.96).
- `execute_all_tests` additionally warns that bonus mode fails Stake's
  3-star volatility limit (CVaR 936.7 vs. limit 800).

This is a math-balance problem, not a code bug — the paytable, wild
multiplier ranges (`mult_values`, 2x-50x weighted), and free-spin trigger
frequencies need an actual rebalance pass (most of this is what the SDK's
own optimization step is meant to tune, but the starting weights/paytable
are far outside a workable range for it to land near 0.96). Flagging this
explicitly rather than treating "pipeline completes" as "ready to publish."
