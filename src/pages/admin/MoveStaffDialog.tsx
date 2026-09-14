import RoomRoleIcon from "../../components/RoomRoleIcon";
import { useEffect, useMemo, useState } from "react";
import { bedroomLabel } from "../../api/bedrooms";
import { compareRoomStaff, moveStaff, ROOM_ROLE_META, type MoveKids, type Staff } from "../../api/staff";
import { BedroomSelect } from "../../components/CategoryFields";
import Dialog from "../../components/Dialog";
import { ICONS } from "../../icons";
import { useCollectionOrEmpty } from "../../store";

interface MoveStaffDialogProps {
  token: string;
  open: boolean;
  member: Staff;
  onClose: () => void;
}

const OPTIONS: { key: MoveKids; emoji?: string; icon?: string; label: string; hint: string }[] = [
  { key: "swap", icon: ICONS.leaderFace, label: "Trocar com alguém", hint: "a outra pessoa vem para cá e assume estas crianças; ela leva as dela" },
  { key: "bring", emoji: "🧳", label: "Levar as crianças junto", hint: "as crianças mudam de quarto com a pessoa" },
  { key: "assign", emoji: "🤝", label: "Passar para outra pessoa", hint: "as crianças ficam e alguém do quarto assume (um auxiliar vira líder)" },
  { key: "orphan", emoji: "⚠️", label: "Deixar sem líder", hint: "as crianças ficam no quarto sem líder, para resolver depois" },
];

/**
 * Admin: move a team member to another room. The destination room is chosen
 * FIRST; only then, for a CARETAKER with kids, the dialog asks what happens to
 * them (swap / bring / assign / orphan). Nothing is ever picked by default —
 * in particular a helper is only promoted to leader when explicitly chosen.
 */
