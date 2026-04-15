#!/usr/bin/env node
/**
 * Headless mobile smoke test for the RAPNO disappeared-lesion (CR) fix.
 *
 * Loads the dev-server rapno page in an iPhone 13 emulated viewport,
 * types baseline 10x10 and current 0x0 into the first target row,
 * waits for the UI to compute, then asserts:
 *   - The "Current product" cell shows "0" (not the "—" placeholder).
 *   - The "Sum of products" footer shows "0" for current.
 *   - The overall response badge shows "CR".
 *   - The percent badge shows "-100%".
 *
 * Run: node scripts/smoke-rapno-mobile.mjs [baseUrl]
 * Default base URL is http://localhost:5173 (Vite dev server).
 *
 * Prereqs:
 *   1. `npm run dev` running in another terminal (or pass a --base URL)
 *   2. A .env.local with dummy VITE_FIREBASE_* values so the module graph
 *      loads (even placeholder strings like "dummy" are enough — rapno.js
 *      doesn't need real Firebase to render its UI).
 *   3. `npm install` has pulled puppeteer (devDep).
 *
 * Notes on the `--no-sandbox` flag: required only when running as root,
 * e.g. inside a container. Safe to drop on normal dev machines.
 *
 * Exit codes:
 *   0 — all assertions passed
 *   1 — at least one assertion failed (diagnostic dumped to stderr)
 *   2 — puppeteer/launch/navigation error
 *
 * This script is a temporary verification harness kept alongside the
 * retroactive test-coverage batches. Remove alongside the puppeteer
 * devDep once all batches ship.
 */
import puppeteer, { KnownDevices } from 'puppeteer';

const BASE = process.argv[2] || 'http://localhost:5173';
const URL  = `${BASE}/src/tools/rapno/rapno.html`;

function fail(msg) {
  console.error(`\u274c ${msg}`);
  process.exitCode = 1;
}
function ok(msg) {
  console.log(`\u2705 ${msg}`);
}

