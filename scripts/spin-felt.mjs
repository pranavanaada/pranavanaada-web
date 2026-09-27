/**
 * Cuts the bell out of each lined-up 360° photo (taken on the bright green cloth)
 * and places it on the same deep-green felt as the edited product photos.
 *
 * All frames get the identical felt (same grain) and the identical outline for
 * the round body, so while the 360° view turns only the figure on top changes.
 *
 * How the cut-out works: the cloth is far greener than it is red, polished
 * Panchaloha is not. Cloth reachable from the photo's edge is background; the
 * bell is the solid shape above the rim. The body and lower stem are round, so
 * their outline is rebuilt as one smooth curve from all frames together (the
 * shiny edges reflect the cloth, which would otherwise leave ragged edges).
 */
import sharp from 'sharp';

const FELT = [1, 67, 47]; // colour of the felt in the edited photos
const CLOTH_MIN_GREEN_OVER_RED = 62;

/** frames: [{ data: Buffer (RGB), width, height }], all the same size. Returns RGB buffers. */
export async function placeOnFelt(frames) {
  const { width: W, height: H } = frames[0];
  const N = W * H;
  const masks = frames.map(({ data }) => bellMask(data, W, H));

  // Shared extent of the bell
  let top = H, bot = 0;
  for (const m of masks) for (let p = 0; p < N; p++) if (m[p]) { const y = (p / W) | 0; if (y < top) top = y; if (y > bot) bot = y; }
  const roundFrom = Math.round(top + 0.5 * (bot - top));

  // Each frame's half-width per row (from its centre); combine frames with a median
  const centreOf = (m) => {
    const c = [];
    for (let y = roundFrom; y <= bot; y++) { const [l, r] = extent(m, y, W); if (l >= 0) c.push((l + r) / 2); }
    c.sort((a, b) => a - b);
    return c[c.length >> 1];
  };
  const centres = masks.map(centreOf);
  const cx = median(centres);
  const rows = [];
  for (let y = 0; y < H; y++) {
    if (y < roundFrom || y > bot) { rows.push(0); continue; }
    rows.push(median(masks.map((m, i) => { const [l, r] = extent(m, y, W); return l < 0 ? 0 : Math.max(centres[i] - l, r - centres[i]); })));
  }
  const med = rows.map((_, y) => median(rows.slice(Math.max(0, y - 5), y + 6)));
  // the shiny sides lose a few rows of edge and then jump back — smooth that into the real curve
  const half = med.map((_, y) => mean(med.slice(Math.max(0, y - 6), y + 7)));

  const felt = await feltBackground(W, H, cx, half[Math.max(0, bot - 4)], bot);

  const out = [];
  for (const [i, frame] of frames.entries()) {
    const m = masks[i];
    // Where this photo's bell sits a few px inside the shared outline, cloth would show
    // through as a pale strip: fill those pixels with the metal colour next to them (same row).
    const data = Buffer.from(frame.data);
    for (let y = roundFrom; y <= Math.min(H - 1, bot); y++) {
      for (let x = 0; x < W; x++) {
        const p = y * W + x;
        if (m[p] || half[y] - Math.abs(x + 0.5 - cx) <= 0) continue;
        const step = x < cx ? 1 : -1;
        let q = x + step;
        while (q >= 0 && q < W && !m[y * W + q] && Math.abs(q - cx) > 1) q += step;
        const src = (y * W + q) * 3;
        data[p * 3] = data[src]; data[p * 3 + 1] = data[src + 1]; data[p * 3 + 2] = data[src + 2];
      }
    }
    // Figure and upper stem: the mask, shrunk 1px (drops the green fringe) and softened
    const e = new Uint8Array(N);
    for (let p = W; p < N - W; p++) e[p] = m[p] && m[p - 1] && m[p + 1] && m[p - W] && m[p + W] ? 255 : 0;
    const alpha = await sharp(Buffer.from(e), { raw: { width: W, height: H, channels: 1 } }).blur(0.9).extractChannel(0).raw().toBuffer();
    const edge = new Uint8Array(N);
    // Round body: the shared smooth outline, blended in over 20 rows so the join doesn't show
    for (let y = roundFrom; y <= Math.min(H - 1, bot + 3); y++) {
      const t = Math.min(1, (y - roundFrom) / 20);
      for (let x = 0; x < W; x++) {
        const inside = half[y] - Math.abs(x + 0.5 - cx);
        const k = Math.min(1, Math.max(0, inside - 0.5));
        const p = y * W + x;
        alpha[p] = Math.round(255 * (k * t + (alpha[p] / 255) * (1 - t)));
        if (inside < 7) edge[p] = 1;
      }
    }
    const o = Buffer.alloc(N * 3);
    for (let p = 0; p < N; p++) {
      const k = alpha[p] / 255;
      const R = data[p * 3], B = data[p * 3 + 2];
      let G = data[p * 3 + 1];
      if (edge[p] || (alpha[p] > 0 && alpha[p] < 250)) G = Math.min(G, Math.max(R, B)); // cloth green on the outline
      o[p * 3] = R * k + felt[p * 3] * (1 - k);
      o[p * 3 + 1] = G * k + felt[p * 3 + 1] * (1 - k);
      o[p * 3 + 2] = B * k + felt[p * 3 + 2] * (1 - k);
    }
    out.push(o);
  }
  return out;
}

