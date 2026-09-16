"""Vice Heist audio is generated in artifacts/vice-heist-pixi/static/assets/audio/.

music.mp3 — 8s looping synth bed
sfx.mp3   — 8s sprite sheet:
  0.0–1.8s spin whoosh
  2.0–3.8s win chime
  4.0–5.8s big-win sting
  6.0–7.8s scatter riser

Regenerate with the synthesis block in the repo setup script, then:
  ffmpeg -y -i music.wav -codec:a libmp3lame -qscale:a 4 music.mp3
  ffmpeg -y -i sfx.wav   -codec:a libmp3lame -qscale:a 4 sfx.mp3
"""
