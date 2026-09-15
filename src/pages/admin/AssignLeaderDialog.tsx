import RoomRoleIcon from "../../components/RoomRoleIcon";
import { useEffect, useMemo, useRef, useState } from "react";
import { bedroomLabel } from "../../api/bedrooms";
import BedroomTag from "../../components/BedroomTag";
import { moveCamper, updateCamper, type Camper, type CamperSex } from "../../api/campers";
import { ROOM_ROLE_META, staffSex, updateStaff, type Staff } from "../../api/staff";
import { useConfirm } from "../../components/ConfirmDialog";
import Dialog from "../../components/Dialog";
import { useCollectionOrEmpty } from "../../store";

interface AssignLeaderDialogProps {
  token: string;
  open: boolean;
  camper: Camper;
  onClose: () => void;
}

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

type Group = "roomLeaders" | "roomHelpers" | "others" | "staffWing" | "otherSex";
const GROUP_LABEL: Record<Group, string> = {
  roomLeaders: "Líderes do quarto",
  roomHelpers: "Auxiliares do quarto",
  others: "Resto da equipe",
  staffWing: "Ala da equipe",
  otherSex: "Outro sexo",
};

const SEX_LABEL: Record<CamperSex, string> = { F: "feminino", M: "masculino" };

/**
 * Admin: pick a kid's líder. Search-as-you-type over the team of the kid's
 * sex (from the wing of the room each person sleeps in) — the room's
 * caretakers first, then the room's helpers, then everyone else, then the
 * staff wing (an exception: a parent on the team, say — the kid would sleep
 * there). When nothing of the kid's sex matches, the other sex is offered in
 * red and confirmed before saving. The staff member never moves: a helper is
 * promoted to caretaker of their room and, when the líder sleeps elsewhere,
 * the KID changes room (asked first).
 */
