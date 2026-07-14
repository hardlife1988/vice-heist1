"""
Vice Heist — audio asset generation notes.

Both static/assets/audio/music.mp3 and sfx.mp3 (in artifacts/vice-heist-pixi)
were produced via `surething video generate` (video model with synchronized
audio) and then had their audio track extracted with ffmpeg -- there is no
direct text-to-audio-only generator available, so video generation with a
prompt that ignores the visual track is the supported path.

music.mp3 (looping background bed):
  surething video generate "Ambient synthwave background music loop for a
  neon-noir heist-themed casino slot machine, moody electronic beat with a
  pulsing bassline, retro synth arpeggios, subtle vinyl-style warmth,
  atmospheric and tense but rhythmic, suited for looping continuously, no
  vocals, no sudden stops" --duration-seconds=8 --aspect-ratio=16:9
  --generate-audio=true --model=veo-3.1-fast-generate-001
  then: ffmpeg -i music.mp4 -vn -acodec libmp3lame -q:a 4 music.mp3

sfx.mp3 (one sprite-sheet file, four cues at fixed 2s-spaced slots):
  surething video generate "A rapid sequence of four distinct clean
  casino slot-machine sound effects with no music and no visuals mattering,
  evenly spaced about two seconds apart: first a quick mechanical reel-spin
  whirring whoosh sound, then a short bright coin-win chime cascade, then a
  bigger celebratory orchestral-synth fanfare sting for a big win, then a low
  rising synth swell tension riser for a bonus scatter trigger, distinct
  silence between each effect, no vocals, no continuous music bed"
  --duration-seconds=8 --aspect-ratio=16:9 --generate-audio=true
  --model=veo-3.1-fast-generate-001
  then: ffmpeg -i sfx.mp4 -vn -acodec libmp3lame -q:a 3 sfx.mp3

The prompt asks for four cues laid out roughly every 2s (spin, win, bigWin,
scatter, in that order) -- src/lib/audio.ts's SFX_SPRITE slices exactly those
four fixed 2s-spaced windows (0-1.8s, 2-3.8s, 4-5.8s, 6-7.8s). Automatic
silence-boundary detection (ffmpeg silencedetect / librosa RMS envelope) was
tried first but the generated track doesn't have clean silence gaps between
cues, so the fixed layout from the prompt is what's actually used.
"""
