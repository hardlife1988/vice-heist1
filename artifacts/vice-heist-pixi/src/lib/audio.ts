/**
 * Vice Heist — audio manager (Howler).
 *
 * pixi-svelte can *describe* an audio asset (Howler-shaped sprite config)
 * but doesn't provide a playback API of its own -- so audio here is plain
 * Howler, independent of the pixi-svelte asset/texture pipeline used for
 * symbol art. Two files:
 *   - music.mp3: ambient background loop, started once on first user
 *     interaction (browsers block audio autoplay before that) and looped
 *     continuously at low volume under gameplay.
 *   - sfx.mp3: a single sprite-sheet file with four cues (spin / win /
 *     bigWin / scatter) sliced from one generated track, played on demand.
 * Sprite offsets in SFX_SPRITE are fixed 2s-spaced slots (0/2/4/6s, 1.8s
 * each) matching the exact layout the source track was generated with --
 * see scripts/generate_audio.py's prompt for the four cues in that order.
 */
import { Howl } from "howler";

let music: Howl | null = null;
let sfx: Howl | null = null;
let unlocked = false;

const SFX_SPRITE: Record<string, [number, number]> = {
  spin: [0, 1800],
  win: [2000, 1800],
  bigWin: [4000, 1800],
  scatter: [6000, 1800],
};

export function initAudio() {
  if (music || sfx) return;
  music = new Howl({ src: ["/assets/audio/music.mp3"], loop: true, volume: 0.35 });
  sfx = new Howl({ src: ["/assets/audio/sfx.mp3"], sprite: SFX_SPRITE, volume: 0.8 });
}

/** Browsers block audio until a user gesture; call this from the Spin button handler. */
export function unlockAndStartMusic() {
  if (unlocked) return;
  unlocked = true;
  initAudio();
  music?.play();
}

export function playSfx(name: keyof typeof SFX_SPRITE) {
  sfx?.play(name);
}

export function setMusicMuted(muted: boolean) {
  music?.mute(muted);
}
