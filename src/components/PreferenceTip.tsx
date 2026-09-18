import { useCallback, useEffect, useRef, useState } from "react";
import type { Camper } from "../api/campers";
import type { Bedroom } from "../api/bedrooms";
import type { PreferenceMap } from "../roomGroups";
import { useI18n } from "../i18n";
import { navigate } from "../router";
import ChipTip from "./ChipTip";

/** how long the mouse must rest on a chip before its tooltip opens (taps are instant) */
const TIP_DELAY = 450;
/** how long the tip survives after the mouse leaves the chip — enough to travel onto the tip itself */
const LEAVE_GRACE = 250;

/**
 * Shared "prefere dividir com" tooltip of the assignment boards (Montar
 * quartos / Montar times): hover opens it after a beat on desktop, a tap
 * toggles it on touch. It opens for EVERY kid — the ones without a preference
 * still get their name as a link to their page. The caller registers each
 * chip element and tells the hook when a gesture turned into a drag (so the
 * click that ends it is not a tap) and which pointer type started it.
 */
export function usePreferenceTip(_prefs: PreferenceMap) {
  const [tip, setTip] = useState<string | null>(null);
  const chipEls = useRef(new Map<string, HTMLElement>());
  const timer = useRef<number | null>(null);
  const pointerType = useRef("mouse");
  const suppressClick = useRef(false);

  const cancelTimer = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);
  useEffect(() => cancelTimer, [cancelTimer]);

  const hover = useCallback((kidId: string) => {
    cancelTimer();
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setTip(kidId);
    }, TIP_DELAY);
  }, [cancelTimer]);

  /** mouse left the chip: close after a grace period, unless it lands on the tip (see `enterTip`) */
  const leave = useCallback((kidId: string) => {
    cancelTimer();
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setTip((t) => (t === kidId ? null : t));
    }, LEAVE_GRACE);
  }, [cancelTimer]);

  /** the mouse reached the tooltip: keep it open */
  const enterTip = useCallback(() => cancelTimer(), [cancelTimer]);
  /** the mouse left the tooltip: close it (a click inside already navigated) */
  const leaveTip = useCallback(() => {
    cancelTimer();
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setTip(null);
    }, LEAVE_GRACE);
  }, [cancelTimer]);

  /** call at the start of every pointer gesture on a chip */
  const gestureStart = useCallback((type: string) => {
    pointerType.current = type;
    suppressClick.current = false;
  }, []);
  /** call once the gesture became a drag: the tooltip closes and the closing click is ignored */
  const gestureDragged = useCallback(() => {
    suppressClick.current = true;
    setTip(null);
  }, []);

  /** false when this click is just the end of a drag gesture */
  const wasTap = useCallback(() => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return false;
    }
    return true;
  }, []);

  /** the tooltip half of a tap (mouse users already got it on hover) */
  const tap = useCallback((kidId: string) => {
    if (pointerType.current === "mouse") return;
    setTip((t) => (t === kidId ? null : kidId));
  }, []);

  const register = useCallback((kidId: string) => (el: HTMLElement | null) => {
    if (el) chipEls.current.set(kidId, el);
    else chipEls.current.delete(kidId);
  }, []);

  const close = useCallback(() => setTip(null), []);
  const anchor = tip ? chipEls.current.get(tip) ?? null : null;

  return { tip, anchor, hover, leave, enterTip, leaveTip, tap, wasTap, gestureStart, gestureDragged, register, close, setTip };
}

/** opens the kid's page — same target as tapping a camper card anywhere in the app */
const openCamper = (id: string) => navigate(`/campers/${id}`);

/**
 * What the tooltip says: who the kid asked to share with, and where each of
 * them is now. The kid's name and every matched name are links to their pages.
 */
export function PreferenceTipBody({ kid, prefs, kids, bedrooms }: { kid: Camper | undefined; prefs: PreferenceMap; kids: readonly Camper[]; bedrooms: readonly Bedroom[] }) {
  const { tx } = useI18n();
  if (!kid) return null;
  const list = prefs.get(kid.id) ?? [];
  return (
    <>
      <p className="chip-tip__title">
        <button type="button" className="link-btn chip-tip__link" onClick={() => openCamper(kid.id)}>{kid.name}</button>
      </p>
      {list.length === 0 ? (
        <p>{tx("Sem preferência de quarto informada.")}</p>
      ) : (
        <p className="chip-tip__chips">
          <span className="chip-tip__lead">{tx("prefere dividir com:")}</span>
          {list.map((p, i) => {
            const target = p.camperId ? kids.find((k) => k.id === p.camperId) : undefined;
            const room = target?.bedroom ? bedrooms.find((b) => b.id === target.bedroom) : undefined;
            const where = room ? ` · ${room.name}` : p.camperId ? tx(" · sem quarto") : p.ambiguous ? tx(" — mais de uma com esse nome") : tx(" — ninguém com esse nome");
            const note = p.note ? <small className="chip-tip__note"> ({p.note})</small> : null;
            if (target) {
              return (
                <button key={`${p.raw}-${i}`} type="button" className="chip-tip__chip chip-tip__chip--link" title={tx("Abrir {name}", { name: target.name })} onClick={() => openCamper(target.id)}>
                  {p.raw}{note}{where}
                </button>
              );
            }
            return <span key={`${p.raw}-${i}`} className="chip-tip__chip chip-tip__chip--missing">{p.raw}{note}{where}</span>;
          })}
        </p>
      )}
    </>
  );
}

/** Renders the shared tooltip when one is open; hovering it keeps it open so its links can be clicked. */
export function PreferenceTipPortal({ tip, anchor, onClose, onEnter, onLeave, kids, prefs, bedrooms }: { tip: string | null; anchor: HTMLElement | null; onClose: () => void; onEnter?: () => void; onLeave?: () => void; kids: readonly Camper[]; prefs: PreferenceMap; bedrooms: readonly Bedroom[] }) {
  if (!tip || !anchor) return null;
  return (
    <ChipTip anchor={anchor} onClose={onClose} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <PreferenceTipBody kid={kids.find((k) => k.id === tip)} prefs={prefs} kids={kids} bedrooms={bedrooms} />
    </ChipTip>
  );
}
