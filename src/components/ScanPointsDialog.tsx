import { useEffect, useMemo, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { repointEventScans, scanScore } from "../api/scores";
import { formatEventDate, type CampEvent } from "../api/schedule";
import { camperIdFromQr } from "../print/camperLabels";
import { useCollection, useCollectionOrEmpty } from "../store";
import Dialog from "./Dialog";
import { QrGlyph } from "./Glyph";

interface ScanPointsDialogProps {
  token: string;
  onClose: () => void;
}

type Flash = { kind: "ok"; text: string; color: string } | { kind: "error"; text: string };

const FLASH_MS = 1400;
const POINTS_MAX = 100_000;

/** "HH:mm" and "YYYY-MM-DD" of now, local time */
function clock(): { date: string; time: string } {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

/** the programme event happening right now (today, started, not yet ended — the next start counts as the end) */
function currentEvent(events: CampEvent[]): CampEvent | null {
  const now = clock();
  const today = events.filter((e) => e.date === now.date).sort((a, b) => a.startTime.localeCompare(b.startTime));
  for (let k = 0; k < today.length; k++) {
    const e = today[k];
    const end = e.endTime ?? today[k + 1]?.startTime ?? "23:59";
    if (e.startTime <= now.time && now.time < end) return e;
  }
  return null;
}

/** short beep via WebAudio — no asset needed; silently skipped when the browser refuses */
function beep(kind: "ok" | "error") {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = kind === "ok" ? [880, 1320] : [220, 160];
    const t0 = ctx.currentTime;
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = kind === "ok" ? "sine" : "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0 + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.25, t0 + i * 0.09 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.09 + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0 + i * 0.09);
      osc.stop(t0 + i * 0.09 + 0.13);
    });
    setTimeout(() => void ctx.close(), 400);
  } catch {
    /* audio is a nicety */
  }
  if (kind === "error" && "vibrate" in navigator) navigator.vibrate?.(120);
}

/**
 * Bulk points at a door, tied to a programme EVENT: the camera stays on
 * while the dialog is open and every kid's QR code scanned gives the
 * event's points to the kid's team. The event (default: the one happening
 * now) is the unit of the round, shared across every device — a kid counts
 * once per event, and the points are one value per event: changing them
 * re-points everyone already scanned. Green flash + chime on success, red
 * flash + buzz with the reason on failure.
 */
