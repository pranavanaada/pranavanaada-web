#!/usr/bin/env node
/**
 * Build the 360° view for one product from photos of it taken from each side,
 * then upload the photos and attach them to the product.
 *
 *   npm run make-spin -- --product "Anjaneya Hand Bell" front.jpg left.jpg back.jpg right.jpg
 *   (add --dry-run to only make the lined-up photos in .media-cache/spin/<product>/,
 *    --keep-background to keep the original cloth instead of the felt)
 *
 * Photos: same green cloth, bell standing upright, in turning order
 * (front → one side → back → other side; more angles in between make it smoother).
 * The photos don't need to match in distance or position — each one is
 * measured (rim width and position against the green cloth) and scaled/cropped
 * so the bell sits in exactly the same place in every frame.
 *
 * Uses the Supabase CLI login on this computer (npx supabase login) to upload
 * and to update the product; no passwords are needed or stored.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { placeOnFelt } from './spin-felt.mjs';

sharp.cache(false);
const PROJECT_REF = 'qgmjfcioczdxglhwxwoi';
const BUCKET = 'product-images';
const PUBLIC_BASE = `https://${PROJECT_REF}.supabase.co/storage/v1/object/public/${BUCKET}`;
const OUT_WIDTH = 900; // final frame width (px)

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const dryRun = args.includes('--dry-run') && args.splice(args.indexOf('--dry-run'), 1);
// By default the bell is moved onto the same deep-green felt as the edited photos
const keepBackground = args.includes('--keep-background') && args.splice(args.indexOf('--keep-background'), 1);
const productName = flag('product');
const photos = args;
if (!productName || photos.length < 2) {
  console.error('Usage: npm run make-spin -- --product "Product name" front.jpg side.jpg back.jpg side2.jpg [--dry-run]');
  process.exit(1);
}
for (const p of photos) if (!fs.existsSync(p)) throw new Error(`Photo not found: ${p}`);

const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const outDir = path.join('.media-cache', 'spin', slug);
fs.mkdirSync(outDir, { recursive: true });

/** Find the bell against the green cloth: metal has a strong red channel, the cloth almost none. */
async function measure(file) {
  const { data, info } = await sharp(file).rotate().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const margin = Math.round(W * 0.15); // ignore the photo edges (cloth folds, shadows)
  const metal = (x, y) => data[(y * W + x) * C] > 95;
  const rowWidth = (y) => {
    let l = -1, r = -1;
    for (let x = margin; x < W - margin; x++) if (metal(x, y)) { if (l < 0) l = x; r = x; }
    return l < 0 ? [0, 0, 0] : [r - l, l, r];
  };
  const minRim = W * 0.12;
  let bottom = H - 1;
  while (bottom > 0 && rowWidth(bottom)[0] < minRim) bottom--;
  let l = W, r = 0;
  for (let y = Math.max(0, bottom - Math.round(H * 0.05)); y <= bottom; y++) {
    const [, rl, rr] = rowWidth(y);
    if (rr) { l = Math.min(l, rl); r = Math.max(r, rr); }
  }
  let top = 0;
  const count = (y) => { let c = 0; for (let x = margin; x < W - margin; x++) if (metal(x, y)) c++; return c; };
  while (top < bottom && count(top) < 4) top++;
  if (r - l < minRim) throw new Error(`Couldn't find the bell in ${path.basename(file)} — is it on the green cloth?`);
  return { file, W, H, bottom, rim: r - l, cx: (l + r) / 2, top };
}

function run(cmdArgs) {
  const res = spawnSync('npx', ['supabase', ...cmdArgs], { encoding: 'utf8', shell: process.platform === 'win32' });
  if (res.status !== 0) throw new Error(`supabase ${cmdArgs[0]} ${cmdArgs[1]} failed:\n${res.stderr || res.stdout}`);
  return res.stdout;
}

const shells = await Promise.all(photos.map(measure));
// Scale every photo up to the largest rim, so nothing is enlarged less than 1× … and crop to the
// largest window (anchored on the rim's centre-bottom) that fits inside every scaled photo.
const RIM = Math.max(...shells.map((m) => m.rim));
const scaled = shells.map((m) => {
  const s = RIM / m.rim;
  return { ...m, s, cx: m.cx * s, bottom: m.bottom * s, top: m.top * s, W: m.W * s, H: m.H * s };
});
const halfW = Math.min(...scaled.map((m) => Math.min(m.cx, m.W - m.cx)));
const above = Math.min(...scaled.map((m) => m.bottom));
const below = Math.min(60, ...scaled.map((m) => m.H - m.bottom));
const bellH = Math.max(...scaled.map((m) => m.bottom - m.top));
let OH = Math.min(above + below, bellH / 0.78);
let OW = Math.min(2 * halfW, OH * 0.75);
OH = Math.max(Math.min(OH, OW / 0.75), Math.min(above + below, bellH + below + 20));
OW = Math.floor(OW);
OH = Math.floor(OH);
const BOT = OH - below;

const lined = [];
for (const m of scaled) {
  const rw = Math.round(m.W), rh = Math.round((m.H / m.W) * rw); // size after resize (sharp keeps the aspect ratio)
  const clamp = (v, max) => Math.min(Math.max(0, v), max);
  const left = clamp(Math.round(m.cx - OW / 2), rw - OW);
  const top = clamp(Math.round(m.bottom - BOT), rh - OH);
  // Two passes: sharp allows only one resize per pipeline
  const img = await sharp(m.file).rotate().resize(rw).extract({ left, top, width: OW, height: OH }).removeAlpha().raw().toBuffer();
  lined.push({ data: img, width: OW, height: OH });
  console.log(`${path.basename(m.file)}: lined up (×${m.s.toFixed(2)})`);
}

const finished = keepBackground ? lined.map((f) => f.data) : await placeOnFelt(lined);
const files = [];
for (const [i, data] of finished.entries()) {
  const out = path.join(outDir, `${slug}-${i + 1}.webp`);
  await sharp(data, { raw: { width: OW, height: OH, channels: 3 } }).resize({ width: Math.min(OUT_WIDTH, OW) }).webp({ quality: 82 }).toFile(out);
  files.push(out);
  console.log(`→ ${out}`);
}

if (dryRun) {
  console.log('\nDry run: photos lined up but not uploaded.');
  process.exit(0);
}

const stamp = Date.now();
const urls = [];
for (const [i, file] of files.entries()) {
  const key = `products/spin/${stamp}-${slug}-${i + 1}.webp`;
  run(['storage', 'cp', file, `ss:///${BUCKET}/${key}`, '--content-type', 'image/webp', '--cache-control', 'max-age=31536000', '--project-ref', PROJECT_REF, '--experimental']);
  urls.push(`${PUBLIC_BASE}/${key}`);
  console.log(`uploaded ${i + 1}/${files.length}`);
}

const sqlText = (s) => `'${s.replace(/'/g, "''")}'`;
// SQL goes in a file: passing it as an argument gets split up by the Windows shell
const sqlFile = path.join(outDir, 'attach.sql');
fs.writeFileSync(sqlFile, `update public.products set spin = ${sqlText(JSON.stringify(urls))}::jsonb where name = ${sqlText(productName)} returning id`);
const out = run(['db', 'query', '--linked', '--project-ref', PROJECT_REF, '--file', sqlFile]);
if (!/"id"/.test(out)) throw new Error(`No product named "${productName}" — photos were uploaded but not attached.`);
console.log(`\n✓ 360° view added to "${productName}" (${urls.length} views).`);
