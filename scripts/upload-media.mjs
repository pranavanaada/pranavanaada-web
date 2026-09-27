#!/usr/bin/env node
/**
 * Upload the edited product photos + videos (Desktop/edited) to Supabase and
 * update the products. Run from the project folder:
 *
 *   node scripts/upload-media.mjs --dry-run     # compress + show the plan, change nothing
 *   node scripts/upload-media.mjs               # log in as admin and upload for real
 *
 * Options:
 *   --source "C:\path\to\edited"   folder with the edited media (default: Desktop\edited)
 *   --email you@example.com         admin email (default: pranavanaadaa@gmail.com)
 *
 * The admin password is asked for when the script runs and is never saved.
 * Photos → WebP (1400px main + 600px card thumbnail). Videos → 720px wide,
 * muted, H.264 with fast start, so they begin playing quickly on phones.
 * Products are matched by name; Shanka and Garuda are created if missing.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import readline from 'node:readline';
import sharp from 'sharp';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { createClient } from '@supabase/supabase-js';

// ---- Options -----------------------------------------------------------------

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const DRY_RUN = args.includes('--dry-run');
const SOURCE = opt('source', path.join(os.homedir(), 'Desktop', 'edited'));
const EMAIL = opt('email', 'pranavanaadaa@gmail.com');
const CACHE = path.resolve('.media-cache'); // compressed output, reused between runs
const BUCKET = 'product-images';

// ---- What goes where -----------------------------------------------------------
// Photos: first = main photo (cards + first in gallery), the rest = gallery.
// All paths are relative to the edited folder (green-cloth "images" set).

const HAND_BELL_VARIANTS = [
  { label: '1 kg', size: '9 in tall · 5 in wide', price: 10000, in_stock: true },
  { label: '1.5 kg', size: '10 in tall · 5.5 in wide', price: 12000, in_stock: true },
  { label: '2 kg', size: '11 in tall · 5.5 in wide', price: 14000, in_stock: true },
];
const INSIDE = (type) => `images/hand-bells/${type}/hang1.png`; // inside-the-bell view
const CLIP = (name) => `videos-green-cloth/product-clips/${name}.mp4`;

const PLAN = [
  {
    match: ['Anjaneya Hand Bell'],
    photos: ['images/Home carousel/Anjaneya.jpg', 'images/hand-bells/type-2/ANJANEYA.jpg', INSIDE('type-2')],
    video: CLIP('home-carousel-anjaneya'),
  },
  {
    // Garuda — new design (same prices as the other hand bells)
    match: ['Garuda Hand Bell'],
    create: {
      name: 'Garuda Hand Bell',
      name_kn: 'ಗರುಡ ಕೈ ಘಂಟೆ',
      description:
        "Panchaloha hand bell crowned with Garuda, Lord Vishnu's divine eagle, in namaskara pose with outstretched wings.",
      description_kn:
        'ನಮಸ್ಕಾರ ಭಂಗಿಯಲ್ಲಿ, ರೆಕ್ಕೆ ಚಾಚಿದ ಶ್ರೀ ವಿಷ್ಣುವಿನ ವಾಹನ ಗರುಡನನ್ನು ಮೇಲ್ಭಾಗದಲ್ಲಿ ಹೊಂದಿರುವ ಪಂಚಲೋಹದ ಕೈ ಘಂಟೆ.',
      category: 'hand-bell',
      variants: HAND_BELL_VARIANTS,
      price: 10000,
      sort_order: 15,
    },
    photos: ['images/hand-bells/type-2/GARUDA 2.jpg', 'images/hand-bells/type-2/GARUDA.jpg', INSIDE('type-2')],
    video: CLIP('hand-bells-type-2-garuda-2'),
  },
  {
    // The old combined "Shanka Chakra" product becomes the Chakra bell (its photo was the Chakra)
    match: ['Chakra Hand Bell', 'Shanka Chakra Hand Bell'],
    update: {
      name: 'Chakra Hand Bell',
      name_kn: 'ಚಕ್ರ ಕೈ ಘಂಟೆ',
      description: "Panchaloha hand bell topped with the Chakra (discus) emblem of Lord Vishnu, on a slender handle.",
      description_kn: 'ತೆಳುವಾದ ಹಿಡಿಕೆಯ ಮೇಲೆ ಶ್ರೀ ವಿಷ್ಣುವಿನ ಚಕ್ರ ಲಾಂಛನವನ್ನು ಹೊಂದಿರುವ ಪಂಚಲೋಹದ ಕೈ ಘಂಟೆ.',
    },
    photos: ['images/hand-bells/type-1/CHAKRA 1.jpg', 'images/hand-bells/type-1/CHAKRA.jpg', INSIDE('type-1')],
    video: CLIP('hand-bells-type-1-chakra-1'),
  },
  {
    match: ['Shanka Hand Bell'],
    create: {
      name: 'Shanka Hand Bell',
      name_kn: 'ಶಂಖ ಕೈ ಘಂಟೆ',
      description: 'Panchaloha hand bell topped with the Shankha (conch) emblem of Lord Vishnu, on a slender handle.',
      description_kn: 'ತೆಳುವಾದ ಹಿಡಿಕೆಯ ಮೇಲೆ ಶ್ರೀ ವಿಷ್ಣುವಿನ ಶಂಖ ಲಾಂಛನವನ್ನು ಹೊಂದಿರುವ ಪಂಚಲೋಹದ ಕೈ ಘಂಟೆ.',
      category: 'hand-bell',
      variants: HAND_BELL_VARIANTS,
      price: 10000,
      sort_order: 25,
    },
    photos: ['images/hand-bells/type-1/SHANKA 1.jpg', 'images/hand-bells/type-1/SHANKA.jpg', INSIDE('type-1')],
    video: CLIP('hand-bells-type-1-shanka-1'),
  },
  {
    match: ['Nandi Hand Bell'],
    photos: ['images/hand-bells/type-4/NANDI 1.jpg', 'images/hand-bells/type-4/NANDI 2.jpg', 'images/hand-bells/type-4/NANDI.jpg'],
    video: CLIP('hand-bells-type-4-nandi-1'),
  },
  {
    match: ['Pranava Hand Bell'],
    photos: ['images/hand-bells/type-5/PRANAVA.jpg', INSIDE('type-5')],
    video: CLIP('home-carousel-pranava'),
  },
  {
    match: ['Brahmanda Gola Hand Bell'],
    photos: ['images/hand-bells/type-3/gola.jpg', INSIDE('type-3')],
    video: CLIP('home-carousel-gola'),
  },
  {
    match: ['Panchaloha Hanging Bell'],
    photos: ['images/hanging-bells/hang.jpg', 'images/hanging-bells/hang_5.jpg', 'images/hanging-bells/hang1.png'],
    video: CLIP('hanging-bells-hang'),
  },
  {
    match: ['Panchaloha Jayagante'],
    photos: ['images/jayagante/jaya.jpg', 'images/jayagante/jaya1.jpg', 'images/jayagante/jaya3.jpg'],
    video: CLIP('home-carousel-jayagante'),
  },
];

// ---- Helpers --------------------------------------------------------------------

const log = (...m) => console.log(...m);
const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function readEnv() {
  const out = {};
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => {
      if (s.includes(question)) rl.output.write(s);
      else if (!/[\r\n]/.test(s)) rl.output.write('*');
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

/** Photo → { full, thumb } WebP files in the cache folder. Transparent PNGs keep transparency. */
async function processPhoto(rel) {
  const src = path.join(SOURCE, rel);
  if (!fs.existsSync(src)) throw new Error(`Missing photo: ${src}`);
  const base = slug(rel.replace(/\.[^.]+$/, ''));
  const full = path.join(CACHE, `${base}.webp`);
  const thumb = path.join(CACHE, `${base}-thumb.webp`);
  if (!fs.existsSync(full)) await sharp(src).rotate().resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 82 }).toFile(full);
  if (!fs.existsSync(thumb)) await sharp(src).rotate().resize({ width: 600, withoutEnlargement: true }).webp({ quality: 78 }).toFile(thumb);
  return { full, thumb };
}

