import { Howl } from "howler";
import { assetUrl } from "./assetUrl";

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
  music = new Howl({ src: [assetUrl("assets/audio/music.mp3")], loop: true, volume: 0.32, html5: true });
  sfx = new Howl({ src: [assetUrl("assets/audio/sfx.mp3")], sprite: SFX_SPRITE, volume: 0.85, html5: true });
}

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
  sfx?.mute(muted);
}
