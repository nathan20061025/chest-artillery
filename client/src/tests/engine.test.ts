import { MatchEngine } from "../game/engine";
import type { FishPick } from "../game/types";

const fish: FishPick = { sol: 5, src: null, how: "local", svg: "<svg/>" };

function make(over: Partial<ConstructorParameters<typeof MatchEngine>[0]> = {}) {
  const onFinish = vi.fn();
  const e = new MatchEngine(
    { level: 1, diff: 1, heart: false, heavy: false, time: false, ...over },
    { onChange: () => {}, onFinish, getFish: async () => fish, checkAnswer: async (f, d, t) => (t ? 4 : Math.abs(d - (f.sol ?? 0))) },
  );
  e.start();
  return { e, onFinish };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

describe("MatchEngine turn flow", () => {
  it("rejects out-of-range power and angle", () => {
    const { e } = make();
    expect(e.setPower(10)).toMatch(/30 to 100/);
    expect(e.ph).toBe("power");
    expect(e.setPower(65)).toBeNull();
    expect(e.ph).toBe("angle");
    expect(e.setAngle(95)).toMatch(/10 to 80/);
    expect(e.ph).toBe("angle");
  });

  it("loads a fish after the angle and then accepts an answer", async () => {
    const { e } = make();
    e.setPower(65);
    e.setAngle(45);
    expect(e.ph).toBe("loading");
    await tick();
    expect(e.ph).toBe("count");
    await e.answer(5);
    expect(e.ph).toBe("ready");
    expect(e.pe).toBe(0);
    expect(e.cor).toBe(1);
    expect(e.fb.tone).toBe("good");
  });

  it("a wrong count sets the error size and resets the combo", async () => {
    const { e } = make();
    e.setPower(65);
    e.setAngle(45);
    await tick();
    await e.answer(8);
    expect(e.pe).toBe(3);
    expect(e.cb).toBe(0);
    expect(e.fb.tone).toBe("bad");
  });

  it("only fires when ready", async () => {
    const { e } = make();
    e.fire();
    expect(e.shot).toBeNull();
    e.setPower(65);
    e.setAngle(45);
    await tick();
    await e.answer(5);
    e.fire();
    expect(e.shot?.me).toBe(true);
    expect(e.ph).toBe("fly");
  });

  it("the extra-heart item gives 4 hearts and extra time adds 8 s", () => {
    const { e } = make({ heart: true, time: true });
    expect(e.hp).toBe(4);
    expect(e.tm).toBe(22 + 8);
  });

  it("ignores a late fish once disposed", async () => {
    const { e } = make();
    e.setPower(65);
    e.setAngle(45);
    e.dispose();
    await tick();
    expect(e.ph).toBe("loading");
  });
});
