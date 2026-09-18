import { useEffect, useRef, useState, type ReactNode } from "react";
import QrScanner from "qr-scanner";
import Dialog from "./Dialog";
import { keepOverlayInPlace, visibleScanRegion } from "./scanOverlay";
import { QrGlyph } from "./Glyph";
import { useI18n } from "../i18n";

interface QrScannerDialogProps {
  open: boolean;
  busy?: boolean;
  onScan: (value: string) => void;
  onClose: () => void;
  title?: string;
  hint?: string;
  /** shown under the camera (e.g. a running count) */
  children?: ReactNode;
}

/** Phone-camera QR reader. The camera only runs while the dialog is open; full screen on phones. */
export default function QrScannerDialog({ open, busy = false, onScan, onClose, title, hint, children }: QrScannerDialogProps) {
  const { tx } = useI18n();
  const resolvedTitle = title ?? tx("Ler pulseira ou crachá");
  const resolvedHint = hint ?? tx("Aponte a câmera para o QR code.");
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const onScanRef = useRef(onScan);
  const busyRef = useRef(busy);
  const txRef = useRef(tx);
  txRef.current = tx;
  const acceptingRef = useRef(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [flash, setFlash] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    busyRef.current = busy;
    if (!busy) acceptingRef.current = true;
  }, [busy]);

  useEffect(() => {
    if (!open) return;
    const video = videoRef.current;
    if (!video) return;

    let disposed = false;
    acceptingRef.current = true;
    setError(null);
    setStarting(true);
    setFlash(false);
    setHasFlash(false);

    const scanner = new QrScanner(
      video,
      (result) => {
        if (busyRef.current || !acceptingRef.current) return;
        acceptingRef.current = false;
        onScanRef.current(result.data);
      },
      {
        preferredCamera: "environment",
        maxScansPerSecond: 10,
        calculateScanRegion: visibleScanRegion,
        highlightScanRegion: true,
        highlightCodeOutline: true,
        returnDetailedScanResult: true,
        onDecodeError: () => undefined,
      },
    );
    scannerRef.current = scanner;
    const stopOverlay = keepOverlayInPlace(scanner, video);

    void scanner
      .start()
      .then(async () => {
        if (disposed) return;
        setStarting(false);
        setHasFlash(await scanner.hasFlash().catch(() => false));
      })
      .catch((err) => {
        if (disposed) return;
        setStarting(false);
        setError(cameraError(err, txRef.current));
      });

    return () => {
      disposed = true;
      stopOverlay();
      scanner.destroy();
      if (scannerRef.current === scanner) scannerRef.current = null;
    };
  }, [open]);

  async function toggleFlash() {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      await scanner.toggleFlash();
      setFlash(scanner.isFlashOn());
    } catch {
      setError(tx("Não foi possível ligar a lanterna."));
    }
  }

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} title={resolvedTitle} width={560} fullscreenOnMobile>
      <div className="qr-scanner">
        <header className="qr-scanner__head">
          <div>
            <h2 className="cat-form__title"><QrGlyph /> {resolvedTitle}</h2>
            <p className="cat-hint">{resolvedHint}</p>
          </div>
          <button type="button" className="qr-scanner__close" aria-label={tx("Fechar câmera")} title={tx("Fechar")} disabled={busy} onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="qr-scanner__viewport">
          <video ref={videoRef} className="qr-scanner__video" playsInline muted />
          {(starting || busy) && (
            <div className="qr-scanner__status" role="status">
              <span className="qr-scanner__spinner" aria-hidden="true" />
              {busy ? tx("Fazendo check-in…") : tx("Abrindo câmera…")}
            </div>
          )}
        </div>

        {error && <p className="message message--error">{error}</p>}
        {children}

        <div className="qr-scanner__actions">
          {hasFlash && (
            <button type="button" className="button button--secondary" disabled={busy} aria-pressed={flash} onClick={toggleFlash}>
              {flash ? tx("🔦 Desligar lanterna") : tx("🔦 Ligar lanterna")}
            </button>
          )}
          <button type="button" className="button button--secondary" disabled={busy} onClick={onClose}>
            {tx("Cancelar")}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function cameraError(err: unknown, tx: (pt: string, vars?: Record<string, string | number>) => string): string {
  const name = typeof err === "object" && err && "name" in err ? String((err as { name: unknown }).name) : "";
  if (name === "NotAllowedError") return tx("Permita o acesso à câmera nas configurações do navegador e tente novamente.");
  if (name === "NotFoundError") return tx("Nenhuma câmera foi encontrada neste aparelho.");
  if (name === "NotReadableError") return tx("A câmera está sendo usada por outro aplicativo.");
  if (!window.isSecureContext) return tx("A câmera só funciona em uma conexão segura (HTTPS).");
  return tx("Não foi possível abrir a câmera. Confira a permissão e tente novamente.");
}
