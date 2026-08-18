"use client";

/**
 * Reference pattern for anime.js v4 in a React client component, verified
 * against animejs.com's docs (npm path).
 *
 * Covers what frontend-senior needs on every anime.js interaction:
 *  - createScope() scoped to a container ref, so selectors (".card") only
 *    match inside this component and don't leak across the page.
 *  - scope.revert() on unmount for cleanup (equivalent to GSAP's
 *    gsap.context().revert() / useGSAP()'s auto-cleanup).
 *  - self.add(name, fn) to register a reusable, named animation (e.g. a
 *    click-triggered pulse) callable later as scope.methods.<name>().
 *  - A manual prefers-reduced-motion check — anime.js has no matchMedia
 *    helper built in (unlike GSAP's gsap.matchMedia()), so gate manually.
 */

import { useEffect, useRef } from "react";
import { animate, createScope, stagger, utils } from "animejs";
import type { Scope } from "animejs";

export default function AnimatedScope() {
  const root = useRef<HTMLDivElement>(null);
  const scope = useRef<Scope | null>(null);

  useEffect(() => {
    scope.current = createScope({ root }).add((self) => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced) {
        utils.set(".card", { opacity: 1, translateY: 0 });
      } else {
        animate(".card", {
          opacity: [0, 1],
          translateY: [40, 0],
          delay: stagger(120),
          duration: 600,
          ease: "outQuad",
        });
      }

      // scope's constructor callback receives `self: Scope | undefined`
      // (see Gotchas) — guard before registering named methods.
      self?.add("pulse", () => {
        if (reduced) return;
        animate(".pulse-target", {
          scale: [1, 1.15, 1],
          duration: 400,
          ease: "outQuad",
        });
      });
    });

    return () => scope.current?.revert();
  }, []);

  return (
    <div ref={root}>
      <div style={{ display: "flex", gap: "1rem" }}>
        <div className="card" style={{ opacity: 0, width: 150, height: 150, background: "coral" }} />
        <div className="card" style={{ opacity: 0, width: 150, height: 150, background: "teal" }} />
        <div className="card" style={{ opacity: 0, width: 150, height: 150, background: "slateblue" }} />
      </div>
      <button
        className="pulse-target"
        onClick={() => scope.current?.methods.pulse()}
        style={{ marginTop: "2rem", padding: "1rem 2rem" }}
      >
        Pulse
      </button>
    </div>
  );
}
