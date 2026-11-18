// Synthesised WebAudio effects only — short oscillator/noise blips, no audio files.
export function createAudio() {
  let ctx = null;
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; } }
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  function tone(freq, dur, type = 'square', vol = 0.06, slide = 0) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, c.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  }
  function noise(dur = 0.08, vol = 0.08) {
    const c = ac(); if (!c) return;
    const buf = c.createBuffer(1, Math.max(1, c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = c.createBufferSource(); s.buffer = buf;
    const g = c.createGain(); g.gain.value = vol;
    s.connect(g).connect(c.destination); s.start();
  }
  return {
    unlock: () => ac(),
    punch: () => noise(0.07, 0.1),
    shoot: () => { noise(0.09, 0.14); tone(180, 0.08, 'square', 0.05, -120); },
    cash: () => { tone(880, 0.07, 'sine', 0.07); setTimeout(() => tone(1320, 0.1, 'sine', 0.07), 60); },
    door: () => tone(240, 0.09, 'triangle', 0.07, -60),
    crash: () => { noise(0.18, 0.16); tone(90, 0.18, 'sawtooth', 0.06, -40); },
    siren: () => tone(720, 0.16, 'triangle', 0.035, 220),
    success: () => { tone(660, 0.1, 'sine', 0.08); setTimeout(() => tone(990, 0.16, 'sine', 0.08), 100); },
    hurt: () => tone(140, 0.12, 'sawtooth', 0.07, -60),
  };
}
