import { useEffect, useMemo, useState } from "react";
import { GROUP_META, bedroomLabel } from "../../api/bedrooms";
import { moveCamper, type Camper } from "../../api/campers";
import { ROOM_ROLE_META } from "../../api/staff";
import { BedroomSelect } from "../../components/CategoryFields";
import Dialog from "../../components/Dialog";
import { useCollectionOrEmpty } from "../../store";

interface ChangeRoomDialogProps {
  token: string;
  open: boolean;
  camper: Camper;
  onClose: () => void;
}

/**
 * Admin: move a kid to another room and pick WHO looks after them there.
 * Only the CARETAKERS of the chosen room are offered, as big tap targets
 * (most rooms have one or two). With exactly one caretaker nothing is asked —
 * it is picked for you. With none the kid becomes an orphan (warned).
 * Works on the current room too: to hand the kid to another caretaker.
 */
export default function ChangeRoomDialog({ token, open, camper: k, onClose }: ChangeRoomDialogProps) {
  const bedrooms = useCollectionOrEmpty("bedrooms");
  const staff = useCollectionOrEmpty("staff");
  const [bedroom, setBedroom] = useState<string | null>(k.bedroom);
  const [caretakerId, setCaretakerId] = useState<string | null>(k.caretakerId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setBedroom(k.bedroom);
      setCaretakerId(k.caretakerId);
      setError(null);
    }
  }, [open, k.bedroom, k.caretakerId]);

  const room = bedroom ? bedrooms.find((b) => b.id === bedroom) : null;
  const caretakers = useMemo(
    () => (bedroom ? staff.filter((s) => s.active && s.bedroom === bedroom && s.roomRole === "caretaker").sort((a, b) => a.name.localeCompare(b.name, "pt-BR")) : []),
    [staff, bedroom],
  );
  const helpers = useMemo(() => (bedroom ? staff.filter((s) => s.active && s.bedroom === bedroom && s.roomRole === "helper") : []), [staff, bedroom]);

  // one caretaker → no question asked; none → orphan; the current one stays selected when still valid
  useEffect(() => {
    if (caretakers.length === 1) setCaretakerId(caretakers[0].id);
    else if (!caretakers.some((s) => s.id === caretakerId)) setCaretakerId(null);
  }, [caretakers, caretakerId]);

  const changed = bedroom !== k.bedroom || caretakerId !== k.caretakerId;
  const needsPick = caretakers.length > 1 && !caretakerId;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await moveCamper(token, k.id, bedroom, caretakerId);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Trocar de quarto" width={560}>
      <div className="cat-form">
        <h2 className="cat-form__title">🔄 {k.name.split(" ")[0]}: quarto e responsável</h2>

        <BedroomSelect bedrooms={bedrooms} value={bedroom} onChange={setBedroom} current={k.bedroom} groups={["girls", "boys"]} disabled={busy} />

        {bedroom && (
          <fieldset className="cat-fieldset">
            <legend className="cat-field__label">
              {ROOM_ROLE_META.caretaker.emoji} Quem cuida de {k.name.split(" ")[0]} no quarto {room ? bedroomLabel(room) : ""}?
            </legend>
            {caretakers.length === 0 && (
              <p className="message message--warn">
                ⚠️ Nenhum responsável neste quarto{helpers.length ? ` (só auxiliares: ${helpers.map((h) => h.name.split(" ")[0]).join(", ")})` : ""}. A criança ficará <strong>sem responsável</strong>.
              </p>
            )}
            {caretakers.length === 1 && (
              <p className="cat-hint">
                Único responsável do quarto: <strong>{caretakers[0].name}</strong>.
              </p>
            )}
            {caretakers.length > 1 && (
              <div className="big-options">
                {caretakers.map((s) => {
                  const on = caretakerId === s.id;
                  return (
                    <button key={s.id} type="button" className={`big-option ${on ? "big-option--on" : ""}`} aria-pressed={on} disabled={busy} onClick={() => setCaretakerId(s.id)}>
                      <span className="big-option__emoji" aria-hidden="true">
                        {ROOM_ROLE_META.caretaker.emoji}
                      </span>
                      <span className="big-option__label">{s.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>
        )}
        {!bedroom && <p className="cat-hint">Sem quarto a criança fica sem responsável.</p>}
        {room && <p className="cat-hint">{GROUP_META[room.group].emoji} {GROUP_META[room.group].label} · quarto {room.name}</p>}

        {error && <p className="message message--error">{error}</p>}

        <div className="cat-form__actions">
          <button type="button" className="button button--secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="button button--primary" disabled={busy || !changed || needsPick} onClick={submit}>
            {busy ? "Salvando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
