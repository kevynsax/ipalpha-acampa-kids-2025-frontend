import { useEffect, useState } from "react";
import { speakAgo } from "../dates";
import { useConnection, useSyncedAt } from "../store";
import { requestSnapshot } from "../store/realtime";

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
      ? `Ao vivo · dados de ${speakAgo(syncedAt, now)}`
      : connection === "connecting"
        ? `Conectando… · dados de ${speakAgo(syncedAt, now)}`
        : `Sem conexão · usando dados salvos ${speakAgo(syncedAt, now)}`;

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
