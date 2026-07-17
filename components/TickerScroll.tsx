"use client";

import { useEffect, useRef } from "react";

// Pixels per second the ticker auto-scrolls at when idle. This is matched to
// the Testimony Wall ticker's original speed (measured live: ~740px of
// scroll distance over its 42s animation) so both tickers now move at the
// exact same rate regardless of how many items each one has.
const SCROLL_SPEED_PX_PER_SEC = 17.6;

// How long to wait after the visitor's last manual scroll/touch input before
// auto-scroll resumes. This gives native touch/trackpad momentum time to
// fully settle before we take back over.
const RESUME_DELAY_MS = 1200;

export default function TickerScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const maskRef = useRef<HTMLDivElement>(null);
  const programmatic = useRef(false);
  const lastUserInput = useRef(0);
  const pointerDown = useRef(false);
  // Our own precise, fractional scroll position. We deliberately do NOT use
  // el.scrollTop as the running total: browsers store/report scrollTop as a
  // rounded whole pixel, and at this speed each frame only advances by a
  // fraction of a pixel (~0.3px at 60fps). Reading the rounded value back
  // every frame throws away that fractional progress before it can add up,
  // so the ticker would appear to never move at all. Tracking position
  // ourselves and only writing it into scrollTop avoids that.
  const position = useRef(0);

  useEffect(() => {
    const current = maskRef.current;
    if (!current) return;
    // Give the element a non-nullable local binding so TypeScript's control
    // flow narrowing above carries through into the nested closures below
    // (it does not narrow across function boundaries on its own).
    const el: HTMLDivElement = current;

    position.current = el.scrollTop;

    let raf = 0;
    let last = performance.now();

    function onScroll() {
      // Ignore scroll events that we ourselves triggered programmatically;
      // anything else came from the visitor (touch drag, momentum, wheel).
      if (programmatic.current) {
        programmatic.current = false;
      } else {
        lastUserInput.current = performance.now();
      }
      // Either way, resync our tracked position to reality so that once
      // auto-scroll resumes it continues from wherever the visitor left it.
      position.current = el.scrollTop;
    }

    function onPointerDown() {
      pointerDown.current = true;
      lastUserInput.current = performance.now();
    }

    function onPointerUp() {
      pointerDown.current = false;
      lastUserInput.current = performance.now();
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);

    function tick(now: number) {
      const dt = now - last;
      last = now;

      const half = el.scrollHeight / 2;
      const idleFor = now - lastUserInput.current;

      if (!pointerDown.current && idleFor > RESUME_DELAY_MS && half > 0) {
        let next = position.current + (SCROLL_SPEED_PX_PER_SEC * dt) / 1000;
        while (next >= half) {
          next -= half;
        }
        position.current = next;
        programmatic.current = true;
        el.scrollTop = next;
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  return (
    <div
      ref={maskRef}
      className="lfp-ticker-mask relative h-80 overflow-y-scroll"
      style={{ touchAction: "pan-y" }}
    >
      <div className="flex flex-col gap-4 px-5 py-4">{children}</div>
      <style jsx>{`
        .lfp-ticker-mask {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .lfp-ticker-mask::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
