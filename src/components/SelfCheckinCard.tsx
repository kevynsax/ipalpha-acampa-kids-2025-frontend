import { useEffect, useMemo, useState } from "react";
import { getSelfCheckinStatus, selfCheckin, type SelfCheckinStatus } from "../api/staff";
import { ApiError } from "../api/client";
import { describeGeoError, distanceMeters, formatDistance, readPosition, type DevicePosition } from "../geo";
import type { LoggedUser } from "../roles";
import { useCollection, useCollectionOrEmpty } from "../store";
import Dialog from "./Dialog";

interface SelfCheckinCardProps {
  token: string;
  /** the logged-in person — their staff record is found by phone */
  user: LoggedUser;
}

/** "YYYY-MM-DD" of today in the device's clock */
function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** the check-in window opens this long before the first event (mirrors the server) */
const OPENS_MINUTES_BEFORE = 60;

/** "YYYY-MM-DD" + "HH:mm" in the device's clock → epoch ms */
function localDateTime(date: string, time: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return new Date(y, m - 1, d, h, min).getTime();
}

/** popup dismissed for this browser session only — it pops again next time the app is opened */
const DISMISS_KEY = "acampa.selfcheck.dismissed";
function isDismissed(date: string): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === date;
  } catch {
    return false;
  }
}
function remember(date: string) {
  try {
    sessionStorage.setItem(DISMISS_KEY, date);
  } catch {
    /* private mode: just don't persist */
  }
}

/**
 * "Cheguei na igreja!" — lets a team member mark their own arrival on the
 * departure day (the day of the first event of the programme). The phone
 * sends its GPS position and the SERVER decides whether it is close enough to
 * the spot the admin configured (Configurações → Local do check-in).
 *
 * The window opens ONE HOUR before the first event and lasts the rest of the
 * departure day (the server enforces the same rule). Until then, and every
 * other day, it renders nothing. When the window opens it first shows as a
 * POPUP; once dismissed (✕, Esc or tapping outside) the very same
 * card stays INLINE on the home page, in its usual place, so the person can
 * still check in later. Once checked in, the green "done" card shows inline.
 */
