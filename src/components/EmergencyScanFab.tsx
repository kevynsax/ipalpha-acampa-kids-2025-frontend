import { useCallback, useState } from "react";
import { ApiError } from "../api/client";
import { lookupCamper, type Camper } from "../api/campers";
import { camperIdFromQr } from "../print/camperLabels";
import CamperDetail from "../pages/admin/CamperDetail";
import Dialog from "./Dialog";
import QrScannerDialog from "./QrScannerDialog";
import { QrGlyph } from "./Glyph";

interface EmergencyScanFabProps {
  token: string;
}

/**
 * App-wide FAB: any team member / admin can scan a kid's badge for an
 * emergency (lost child, needs help…). Hidden on the Placar tab so it never
 * fights the score-helper's own "Ler crachás" FAB. The server is the source
 * of truth for scope + counters; out-of-scope kids come back with a warning.
 */
export default function EmergencyScanFab({ token }: EmergencyScanFabProps) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    camper: Camper;
    belonged: boolean;
    foreignLookupCount: number;
    bedroom?: { id: string; name: string; group: "girls" | "boys" | "staff" } | null;
    caretaker?: { id: string; name: string } | null;
  } | null>(null);

  const onScan = useCallback(
    async (raw: string) => {
      const id = camperIdFromQr(raw);
      if (!id) {
        setError("Esse QR code não é de um crachá / pulseira do Acampa Kids.");
        setScannerOpen(false);
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const res = await lookupCamper(token, id);
        setScannerOpen(false);
        setResult({
          camper: res.camper,
          belonged: res.belonged,
          foreignLookupCount: res.foreignLookupCount,
          bedroom: res.bedroom,
          caretaker: res.caretaker,
        });
      } catch (e) {
        setScannerOpen(false);
        if (e instanceof ApiError) setError(e.message);
        else setError(e instanceof Error ? e.message : "Não foi possível ler o crachá.");
      } finally {
        setBusy(false);
      }
    },
    [token],
  );

  function closeResult() {
    setResult(null);
  }

  return (
    <>
      <button
        type="button"
        className="fab fab--emergency fab--icon"
        title="Ler crachá de qualquer criança (emergência)"
        aria-label="Ler crachá de qualquer criança"
        onClick={() => {
          setError(null);
          setScannerOpen(true);
        }}
      >
        <span className="fab__icon" aria-hidden="true">
          <QrGlyph size="1.5em" />
        </span>
      </button>

      <QrScannerDialog open={scannerOpen} busy={busy} onScan={(v) => void onScan(v)} onClose={() => !busy && setScannerOpen(false)} />

      {error && (
        <Dialog open onClose={() => setError(null)} title="Não deu para ler" width={420}>
          <p className="message message--error">{error}</p>
          <div className="cat-form__actions">
            <button type="button" className="button button--secondary" onClick={() => setError(null)}>
              Fechar
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => {
                setError(null);
                setScannerOpen(true);
              }}
            >
              Tentar de novo
            </button>
          </div>
        </Dialog>
      )}

      {result && (
        <Dialog open onClose={closeResult} title={result.camper.name.split(" ")[0]} width={720}>
          {!result.belonged && (
            <p className="message message--warn">
              ⚠️ Esta criança <strong>não é do seu quarto</strong>. Use só em emergência
              {result.foreignLookupCount > 0 ? ` (leitura fora do escopo nº ${result.foreignLookupCount})` : ""}.
            </p>
          )}
          <CamperDetail
            token={token}
            camperId={result.camper.id}
            camperOverride={result.camper}
            bedroomOverride={result.bedroom}
            caretakerOverride={result.caretaker}
            nav={{ crumbs: [{ label: "Busca", onClick: closeResult }, { label: "Criança" }], setTitle: () => undefined }}
          />
          <div className="cat-form__actions">
            <button type="button" className="button button--secondary" onClick={closeResult}>
              Fechar
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => {
                setResult(null);
                setScannerOpen(true);
              }}
            >
              Ler outro
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
