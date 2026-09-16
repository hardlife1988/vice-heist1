# Vice Heist

Stake Engine slot: 5×3, 20 paylines, heist-noir theme.

| Mode | Cost | RTP target | Max win |
| --- | --- | --- | --- |
| Base | 1× | 96% | 900× |
| Bonus buy | 100× | 96% | 900× |

## Repo layout

- `artifacts/vice-heist-pixi/` — SvelteKit frontend (upload `build/` to Stake Engine)
- `math-sdk/games/vice_heist/` — math (upload `library/publish_files/` after `python run.py`)
- `artifacts/vice-heist-pixi/STAKE_UPLOAD.md` — exact ACP steps

## Local frontend

```bash
cd artifacts/vice-heist-pixi
pnpm install
pnpm dev
```

Without `sessionID` + `rgs_url` the game runs a local preview. Real play is launched from Stake Engine Developer → Start game session.

## Review notes

- Relative asset URLs so the game loads on `{team}.live.stake-engine.com/{game}/v{version}/`
- Bet selector uses RGS `config.betLevels`
- Balance, win, RTP, max win, paytable, and bonus buy are on-screen
- Unique PNG symbols and generated music/SFX in `static/assets/`
- Math reel strips: BR0 ~1.25% scatter, FR0 wild-heavier, FRWCAP distinct (33% wilds, 0 scatters)
