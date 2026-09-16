# Stake Engine upload — Vice Heist

Games are served from `https://{team}.live.stake-engine.com/{game}/v{version}/`.
This frontend uses **relative** asset URLs. Do not restore `base: "/vice-heist1/"`.

## 1. Build the frontend

```bash
cd artifacts/vice-heist-pixi
pnpm install
pnpm build
```

Upload the **contents** of `artifacts/vice-heist-pixi/build/` as the frontend:

```
index.html
_app/
assets/          (background, symbols/*.png, audio/*.mp3)
```

Do not wrap the upload in an extra `front/` folder. `index.html` must sit at the frontend root.

Then click **Publish Front End**.

## 2. Generate and upload math

```bash
cd math-sdk
pip install -r requirements.txt
cd games/vice_heist
python run.py
```

Default is 100,000 sims per mode (required range is 100k–1M). Faster smoke run:

```bash
VICE_HEIST_NUM_SIMS=2000 python run.py
```

Upload these five files from `math-sdk/games/vice_heist/library/publish_files/`:

- `index.json`
- `books_base.jsonl.zst`
- `books_bonus.jsonl.zst`
- `lookUpTable_base_0.csv`
- `lookUpTable_bonus_0.csv`

Then click **Publish Math**. In the ACP, base and bonus RTP should both land near 96% and within 0.5% of each other.

Replace the old 115 MB bonus book pack after this regeneration. New strips have ~1.25% scatter on BR0 (was ~11.5%) and a distinct wild-heavy FRWCAP.

## 3. Launch a session

Developer → Start game session → Launch in new tab.

If the board is blank, the previous build used absolute `/vice-heist1/_app/...` paths. This build fixes that.

If authenticate fails, the URL is missing `sessionID` or `rgs_url`.
