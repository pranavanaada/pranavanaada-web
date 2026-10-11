#!/usr/bin/env node
/**
 * Save your Razorpay API keys on the website's server.
 *
 *   npm run set-razorpay-keys
 *
 * Run this whenever you generate new keys in the Razorpay dashboard
 * (Account & Settings → API Keys): the old keys stop working the moment new
 * ones are created, and online payments fail until the new ones are saved here.
 *
 * It asks for the Key ID and Key Secret (the secret is hidden while you type or
 * paste), checks them with Razorpay, and only then saves them as Supabase secrets.
 * Nothing is written to any project file. Needs the Supabase CLI login on this
 * computer (npx supabase login).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { spawnSync } from 'node:child_process';

const PROJECT_REF = 'qgmjfcioczdxglhwxwoi';

// In a terminal: one reader for both questions; while "muted", what is typed or pasted is not shown.
// When the answers are piped in (testing), they are simply read line by line.
const interactive = process.stdin.isTTY;
const pipedLines = interactive ? [] : fs.readFileSync(0, 'utf8').split(String.fromCharCode(10));
const rl = interactive ? readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true }) : null;
let muted = false;
if (rl) {
  const write = rl._writeToOutput.bind(rl);
  rl._writeToOutput = (text) => {
    if (!muted) write(text);
  };
}
function ask(question, { hidden = false } = {}) {
  if (!rl) {
    console.log(question);
    return Promise.resolve((pipedLines.shift() ?? '').trim());
  }
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      if (hidden) console.log();
      muted = false;
      resolve(answer.trim());
    });
    muted = hidden; // set after the question itself has been printed
  });
}

console.log('\nSave Razorpay API keys for pranavanaada.com\n');
console.log('Find them in the Razorpay dashboard → Account & Settings → API Keys.');
console.log('(Use LIVE keys for real payments — the Key ID starts with rzp_live_.)\n');

const keyId = await ask('Key ID: ');
const keySecret = await ask('Key Secret (hidden): ', { hidden: true });
rl?.close();

if (!/^rzp_(live|test)_[A-Za-z0-9]+$/.test(keyId)) {
  console.error('\n✗ That does not look like a Razorpay Key ID (it should start with rzp_live_ or rzp_test_). Nothing was changed.');
  process.exit(1);
}
if (!/^[A-Za-z0-9]{10,}$/.test(keySecret)) {
  console.error('\n✗ That does not look like a Razorpay Key Secret. Nothing was changed.');
  process.exit(1);
}

process.stdout.write('\nChecking the keys with Razorpay… ');
const check = await fetch('https://api.razorpay.com/v1/orders?count=1', {
  headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}` },
}).catch(() => null);
if (!check) {
  console.error('\n✗ Could not reach Razorpay — check your internet connection. Nothing was changed.');
  process.exit(1);
}
if (!check.ok) {
  const body = await check.json().catch(() => ({}));
  console.error(`\n✗ Razorpay did not accept these keys (${body?.error?.description ?? `HTTP ${check.status}`}).`);
  console.error('  Check that the Key ID and Key Secret belong together and were copied completely. Nothing was changed.');
  process.exit(1);
}
console.log('accepted ✓');

// Pass the values through a temporary file rather than the command line
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rzp-'));
const envFile = path.join(dir, 'keys.env');
fs.writeFileSync(envFile, `RAZORPAY_KEY_ID=${keyId}\nRAZORPAY_KEY_SECRET=${keySecret}\n`);
const res = spawnSync('npx', ['supabase', 'secrets', 'set', '--env-file', `"${envFile}"`, '--project-ref', PROJECT_REF], {
  encoding: 'utf8',
  shell: true,
});
fs.rmSync(dir, { recursive: true, force: true });

if (res.status !== 0) {
  console.error('\n✗ The keys are valid, but saving them on the server failed:\n');
  console.error((res.stderr || res.stdout || '').trim());
  console.error('\nIf it says you are not logged in, run:  npx supabase login   and then run this again.');
  process.exit(1);
}

console.log(`\n✓ Saved. The website now uses ${keyId.startsWith('rzp_live_') ? 'your LIVE' : 'TEST'} Razorpay keys (${keyId.slice(0, 12)}…).`);
if (keyId.startsWith('rzp_test_')) console.log('  Note: these are TEST keys — no real money moves. Use live keys before taking real orders.');
console.log('\nLast step: open Admin → Settings on the website and switch "Online payment" ON.\n');
