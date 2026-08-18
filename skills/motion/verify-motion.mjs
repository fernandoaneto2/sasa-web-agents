#!/usr/bin/env node
/**
 * Drives a running client-project page with Playwright/chromium to prove a
 * Motion for React (npm package "motion") scroll-reveal animation actually
 * fires (and that a manually-implemented prefers-reduced-motion check
 * actually holds it static) — see SKILL.md Gotchas for why Motion's own
 * useReducedMotion()/MotionConfig reducedMotion="user" did NOT pass this
 * same check when tested in this container.
 *
 * Verified in this repo against a Next.js app running
 * examples/scroll-reveal.tsx:
 *   node skills/motion/verify-motion.mjs --url=http://localhost:4124/motion --selector='[data-testid="motion-card"]'
 *   node skills/motion/verify-motion.mjs --url=http://localhost:4124/motion --selector='[data-testid="motion-card"]' --reduced-motion
 *
 * Usage:
 *   node verify-motion.mjs --url=<page-url> --selector=<css-selector> [--wait=<ms>] [--reduced-motion] [--out=<dir>]
 */
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(path.join(process.cwd(), "package.json"));
const playwrightEntry = require.resolve("playwright");
const playwrightModule = await import(pathToFileURL(playwrightEntry).href);
const { chromium } = playwrightModule.default ?? playwrightModule;

function parseArgs(argv) {
  const args = { wait: 700, out: ".", reducedMotion: false, url: "http://localhost:3000", selector: "body" };
  for (const raw of argv) {
    if (raw === "--reduced-motion") { args.reducedMotion = true; continue; }
    const stripped = raw.replace(/^--/, "");
    const eq = stripped.indexOf("=");
    const key = eq === -1 ? stripped : stripped.slice(0, eq);
    const value = eq === -1 ? "" : stripped.slice(eq + 1);
    if (key === "url") args.url = value;
    if (key === "selector") args.selector = value;
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
await page.screenshot({ path: path.join(args.out, "motion-verify-before.png") });

await page.locator(args.selector).scrollIntoViewIfNeeded();
await page.waitForTimeout(args.wait);

const after = await styleOf();
await page.screenshot({ path: path.join(args.out, "motion-verify-after.png") });

const changed = before.opacity !== after.opacity || before.transform !== after.transform;

console.log(JSON.stringify({ url: args.url, selector: args.selector, reducedMotion: args.reducedMotion, before, after, changed }, null, 2));

if (args.reducedMotion) {
  console.log(changed ? "FAIL: element still animated with prefers-reduced-motion: reduce" : "PASS: static under reduced motion");
} else {
  console.log(changed ? "PASS: element animated on scroll" : "FAIL: no visible change after scroll");
}

await browser.close();