/** Video → 720px wide, no sound, H.264 + faststart. */
function processVideo(rel) {
  const src = path.join(SOURCE, rel);
  if (!fs.existsSync(src)) throw new Error(`Missing video: ${src}`);
  const out = path.join(CACHE, `${slug(path.basename(rel, '.mp4'))}.mp4`);
  if (!fs.existsSync(out)) {
    execFileSync(
      ffmpegInstaller.path,
      ['-y', '-loglevel', 'error', '-i', src, '-an', '-vf', 'scale=720:-2', '-c:v', 'libx264', '-preset', 'slow',
       '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
      { stdio: 'inherit' }
    );
  }
  return out;
}

// ---- Main ---------------------------------------------------------------------------

async function main() {
  if (!fs.existsSync(SOURCE)) throw new Error(`Edited folder not found: ${SOURCE}  (use --source "path")`);
  fs.mkdirSync(CACHE, { recursive: true });

  log(`\nSource: ${SOURCE}`);
  log(DRY_RUN ? 'Mode: DRY RUN — compressing only, nothing is uploaded or changed.\n' : 'Mode: UPLOAD\n');

  // 1. Compress everything first (fails early if a file is missing)
  const prepared = [];
  for (const item of PLAN) {
    const name = item.create?.name ?? item.update?.name ?? item.match[0];
    const photos = [];
    for (const rel of item.photos) photos.push({ rel, ...(await processPhoto(rel)) });
    const video = item.video ? processVideo(item.video) : null;
    prepared.push({ item, name, photos, video });
    log(`✓ ${name}`);
    for (const p of photos) log(`    photo  ${path.basename(p.rel).padEnd(16)} → ${kb(fs.statSync(p.full).size)} (card ${kb(fs.statSync(p.thumb).size)})`);
    if (video) log(`    video  ${path.basename(item.video).padEnd(34)} → ${kb(fs.statSync(video).size)}`);
  }

  if (DRY_RUN) {
    log(`\nCompressed files are in ${CACHE}. Run without --dry-run to upload.`);
    return;
  }

  // 2. Log in as admin
  const env = readEnv();
  const db = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const password = await askHidden(`Admin password for ${EMAIL}: `);
  const { error: loginError } = await db.auth.signInWithPassword({ email: EMAIL, password });
  if (loginError) throw new Error(`Login failed: ${loginError.message}`);
  const { data: isAdmin } = await db.rpc('is_admin');
  if (!isAdmin) throw new Error(`${EMAIL} is not on the admin list.`);
  log('Logged in.\n');

  const { error: columnError } = await db.from('products').select('video').limit(1);
  if (columnError) {
    throw new Error('The products table has no "video" column yet — re-run supabase/schema.sql in the Supabase SQL editor, then run this again.');
  }

  const { data: existing, error: listError } = await db.from('products').select('*');
  if (listError) throw listError;

  const upload = async (file, folder) => {
    const ext = path.extname(file).slice(1);
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${path.basename(file)}`;
    const { error } = await db.storage.from(BUCKET).upload(key, fs.readFileSync(file), {
      contentType: ext === 'mp4' ? 'video/mp4' : 'image/webp',
      cacheControl: '31536000',
    });
    if (error) throw new Error(`Upload failed for ${path.basename(file)}: ${error.message}`);
    return db.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
  };

  // 3. Upload and update each product
  for (const { item, name, photos, video } of prepared) {
    const row = existing.find((p) => item.match.some((m) => m.toLowerCase() === p.name.toLowerCase()));
    if (!row && !item.create) {
      log(`! ${name}: not found in the database — skipped (import the starter catalogue first).`);
      continue;
    }
    process.stdout.write(`Uploading ${name}… `);
    const [main, ...extras] = photos;
    const image = await upload(main.full, 'products');
    const thumb = await upload(main.thumb, 'products/thumbs');
    const images = [];
    for (const p of extras) images.push(await upload(p.full, 'products'));
    const videoUrl = video ? await upload(video, 'videos') : null;

    const media = { image, thumb, images, ...(videoUrl ? { video: videoUrl } : {}) };
    const { error } = row
      ? await db.from('products').update({ ...(item.update ?? {}), ...media }).eq('id', row.id)
      : await db.from('products').insert({ ...item.create, ...media, in_stock: true, is_visible: true });
    if (error) throw new Error(`${name}: ${error.message}`);
    log(row ? 'updated ✓' : 'created ✓');
  }

  await db.auth.signOut();
  log('\nAll done. Refresh the website to see the new photos and videos.');
}

main().catch((e) => {
  console.error(`\n✗ ${e.message}`);
  process.exit(1);
});