export default function ScanPointsDialog({ token, onClose }: ScanPointsDialogProps) {
  const events = useCollection("events");
  const campers = useCollectionOrEmpty("campers");
  const scores = useCollectionOrEmpty("scores");
  const teams = useCollectionOrEmpty("teams");
  const sorted = useMemo(() => (events ?? []).slice().sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)), [events]);
  const current = useMemo(() => currentEvent(sorted), [sorted]);

  const [eventId, setEventId] = useState<string>(current?.id ?? "");
  const [points, setPoints] = useState(1);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [torch, setTorch] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [repointing, setRepointing] = useState(false);
  const [repointError, setRepointError] = useState<string | null>(null);

  const event = sorted.find((e) => e.id === eventId) ?? null;
  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  /** every scan already made for this event, on any device (newest first — the store is the truth) */
  const eventScans = useMemo(() => scores.filter((s) => s.eventId === eventId && s.camperId), [scores, eventId]);
  const scannedIds = useMemo(() => new Set(eventScans.map((s) => s.camperId as string)), [eventScans]);
  /** the value the event's scans currently carry (null: nobody scanned yet) */
  const eventPoints = eventScans[0]?.points ?? null;

  // default to the event happening now once the programme arrives (the dialog may open before the first snapshot)
  const defaulted = useRef(!!current);
  useEffect(() => {
    if (!defaulted.current && current) {
      defaulted.current = true;
      setEventId((id) => id || current.id);
    }
  }, [current]);

  // switching events: adopt the points that event already uses
  useEffect(() => {
    setRepointError(null);
    if (eventPoints !== null) setPoints(eventPoints);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const busyRef = useRef(false);
  /** the last raw value + when: ignores the same code while it is still in front of the camera */
  const lastRef = useRef<{ raw: string; at: number }>({ raw: "", at: 0 });
  const stateRef = useRef({ eventId, points, campers, scannedIds });
  stateRef.current = { eventId, points, campers, scannedIds };
  const flashTimer = useRef<number | null>(null);

  function showFlash(f: Flash) {
    setFlash(f);
    beep(f.kind);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), f.kind === "ok" ? FLASH_MS : FLASH_MS + 800);
  }

  async function handleScan(raw: string) {
    const now = Date.now();
    if (busyRef.current) return;
    // same code lingering in front of the lens: ignore it until it has left the view for a few seconds
    if (raw === lastRef.current.raw && now - lastRef.current.at < 3000) {
      lastRef.current.at = now;
      return;
    }
    lastRef.current = { raw, at: now };
    busyRef.current = true;
    const { eventId, points, campers, scannedIds } = stateRef.current;
    try {
      if (!eventId) throw new Error("Escolha o evento da programação antes de ler.");
      if (!Number.isInteger(points) || points < 1) throw new Error("Informe uma quantidade de pontos maior que zero.");
      const id = camperIdFromQr(raw);
      if (!id) throw new Error("Este QR code não é de uma pulseira ou crachá do Acampa Kids.");
      const known = campers.find((x) => x.id === id);
      if (scannedIds.has(id)) throw new Error(`${known ? known.name.split(" ")[0] : "Esta criança"} já foi lido(a) neste evento.`);
      if (known && !known.team) throw new Error(`${known.name.split(" ")[0]} não está em nenhum time.`);
      const res = await scanScore(token, { camperId: id, eventId, points });
      showFlash({ kind: "ok", text: `${res.score.camperName.split(" ")[0]} · +${points} para ${res.team.name}`, color: res.team.color });
    } catch (e) {
      showFlash({ kind: "error", text: e instanceof Error ? e.message : "Não foi possível ler este QR code." });
    } finally {
      busyRef.current = false;
    }
  }
  const handleScanRef = useRef(handleScan);
  handleScanRef.current = handleScan;

  // the camera runs for as long as the dialog is open
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let disposed = false;
    const scanner = new QrScanner(video, (result) => void handleScanRef.current(result.data), {
      preferredCamera: "environment",
      maxScansPerSecond: 8,
      highlightScanRegion: true,
      highlightCodeOutline: true,
      returnDetailedScanResult: true,
      onDecodeError: () => undefined,
    });
    scannerRef.current = scanner;
    void scanner
      .start()
      .then(async () => {
        if (disposed) return;
        setStarting(false);
        setHasTorch(await scanner.hasFlash().catch(() => false));
      })
      .catch((err) => {
        if (disposed) return;
        setStarting(false);
        setCameraError(cameraErrorText(err));
      });
    return () => {
      disposed = true;
      scanner.destroy();
      if (scannerRef.current === scanner) scannerRef.current = null;
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    };
  }, []);

  async function toggleTorch() {
    const s = scannerRef.current;
    if (!s) return;
    try {
      await s.toggleFlash();
      setTorch(s.isFlashOn());
    } catch {
      setCameraError("Não foi possível ligar a lanterna.");
    }
  }

  const pointsValid = Number.isInteger(points) && points >= 1 && points <= POINTS_MAX;
  /** the value differs from what the event's scans carry: offer to re-point them all */
  const pointsDiverge = pointsValid && eventPoints !== null && eventPoints !== points;

  async function applyRepoint() {
    if (!eventId || !pointsValid || repointing) return;
    setRepointing(true);
    setRepointError(null);
    try {
      await repointEventScans(token, eventId, points);
    } catch (e) {
      setRepointError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setRepointing(false);
    }
  }

  const perTeam = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of eventScans) m.set(s.teamId, (m.get(s.teamId) ?? 0) + 1);
    return [...m.entries()].map(([teamId, n]) => ({ team: teamById.get(teamId), n }));
  }, [eventScans, teamById]);

  return (
    <Dialog open onClose={onClose} title="Lançar pontos em massa" width={560}>
      <div className="qr-scanner scan-points">
        <header className="qr-scanner__head">
          <div>
            <h2 className="cat-form__title"><QrGlyph /> Pontos por QR code</h2>
            <p className="cat-hint">
              Cada crachá lido dá {pointsValid ? points : "—"} ponto{points !== 1 ? "s" : ""} ao time da criança. Uma vez por criança neste evento, em qualquer aparelho.
            </p>
          </div>
          <button type="button" className="qr-scanner__close" aria-label="Encerrar leitura" title="Encerrar" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="scan-points__fields">
          <label className="cat-field">
            <span className="cat-field__label">Evento</span>
            <select className="cat-input" value={eventId} onChange={(e) => setEventId(e.target.value)}>
              <option value="">{sorted.length ? "Escolha o evento…" : "Sem programação"}</option>
              {sorted.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.emoji} {e.title} · {formatEventDate(e.date, { weekday: "short", day: "numeric" })} {e.startTime}
                  {e.id === current?.id ? " (agora)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="cat-field scan-points__points">
            <span className="cat-field__label">Pontos por criança</span>
            <input
              className="cat-input"
              type="number"
              inputMode="numeric"
              min={1}
              max={POINTS_MAX}
              step={1}
              value={Number.isNaN(points) ? "" : points}
              onChange={(e) => setPoints(Math.max(1, Math.floor(Number(e.target.value) || 0)))}
              onBlur={() => setPoints((p) => (Number.isInteger(p) && p >= 1 ? p : 1))}
              aria-label="Pontos por criança"
            />
          </label>
        </div>
        {!eventId && sorted.length > 0 && <p className="cat-hint cat-hint--error">Escolha o evento: a leitura fica bloqueada até lá.</p>}
        {!pointsValid && <p className="message message--error">Os pontos precisam ser um número inteiro maior que zero.</p>}
        {pointsDiverge && (
          <p className="cat-hint cat-hint--error scan-points__repoint">
            ⚠️ {eventScans.length} criança{eventScans.length !== 1 ? "s" : ""} já lida{eventScans.length !== 1 ? "s" : ""} com <strong>{eventPoints}</strong> ponto{eventPoints !== 1 ? "s" : ""}. O
            valor é um só por evento: a próxima leitura (ou o botão) muda todas para <strong>{points}</strong>.{" "}
            <button type="button" className="button button--secondary scan-points__repoint-btn" disabled={repointing} onClick={() => void applyRepoint()}>
              {repointing ? "Atualizando…" : `Atualizar todas para ${points}`}
            </button>
          </p>
        )}
        {repointError && <p className="message message--error">{repointError}</p>}

        <div className={`qr-scanner__viewport scan-points__viewport ${flash ? `scan-points__viewport--${flash.kind}` : ""}`}>
          <video ref={videoRef} className="qr-scanner__video" playsInline muted />
          {starting && !cameraError && (
            <div className="qr-scanner__status" role="status">
              <span className="qr-scanner__spinner" aria-hidden="true" />
              Abrindo câmera…
            </div>
          )}
          {flash && (
            <div className={`scan-points__flash scan-points__flash--${flash.kind}`} role="status" aria-live="assertive">
              <span className="scan-points__flash-icon" aria-hidden="true">
                {flash.kind === "ok" ? "✅" : "⛔"}
              </span>
              <span className="scan-points__flash-text">{flash.text}</span>
            </div>
          )}
        </div>

        {cameraError && <p className="message message--error">{cameraError}</p>}

        {event && (
          <>
            <div className="scan-points__summary" aria-live="polite">
              <strong>{eventScans.length}</strong> {eventScans.length === 1 ? "criança lida" : "crianças lidas"} em {event.emoji} {event.title}
              {perTeam.length > 0 && (
                <span className="scan-points__teams">
                  {perTeam.map(({ team, n }, i) => (
                    <span key={team?.id ?? i} className="scan-points__team-chip" style={{ borderColor: team?.color }}>
                      {team?.name ?? "Time removido"} · {n}
                    </span>
                  ))}
                </span>
              )}
            </div>
            {eventScans.length > 0 && (
              <ul className="scan-points__list">
                {eventScans.slice(0, 8).map((s) => {
                  const team = teamById.get(s.teamId);
                  return (
                    <li key={s.id}>
                      <span className="score-log__dot" style={{ background: team?.color ?? "#999" }} aria-hidden="true" /> {s.camperName}{" "}
                      <small>
                        · {team?.name ?? "Time removido"} · {s.by.name.split(" ")[0]}
                      </small>
                    </li>
                  );
                })}
                {eventScans.length > 8 && <li className="cat-hint">… e mais {eventScans.length - 8}</li>}
              </ul>
            )}
          </>
        )}

        <div className="qr-scanner__actions">
          {hasTorch && (
            <button type="button" className="button button--secondary" aria-pressed={torch} onClick={toggleTorch}>
              {torch ? "🔦 Desligar lanterna" : "🔦 Ligar lanterna"}
            </button>
          )}
          <button type="button" className="button button--primary" onClick={onClose}>
            Encerrar leitura
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function cameraErrorText(err: unknown): string {
  const name = typeof err === "object" && err && "name" in err ? String((err as { name: unknown }).name) : "";
  if (name === "NotAllowedError") return "Permita o acesso à câmera nas configurações do navegador e tente novamente.";
  if (name === "NotFoundError") return "Nenhuma câmera foi encontrada neste aparelho.";
  if (name === "NotReadableError") return "A câmera está sendo usada por outro aplicativo.";
  if (!window.isSecureContext) return "A câmera só funciona em uma conexão segura (HTTPS).";
  return "Não foi possível abrir a câmera. Confira a permissão e tente novamente.";
}
