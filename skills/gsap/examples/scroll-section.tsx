"use client";

/**
 * Reference pattern for GSAP + ScrollTrigger in a Next.js/React client
 * component, verified against gsap.com/docs/v3/Installation (npm path).
 *
 * Covers the three things frontend-senior needs on every animated section:
 *  - useGSAP() for correct mount/cleanup in React (no leaked ScrollTriggers
 *    on unmount / fast refresh).
 *  - gsap.matchMedia() to give prefers-reduced-motion users the static
 *    end-state instead of the animation, with no separate code path.
 *  - A pinned horizontal-scroll section driven by vertical scroll
 *    (scrub, no manual wheel/touch handling).
 */

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollSection() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          isReduced: "(prefers-reduced-motion: reduce)",
          isNotReduced: "(prefers-reduced-motion: no-preference)",
        },
        (context) => {
          const { isReduced } = context.conditions as { isReduced: boolean };

          if (isReduced) {
            gsap.set(".panel", { opacity: 1 });
            return () => {};
          }

          gsap.to(".panel", {
            opacity: 1,
            stagger: 0.15,
            scrollTrigger: { trigger: ".panels", start: "top 80%" },
          });

          if (track.current) {
            const el = track.current;
            const scrollLength = el.scrollWidth - window.innerWidth;

            gsap.to(el, {
              x: -scrollLength,
              ease: "none",
              scrollTrigger: {
                trigger: el.parentElement,
                start: "top top",
                end: () => `+=${scrollLength}`,
                scrub: 1,
                pin: true,
              },
            });
          }

          return () => {};
        }
      );

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <div ref={root}>
      <section className="panels" style={{ display: "flex", gap: "2rem", padding: "4rem 2rem" }}>
        <div className="panel" style={{ opacity: 0, width: 200, height: 200, background: "coral" }} />
        <div className="panel" style={{ opacity: 0, width: 200, height: 200, background: "teal" }} />
        <div className="panel" style={{ opacity: 0, width: 200, height: 200, background: "slateblue" }} />
      </section>

      <section style={{ height: "100vh", overflow: "hidden" }}>
        <div ref={track} style={{ display: "flex", height: "100%", width: "max-content" }}>
          {["one", "two", "three", "four"].map((label) => (
            <div
              key={label}
              style={{
                width: "100vw",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              slide {label}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
