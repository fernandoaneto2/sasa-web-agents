"use client";

/**
 * Reference pattern for Motion for React (npm package "motion", import
 * from "motion/react" — the successor to Framer Motion) in a Next.js/React
 * client component, verified against motion.dev/docs/react-animation.
 *
 * Covers a scroll-triggered reveal via whileInView — and, more
 * importantly, a manual, verified-working prefers-reduced-motion pattern.
 * Motion's OWN reduced-motion support (`useReducedMotion()` / `MotionConfig
 * reducedMotion="user"`) did NOT reliably disable this animation when
 * tested end-to-end in this container — see SKILL.md Gotchas before
 * reaching for those APIs.
 */

import { useEffect, useState } from "react";
import { motion } from "motion/react";

// Motion's built-in detection queries matchMedia("(prefers-reduced-motion)")
// with no value (a boolean-context query that doesn't reliably reflect the
// actual reduce/no-preference setting). Query it ourselves with the value
// specified instead of using useReducedMotion()/MotionConfig for this.
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export default function ScrollReveal() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div>
      <motion.div
        // Motion only reads `initial` once, at genuine mount — changing it on
        // a later re-render of the SAME element does nothing (the entrance
        // has already been committed). `key` forces a fresh mount once the
        // real preference is known (tri-state null -> true/false), which
        // happens well before this element — offscreen at first paint —
        // could ever be scrolled into view.
        key={String(reducedMotion)}
        initial={reducedMotion ? false : { opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6 }}
        style={{ width: 200, height: 200, background: "slateblue", borderRadius: 16 }}
      />
    </div>
  );
}