function bellMask(data, W, H) {
  const N = W * H;
  const outside = new Uint8Array(N);
  const cloth = (p) => data[p * 3 + 1] - data[p * 3] > CLOTH_MIN_GREEN_OVER_RED;
  const edges = [];
  for (let x = 0; x < W; x++) edges.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) edges.push(y * W, y * W + W - 1);
  flood(outside, cloth, edges, W, N);
  // Walk up from the bottom centre to the rim, then take everything connected to it
  let seed = (H - 1) * W + (W >> 1);
  while (outside[seed] && seed > W) seed -= W;
  const m = new Uint8Array(N);
  flood(m, (p) => !outside[p], [seed], W, N);
  return m;
}

function flood(mask, pass, seeds, W, N) {
  const st = [];
  const push = (p) => { if (!mask[p] && pass(p)) { mask[p] = 1; st.push(p); } };
  seeds.forEach(push);
  while (st.length) {
    const p = st.pop();
    const x = p % W;
    if (x > 0) push(p - 1);
    if (x < W - 1) push(p + 1);
    if (p >= W) push(p - W);
    if (p < N - W) push(p + W);
  }
}

function extent(m, y, W) {
  let l = -1, r = -1;
  for (let x = 0; x < W; x++) if (m[y * W + x]) { if (l < 0) l = x; r = x; }
  return [l, r];
}

const median = (a) => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n % 2 ? s[n >> 1] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;

/** Deep-green felt with fine grain (same seed every time) and a soft shadow under the rim. */
async function feltBackground(W, H, cx, rimHalf, bot) {
  let seed = 12345;
  const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const grain = Buffer.alloc(W * H * 3);
  for (let p = 0; p < W * H; p++) {
    const n = (rand() - 0.5) * 16;
    grain[p * 3] = FELT[0];
    grain[p * 3 + 1] = FELT[1] + n;
    grain[p * 3 + 2] = FELT[2] + n * 0.9;
  }
  const shadow = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><defs><filter id="b"><feGaussianBlur stdDeviation="${rimHalf * 0.12}"/></filter></defs><ellipse cx="${cx}" cy="${bot - 2}" rx="${rimHalf * 1.05}" ry="${rimHalf * 0.14}" fill="black" opacity="0.55" filter="url(#b)"/></svg>`;
  return sharp(grain, { raw: { width: W, height: H, channels: 3 } })
    .blur(0.6)
    .composite([{ input: Buffer.from(shadow) }])
    .removeAlpha()
    .raw()
    .toBuffer();
}