export default function MoveStaffDialog({ token, open, member: s, onClose }: MoveStaffDialogProps) {
  const bedrooms = useCollectionOrEmpty("bedrooms");
  const staff = useCollectionOrEmpty("staff");
  const campers = useCollectionOrEmpty("campers");
  const [bedroom, setBedroom] = useState<string | null>(s.bedroom);
  /** the room question is answered only after the user touches the select */
  const [roomPicked, setRoomPicked] = useState(false);
  const [kids, setKids] = useState<MoveKids | null>(null);
  const [person, setPerson] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setBedroom(s.bedroom);
      setRoomPicked(false);
      setKids(null);
      setPerson(null);
      setError(null);
    }
  }, [open, s.bedroom]);

  const myKids = useMemo(() => campers.filter((k) => k.caretakerId === s.id), [campers, s.id]);
  const hasKids = s.roomRole === "caretaker" && myKids.length > 0;
  const target = bedroom ? bedrooms.find((b) => b.id === bedroom) : null;
  const sameRoom = bedroom === s.bedroom;
  /** a full destination can still be chosen — but then the only way in is a swap */
  const targetFull = !!target && !sameRoom && target.available <= 0;
  /** people to swap with: anyone of the TARGET room; to assign: anyone of MY room */
  const candidates = useMemo(() => {
    const room = kids === "swap" ? bedroom : s.bedroom;
    return room ? staff.filter((x) => x.id !== s.id && x.bedroom === room).sort(compareRoomStaff) : [];
  }, [staff, kids, bedroom, s.bedroom, s.id]);
  const kidsOf = (id: string) => campers.filter((k) => k.caretakerId === id).length;

  // never pre-select anybody: promoting a helper to leader must be an explicit
  // choice. Only clear the pick when that person stops being a candidate — the
  // array identity changes on every render, so key off the ids instead.
  const candidateIds = candidates.map((x) => x.id).join(",");
  useEffect(() => {
    setPerson((p) => (p && candidateIds.split(",").includes(p) ? p : null));
  }, [candidateIds]);

  function chooseRoom(id: string | null) {
    setBedroom(id);
    setRoomPicked(true);
    setKids(null);
  }

  const askKids = hasKids && roomPicked;
  const needsPerson = askKids && (kids === "swap" || kids === "assign");
  const valid = !roomPicked
    ? false
    : hasKids
      ? kids === "assign"
        ? !!person
        : !sameRoom && (kids === "orphan" || (kids === "bring" && !!bedroom) || (kids === "swap" && !!person))
      : !sameRoom && !targetFull;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const mode: MoveKids = hasKids && kids ? kids : "orphan";
      await moveStaff(token, s.id, { bedroom, kids: mode, ...(mode === "swap" && person ? { swapWith: person } : {}), ...(mode === "assign" && person ? { assignTo: person } : {}) });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Trocar de quarto" width={600}>
      <div className="cat-form cat-form--plain">
        <h2 className="cat-form__title change-room__title">
          <img className="admin-title__icon" src={ICONS.swap} alt="" aria-hidden="true" /> Trocar de quarto
        </h2>

        <BedroomSelect bedrooms={bedrooms} value={bedroom} onChange={chooseRoom} current={s.bedroom} allowFull disabled={busy} />

        {askKids && (
          <fieldset className="cat-fieldset change-room__caretaker">
            <legend className="cat-field__label">
              <RoomRoleIcon role="caretaker" /> E as {myKids.length} criança{myKids.length > 1 ? "s" : ""} sob sua responsabilidade?
            </legend>
            <div className="big-options">
              {OPTIONS.filter((o) => (sameRoom ? o.key === "assign" : targetFull ? o.key === "swap" : true)).map((o) => {
                const on = kids === o.key;
                return (
                  <button key={o.key} type="button" className={`big-option ${on ? "big-option--on" : ""}`} aria-pressed={on} disabled={busy} onClick={() => setKids(o.key)}>
                    <span className="big-option__emoji" aria-hidden="true">
                      {o.icon ? <img src={o.icon} alt="" width={30} height={30} style={{ display: "block" }} /> : o.emoji}
                    </span>
                    <span className="big-option__label">{o.label}</span>
                    <span className="big-option__hint">{o.hint}</span>
                  </button>
                );
              })}
            </div>
            {sameRoom && <p className="cat-hint">No mesmo quarto só dá para passar as crianças para outra pessoa.</p>}
            {targetFull && <p className="cat-hint">O quarto de destino está lotado: só dá para trocar de lugar com alguém de lá.</p>}
          </fieldset>
        )}

        {needsPerson && (
          <fieldset className="cat-fieldset change-room__caretaker">
            <legend className="cat-field__label">{kids === "swap" ? `Quem vem do quarto ${target ? bedroomLabel(target) : ""}?` : "Quem assume as crianças?"}</legend>
            {candidates.length === 0 && <p className="message message--warn">⚠️ Ninguém da equipe {kids === "swap" ? "neste quarto de destino" : "no quarto atual"}.</p>}
            <div className="big-options">
              {candidates.map((x) => {
                const on = person === x.id;
                const n = kidsOf(x.id);
                return (
                  <button key={x.id} type="button" className={`big-option ${on ? "big-option--on" : ""}`} aria-pressed={on} disabled={busy} onClick={() => setPerson(x.id)}>
                    <span className="big-option__emoji" aria-hidden="true"><RoomRoleIcon role={x.roomRole} size={32} /></span>
                    <span className="big-option__label">{x.name}</span>
                    <span className="big-option__hint">
                      {ROOM_ROLE_META[x.roomRole].label}
                      {x.roomRole === "caretaker" && ` · ${n} criança${n === 1 ? "" : "s"}`}
                      {x.roomRole === "helper" && " · vira líder"}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {!hasKids && targetFull && <p className="message message--warn">⚠️ O quarto de destino está lotado — alguém precisa sair de lá antes.</p>}
        {!hasKids && s.roomRole === "caretaker" && <p className="cat-hint">Sem crianças sob responsabilidade: só a pessoa muda.</p>}
        {error && <p className="message message--error">{error}</p>}

        <div className="cat-form__actions">
          <button type="button" className="button button--secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="button button--primary" disabled={busy || !valid} onClick={submit}>
            {busy ? "Salvando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
