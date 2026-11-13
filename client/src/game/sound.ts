/* Synthesised sound effects and ambience (Web Audio, no audio files). */

let ac: AudioContext | null = null;
let enabled = true;
let amb: GainNode | null = null;

function ctx(): AudioContext {
  if (!ac) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ac = new Ctor();
  }
  if (ac.state === "suspended") void ac.resume();
  return ac;
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
  if (amb && ac) amb.gain.setTargetAtTime(on ? 0.05 : 0, ac.currentTime, 0.3);
}

export function tone(f: number, d: number, type: OscillatorType = "sine", v = 0.08, slide = 0): void {
  if (!enabled) return;
  try {
    const a = ctx();
    const o = a.createOscillator();
    const g = a.createGain();
    const n = a.currentTime;
    o.type = type;
    o.frequency.setValueAtTime(f, n);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), n + d);
    g.gain.setValueAtTime(v, n);
    g.gain.exponentialRampToValueAtTime(0.0001, n + d);
    o.connect(g);
    g.connect(a.destination);
    o.start();
    o.stop(n + d);
  } catch {
    /* audio is optional */
  }
}

function noise(d: number, f: number, type: BiquadFilterType, v: number, sweep?: number): void {
  if (!enabled) return;
  try {
    const a = ctx();
    const n = (a.sampleRate * d) | 0;
    const b = a.createBuffer(1, n, a.sampleRate);
    const ch = b.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = a.createBufferSource();
    const fl = a.createBiquadFilter();
    const g = a.createGain();
    s.buffer = b;
    fl.type = type;
    fl.frequency.setValueAtTime(f, a.currentTime);
    if (sweep) fl.frequency.exponentialRampToValueAtTime(sweep, a.currentTime + d);
    g.gain.value = v;
    s.connect(fl);
    fl.connect(g);
    g.connect(a.destination);
    s.start();
  } catch {
    /* audio is optional */
  }
}

export const sfx = {
  fire: () => {
    noise(0.5, 900, "lowpass", 0.5, 120);
    tone(90, 0.35, "sine", 0.2, -50);
  },
  hit: () => {
    noise(0.8, 1400, "lowpass", 0.6, 80);
    tone(70, 0.5, "sine", 0.25, -40);
  },
  splash: () => noise(0.45, 2500, "bandpass", 0.25, 700),
  ok: () => {
    tone(660, 0.12);
    setTimeout(() => tone(880, 0.16), 90);
  },
  bad: () => tone(150, 0.25, "square", 0.07),
  coin: () => {
    tone(900, 0.1);
    setTimeout(() => tone(1200, 0.15), 80);
  },
  win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.25), i * 130)),
};

/** Soft sea ambience. Browsers need a user gesture first, so call this from one. */
export function startAmbient(): void {
  if (amb) return;
  try {
    const a = ctx();
    const n = (a.sampleRate * 4) | 0;
    const b = a.createBuffer(1, n, a.sampleRate);
    const ch = b.getChannelData(0);
    let l = 0;
    for (let i = 0; i < n; i++) {
      l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      ch[i] = l * 3.5;
    }
    const s = a.createBufferSource();
    const f = a.createBiquadFilter();
    const g = a.createGain();
    const lfo = a.createOscillator();
    const lg = a.createGain();
    s.buffer = b;
    s.loop = true;
    f.type = "lowpass";
    f.frequency.value = 500;
    g.gain.value = enabled ? 0.05 : 0;
    lfo.frequency.value = 0.12;
    lg.gain.value = 0.02;
    lfo.connect(lg);
    lg.connect(g.gain);
    s.connect(f);
    f.connect(g);
    g.connect(a.destination);
    s.start();
    lfo.start();
    amb = g;
  } catch {
    /* audio is optional */
  }
}
