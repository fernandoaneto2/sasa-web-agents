#!/usr/bin/env node
/**
 * Drives a running client-project page with Playwright/chromium to prove an
 * anime.js animation actually fires on a triggering interaction (click,
 * hover — anime.js is mostly used for imperative/interaction-driven
 * animation, not scroll reveals), and that prefers-reduced-motion is
 * respected, instead of just eyeballing the code.
 *
 * Verified in this repo against a Next.js app running
 * examples/animated-scope.tsx (click-triggered pulse):
 *   node skills/animejs/verify-animejs.mjs --url=http://localhost:4124/anime --selector='[data-testid="pulse-button"]' --interaction=click
 *   node skills/animejs/verify-animejs.mjs --url=http://localhost:4124/anime --selector='[data-testid="pulse-button"]' --interaction=click --reduced-motion
 *
 * Usage:
 *   node verify-animejs.mjs --url=<page-url> --selector=<css-selector> [--interaction=click|hover] [--wait=<ms>] [--reduced-motion] [--out=<dir>]
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
  const args = { interaction: "click", wait: 300, out: ".", reducedMotion: false, url: "http://localhost:3000", selector: "body" };
  for (const raw of argv) {
    if (raw === "--reduced-motion") { args.reducedMotion = true; continue; }
    const stripped = raw.replace(/^--/, "");
    const eq = stripped.indexOf("=");
    const key = eq === -1 ? stripped : stripped.slice(0, eq);
    const value = eq === -1 ? "" : stripped.slice(eq + 1);
    if (key === "url") args.url = value;
    if (key === "selector") args.selector = value;
    if (key === "interaction") args.interaction = value;
    if (key === "wait") args.wait = Number(value);
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
await page.waitForTimeout(200);

const styleOf = () =>
  page.locator(args.selector).first().evaluate((el) => ({
    opacity: getComputedStyle(el).opacity,
    transform: getComputedStyle(el).transform,
  }));

const before = await styleOf();
await page.screenshot({ path: path.join(args.out, "animejs-verify-before.png") });

if (args.interaction === "hover") {
  await page.locator(args.selector).hover();
} else {
  await page.locator(args.selector).click();
}
await page.waitForTimeout(args.wait);

const after = await styleOf();
await page.screenshot({ path: path.join(args.out, "animejs-verify-after.png") });

const changed = before.opacity !== after.opacity || before.transform !== after.transform;

console.log(JSON.stringify({ url: args.url, selector: args.selector, interaction: args.interaction, reducedMotion: args.reducedMotion, before, after, changed }, null, 2));

if (args.reducedMotion) {
  console.log(changed ? "FAIL: element still animated with prefers-reduced-motion: reduce" : "PASS: static under reduced motion");
} else {
  console.log(changed ? "PASS: element animated on interaction" : "FAIL: no visible change after interaction");
}

await browser.close();
