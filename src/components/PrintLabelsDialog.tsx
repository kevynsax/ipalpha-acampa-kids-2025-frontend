import { useEffect, useState } from "react";
import Dialog from "./Dialog";
import type { Bedroom } from "../api/bedrooms";
import type { Camper } from "../api/campers";
import { LABEL_META, printLabels, type LabelKind } from "../print/camperLabels";

interface PrintLabelsDialogProps {
  open: boolean;
  onClose: () => void;
  /** the kids to print (already filtered by the list) */
  campers: Camper[];
  /** the whole list, offered as an alternative when a filter is on */
  allCampers: Camper[];
  bedrooms: Bedroom[];
  labelOf: (id: string | null | undefined) => string | null;
}

const KINDS: LabelKind[] = ["badge", "bracelet"];

/** labels per print job — label printers choke on big spools, so we go 50 at a time */
export const BATCH_SIZE = 50;

/**
 * "Imprimir" popup: choose crachá or pulseira, whether to print the filtered
 * or the whole list, and — for long lists — which batch of 50 (a stepper that
 * moves to the next batch after each print).
 */
export default function PrintLabelsDialog({ open, onClose, campers, allCampers, bedrooms, labelOf }: PrintLabelsDialogProps) {
  const [kind, setKind] = useState<LabelKind>("badge");
  const [scope, setScope] = useState<"filtered" | "all">("filtered");
  const [batch, setBatch] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** batches printed in this session (ticks on the stepper) */
  const [done, setDone] = useState<Set<number>>(new Set());

  const filtered = campers.length !== allCampers.length;
  const list = scope === "all" || !filtered ? allCampers : campers;
  const batches = Math.max(1, Math.ceil(list.length / BATCH_SIZE));
  const batched = batches > 1;
  const start = batch * BATCH_SIZE;
  const slice = batched ? list.slice(start, start + BATCH_SIZE) : list;

  // the list changed under us (scope switch / filter) → back to the first batch
  useEffect(() => {
    setBatch(0);
    setDone(new Set());
  }, [scope, list.length, kind]);

  // fresh start every time the dialog opens
  useEffect(() => {
    if (open) {
      setBatch(0);
      setDone(new Set());
      setError(null);
    }
  }, [open]);

  async function handlePrint() {
    setBusy(true);
    setError(null);
    try {
      await printLabels(kind, slice, bedrooms, labelOf);
      if (!batched) {
        onClose();
        return;
      }
      // tick this batch and step to the next one (stay on the last)
      setDone((d) => new Set(d).add(batch));
      if (batch < batches - 1) setBatch(batch + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível imprimir.");
    } finally {
      setBusy(false);
    }
  }

  const noun = (n: number) => (n === 1 ? LABEL_META[kind].title.toLowerCase() : `${LABEL_META[kind].title.toLowerCase()}s`);
  const allDone = batched && done.size === batches;

  return (
    <Dialog open={open} onClose={onClose} title="Imprimir" width={480}>
      <div className="cat-form cat-form--embedded print-dialog">
        <h2 className="cat-form__title">
          <span aria-hidden="true">🖨️</span> O que imprimir?
        </h2>

        <div className="print-dialog__kinds" role="radiogroup" aria-label="Tipo de etiqueta">
          {KINDS.map((k) => {
            const m = LABEL_META[k];
            const active = kind === k;
            return (
              <button key={k} type="button" role="radio" aria-checked={active} className={`print-kind ${active ? "print-kind--active" : ""}`} onClick={() => setKind(k)} disabled={busy}>
                <span className="print-kind__emoji" aria-hidden="true">
                  {m.emoji}
                </span>
                <span className="print-kind__text">
                  <strong>{m.title}</strong>
                </span>
              </button>
            );
          })}
        </div>

        {filtered && (
          <div className="print-dialog__scope" role="radiogroup" aria-label="Quem imprimir">
            <label className="print-scope">
              <input type="radio" name="print-scope" checked={scope === "filtered"} onChange={() => setScope("filtered")} disabled={busy} />
              <span>
                Só os filtrados <em>({campers.length})</em>
              </span>
            </label>
            <label className="print-scope">
              <input type="radio" name="print-scope" checked={scope === "all"} onChange={() => setScope("all")} disabled={busy} />
              <span>
                Todos os acampantes <em>({allCampers.length})</em>
              </span>
            </label>
          </div>
        )}

        {batched && (
          <div className="print-batch" role="group" aria-label="Lote">
            <div className="print-batch__stepper">
              <button type="button" className="icon-btn print-batch__arrow" aria-label="Lote anterior" disabled={busy || batch === 0} onClick={() => setBatch(batch - 1)}>
                ◀
              </button>
              <div className="print-batch__label">
                <strong>
                  Lote {batch + 1} de {batches}
                </strong>
                <small>
                  {slice[0]?.name.split(" ")[0]} … {slice[slice.length - 1]?.name.split(" ")[0]} · {start + 1}–{start + slice.length}
                </small>
              </div>
              <button type="button" className="icon-btn print-batch__arrow" aria-label="Próximo lote" disabled={busy || batch === batches - 1} onClick={() => setBatch(batch + 1)}>
                ▶
              </button>
            </div>
            <ol className="print-batch__dots" aria-label="Lotes impressos">
              {Array.from({ length: batches }, (_, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className={`print-batch__dot ${i === batch ? "print-batch__dot--current" : ""} ${done.has(i) ? "print-batch__dot--done" : ""}`}
                    title={`Lote ${i + 1}${done.has(i) ? " · impresso" : ""}`}
                    aria-label={`Lote ${i + 1}${done.has(i) ? ", impresso" : ""}`}
                    aria-current={i === batch ? "step" : undefined}
                    disabled={busy}
                    onClick={() => setBatch(i)}
                  >
                    {done.has(i) ? "✓" : i + 1}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}

        <p className="print-dialog__hint">
          {batched
            ? `A lista sai em lotes de ${BATCH_SIZE} — imprima um lote de cada vez; depois de imprimir, o próximo já fica selecionado. Confira o tamanho do papel (${LABEL_META[kind].size}).`
            : `Cada criança sai numa página do tamanho da etiqueta — escolha a impressora de etiquetas e confira o tamanho do papel (${LABEL_META[kind].size}).`}
        </p>

        {error && <p className="message message--error">{error}</p>}

        <div className="cat-form__actions">
          <button type="button" className="button button--secondary" onClick={onClose} disabled={busy}>
            {allDone ? "Fechar" : "Cancelar"}
          </button>
          <button type="button" className="button button--primary" onClick={handlePrint} disabled={busy || slice.length === 0} autoFocus>
            {busy ? "Preparando…" : batched ? `🖨️ Imprimir lote ${batch + 1} (${slice.length} ${noun(slice.length)})` : `🖨️ Imprimir ${slice.length} ${noun(slice.length)}`}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
