"use client";

/**
 * Reference pattern for @react-spring/web in a React client component,
 * verified against react-spring.dev's Getting Started docs.
 *
 * Covers what frontend-senior needs for a physics-based hover/press
 * micro-interaction:
 *  - useSpring() + animated.<tag> for a value that eases toward a target
 *    with real spring physics (tension/friction), not a fixed-duration
 *    tween — the right tool for hover/press feedback, as opposed to
 *    GSAP/anime.js's duration-based tweens.
 *  - useReducedMotion() — react-spring's built-in prefers-reduced-motion
 *    hook (no manual matchMedia needed, unlike anime.js).
 *  - className for static styles, `style={style}` for ONLY the animated
 *    properties — see Gotchas for why merging them breaks TypeScript.
 */

import { animated, useSpring, useReducedMotion } from "@react-spring/web";
import { useState } from "react";

export default function SpringCard() {
  const prefersReducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  const style = useSpring({
    transform: hovered ? "scale(1.15) rotate(3deg)" : "scale(1) rotate(0deg)",
    // useReducedMotion() can return null before it resolves client-side;
    // `immediate` only accepts boolean | undefined, so coerce it.
    immediate: prefersReducedMotion ?? false,
    config: { tension: 300, friction: 20 },
  });

  return (
    <>
      <style>{`.spring-card { width: 200px; height: 200px; background: coral; border-radius: 16px; }`}</style>
      <animated.div
        className="spring-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={style}
      />
    </>
  );
}
