#!/usr/bin/env node
/**
 * Drives a running client-project page with Playwright/chromium to prove a
 * react-spring animation actually fires on hover (its most common use:
 * physics-based UI feedback), and to show what prefers-reduced-motion
 * actually does for it — see the SKILL.md note: `immediate` removes the
 * eased transition, it does NOT remove the interaction/state change, so
 * don't expect a GSAP-style "nothing moves" result here.
 *
 * Verified in this repo against a Next.js app running
 * examples/spring-card.tsx:
 *   node skills/react-spring/verify-react-spring.mjs --url=http://localhost:4124/spring --selector='[data-testid="spring-card"]'
 *   node skills/react-spring/verify-react-spring.mjs --url=http://localhost:4124/spring --selector='[data-testid="spring-card"]' --reduced-motion
 *
 * Usage:
 *   node verify-react-spring.mjs --url=<page-url> --selector=<css-selector> [--wait=<ms>] [--reduced-motion] [--out=<dir>]
 */
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(path.join(process.cwd(), "package.json"));
const playwrightEntry = require.resolve("playwright");
const playwrightModule = await import(pathToFileURL(playwrightEntry).href);
const { chromium } = playwrightModule.default ?? playwrightModule;

function parseArgs(argv) {
  const args = { wait: 300, out: ".", reducedMotion: false, url: "http://localhost:3000", selector: "body" };
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
await page.screenshot({ path: path.join(args.out, "react-spring-verify-before.png") });

await page.locator(args.selector).hover();
await page.waitForTimeout(args.wait);

const after = await styleOf();
await page.screenshot({ path: path.join(args.out, "react-spring-verify-after.png") });

const changed = before.opacity !== after.opacity || before.transform !== after.transform;

console.log(JSON.stringify({ url: args.url, selector: args.selector, reducedMotion: args.reducedMotion, before, after, changed }, null, 2));
console.log(
  changed
    ? `${args.reducedMotion ? "INFO (expected)" : "PASS"}: hover state changed — react-spring's \`immediate\` skips the eased transition, not the state change itself`
    : "FAIL: no visible change on hover"
);

await browser.close();
