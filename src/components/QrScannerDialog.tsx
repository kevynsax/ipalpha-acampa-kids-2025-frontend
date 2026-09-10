import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import Dialog from "./Dialog";

interface QrScannerDialogProps {
  open: boolean;
  busy?: boolean;
  onScan: (value: string) => void;
  onClose: () => void;
}

/** Phone-camera QR reader. The camera only runs while the dialog is open. */
export default function QrScannerDialog({ open, busy = false, onScan, onClose }: QrScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const onScanRef = useRef(onScan);
  const busyRef = useRef(busy);
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
        highlightScanRegion: true,
        highlightCodeOutline: true,
        returnDetailedScanResult: true,
        onDecodeError: () => undefined,
      },
    );
    scannerRef.current = scanner;

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
        setError(cameraError(err));
      });

    return () => {
      disposed = true;
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
      setError("Não foi possível ligar a lanterna.");
    }
  }

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} title="Ler QR code" width={560}>
      <div className="qr-scanner">
        <header className="qr-scanner__head">
          <div>
            <h2 className="cat-form__title">📷 Ler pulseira ou crachá</h2>
            <p className="cat-hint">Aponte a câmera para o QR code. O check-in será feito automaticamente.</p>
          </div>
          <button type="button" className="qr-scanner__close" aria-label="Fechar câmera" title="Fechar" disabled={busy} onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="qr-scanner__viewport">
          <video ref={videoRef} className="qr-scanner__video" playsInline muted />
          {(starting || busy) && (
            <div className="qr-scanner__status" role="status">
              <span className="qr-scanner__spinner" aria-hidden="true" />
              {busy ? "Fazendo check-in…" : "Abrindo câmera…"}
            </div>
          )}
        </div>

        {error && <p className="message message--error">{error}</p>}

        <div className="qr-scanner__actions">
          {hasFlash && (
            <button type="button" className="button button--secondary" disabled={busy} aria-pressed={flash} onClick={toggleFlash}>
              {flash ? "🔦 Desligar lanterna" : "🔦 Ligar lanterna"}
            </button>
          )}
          <button type="button" className="button button--secondary" disabled={busy} onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function cameraError(err: unknown): string {
  const name = typeof err === "object" && err && "name" in err ? String((err as { name: unknown }).name) : "";
  if (name === "NotAllowedError") return "Permita o acesso à câmera nas configurações do navegador e tente novamente.";
  if (name === "NotFoundError") return "Nenhuma câmera foi encontrada neste aparelho.";
  if (name === "NotReadableError") return "A câmera está sendo usada por outro aplicativo.";
  if (!window.isSecureContext) return "A câmera só funciona em uma conexão segura (HTTPS).";
  return "Não foi possível abrir a câmera. Confira a permissão e tente novamente.";
}
