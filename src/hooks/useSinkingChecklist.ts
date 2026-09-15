import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** how long a ticked card stays where it is, dimming, before it leaves for the end of the list */
const DWELL_MS = 620;
/** the ticked card's own trip — longer, it is the one you are watching */
const TRAVEL_MS = 540;
/** the cards it jumps over, closing/opening the gap */
const SHIFT_MS = 400;
/** the gap starts opening a hair before the card sets off */
const TRAVEL_DELAY = 70;
/** each card downstream starts a touch later, so the list ripples instead of snapping as a block */
const STAGGER_MS = 14;
const STAGGER_MAX = 90;

/** id stamped on our animations so we only ever cancel our own (never a CSS transition) */
const ANIM_ID = "prep-flip";
/** each card must carry `data-sink-key={key}` so we can measure it before/after the reorder */
const SEL = "[data-sink-key]";

function sameOrder(a: string[], b: string[]) {
  return a.length === b.length && a.every((k, i) => k === b[i]);
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Checklist where ticking an item sinks it to the end of the list — but never
 * abruptly:
 *
 *   1. the card you ticked stays exactly where it is for {@link DWELL_MS},
 *      fading, so you can see WHAT you ticked;
 *   2. the cards it will jump over slide to close the gap, each starting a few
 *      ms after the one above it;
 *   3. the ticked card follows, lifted (it dips in scale mid-flight and rides
 *      above the others), and lands at the end.
 *
 * Steps 2–3 are a FLIP: React reorders the list, we measure every card before
 * and after and play it back from its old position, so nothing ever jumps.
 * With `prefers-reduced-motion` the reorder is instant.
 *
 * The caller keeps owning the data — this only decides the ORDER it is rendered
 * in and animates the change.
 *
 * ```tsx
 * const { listRef, ordered, settling } = useSinkingChecklist(items, i => i.key, i => done.has(i.key));
 * <div ref={listRef}>{ordered.map(i => <article data-sink-key={i.key} …/>)}</div>
 * ```
 */
export function useSinkingChecklist<T>(
  items: T[],
  keyOf: (item: T) => string,
  isDone: (item: T) => boolean,
): { listRef: React.RefObject<HTMLDivElement | null>; ordered: T[]; settling: Set<string> } {
  const listRef = useRef<HTMLDivElement | null>(null);
  /** the "First" of the FLIP: where each card was, captured just before the reorder */
  const flipRef = useRef<{ rects: Map<string, DOMRect>; movers: Set<string> } | null>(null);
  /** the tick state of the previous render, to spot which item the user just flipped */
  const prevDoneRef = useRef<Map<string, boolean> | null>(null);

  /** where things should end up: untouched first, ticked at the end */
  const target = [...items.filter((i) => !isDone(i)), ...items.filter((i) => isDone(i))];
  const targetKeys = target.map(keyOf);

  const [order, setOrder] = useState<string[]>(targetKeys);
  /** keys ticked a moment ago, still sitting in place (rendered dimmer) */
  const [settling, setSettling] = useState<Set<string>>(new Set());

  const doneSig = items.map((i) => `${keyOf(i)}:${isDone(i) ? 1 : 0}`).join("\u0000");

  useEffect(() => {
    const doneNow = new Map(items.map((i) => [keyOf(i), isDone(i)] as const));
    const prev = prevDoneRef.current;
    prevDoneRef.current = doneNow;

    // the list itself changed (item added/removed, first render, another camp): just follow it
    const known = order.length === doneNow.size && order.every((k) => doneNow.has(k));
    if (!known) {
      setOrder(targetKeys);
      setSettling((s) => (s.size ? new Set() : s));
      return;
    }
    // already where it belongs — e.g. the user un-ticked during the dwell
    if (sameOrder(order, targetKeys)) {
      setSettling((s) => (s.size ? new Set() : s));
      return;
    }

    /** the items whose tick just changed — those are the ones that get the lift */
    const flipped = prev ? [...doneNow].filter(([k, d]) => prev.get(k) !== d).map(([k]) => k) : [];
    /** only TICKING dwells: un-ticking should bring the card back up at once, it is a correction */
    const dwells = flipped.some((k) => doneNow.get(k));

    const apply = (movers: Set<string>) => {
      const el = listRef.current;
      if (el && !prefersReducedMotion()) {
        const rects = new Map<string, DOMRect>();
        for (const node of el.querySelectorAll<HTMLElement>(SEL)) {
          // mid-flight cards measure where they LOOK right now, so a second tick picks up smoothly
          if (node.dataset.sinkKey) rects.set(node.dataset.sinkKey, node.getBoundingClientRect());
        }
        flipRef.current = { rects, movers };
      }
      setOrder(targetKeys);
      setSettling(new Set());
    };

    // nothing the user did (a sync from another device, an admin edit): reorder straight away
    if (!flipped.length) {
      apply(new Set());
      return;
    }

    // tick a second item while the first is still dwelling: they leave together
    const movers = new Set(flipped);
    for (const k of settling) movers.add(k);

    if (!dwells || prefersReducedMotion()) {
      apply(movers);
      return;
    }

    setSettling(new Set(flipped.filter((k) => doneNow.get(k))));
    const t = window.setTimeout(() => apply(movers), DWELL_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneSig, targetKeys.join("\u0000")]);

  // ── FLIP: play every card back from where it was to where it now is ──
  useLayoutEffect(() => {
    const flip = flipRef.current;
    flipRef.current = null;
    const el = listRef.current;
    if (!flip || !el) return;

    const nodes = [...el.querySelectorAll<HTMLElement>(SEL)];
    let shifted = 0;

    for (const node of nodes) {
      const key = node.dataset.sinkKey;
      const from = key ? flip.rects.get(key) : undefined;
      if (!from || typeof node.animate !== "function") continue;

      // a card can be caught mid-flight by a second tick — drop the old trip, keep CSS transitions
      for (const running of node.getAnimations()) {
        if (running.id === ANIM_ID) running.cancel();
      }

      const to = node.getBoundingClientRect();
      const dx = Math.round(from.left - to.left);
      const dy = Math.round(from.top - to.top);
      if (!dx && !dy) continue;

      const isMover = !!key && flip.movers.has(key);
      const anim = isMover
        ? node.animate(
            [
              { transform: `translate3d(${dx}px, ${dy}px, 0) scale(1)`, easing: "cubic-bezier(.45,0,.75,.35)" },
              // dips as it passes the others, like it is being tucked underneath the pile
              { transform: `translate3d(${dx * 0.5}px, ${dy * 0.5}px, 0) scale(.955)`, offset: 0.5, easing: "cubic-bezier(.2,.75,.3,1)" },
              { transform: "translate3d(0, 0, 0) scale(1)" },
            ],
            { duration: TRAVEL_MS, delay: TRAVEL_DELAY, fill: "backwards" },
          )
        : node.animate(
            [{ transform: `translate3d(${dx}px, ${dy}px, 0)` }, { transform: "translate3d(0, 0, 0)" }],
            {
              duration: SHIFT_MS,
              delay: Math.min(shifted++ * STAGGER_MS, STAGGER_MAX),
              easing: "cubic-bezier(.22,.7,.28,1)",
              fill: "backwards",
            },
          );
      anim.id = ANIM_ID;

      if (isMover) {
        // it flies OVER the cards it is passing, not between them
        node.style.zIndex = "2";
        const land = () => {
          node.style.zIndex = "";
        };
        anim.addEventListener("finish", land);
        anim.addEventListener("cancel", land);
      }
    }
  }, [order]);

  const byKey = new Map(items.map((i) => [keyOf(i), i] as const));
  const known = new Set(order);
  const ordered = [
    ...order.map((k) => byKey.get(k)).filter((i): i is T => i !== undefined),
    ...items.filter((i) => !known.has(keyOf(i))),
  ];

  return { listRef, ordered, settling };
}
