/**
 * Generic side-view silhouette of an airliner (Hangar). It is an original, schematic drawing
 * built only from the family's configuration (body width, number of engines, number of decks),
 * so it never pretends to be a photo of a real aircraft or airline and carries no livery.
 * Not to scale. Colours come from CSS (currentColor and custom properties).
 */
export const BODIES = ['narrow', 'wide'];
export const ENGINE_COUNTS = [2, 4];
export const DECKS = [1, 2];

const r = (n) => Math.round(n * 10) / 10;

/**
 * @param {{ body: 'narrow'|'wide', engines: 2|4, decks: 1|2 }} config
 * @returns {{ width: number, height: number, body: string }} geometry used by the SVG and the tests
 */
export function silhouetteGeometry({ body, engines, decks }) {
  if (!BODIES.includes(body) || !ENGINE_COUNTS.includes(engines) || !DECKS.includes(decks)) {
    throw new Error(`Invalid silhouette config: ${JSON.stringify({ body, engines, decks })}`);
  }
  const W = 320;
  const H = 112;
  const fh = decks === 2 ? 34 : body === 'wide' ? 24 : 18; // fuselage height
  const len = body === 'narrow' ? 250 : 270;
  const x0 = (W - len) / 2 - 6;
  const yTop = 64 - fh / 2;
  const yBot = yTop + fh;
  const nacelleH = body === 'narrow' ? 9 : 12;
  const nacelleW = body === 'narrow' ? 26 : 34;
  const windowRows = decks === 2 ? [yTop + fh * 0.3, yTop + fh * 0.68] : [yTop + fh * 0.42];
  return { W, H, fh, len, x0, yTop, yBot, nacelleH, nacelleW, windowRows, engines, body, decks };
}

/** @param {{ body: 'narrow'|'wide', engines: 2|4, decks: 1|2 }} config @param {string} label accessible name */
export function silhouetteSvg(config, label) {
  const g = silhouetteGeometry(config);
  const { W, H, fh, len, x0, yTop, yBot, nacelleH, nacelleW, windowRows } = g;
  const xEnd = x0 + len;
  const noseR = fh * 0.9;
  // Fuselage: rounded nose, straight barrel, tail cone rising to the top line.
  const fuselage = [
    `M ${r(x0 + noseR)} ${r(yTop)}`,
    `L ${r(xEnd - 46)} ${r(yTop)}`,
    `L ${r(xEnd)} ${r(yTop - 2)}`,
    `L ${r(xEnd)} ${r(yTop + fh * 0.35)}`,
    `L ${r(xEnd - 52)} ${r(yBot)}`,
    `L ${r(x0 + noseR)} ${r(yBot)}`,
    `Q ${r(x0 - 2)} ${r(yBot)} ${r(x0)} ${r(yTop + fh * 0.62)}`,
    `Q ${r(x0 + 4)} ${r(yTop)} ${r(x0 + noseR)} ${r(yTop)} Z`,
  ].join(' ');
  const finH = Math.min(fh * 0.9 + 28, yTop - 6);
  const fin = `M ${r(xEnd - 40)} ${r(yTop)} L ${r(xEnd - 10)} ${r(yTop - finH)} L ${r(xEnd + 2)} ${r(yTop - finH)} L ${r(xEnd)} ${r(yTop)} Z`;
  const stab = `M ${r(xEnd - 30)} ${r(yTop + fh * 0.32)} L ${r(xEnd + 8)} ${r(yTop + fh * 0.12)} L ${r(xEnd + 10)} ${r(yTop + fh * 0.24)} L ${r(xEnd - 22)} ${r(yTop + fh * 0.46)} Z`;
  const wingRoot = x0 + len * 0.4;
  const wing = `M ${r(wingRoot - 4)} ${r(yBot - 4)} L ${r(wingRoot + 74)} ${r(yBot + 12)} L ${r(wingRoot + 88)} ${r(yBot + 12)} L ${r(wingRoot + 46)} ${r(yBot - 4)} Z`;
  const nacelles = [];
  const inboard = wingRoot + 6;
  const positions = g.engines === 4 ? [inboard - 6, inboard + 36] : [inboard];
  for (const [i, nx] of positions.entries()) {
    const ny = yBot + 4 + i * 3;
    nacelles.push(`<rect class="sil-engine" x="${r(nx)}" y="${r(ny)}" width="${nacelleW}" height="${nacelleH}" rx="${r(nacelleH / 2)}" />`);
  }
  const windows = [];
  for (const wy of windowRows) {
    for (let wx = x0 + noseR + 18; wx < xEnd - 58; wx += 9) windows.push(`<circle cx="${r(wx)}" cy="${r(wy)}" r="1.6" />`);
  }
  const cockpit = `M ${r(x0 + noseR * 0.35)} ${r(yTop + fh * 0.32)} L ${r(x0 + noseR + 6)} ${r(yTop + fh * 0.22)} L ${r(x0 + noseR + 6)} ${r(yTop + fh * 0.42)} L ${r(x0 + noseR * 0.25)} ${r(yTop + fh * 0.46)} Z`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  return `<svg class="silhouette" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg">`
    + `<title>${esc(label)}</title>`
    + `<line class="sil-ground" x1="8" y1="${H - 6}" x2="${W - 8}" y2="${H - 6}" />`
    + `<path class="sil-tail" d="${fin}" /><path class="sil-tail" d="${stab}" />`
    + `<path class="sil-wing" d="${wing}" />`
    + `<path class="sil-body" d="${fuselage}" />`
    + `<path class="sil-cockpit" d="${cockpit}" />`
    + `<g class="sil-windows">${windows.join('')}</g>`
    + nacelles.join('')
    + `</svg>`;
}

/** Accessible description from i18n: hangar.silhouette.{template, templateTwoDecks, engines.N, body.X}. */
export function silhouetteLabel(config, S) {
  return String(config.decks === 2 ? S.templateTwoDecks : S.template)
    .replace('{engines}', S.engines[config.engines])
    .replace('{body}', S.body[config.body]);
}
