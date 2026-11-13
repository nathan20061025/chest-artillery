/* Canvas drawing for the battle scene and the start-screen hero.
   Logical size is 800x380 (the canvas is 1600x760 and drawn at 2x). */
import type { SceneState } from "./types";

type Ctx = CanvasRenderingContext2D;
type Stop = [number, string];

const PI2 = Math.PI * 2;
const sn = Math.sin;
const cn = Math.cos;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/* ---------- helpers ---------- */
function lin(c: Ctx, x0: number, y0: number, x1: number, y1: number, st: Stop[]): CanvasGradient {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  st.forEach((s) => g.addColorStop(s[0], s[1]));
  return g;
}
function rad(c: Ctx, x: number, y: number, r0: number, r1: number, st: Stop[]): CanvasGradient {
  const g = c.createRadialGradient(x, y, r0, x, y, r1);
  st.forEach((s) => g.addColorStop(s[0], s[1]));
  return g;
}
function shade(h: string, a: number): string {
  const n = parseInt(h.slice(1), 16);
  const f = (v: number) =>
    Math.max(0, Math.min(255, Math.round(a < 0 ? v * (1 + a) : v + (255 - v) * a)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
function box(c: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  c.beginPath();
  if (c.roundRect) c.roundRect(x, y, w, h, r);
  else c.rect(x, y, w, h);
}
const waveY = (x: number, t: number, y: number, a: number, f: number, sp: number) =>
  y + sn(x * f + t * sp) * a + sn(x * f * 2.3 + t * sp * 1.4) * a * 0.4;

function wave(c: Ctx, t: number, y: number, a: number, f: number, sp: number, fill: string): void {
  c.fillStyle = fill;
  c.beginPath();
  c.moveTo(0, 380);
  for (let x = 0; x <= 800; x += 8) c.lineTo(x, waveY(x, t, y, a, f, sp));
  c.lineTo(800, 380);
  c.closePath();
  c.fill();
}

function cloud(c: Ctx, x: number, y: number, s: number, storm: boolean): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.fillStyle = storm ? "rgba(28,38,50,.85)" : "rgba(255,255,255,.88)";
  [
    [0, 0, 18],
    [24, -8, 16],
    [48, 0, 18],
    [22, 5, 17],
  ].forEach((p) => {
    c.beginPath();
    c.arc(p[0], p[1], p[2], 0, PI2);
    c.fill();
  });
  c.fillStyle = storm ? "rgba(5,12,20,.3)" : "rgba(140,185,220,.3)";
  c.beginPath();
  c.ellipse(24, 10, 38, 7, 0, 0, PI2);
  c.fill();
  c.restore();
}

/* ---------- ships, chests, cannons ---------- */
function ship(c: Ctx, x: number, col: string, flip: boolean, t: number, wind: number): void {
  const dir = flip ? -1 : 1;
  const bil = wind * dir * 1.2;
  c.save();
  c.translate(x, 258 + sn(t * 2 + x) * 2.2);
  c.rotate(sn(t * 1.6 + x) * 0.03 * dir);
  if (flip) c.scale(-1, 1);
  c.beginPath();
  c.moveTo(-58, -2);
  c.lineTo(58, -2);
  c.quadraticCurveTo(54, 22, 38, 34);
  c.lineTo(-38, 34);
  c.quadraticCurveTo(-54, 22, -58, -2);
  c.closePath();
  c.fillStyle = lin(c, 0, -2, 0, 34, [
    [0, shade(col, 0.22)],
    [1, shade(col, -0.35)],
  ]);
  c.fill();
  c.save();
  c.clip();
  c.strokeStyle = "rgba(0,0,0,.28)";
  c.lineWidth = 1;
  for (let y = 6; y < 34; y += 8) {
    c.beginPath();
    c.moveTo(-60, y);
    c.lineTo(60, y);
    c.stroke();
  }
  c.restore();
  c.fillStyle = "#c79a3a";
  c.fillRect(-58, -4, 116, 5);
  [-26, 0, 26].forEach((px) => {
    c.fillStyle = "#0e1b22";
    c.beginPath();
    c.arc(px, 15, 3.4, 0, PI2);
    c.fill();
    c.strokeStyle = "#c79a3a";
    c.lineWidth = 1;
    c.stroke();
  });
  c.strokeStyle = "rgba(240,230,200,.45)";
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(0, -64);
  c.lineTo(-56, -3);
  c.moveTo(0, -64);
  c.lineTo(56, -3);
  c.stroke();
  c.fillStyle = lin(c, -3, 0, 3, 0, [
    [0, "#6a4a28"],
    [1, "#2c1d0e"],
  ]);
  c.fillRect(-3, -68, 6, 68);
  c.beginPath();
  c.moveTo(-3, -58);
  c.quadraticCurveTo(-34 - bil * 2, -40, -34, -18);
  c.lineTo(-3, -14);
  c.closePath();
  c.fillStyle = "#efe2c0";
  c.fill();
  c.beginPath();
  c.moveTo(3, -62);
  c.quadraticCurveTo(46 + bil * 3, -40, 46, -16);
  c.lineTo(3, -12);
  c.closePath();
  c.fillStyle = lin(c, 3, 0, 46, 0, [
    [0, "#fff8e4"],
    [1, "#e3d3aa"],
  ]);
  c.fill();
  c.strokeStyle = "rgba(0,0,0,.18)";
  c.stroke();
  c.fillStyle = "#ff6b5f";
  c.beginPath();
  c.moveTo(0, -70);
  c.lineTo(26 + bil * 2, -66 + sn(t * 8 + x) * 3);
  c.lineTo(0, -61);
  c.closePath();
  c.fill();
  c.fillStyle = "rgba(255,255,255,.6)";
  c.beginPath();
  c.ellipse(0, 33, 66, 3.5 + sn(t * 3 + x), 0, 0, PI2);
  c.fill();
  c.beginPath();
  c.ellipse(-52, 32, 12, 4, 0, 0, PI2);
  c.fill();
  c.restore();
}

function chest(c: Ctx, x: number, t: number): void {
  const y = 274 + sn(t * 2 + x) * 2;
  const p = 0.5 + 0.5 * sn(t * 3 + x);
  c.fillStyle = rad(c, x, y + 12, 4, 40, [
    [0, `rgba(255,215,110,${(0.35 + 0.2 * p).toFixed(2)})`],
    [1, "rgba(255,215,110,0)"],
  ]);
  c.fillRect(x - 42, y - 30, 84, 84);
  c.fillStyle = lin(c, 0, y, 0, y + 24, [
    [0, "#e0ae4c"],
    [1, "#8a5f16"],
  ]);
  box(c, x - 20, y, 40, 24, 4);
  c.fill();
  c.fillStyle = "#6b4410";
  c.fillRect(x - 20, y + 9, 40, 3);
  c.fillStyle = "rgba(255,255,255,.28)";
  c.fillRect(x - 18, y + 2, 36, 3);
  c.fillStyle = "#f3ead3";
  box(c, x - 3, y + 7, 6, 9, 2);
  c.fill();
  if (sn(t * 2.5 + x * 0.7) > 0.9) {
    c.fillStyle = "#fff";
    c.beginPath();
    for (let k = 0; k < 8; k++) {
      const r = k % 2 ? 2 : 8;
      const a = (k * Math.PI) / 4;
      c.lineTo(x + 9 + cn(a) * r, y + 3 + sn(a) * r);
    }
    c.fill();
  }
}

function cannon(c: Ctx, x: number, y: number, ang: number, rec: number): void {
  c.save();
  c.translate(x, y);
  c.fillStyle = "#4a3018";
  box(c, -16, 2, 30, 12, 3);
  c.fill();
  c.fillStyle = "#24170b";
  c.beginPath();
  c.arc(-8, 14, 6, 0, PI2);
  c.arc(8, 14, 6, 0, PI2);
  c.fill();
  c.rotate(ang);
  c.translate(-rec * 8, 0);
  c.fillStyle = lin(c, 0, -9, 0, 9, [
    [0, "#8a99a2"],
    [0.5, "#2f3a41"],
    [1, "#12181c"],
  ]);
  c.beginPath();
  c.moveTo(-6, -9);
  c.lineTo(38, -6.5);
  c.lineTo(38, 6.5);
  c.lineTo(-6, 9);
  c.closePath();
  c.fill();
  c.fillStyle = "#1a2126";
  c.fillRect(33, -8.5, 6, 17);
  c.beginPath();
  c.arc(-8, 0, 7, 0, PI2);
  c.fill();
  c.restore();
}

function waterFront(c: Ctx, t: number): void {
  c.fillStyle = lin(c, 0, 286, 0, 380, [
    [0, "rgba(40,150,185,.55)"],
    [1, "rgba(8,55,75,.9)"],
  ]);
  c.beginPath();
  c.moveTo(0, 380);
  for (let x = 0; x <= 800; x += 8) c.lineTo(x, waveY(x, t, 293, 3.6, 0.06, 2.2));
  c.lineTo(800, 380);
  c.fill();
  c.strokeStyle = "rgba(255,255,255,.35)";
  c.lineWidth = 1.4;
  c.beginPath();
  for (let x = 0; x <= 800; x += 8) {
    const y = waveY(x, t, 293, 3.6, 0.06, 2.2);
    if (x) c.lineTo(x, y);
    else c.moveTo(x, y);
  }
  c.stroke();
}

/* ---------- effects (muzzle flash, smoke, splash, explosion, sparkles) ---------- */
interface Fx {
  k: "fl" | "sm" | "deb" | "ring" | "dr" | "gl";
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** growth */
  gr: number;
  /** grey level for smoke */
  g: number;
  t: number;
  life: number;
  r?: number;
  c1?: number;
}
type FxInit = Partial<Fx> & Pick<Fx, "k" | "x" | "y" | "life">;

interface Prev {
  hp: number;
  he: number;
  ch: number;
  x: number;
  y: number;
}

const BIRDS = [
  { x: 80, y: 70, s: 22, p: 0 },
  { x: 300, y: 48, s: 16, p: 2 },
  { x: 520, y: 92, s: 19, p: 4 },
];

export class Renderer {
  private fx: Fx[] = [];
  private prev: Prev | null = null;
  private last: SceneState | null = null;
  private lt = 0;
  private lightning = 0;
  private boltX = 300;
  private rec: [number, number] = [0, 0];

  private add(o: FxInit): void {
    this.fx.push({ t: 0, vx: 0, vy: 0, gr: 10, g: 150, ...o });
  }

  /* ---------- sky + sea ---------- */
  private sea(c: Ctx, t: number, storm: boolean): void {
    c.fillStyle = lin(
      c, 0, 0, 0, 290,
      storm
        ? [[0, "#27323d"], [0.6, "#51657a"], [1, "#8197a6"]]
        : [[0, "#2f7fb5"], [0.55, "#86c6e3"], [1, "#fbe9c0"]],
    );
    c.fillRect(0, 0, 800, 380);
    if (!storm) {
      c.save();
      c.translate(690, 62);
      c.fillStyle = rad(c, 0, 0, 10, 150, [[0, "rgba(255,244,190,.9)"], [1, "rgba(255,244,190,0)"]]);
      c.fillRect(-160, -160, 320, 320);
      c.rotate(t * 0.05);
      c.fillStyle = "rgba(255,240,180,.07)";
      for (let i = 0; i < 8; i++) {
        c.rotate(PI2 / 8);
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(260, -24);
        c.lineTo(260, 24);
        c.fill();
      }
      c.restore();
      c.fillStyle = "#fff6c8";
      c.beginPath();
      c.arc(690, 62, 24, 0, PI2);
      c.fill();
    }
    for (let i = 0; i < 4; i++) cloud(c, ((i * 260 + t * (5 + i * 2)) % 1040) - 120, 44 + i * 20 + sn(i) * 8, 1 + i * 0.12, storm);
    c.fillStyle = storm ? "#3a4a57" : "#5f93a8";
    c.beginPath();
    c.moveTo(-10, 270);
    c.quadraticCurveTo(70, 236, 150, 264);
    c.quadraticCurveTo(205, 246, 250, 270);
    c.fill();
    c.fillStyle = storm ? "#34424e" : "#76a3b5";
    c.beginPath();
    c.moveTo(520, 270);
    c.quadraticCurveTo(590, 248, 660, 270);
    c.fill();
    if (!storm) {
      BIRDS.forEach((b) => {
        const x = ((b.x + t * b.s) % 900) - 50;
        const y = b.y + sn(t * 0.8 + b.p) * 8;
        const f = sn(t * 9 + b.p);
        c.strokeStyle = "rgba(255,255,255,.92)";
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(x - 8, y - f * 3);
        c.quadraticCurveTo(x - 4, y - 5 - f * 3, x, y);
        c.quadraticCurveTo(x + 4, y - 5 - f * 3, x + 8, y - f * 3);
        c.stroke();
      });
    }
    c.fillStyle = lin(
      c, 0, 262, 0, 380,
      storm
        ? [[0, "#3a5666"], [1, "#0d2733"]]
        : [[0, "#5cc0dc"], [0.35, "#1f8bad"], [1, "#0b4259"]],
    );
    c.fillRect(0, 264, 800, 116);
    if (!storm) {
      for (let i = 0; i < 14; i++) {
        c.fillStyle = `rgba(255,250,210,${(0.5 * (0.5 + 0.5 * sn(t * 5 + i))).toFixed(2)})`;
        c.fillRect(690 + sn(i * 3.1 + t * 2) * (10 + i * 3) - 6, 268 + i * 5, 12 + i, 1.6);
      }
    }
    wave(c, t, 287, 3, 0.05, 1.6, "rgba(80,175,210,.5)");
    c.fillStyle = "rgba(255,255,255,.4)";
    for (let x = 0; x < 800; x += 14) {
      if (sn(x * 0.05 + t * 1.6) > 0.85) c.fillRect(x, waveY(x, t, 287, 3, 0.05, 1.6) - 1, 9, 2);
    }
  }

  /** wind streaks, rain, lightning and vignette */
  private post(c: Ctx, t: number, storm: boolean, w: number): void {
    if (w) {
      c.strokeStyle = "rgba(255,255,255,.17)";
      c.lineWidth = 1.2;
      const d = w >= 0 ? 1 : -1;
      const sp = Math.abs(w) * 26 + 12;
      for (let i = 0; i < 7; i++) {
        const x = ((((i * 151 + t * sp * d) % 960) + 960) % 960) - 80;
        const y = 40 + i * 34 + sn(i * 7) * 10;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + d * (22 + Math.abs(w) * 3), y + sn(t + i) * 2);
        c.stroke();
      }
    }
    if (storm) {
      c.strokeStyle = "rgba(190,210,230,.4)";
      c.lineWidth = 1;
      c.beginPath();
      for (let i = 0; i < 110; i++) {
        const x = ((i * 37 + t * (150 + (w || 0) * 40)) % 850) - 25;
        const y = (i * 53 + t * 640) % 330;
        c.moveTo(x, y);
        c.lineTo(x - 3, y + 14);
      }
      c.stroke();
      if (this.lightning <= 0 && Math.random() < 0.004) {
        this.lightning = 1;
        this.boltX = rnd(100, 700);
      }
      if (this.lightning > 0) {
        c.fillStyle = `rgba(225,238,255,${this.lightning * 0.45})`;
        c.fillRect(0, 0, 800, 380);
        if (this.lightning > 0.55) {
          c.strokeStyle = "rgba(255,255,255,.95)";
          c.lineWidth = 2.5;
          c.beginPath();
          let x = this.boltX;
          c.moveTo(x, 0);
          for (let y = 0; y < 270; y += 24) {
            x += rnd(-18, 18);
            c.lineTo(x, y + 24);
          }
          c.stroke();
        }
        this.lightning -= 0.045;
      }
    }
    c.fillStyle = rad(c, 400, 190, 160, 480, [[0, "rgba(0,0,0,0)"], [1, "rgba(0,10,20,.4)"]]);
    c.fillRect(0, 0, 800, 380);
  }

  private boom(x: number, y: number): void {
    this.add({ k: "fl", x, y, gr: 55, life: 0.35, c1: 170 });
    for (let i = 0; i < 16; i++)
      this.add({ k: "sm", x, y, vx: rnd(-40, 40), vy: rnd(-70, -15), r: 6, gr: 30, life: rnd(0.9, 1.5), g: rnd(50, 110) });
    for (let i = 0; i < 12; i++)
      this.add({ k: "deb", x, y, vx: rnd(-150, 150), vy: rnd(-260, -80), life: rnd(0.7, 1.2) });
  }
  private splash(x: number, y: number): void {
    this.add({ k: "ring", x, y, gr: 46, life: 0.9 });
    this.add({ k: "ring", x, y, gr: 30, life: 0.7, t: -0.12 });
    for (let i = 0; i < 16; i++) this.add({ k: "dr", x, y, vx: rnd(-70, 70), vy: -rnd(120, 280), life: rnd(0.6, 1) });
  }
  private gold(x: number, y: number): void {
    this.add({ k: "fl", x, y, gr: 36, life: 0.3, c1: 215 });
    for (let i = 0; i < 12; i++) this.add({ k: "gl", x, y, vx: rnd(-70, 70), vy: rnd(-140, -30), life: 0.9 });
  }

  private fxStep(c: Ctx, dt: number): void {
    this.fx = this.fx.filter((f) => {
      f.t += dt;
      if (f.t < 0) return true;
      const u = f.t / f.life;
      if (u >= 1) return false;
      if (f.k === "sm") {
        c.fillStyle = `rgba(${f.g},${f.g},${f.g},${(0.45 * (1 - u)).toFixed(3)})`;
        c.beginPath();
        c.arc(f.x + f.vx * f.t, f.y + f.vy * f.t, (f.r || 3) + u * f.gr, 0, PI2);
        c.fill();
      } else if (f.k === "fl") {
        const r = f.gr * (0.4 + u);
        c.fillStyle = rad(c, f.x, f.y, 0, r, [
          [0, `rgba(255,${f.c1 ?? 190},120,${(1 - u).toFixed(2)})`],
          [1, "rgba(255,120,0,0)"],
        ]);
        c.fillRect(f.x - r, f.y - r, r * 2, r * 2);
      } else if (f.k === "ring") {
        c.strokeStyle = `rgba(255,255,255,${(0.7 * (1 - u)).toFixed(2)})`;
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(f.x, f.y, 6 + u * f.gr, 2 + u * f.gr * 0.28, 0, 0, PI2);
        c.stroke();
      } else if (f.k === "dr") {
        f.vy += 520 * dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        c.fillStyle = `rgba(225,246,255,${(1 - u).toFixed(2)})`;
        c.beginPath();
        c.arc(f.x, f.y, 2.2, 0, PI2);
        c.fill();
      } else if (f.k === "deb") {
        f.vy += 700 * dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        c.save();
        c.translate(f.x, f.y);
        c.rotate(f.t * 9);
        c.fillStyle = "#5a3a1c";
        c.fillRect(-3, -2, 6, 4);
        c.restore();
      } else if (f.k === "gl") {
        f.vy += 260 * dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        c.fillStyle = `rgba(255,225,120,${(1 - u).toFixed(2)})`;
        c.beginPath();
        for (let k = 0; k < 8; k++) {
          const r = k % 2 ? 1.5 : 5;
          const a = (k * Math.PI) / 4;
          c.lineTo(f.x + cn(a) * r, f.y + sn(a) * r);
        }
        c.fill();
      }
      return true;
    });
  }

  /** Watches the match state and spawns muzzle flashes, smoke, splashes, explosions. */
  private track(s: SceneState): void {
    if (this.last !== s) {
      this.last = s;
      this.fx = [];
      this.prev = null;
      this.lt = s.t;
      this.rec = [0, 0];
    }
    const shot = s.shot;
    if (shot) {
      if (!this.prev) {
        this.prev = { hp: s.hp, he: s.he, ch: s.chs, x: shot.x, y: shot.y };
        this.rec[shot.me ? 0 : 1] = 1;
        this.add({ k: "fl", x: shot.x, y: shot.y, gr: 34, life: 0.18, c1: 190 });
        for (let i = 0; i < 7; i++)
          this.add({ k: "sm", x: shot.x, y: shot.y, vx: rnd(-30, 30), vy: rnd(-40, -5), r: 4, gr: 18, life: 1, g: 190 });
      }
      this.prev.x = shot.x;
      this.prev.y = shot.y;
      if (Math.random() < 0.75) this.add({ k: "sm", x: shot.x, y: shot.y, vy: -8, r: 2, gr: 8, life: 0.7, g: 205 });
    } else if (this.prev) {
      const p = this.prev;
      this.prev = null;
      if (s.he < p.he || s.hp < p.hp) this.boom(p.x, p.y);
      else if (s.chs > p.ch) this.gold(p.x, p.y);
      else if (p.x > -20 && p.x < 820) this.splash(p.x, 291);
    }
  }

  /** Draw one frame of a match. */
  draw(c: Ctx, s: SceneState, heavy: boolean): void {
    c.setTransform(2, 0, 0, 2, 0, 0);
    this.track(s);
    const dt = Math.max(0, Math.min(0.05, s.t - this.lt));
    this.lt = s.t;
    this.rec = [Math.max(0, this.rec[0] - dt * 5), Math.max(0, this.rec[1] - dt * 5)];
    c.save();
    if (s.shake > 0) c.translate(rnd(-1, 1) * s.shake, rnd(-1, 1) * s.shake);
    this.sea(c, s.t, s.storm);
    s.ca.forEach((h) => h.on && chest(c, h.x, s.t));
    ship(c, 115, "#6b4423", false, s.t, s.wind);
    ship(c, s.rx, "#8a2f2a", true, s.t, s.wind);
    waterFront(c, s.t);
    cannon(c, 115, 262, (-s.aim * Math.PI) / 180, this.rec[0]);
    cannon(c, s.rx - 30, 255, Math.PI + 0.8, this.rec[1]);
    const shot = s.shot;
    if (shot) {
      c.strokeStyle = "rgba(18,40,50,.35)";
      c.lineWidth = 3;
      c.beginPath();
      shot.tr.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
      c.stroke();
      const r = heavy && shot.me ? 9 : 6;
      c.fillStyle = rad(c, shot.x - 2, shot.y - 2, 1, r + 2, [[0, "#9aa7ae"], [1, "#0c1013"]]);
      c.beginPath();
      c.arc(shot.x, shot.y, r, 0, PI2);
      c.fill();
    }
    this.fxStep(c, dt);
    s.P.forEach((p) => {
      c.globalAlpha = Math.max(0, p[4]);
      c.fillStyle = p[5];
      c.fillRect(p[0], p[1], 4, 4);
    });
    c.globalAlpha = 1;
    c.font = "800 20px sans-serif";
    c.textAlign = "center";
    c.lineWidth = 3;
    c.strokeStyle = "rgba(0,0,0,.45)";
    s.TX.forEach((t) => {
      c.globalAlpha = Math.max(0, t[2]);
      c.strokeText(t[3], t[0], t[1]);
      c.fillStyle = t[4];
      c.fillText(t[3], t[0], t[1]);
    });
    c.globalAlpha = 1;
    this.post(c, s.t, s.storm, s.wind);
    const n = Math.min(4, Math.ceil(Math.abs(s.wind) / 2));
    const txt = "WIND " + (s.wind >= 0 ? "›" : "‹").repeat(n) + " " + Math.abs(s.wind).toFixed(1);
    c.fillStyle = "rgba(8,28,40,.6)";
    box(c, 336, 8, 128, 26, 13);
    c.fill();
    c.fillStyle = "#f3ead3";
    c.font = "700 13px sans-serif";
    c.fillText(txt, 400, 26);
    if (s.flash > 0) {
      c.fillStyle = `rgba(255,70,60,${s.flash * 0.35})`;
      c.fillRect(0, 0, 800, 380);
    }
    c.restore();
  }

  /** The start-screen picture: two ships facing off over three chests. */
  hero(c: Ctx, t: number): void {
    c.setTransform(2, 0, 0, 2, 0, 0);
    this.sea(c, t, false);
    [330, 430, 545].forEach((x) => chest(c, x, t));
    const w = sn(t * 0.3) * 2;
    ship(c, 115, "#6b4423", false, t, w);
    ship(c, 690, "#8a2f2a", true, t, w);
    waterFront(c, t);
    cannon(c, 115, 262, -0.8, 0);
    cannon(c, 660, 255, Math.PI + 0.8, 0);
    this.post(c, t, false, w);
  }
}
