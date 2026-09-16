# Vice Heist frontend

SvelteKit static build for Stake Engine.

## Required for CDN

`kit.paths.relative: true` and `assetUrl()` so `_app/` and `assets/` resolve under
`/{game}/v{version}/`. Never set Vite `base` to `/vice-heist1/`.

## RGS

`src/lib/rgsClient.ts` talks to `/wallet/authenticate`, `/wallet/play`, `/wallet/end-round`, `/wallet/balance`.
Bet amounts are integer micros ($1 = 1_000_000). Mode is `BASE` or `BONUS`.

## Upload

See `STAKE_UPLOAD.md`.
