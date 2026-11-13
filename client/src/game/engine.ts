/* Match logic: turn flow (power -> angle -> count -> fire), physics, rival AI, scoring.
   Pure TypeScript, no React or DOM. The React page drives it with update(dt) every frame
   and re-renders when the engine calls hooks.onChange(). */
import { LEVELS, RIVAL_AIM, TURN_SECONDS, type LevelDef } from "./data";
import { sfx } from "./sound";
import type {
  Chest,
  FishPick,
  FloatText,
  MatchStats,
  Particle,
  Phase,
  SceneState,
  Shot,
} from "./types";

const R = Math.random;
const rr = (a: number, b: number) => a + R() * (b - a);
const ri = (n: number) => Math.floor(R() * n);

export interface MatchConfig {
  /** campaign level number, 1-based */
  level: number;
  /** 0 easy, 1 normal, 2 hard */
  diff: number;
  heart: boolean;
  heavy: boolean;
  time: boolean;
}

export interface MatchHooks {
  onChange: () => void;
  onFinish: (stats: MatchStats) => void;
  getFish: () => Promise<FishPick>;
}

export interface Feedback {
  text: string;
  tone: "good" | "bad" | "";
}

export class MatchEngine implements SceneState {
  readonly L: LevelDef;
  readonly level: number;
  readonly hpMax: number;
  readonly tm: number;

  /* --- scene state (SceneState) --- */
  t = 0;
  wind = 0;
  aim = 45;
  rx = 690;
  ca: Chest[];
  shot: Shot | null = null;
  P: Particle[] = [];
  TX: FloatText[] = [];
  shake = 0;
  flash = 0;
  hp: number;
  he: number;
  chs = 0;

  /* --- match state --- */
  ph: Phase = "power";
  sc = 0;
  cb = 0;
  best = 0;
  shots = 0;
  ans = 0;
  cor = 0;
  hits = 0;
  tl: number;
  /** count error of the current turn (0 = perfect) */
  pe = 0;
  pw = 0;
  ag = 0;
  sol = 0;
  fish: FishPick | null = null;
  /** increments each time a new fish picture arrives (lets the UI animate the swap) */
  fishId = 0;
  fb: Feedback = { text: "", tone: "" };
  /** angle currently typed in the box, used as the cannon's resting aim */
  previewAim = 45;
  done = false;

  private Q: [number, () => void][] = [];

  constructor(
    private readonly cfg: MatchConfig,
    private readonly hooks: MatchHooks,
  ) {
    this.level = cfg.level;
    this.L = LEVELS[cfg.level - 1];
    this.hpMax = 3 + (cfg.heart ? 1 : 0);
    this.hp = this.hpMax;
    this.he = this.L.rivalHp;
    this.tm = TURN_SECONDS[cfg.diff] + (cfg.time ? 8 : 0);
    this.tl = this.tm;
    const n = this.L.chests;
    this.ca = Array.from({ length: n }, (_, i) => ({ x: 300 + i * (260 / (n - 1)), on: true }));
  }

  get storm(): boolean {
    return this.L.storm;
  }

  /** Stop the engine (leaving the page, restarting). Pending async work is ignored. */
  dispose(): void {
    this.done = true;
  }

  private changed(): void {
    if (!this.done) this.hooks.onChange();
  }

  private setFb(text: string, tone: Feedback["tone"] = ""): void {
    this.fb = { text, tone };
  }

  /* ---------- turn flow ---------- */
  start(): void {
    this.turn();
  }

  private turn = (): void => {
    this.ph = "power";
    this.wind = (R() < 0.5 ? -1 : 1) * rr(0.3, 1) * this.L.wind;
    this.aim = this.previewAim;
    this.pe = 0;
    this.pw = 0;
    this.ag = 0;
    this.setFb("");
    this.changed();
  };

