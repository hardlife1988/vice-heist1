# ⚠️ This folder is pre-migration source data — not the Stake Engine build

`math/` is the original hand-written prototype for Vice Heist's math (its own
`GameConfig`, `Paytable`, `ReelEngine`, `Simulator`, and a custom provably-fair
scheme in `stake_engine.py`). It predates the SDK integration and uses a
different symbol scheme (`WILD/BOOK/GOLD_BAR/DIAMOND/...`) and a different
provably-fair model than the Stake Engine RGS uses.

**`math/reels/*.csv` was the source `convert_reels.py` (in
`math-sdk/games/vice_heist/`) converted into the SDK's reel format** — that
part of this folder did its job.

**Do not upload anything under `math/library/publish_files/` to the Stake
Engine Admin Control Panel.** Those JSON files are hand-authored placeholders,
not the SDK's compressed simulation "books" + lookup-table output, and they
disagree with the SDK paytable on symbol pays.

The compliant, upload-ready math lives in `math-sdk/games/vice_heist/`. Run:

```
cd math-sdk
python3.12 games/vice_heist/run.py
```

That writes real publish files to `math-sdk/games/vice_heist/library/publish_files/`.
Those are the files that go to the ACP — not this folder's.
