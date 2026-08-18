#!/usr/bin/env node
/**
 * Drives a running client-project page with Playwright/chromium to prove a
 * GSAP animation actually fires (and that prefers-reduced-motion is
 * respected), instead of just eyeballing the code.
 *
 * Verified in this repo against a Next.js app running examples/scroll-section.tsx:
 *   node skills/gsap/verify-gsap.mjs --url=http://localhost:4123 --selector=".panel" --scroll=900
 *   node skills/gsap/verify-gsap.mjs --url=http://localhost:4123 --selector=".panel" --scroll=900 --reduced-motion
 *
 * Usage:
 *   node verify-gsap.mjs --url=<page-url> --selector=<css-selector> [--scroll=<px>] [--reduced-motion] [--out=<dir>]
 *
 * Prints a PASS/FAIL line based on whether the selector's computed
 * opacity/transform changed after scrolling, and writes before/after
 * screenshots to --out (default: cwd).
 */
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

// Resolve "playwright" against the CALLER's cwd (the client project),
// not this script's own location — the driver lives in the skill dir,
// but playwright is a devDependency of the project being tested.
const require = createRequire(path.join(process.cwd(), "package.json"));
const playwrightEntry = require.resolve("playwright");
const playwrightModule = await import(pathToFileURL(playwrightEntry).href);
const { chromium } = playwrightModule.default ?? playwrightModule;

function parseArgs(argv) {
  const args = { scroll: 900, out: ".", reducedMotion: false, url: "http://localhost:3000", selector: "body" };
  for (const raw of argv) {
    if (raw === "--reduced-motion") { args.reducedMotion = true; continue; }
    const [key, value] = raw.replace(/^--/, "").split("=");
    if (key === "url") args.url = value;
    if (key === "selector") args.selector = value;
    if (key === "scroll") args.scroll = Number(value);
    if (key === "out") args.out = value;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || chromium.executablePath();

const browser = await chromium.launch({ executablePath });
const context = await browser.newContext({
  reducedMotion: args.reducedMotion ? "reduce" : "no-preference",
});
const page = await context.newPage();

await page.goto(args.url, { waitUntil: "networkidle" });

const before = await page.locator(args.selector).first().evaluate((el) => ({
  opacity: getComputedStyle(el).opacity,
  transform: getComputedStyle(el).transform,
}));
await page.screenshot({ path: path.join(args.out, "gsap-verify-before.png") });

await page.locator(args.selector).first().scrollIntoViewIfNeeded();
await page.mouse.wheel(0, args.scroll);
await page.waitForTimeout(600);

const after = await page.locator(args.selector).first().evaluate((el) => ({
  opacity: getComputedStyle(el).opacity,
  transform: getComputedStyle(el).transform,
}));
await page.screenshot({ path: path.join(args.out, "gsap-verify-after.png") });

const changed = before.opacity !== after.opacity || before.transform !== after.transform;

console.log(JSON.stringify({ url: args.url, selector: args.selector, reducedMotion: args.reducedMotion, before, after, changed }, null, 2));

if (args.reducedMotion) {
  console.log(changed ? "FAIL: element still animated with prefers-reduced-motion: reduce" : "PASS: static under reduced motion");
} else {
  console.log(changed ? "PASS: element animated on scroll" : "FAIL: no visible change after scroll");
}

await browser.close();
