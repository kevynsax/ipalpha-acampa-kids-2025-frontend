import type { DragEventHandler, PointerEventHandler, ReactNode } from "react";
import type { Camper } from "../api/campers";
import { useI18n } from "../i18n";
import type { KidUnit, PreferenceMap } from "../roomGroups";

interface Props {
  unit: KidUnit;
  prefs: PreferenceMap;
  busy?: boolean;
  draggable?: boolean;
  onGroupPointerDown?: PointerEventHandler<HTMLDivElement>;
  onGroupDragStart?: DragEventHandler<HTMLDivElement>;
  onGroupDragEnd?: DragEventHandler<HTMLDivElement>;
  /** shared chip renderer; callers add pointer/native drag behavior around the same UI */
  renderCamper: (camper: Camper, state: { grouped: boolean; missing: boolean; noPreference: boolean }) => ReactNode;
  action?: ReactNode;
  /** show the "✗ name" rows for unmatched preferences (default on; off once the kid is placed) */
  showMissing?: boolean;
}

/** Shared bedroom-preference group card for Montar quartos and Montar times. */
export default function PreferenceGroupCard({ unit, prefs, busy = false, draggable, onGroupPointerDown, onGroupDragStart, onGroupDragEnd, renderCamper, action, showMissing = true }: Props) {
  const { tx } = useI18n();
  const grouped = unit.members.length > 1;
  const hasPreference = (id: string) => (prefs.get(id) ?? []).length > 0;
  // the yellow "someone is missing" ring follows the rows: both hide together
  const missing = (id: string) => showMissing && !grouped && (prefs.get(id) ?? []).some((pref) => !pref.camperId);
  return <div className={`preference-group${grouped ? " preference-group--grouped" : ""}${busy ? " preference-group--saving" : ""}`} draggable={!!draggable && !busy} onPointerDown={grouped ? onGroupPointerDown : undefined} onDragStart={grouped ? onGroupDragStart : undefined} onDragEnd={grouped ? onGroupDragEnd : undefined} role={grouped ? "group" : undefined} aria-label={grouped ? tx("Grupo por preferência de quarto") : undefined}>
    <div className="preference-group__chips">{unit.members.map((camper) => renderCamper(camper, { grouped, missing: missing(camper.id), noPreference: !hasPreference(camper.id) }))}</div>
    {action}
    {showMissing && <MissingPreferenceRows members={unit.members} prefs={prefs} />}
  </div>;
}

function MissingPreferenceRows({ members, prefs }: { members: Camper[]; prefs: PreferenceMap }) {
  const rows = members.map((camper) => ({ camper, list: (prefs.get(camper.id) ?? []).filter((pref) => !pref.camperId) })).filter((row) => row.list.length > 0);
  if (!rows.length) return null;
  return <div className="preference-group__prefs">{rows.map(({ camper, list }) => <span key={camper.id} className="assign-pref-line">{rows.length > 1 && <em className="assign-pref-line__owner">{camper.name.split(" ")[0]}:</em>}{list.map((pref, index) => <span key={`${pref.raw}-${index}`} className={`assign-pref ${pref.ambiguous ? "assign-pref--ambiguous" : "assign-pref--missing"}`} title={pref.ambiguous ? "Mais de uma criança com esse nome — escreva o sobrenome" : "Ninguém com esse nome"}>{pref.ambiguous ? "?" : "✗"} {pref.raw}{pref.note && <small className="assign-pref__note"> ({pref.note})</small>}</span>)}</span>)}</div>;
}
