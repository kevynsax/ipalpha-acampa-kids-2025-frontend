import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { ApiError } from "../api/client";
import { lookupCamper, type CamperLookupResult } from "../api/campers";
import { camperIdFromQr } from "../print/camperLabels";
import CamperDetail from "../pages/admin/CamperDetail";
import Dialog from "./Dialog";
import QrScannerDialog from "./QrScannerDialog";
import { QrGlyph } from "./Glyph";
import { ICONS } from "../icons";
import { goBack, useRoute } from "../router";
import Breadcrumbs from "./Breadcrumbs";

interface EmergencyScanFabProps {
  token: string;
  /** The badge route renders the scanner's result in the dashboard, not a dialog. */
  page?: boolean;
}

/**
 * App-wide FAB (kid + "Ler crachá" + QR): any team member / admin can scan
 * a kid's badge for an emergency (lost child, needs help…). Hidden on the
 * pages that carry their own yellow ScanFab (bulk points, church / bus
 * check-in) so the two never fight. The server is the source
 * of truth for scope + counters; out-of-scope kids come back with a warning.
 */
export default function EmergencyScanFab({ token, page = false }: EmergencyScanFabProps) {
  const { navigate } = useRoute();
  const [scannerOpen, setScannerOpen] = useState(page);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CamperLookupResult | null>(null);

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
        setResult(res);
        for (const selector of [".dash", ".dash-scroll"]) {
          const scroller = document.querySelector(selector);
          if (scroller) scroller.scrollTop = 0;
        }
        window.scrollTo({ top: 0 });
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

  function scanAnother() {
    setError(null);
    setResult(null);
    setScannerOpen(true);
  }

  function back() {
    goBack("/");
  }

  function closeScanner() {
    if (busy) return;
    setScannerOpen(false);
    // cancel with nothing read → the tab they were on, not the empty "Ler crachá" page
    if (page && !result && !error) back();
  }

  if (!page) {
    return createPortal(
      <button
        type="button"
        className="fab fab--emergency"
        title="Ler o crachá de qualquer criança (emergência)"
        aria-label="Ler o crachá de qualquer criança"
        onClick={() => navigate("/badge")}
      >
        <img className="fab__kid" src={ICONS.boyFace} alt="" aria-hidden="true" />
        <span className="fab__label">Ler crachá</span>
        <span className="fab__icon" aria-hidden="true">
          <QrGlyph size="1.4em" />
        </span>
      </button>,
      document.body,
    );
  }

  return (
    <div className="admin-page lookup-result">
      {!result && (
        <>
          <Breadcrumbs items={[{ label: "Voltar", onClick: back }, { label: "Ler crachá" }]} />
          <header className="admin-head">
            <h1 className="admin-title"><QrGlyph /> Ler crachá</h1>
            <button type="button" className="button button--primary" onClick={scanAnother}>
              Ler pulseira ou crachá
            </button>
          </header>
        </>
      )}

      <QrScannerDialog open={scannerOpen} busy={busy} onScan={(v) => void onScan(v)} onClose={closeScanner} />

      {error && (
        <Dialog open onClose={() => setError(null)} title="Não deu para ler" width={420}>
          <div className="cat-form cat-form--plain">
            <h2 className="cat-form__title">Não deu para ler</h2>
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
          </div>
        </Dialog>
      )}

      {result && (
        <>
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
            nav={{
              crumbs: [{ label: "Voltar", onClick: back }, { label: "Criança" }],
              setTitle: () => undefined,
            }}
          />
          <div className="cat-form__actions">
            <button type="button" className="button button--secondary" onClick={back}>
              Voltar
            </button>
            <button type="button" className="button button--primary" onClick={scanAnother}>
              Ler outro
            </button>
          </div>
        </>
      )}
    </div>
  );
}