let browser;
try {
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.emulate(KnownDevices['iPhone 13']);

  // Surface page console errors so a silent JS blow-up shows up here.
  const consoleErrors = [];
  page.on('pageerror', (err) => consoleErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  const resp = await page.goto(URL, { waitUntil: 'networkidle0', timeout: 15000 });
  if (!resp || !resp.ok()) {
    console.error(`navigation failed: ${resp ? resp.status() : 'no response'}`);
    process.exit(2);
  }

  // Wait for the first target row to exist. init() builds the UI on
  // DOMContentLoaded, so this should already be there.
  await page.waitForSelector('[data-row="0"]', { timeout: 5000 });

  // Helper: type a value into a row's dimension input by CSS class.
  //
  // The RAPNO target table lives inside `<div style="overflow-x:auto">`.
  // We scrollIntoView then drive the input via focus() + keyboard.type
  // instead of click() — puppeteer's click() has a clickability geometry
  // check that reports false-positives for inputs that overlap partially-
  // transparent ancestors, and we don't need a "real" tap to exercise
  // the calculator update path (which fires on 'input' events). This
  // still goes through the genuine DOM input event listeners wired in
  // wireNumInput, so the calculator is exercised end-to-end.
  async function typeInto(selector, value) {
    const el = await page.$(selector);
    if (!el) throw new Error(`input not found: ${selector}`);
    await el.evaluate((node) => node.scrollIntoView({ block: 'center', inline: 'center' }));
    await el.focus();
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    if (value === '') {
      await page.keyboard.press('Delete');
    } else {
      await page.keyboard.type(String(value), { delay: 5 });
    }
  }

  // --- Enter baseline 10 x 10 ---
  await typeInto('[data-row="0"] .rapno-bld1', '10');
  await typeInto('[data-row="0"] .rapno-bld2', '10');

  // --- Enter current 0 x 0 (the "disappeared lesion" scenario) ---
  await typeInto('[data-row="0"] .rapno-curd1', '0');
  await typeInto('[data-row="0"] .rapno-curd2', '0');

  // Blur to settle any pending input handlers.
  await page.evaluate(() => document.activeElement?.blur());
  await new Promise((r) => setTimeout(r, 100));

  // --- Assertions ---
  const state = await page.evaluate(() => {
    const blProd = document.querySelector('[data-row="0"] .rapno-bl-prod')?.textContent?.trim();
    const curProd = document.querySelector('[data-row="0"] .rapno-cur-prod')?.textContent?.trim();
    const sumBl = document.getElementById('sum-bl')?.textContent?.trim();
    const sumCur = document.getElementById('sum-cur')?.textContent?.trim();
    const badgeResp = document.getElementById('badge-response')?.textContent?.trim();
    const badgePct = document.getElementById('badge-pct')?.textContent?.trim();
    const badgeLevel = document.getElementById('badge-response')?.dataset?.level;
    return { blProd, curProd, sumBl, sumCur, badgeResp, badgePct, badgeLevel };
  });

  console.log('\nCaptured DOM state:');
  console.log(JSON.stringify(state, null, 2));
  console.log();

  if (state.blProd === '100') ok('Baseline product = 100');
  else fail(`Baseline product expected 100, got ${JSON.stringify(state.blProd)}`);

  if (state.curProd === '0') ok('Current product = 0 (not "—")');
  else fail(`Current product expected 0, got ${JSON.stringify(state.curProd)}`);

  if (state.sumBl === '100') ok('Sum baseline = 100');
  else fail(`Sum baseline expected 100, got ${JSON.stringify(state.sumBl)}`);

  if (state.sumCur === '0') ok('Sum current = 0');
  else fail(`Sum current expected 0, got ${JSON.stringify(state.sumCur)}`);

  if (state.badgeResp === 'CR') ok('Response badge = CR');
  else fail(`Response badge expected CR, got ${JSON.stringify(state.badgeResp)}`);

  if (state.badgePct === '-100%') ok('Percent badge = -100%');
  else fail(`Percent badge expected -100%, got ${JSON.stringify(state.badgePct)}`);

  if (state.badgeLevel === '1') ok('Badge level = 1 (CR color)');
  else fail(`Badge level expected 1, got ${JSON.stringify(state.badgeLevel)}`);

  // --- Second scenario: clear current values (null), confirm badge
  // reverts to incomplete "--" ---
  await page.evaluate(() => {
    for (const sel of ['.rapno-curd1', '.rapno-curd2']) {
      const el = document.querySelector(`[data-row="0"] ${sel}`);
      if (el) { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); }
    }
  });
  await new Promise((r) => setTimeout(r, 100));

  const cleared = await page.evaluate(() => ({
    curProd: document.querySelector('[data-row="0"] .rapno-cur-prod')?.textContent?.trim(),
    badgeResp: document.getElementById('badge-response')?.textContent?.trim(),
  }));
  console.log('\nCleared state:', JSON.stringify(cleared));

  if (cleared.curProd === '\u2014') ok('Cleared current → Product column shows em-dash');
  else fail(`Cleared current expected "—", got ${JSON.stringify(cleared.curProd)}`);

  if (cleared.badgeResp === '--') ok('Cleared current → badge reverts to "--"');
  else fail(`Cleared badge expected "--", got ${JSON.stringify(cleared.badgeResp)}`);

  if (consoleErrors.length > 0) {
    // Dummy-Firebase TLS errors are expected in the test sandbox. Only
    // surface them as a warning; they don't affect assertions.
    console.warn('\n\u26a0 Page logged non-fatal errors during smoke test:');
    for (const e of consoleErrors) console.warn('  ', e);
  }
} catch (err) {
  console.error('\u274c smoke test threw:', err.message);
  console.error(err.stack);
  process.exitCode = 2;
} finally {
  if (browser) await browser.close();
}

if (process.exitCode && process.exitCode !== 0) {
  console.log(`\nFAIL — exit ${process.exitCode}`);
} else {
  console.log('\nPASS — rapno mobile CR smoke test green');
}
