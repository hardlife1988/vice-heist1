# Reel asset notes

## Symbol codes

The frontend loads `assets/symbols/<CODE>.png` (see `src/lib/assets.ts`). Codes
follow this repository's existing assignment:

| Code | Subject | Source resolution |
|------|---------|-------------------|
| `W`  | Panther / WILD banner | 512px (hi-res source) |
| `SC` | Pink gem burst — scatter, triggers free spins | native, low-res |
| `BV` | Gold vault dial — bonus vault | 512px (hi-res source) |
| `H1` | White brilliant diamond | native, low-res |
| `H2` | Stacked gold bars | 512px (hi-res source) |
| `H3` | Banded cash stack | 512px (hi-res source) |
| `H4` | Cash-filled duffel bag | 512px (hi-res source) |
| `H5` | Cracked safe with gold spill | 512px (hi-res source) |
| `A`  | Ace of Spades | native, low-res |
| `K`  | King of Spades (skull king) | 512px (hi-res source) |
| `Q`  | Queen (masked) | native, low-res |
| `J`  | Jack (clubs) | 512px (hi-res source) |

## Format

Sprites are **WebP with alpha**, not PNG. WebP is roughly a fifth of the bytes
at visually indistinguishable quality, which matters for mobile first-load. The
superseded `.png` files are still in this directory but are no longer referenced
by `assets.ts`; delete them once nothing depends on them.

## Transparency

Every sprite carries a real alpha channel, cut by flood-filling background that
is connected to the image border, with narrow gaps in openwork frames bridged
before hole-filling. A naive luminance key must not be used: several symbols are
deliberately dark *inside* the artwork (card faces, the duffel bag, the safe
body) and a global threshold punches holes straight through them.

## Outstanding

- `SC`, `H1`, `A`, `Q` are cut from the older low-resolution art. Supplying
  1408px sources for these four brings the set to uniform 512px.
- An additional hi-res pink-diamond artwork exists but is unassigned: it is
  visually close to `SC`, so assigning it to `H1` would make the scatter hard to
  distinguish from a paying symbol. It is deliberately not committed.
- `background-mobile.webp` is exported as `BACKGROUND_MOBILE_SRC` but no
  component selects it yet; the renderer still always uses the landscape plate.
- `background.jpg` is unchanged at 1600x900.
- Audio is two stub files (`audio/music.mp3`, `audio/sfx.mp3`, ~107KB total).
  A production set needs reel stop, anticipation, scatter hit, win tiers, bonus
  entry and an ambient loop.