export default function AssignLeaderDialog({ token, open, camper: k, onClose }: AssignLeaderDialogProps) {
  const staff = useCollectionOrEmpty("staff");
  const bedrooms = useCollectionOrEmpty("bedrooms");
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setCursor(0);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const room = k.bedroom ? bedrooms.find((b) => b.id === k.bedroom) : undefined;
  const kidSex: CamperSex | null = k.sex ?? (room?.group === "girls" ? "F" : room?.group === "boys" ? "M" : null);

  const results = useMemo(() => {
    const nq = normalize(q.trim());
    const byName = (a: Staff, b: Staff) => a.name.localeCompare(b.name, "pt-BR");
    // anyone with a room; the staff wing (no sex) is the exception at the end — a parent on the team, say
    const pool = staff.filter((s) => !s.redacted && !!s.bedroom && s.id !== k.caretakerId && (!nq || normalize(s.name).includes(nq)));
    const sexOf = (s: Staff) => staffSex(s, bedrooms);
    const compatible = (s: Staff) => !kidSex || sexOf(s) === kidSex;
    const same = pool.filter(compatible);
    const inRoom = (s: Staff) => !!k.bedroom && s.bedroom === k.bedroom;
    const all: { group: Group; items: Staff[] }[] = [
      { group: "roomLeaders", items: same.filter((s) => inRoom(s) && s.roomRole === "caretaker").sort(byName) },
      { group: "roomHelpers", items: same.filter((s) => inRoom(s) && s.roomRole !== "caretaker").sort(byName) },
      { group: "others", items: same.filter((s) => !inRoom(s)).sort(byName) },
      { group: "staffWing", items: pool.filter((s) => sexOf(s) === null && !inRoom(s)).sort(byName) },
    ];
    const groups = all.filter((g) => g.items.length > 0);
    if (!groups.some((g) => g.group !== "staffWing") && kidSex) {
      const other = pool.filter((s) => sexOf(s) !== null && !compatible(s)).sort(byName);
      if (other.length) groups.push({ group: "otherSex", items: other });
    }
    return groups;
  }, [staff, bedrooms, q, kidSex, k.bedroom, k.caretakerId]);

  const flat = useMemo(() => results.flatMap((g) => g.items.map((s) => ({ s, group: g.group }))), [results]);
  useEffect(() => setCursor(0), [q]);

  async function pick(s: Staff) {
    if (busy) return;
    const first = s.name.split(" ")[0];
    const kid = k.name.split(" ")[0];
    const sRoom = s.bedroom ? bedrooms.find((b) => b.id === s.bedroom) : undefined;

    // the other sex was offered only because nobody of the kid's sex matched: make sure
    const sSex = staffSex(s, bedrooms);
    if (kidSex && sSex && sSex !== kidSex) {
      const ok = await confirm({
        emoji: "⚠️",
        danger: true,
        title: `${first} é do sexo ${SEX_LABEL[sSex]}. Confirmar como líder de ${kid}?`,
        message: `${kid} é do sexo ${SEX_LABEL[kidSex]}. Confira se é isso mesmo antes de continuar.`,
        confirmLabel: "Sim, confirmar",
      });
      if (!ok) return;
    }

    // the staff member never moves: the kid goes to the líder's room when they differ
    if (!sRoom) return;
    const changeRoom = s.bedroom !== k.bedroom;
    if (changeRoom) {
      const toStaffWing = sRoom.group === "staff";
      const from = room ? `${kid} sai do quarto ${bedroomLabel(room)}` : `${kid} ainda não tem quarto`;
      const ok = await confirm({
        emoji: toStaffWing ? "⚠️" : "🛏️",
        danger: toStaffWing,
        title: `Mudar ${kid} para o quarto ${bedroomLabel(sRoom)}?`,
        message: toStaffWing ? "Este é um quarto da EQUIPE, não de crianças." : `${from} e vai para o quarto de ${first}.`,
        confirmLabel: "Mudar de quarto",
      });
      if (!ok) return;
    }

    setBusy(true);
    setError(null);
    try {
      // a helper becomes a líder of their own room
      if (s.roomRole !== "caretaker") await updateStaff(token, s.id, { roomRole: "caretaker" });
      if (changeRoom) await moveCamper(token, k.id, sRoom.id, s.id);
      else await updateCamper(token, k.id, { caretakerId: s.id });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(flat.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = flat[cursor];
      if (hit) void pick(hit.s);
    }
  }

  let index = -1;
  return (
    <Dialog open={open} onClose={onClose} title="Escolher líder" width={520}>
      <div className="picker">
        <h2 className="cat-form__title">
          <RoomRoleIcon role="caretaker" /> Quem vai cuidar {kidSex === "F" ? "da" : kidSex === "M" ? "do" : "do(a)"} {k.name.split(" ")[0]}?
        </h2>
        <input
          ref={inputRef}
          className="cat-input"
          type="search"
          placeholder="Digite o nome…"
          value={q}
          disabled={busy}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
          aria-label="Buscar pessoa"
        />
        {kidSex && (
          <p className="cat-hint">
            Equipe do sexo {SEX_LABEL[kidSex]}
            {room ? <> · <BedroomTag bedroom={room} className="staff-tag--inline" /></> : " · sem quarto"}
          </p>
        )}
        {error && <p className="message message--error">{error}</p>}
        {flat.length === 0 ? (
          <p className="opt-empty">Ninguém encontrado.</p>
        ) : (
          <ul className="picker__list" role="listbox">
            {results.map((g) => (
              <li key={g.group} className={`picker__group ${g.group === "otherSex" ? "picker__group--other" : ""}`}>
                <p className="picker__group-title">
                  {g.group === "otherSex" ? "⚠️ " : ""}
                  {GROUP_LABEL[g.group]}
                  {g.group === "otherSex" && kidSex && <span className="picker__group-hint">ninguém do sexo {SEX_LABEL[kidSex]} encontrado</span>}
                </p>
                <ul className="picker__list">
                  {g.items.map((s) => {
                    index += 1;
                    const i = index;
                    const sRoom = s.bedroom ? bedrooms.find((b) => b.id === s.bedroom) : undefined;
                    const isOther = g.group === "otherSex";
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={i === cursor}
                          disabled={busy}
                          className={`picker__item ${isOther ? "picker__item--other" : ""} ${i === cursor ? "picker__item--cursor" : ""}`}
                          onMouseEnter={() => setCursor(i)}
                          onClick={() => void pick(s)}
                        >
                          <span className="picker__name">{s.name}</span>
                          <span className="picker__meta">
                            <RoomRoleIcon role={s.roomRole} /> {ROOM_ROLE_META[s.roomRole].label}
                            {g.group !== "roomLeaders" && g.group !== "roomHelpers" && (sRoom ? <BedroomTag bedroom={sRoom} className="staff-tag--inline" /> : <span className="picker__busy-where">sem quarto</span>)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
        <div className="cat-form__actions">
          <button type="button" className="button button--secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
        </div>
      </div>
    </Dialog>
  );
}