export default function SelfCheckinCard({ token, user }: SelfCheckinCardProps) {
  const staff = useCollection("staff");
  const events = useCollectionOrEmpty("events");
  const me = useMemo(() => staff?.find((s) => s.phone === user.phone) ?? null, [staff, user.phone]);
  /** first event of the programme = departure (events come sorted by date/time, but sort defensively) */
  const first = useMemo(() => [...events].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))[0] ?? null, [events]);
  const departure = first?.date ?? null;
  /** epoch ms from which the window is open (device clock) */
  const opensAt = first ? localDateTime(first.date, first.startTime) - OPENS_MINUTES_BEFORE * 60_000 : null;

  // tick once when the window opens, so the card shows up without a reload
  const [, tick] = useState(0);
  useEffect(() => {
    if (opensAt === null) return;
    const wait = opensAt - Date.now();
    if (wait <= 0) return;
    const t = setTimeout(() => tick((n) => n + 1), Math.min(wait, 2 ** 31 - 1));
    return () => clearTimeout(t);
  }, [opensAt]);

  const [status, setStatus] = useState<SelfCheckinStatus | null>(null);
  const [pos, setPos] = useState<DevicePosition | null>(null);
  const [phase, setPhase] = useState<"idle" | "locating" | "sending">("idle");
  const [error, setError] = useState<string | null>(null);
  const [justDone, setJustDone] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const isDepartureDay = !!departure && departure === today();
  /** departure day AND at most one hour before the first event */
  const isOpen = isDepartureDay && opensAt !== null && Date.now() >= opensAt;
  const checkedIn = !!me?.checkin;

  // remember a dismissal from earlier in this session
  useEffect(() => {
    if (departure && isDismissed(departure)) setDismissed(true);
  }, [departure]);

  // ask the server whether the window is open (it also brings the target spot for the distance hint)
  useEffect(() => {
    if (!isOpen || checkedIn) return;
    let alive = true;
    getSelfCheckinStatus(token)
      .then((s) => alive && setStatus(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [token, isOpen, checkedIn]);

  if (!me || !departure) return null;
  if (!isOpen && !checkedIn) return null;

  const busy = phase !== "idle";
  /** popup while not dismissed; if the person was already checked in when we got here, no popup at all */
  const popup = isOpen && !dismissed && (!checkedIn || justDone !== null);

  function dismiss() {
    if (busy) return;
    setDismissed(true);
    remember(departure!);
  }

  async function handleCheckin() {
    if (busy) return;
    setError(null);
    setPhase("locating");
    let p: DevicePosition;
    try {
      p = await readPosition();
      setPos(p);
    } catch (err) {
      setError(describeGeoError(err));
      setPhase("idle");
      return;
    }
    setPhase("sending");
    try {
      const res = await selfCheckin(token, { lat: p.lat, lng: p.lng, accuracyM: p.accuracyM });
      setJustDone(res.distanceM);
    } catch (err) {
      if (err instanceof ApiError && err.code === "ALREADY_CHECKED_IN") {
        // someone from the admin table beat us to it — the store update will flip the card
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    } finally {
      setPhase("idle");
    }
  }

  // ── already there ──
  if (checkedIn) {
    const at = new Date(me.checkin!.at);
    const when = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(at);
    const self = me.checkin!.byUserId === user.id;
    const card = (
      <section className={`selfcheck selfcheck--done${popup ? " selfcheck--popup" : ""}`} aria-live="polite">
        <span className="selfcheck__badge" aria-hidden="true">✅</span>
        <div className="selfcheck__body">
          <h2 className="selfcheck__title">Check-in feito!</h2>
          <p className="selfcheck__text">
            {self ? "Você confirmou sua chegada" : `${me.checkin!.byName.split(" ")[0]} confirmou sua chegada`} às <strong>{when}</strong>
            {justDone !== null && justDone > 0 ? ` (a ${formatDistance(justDone)} do ponto de encontro)` : ""}. Boa viagem! 🚌
          </p>
          {popup && (
            <button type="button" className="button button--primary selfcheck__cta" onClick={dismiss}>
              Fechar 🎉
            </button>
          )}
        </div>
      </section>
    );
    return popup ? (
      <Dialog open onClose={dismiss} title="Check-in feito!" width={520}>
        {card}
      </Dialog>
    ) : (
      card
    );
  }

  const distance = pos && status ? distanceMeters(pos, status.location) : null;
  const blocked = status && !status.allowed ? status.reason : null;

  const card = (
    <section className={`selfcheck${popup ? " selfcheck--popup" : ""}`} aria-live="polite">
      {popup && (
        <button type="button" className="selfcheck__close" aria-label="Fechar" disabled={busy} onClick={dismiss}>
          ✕
        </button>
      )}
      <span className="selfcheck__badge" aria-hidden="true">⛪</span>
      <div className="selfcheck__body">
        <h2 className="selfcheck__title">O acampamento é Hoje!!!</h2>
        <p className="selfcheck__text">Ao chegar na igreja, confirme sua presença aqui</p>

        {blocked && <p className="message message--error">{blocked.message}</p>}
        {error && <p className="message message--error">{error}</p>}
        {distance !== null && !error && (
          <p className="cat-hint">
            📡 Você está a cerca de <strong>{formatDistance(distance)}</strong> do ponto de encontro
            {pos && pos.accuracyM > 0 ? ` (precisão do GPS: ±${pos.accuracyM} m)` : ""}.
          </p>
        )}

        <div className="selfcheck__actions">
          <button type="button" className="button button--primary selfcheck__cta" disabled={busy || !!blocked} onClick={handleCheckin}>
            {phase === "locating" ? "📡 Lendo o GPS…" : phase === "sending" ? "Confirmando…" : "Cheguei na igreja! ✋"}
          </button>
        </div>
        <p className="selfcheck__location-note">Precisamos da sua localização para saber que você já chegou.</p>
      </div>
    </section>
  );

  return popup ? (
    <Dialog open onClose={dismiss} title="O acampamento é Hoje!!!" width={520}>
      {card}
    </Dialog>
  ) : (
    card
  );
}
