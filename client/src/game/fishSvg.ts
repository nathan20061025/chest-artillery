const COLOURS = ["#ff9f43", "#48dbfb", "#ff6b6b", "#feca57", "#a29bfe"];
const rr = (a: number, b: number) => a + Math.random() * (b - a);

/** Locally drawn fish picture, used when the fish API cannot be reached. Shows `n` fish (plus 2 chests). */
export function fishSvg(n: number): string {
  const placed: [number, number][] = [];
  let body =
    '<path d="M25 200q-10-30 0-60t0-50M270 200q10-30 0-55t0-45" stroke="#2f9e6b" stroke-width="5" fill="none"/>';
  for (let i = 0; i < n + 2; i++) {
    let x = 0;
    let y = 0;
    let tries = 0;
    do {
      x = rr(35, 265);
      y = rr(25, 160);
    } while (placed.some((q) => Math.hypot(q[0] - x, q[1] - y) < 44) && tries++ < 40);
    placed.push([x, y]);
    if (i < n) {
      const c = COLOURS[i % 5];
      const flip = Math.random() < 0.5 ? -1 : 1;
      body += `<g transform="translate(${x} ${y}) scale(${flip} 1)"><ellipse rx="16" ry="9" fill="${c}"/><polygon points="14,0 27,-9 27,9" fill="${c}"/><circle cx="-8" cy="-2" r="2"/></g>`;
    } else {
      body += `<g transform="translate(${x} ${y})"><rect x="-14" y="-8" width="28" height="18" rx="3" fill="#b8862b"/><rect x="-14" y="-1" width="28" height="3" fill="#7a5418"/></g>`;
    }
  }
  return `<svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice">${body}</svg>`;
}