  /** Step 1. Returns an error message when the value is invalid. */
  setPower(v: number): string | null {
    if (this.ph !== "power") return null;
    if (!(v >= 30 && v <= 100)) {
      const e = "Power must be a number from 30 to 100.";
      this.setFb(e, "bad");
      this.changed();
      return e;
    }
    this.pw = Math.round(v);
    this.setFb("");
    this.ph = "angle";
    this.aim = this.previewAim;
    this.changed();
    return null;
  }

  /** Step 2. Returns an error message when the value is invalid. */
  setAngle(v: number): string | null {
    if (this.ph !== "angle") return null;
    if (!(v >= 10 && v <= 80)) {
      const e = "Angle must be a number from 10 to 80 degrees.";
      this.setFb(e, "bad");
      this.changed();
      return e;
    }
    this.ag = Math.round(v);
    this.aim = this.ag;
    this.setFb("");
    void this.loadCount();
    return null;
  }

  /** Step 3: the fish picture is fetched BEFORE the final shot. */
  private async loadCount(): Promise<void> {
    this.ph = "loading";
    this.fish = null;
    this.changed();
    const f = await this.hooks.getFish();
    if (this.done) return;
    this.fish = f;
    this.sol = f.sol;
    this.fishId++;
    this.ph = "count";
    this.tl = this.tm;
    this.changed();
  }

  /** Player answers the count (or the timer ran out). */
  answer(d: number, timedOut = false): void {
    if (this.done || this.ph !== "count") return;
    const e = timedOut ? 4 : Math.abs(d - this.sol);
    this.ans++;
    if (e === 0) {
      this.cor++;
      this.cb++;
      this.best = Math.max(this.best, this.cb);
      sfx.ok();
    } else {
      this.cb = 0;
      sfx.bad();
    }
    this.setFb(
      timedOut
        ? "Time's up! Random digit used."
        : e
          ? `Off by ${e}. Expect wobble.`
          : "Perfect count! Clean shot." + (this.cb > 1 ? " Combo x" + this.cb : ""),
      e ? "bad" : "good",
    );
    this.pe = e;
    this.ph = "ready";
    this.changed();
  }

  fire(): void {
    if (this.done || this.ph !== "ready") return;
    const te = this.pe;
    const a = this.ag + rr(-1, 1) * te * 3.5;
    const pw = this.pw * (1 + rr(-1, 1) * te * 0.02);
    const r = (a * Math.PI) / 180;
    this.shots++;
    this.ph = "fly";
    sfx.fire();
    this.shake = 3;
    this.shot = {
      me: true,
      x: 115 + 38 * Math.cos(r),
      y: 262 - 38 * Math.sin(r),
      vx: pw * 5.8 * Math.cos(r),
      vy: -pw * 5.8 * Math.sin(r),
      tr: [],
      pf: te === 0,
    };
    this.burst(150, 245, "#bbb", 10);
    this.changed();
  }

  private enemy = (): void => {
    this.ph = "enemy";
    const k = RIVAL_AIM[this.cfg.diff] * this.L.aimError;
    const a = rr(40, 55);
    const ax = this.wind * 5;
    const comp = Math.min(1, 0.4 + this.level * 0.15);
    const eff = Math.max(50, this.rx - 145 + 0.5 * ax * 2.25 * comp);
    const v = Math.sqrt((eff * 500) / Math.sin((a * Math.PI) / 90)) * (1 + rr(-1, 1) * k);
    const r = (a * Math.PI) / 180;
    this.shot = {
      me: false,
      x: this.rx - 30 - 38 * Math.cos(r),
      y: 255 - 38 * Math.sin(r),
      vx: -v * Math.cos(r),
      vy: -v * Math.sin(r),
      tr: [],
    };
    sfx.fire();
    this.changed();
  };

  private after(me: boolean): void {
    this.changed();
    if (this.he <= 0) {
      this.Q.push([0.9, () => this.finish(true)]);
      return;
    }
    if (this.hp <= 0) {
      this.Q.push([0.9, () => this.finish(false)]);
      return;
    }
    this.Q.push([me ? 0.9 : 0.7, me ? this.enemy : this.turn]);
  }

