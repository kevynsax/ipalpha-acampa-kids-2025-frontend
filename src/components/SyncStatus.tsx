import { useEffect, useState } from "react";
import { useConnection, useSyncedAt } from "../store";
import { requestSnapshot } from "../store/realtime";

function ago(iso: string | null, now: number): string {
  if (!iso) return "nunca sincronizado";
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 10) return "agora mesmo";
  if (s < 60) return `há ${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 48) return `há ${h}h`;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
}

/**
 * Little dot in the header: green = live feed connected, amber = connecting,
 * red = offline (showing the copy saved on this device). Tap to force a resync.
 */
export default function SyncStatus() {
  const connection = useConnection();
  const syncedAt = useSyncedAt();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  const label =
    connection === "online"
      ? `Ao vivo · dados de ${ago(syncedAt, now)}`
      : connection === "connecting"
        ? `Conectando… · dados de ${ago(syncedAt, now)}`
        : `Sem conexão · usando dados salvos ${ago(syncedAt, now)}`;

  if (connection === "online") return null;

  return (
    <button
      type="button"
      className={`sync-dot sync-dot--${connection}`}
      title={`${label} — toque para sincronizar`}
      aria-label={label}
      onClick={() => requestSnapshot()}
    >
      <span className="sync-dot__led" aria-hidden="true" />
      <span className="sync-dot__text">{connection === "connecting" ? "conectando" : "offline"}</span>
    </button>
  );
}
