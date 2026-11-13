import { parseFishCsv } from "../api/fishApi";

const B64 = "iVBORw0KGgo".padEnd(60, "A");

describe("parseFishCsv", () => {
  it("takes the fish count (2nd field), not the chest count, and keeps the image clean", () => {
    const r = parseFishCsv(`${B64},3,8\n`);
    expect(r.sol).toBe(3);
    expect(r.src).toBe(`data:image/png;base64,${B64}`);
    expect(r.src).not.toContain(",3");
  });
  it("also accepts a two-field reply", () => {
    expect(parseFishCsv(`${B64},7`).sol).toBe(7);
  });
  it("detects jpeg", () => {
    expect(parseFishCsv(`/9j/${"A".repeat(60)},3,1`).src.startsWith("data:image/jpeg")).toBe(true);
  });
  it("rejects bad data", () => {
    expect(() => parseFishCsv("short,3,1")).toThrow();
    expect(() => parseFishCsv(`${B64},12,1`)).toThrow();
    expect(() => parseFishCsv(B64)).toThrow();
  });
});
