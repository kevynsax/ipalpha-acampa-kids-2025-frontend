import { useEffect, useState } from "react";
import { speakAgo } from "../dates";
import { useI18n } from "../i18n";
import { useConnection, useSyncedAt } from "../store";
import { requestSnapshot } from "../store/realtime";

/**
 * Little dot in the header: green = live feed connected, amber = connecting,
 * red = offline (showing the copy saved on this device). Tap to force a resync.
 */
export default function SyncStatus() {
  const { tx } = useI18n();
  const connection = useConnection();
  const syncedAt = useSyncedAt();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  const when = speakAgo(syncedAt, now);
  const label =
    connection === "online"
      ? tx("Ao vivo · dados de {when}", { when })
      : connection === "connecting"
        ? tx("Conectando… · dados de {when}", { when })
        : tx("Sem conexão · usando dados salvos {when}", { when });

  if (connection === "online") return null;

  return (
    <button
      type="button"
      className={`sync-dot sync-dot--${connection}`}
      title={tx("{label} — toque para sincronizar", { label })}
      aria-label={label}
      onClick={() => requestSnapshot()}
    >
      <span className="sync-dot__led" aria-hidden="true" />
      <span className="sync-dot__text">{connection === "connecting" ? tx("conectando") : tx("offline")}</span>
    </button>
  );
}