  private finish(win: boolean): void {
    if (this.done) return;
    this.ph = "done";
    this.done = true;
    this.hooks.onFinish({
      win,
      sc: this.sc,
      ans: this.ans,
      cor: this.cor,
      chs: this.chs,
      hits: this.hits,
      best: this.best,
      hp: this.hp,
      hpMax: this.hpMax,
    });
  }

  /* ---------- effects helpers ---------- */
  private burst(x: number, y: number, col: string, n: number): void {
    for (let i = 0; i < n; i++) this.P.push([x, y, rr(-160, 160), rr(-260, -20), rr(0.4, 0.9), col]);
  }
  private ftxt(x: number, y: number, s: string, col: string): void {
    this.TX.push([x, y, 1.1, s, col]);
  }
  private addPts(base: number, s: Shot, x: number, y: number, col: string): void {
    const m = Math.min(3, 1 + (this.cb >> 1));
    const p = Math.round((base + (s.pf ? 5 : 0)) * m);
    this.sc += p;
    this.ftxt(x, y - 12, "+" + p + (m > 1 ? " x" + m : ""), col);
  }

  /* ---------- per-frame update ---------- */
  update(dt: number): void {
    if (this.done) return;
    this.t += dt;
    if (this.L.moving) this.rx = 690 + Math.sin(this.t * 0.9) * 45;

    for (let i = this.Q.length - 1; i >= 0; i--) {
      this.Q[i][0] -= dt;
      if (this.Q[i][0] <= 0) {
        const f = this.Q.splice(i, 1)[0][1];
        f();
        if (this.done) return;
      }
    }

    if (this.ph === "count") {
      this.tl -= dt;
      if (this.tl <= 0) this.answer(ri(10), true);
    }

    const s = this.shot;
    const hr = this.cfg.heavy ? 14 : 0;
    if (s) {
      s.vx += this.wind * 5 * dt;
      s.vy += 500 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.tr.push([s.x, s.y]);
      if (s.tr.length > 28) s.tr.shift();
      let o = 0;
      if (s.me) {
        for (const h of this.ca) {
          if (h.on && Math.hypot(s.x - h.x, s.y - 284) < 26 + hr) {
            h.on = false;
            o = 1;
            this.chs++;
            this.addPts(10, s, h.x, 270, "#e3b24e");
            this.burst(h.x, 284, "#e3b24e", 26);
            sfx.coin();
            break;
          }
        }
        if (!o && Math.abs(s.x - this.rx) < 55 + hr && s.y > 225 - hr && s.y < 295) {
          o = 2;
          this.he--;
          this.hits++;
          this.addPts(25, s, s.x, s.y, "#ff8a3d");
          this.burst(s.x, s.y, "#ff8a3d", 34);
          this.shake = 9;
          sfx.hit();
        }
      } else if (s.x > 60 && s.x < 170 && s.y > 225 && s.y < 295) {
        o = 2;
        this.hp--;
        this.flash = 1;
        this.shake = 9;
        this.ftxt(s.x, s.y - 10, "-1 ♥", "#ff6b5f");
        this.burst(s.x, s.y, "#ff8a3d", 34);
        sfx.hit();
      }
      if (!o && (s.y > 294 || s.x < -60 || s.x > 860)) {
        o = 3;
        this.burst(s.x, Math.min(s.y, 290), "#cfeefa", 16);
        sfx.splash();
      }
      if (o) {
        this.shot = null;
        this.after(s.me);
      }
    }

    this.P.forEach((p) => {
      p[0] += p[2] * dt;
      p[1] += p[3] * dt;
      p[3] += 600 * dt;
      p[4] -= dt;
    });
    this.P = this.P.filter((p) => p[4] > 0);
    this.TX.forEach((t) => {
      t[1] -= 30 * dt;
      t[2] -= dt * 0.8;
    });
    this.TX = this.TX.filter((t) => t[2] > 0);
    this.shake = Math.max(0, this.shake - dt * 20);
    this.flash = Math.max(0, this.flash - dt * 2);
  }
}
