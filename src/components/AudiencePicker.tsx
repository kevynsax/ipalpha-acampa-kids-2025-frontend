import { ROOM_ROLE_META, type RoomRole } from "../api/staff";
import RoomRoleIcon from "./RoomRoleIcon";

/** Who a general document (Instruções / Preparação) is for. */
export type DocAudience = "all" | "caretaker" | "helper";

export const DOC_AUDIENCE_META: Record<DocAudience, { label: string; emoji: string; hint: string }> = {
  all: { label: "Todos", emoji: "👥", hint: "toda a equipe" },
  caretaker: { label: ROOM_ROLE_META.caretaker.label + "s", emoji: ROOM_ROLE_META.caretaker.emoji, hint: "só quem cuida de crianças" },
  helper: { label: ROOM_ROLE_META.helper.label + "es", emoji: ROOM_ROLE_META.helper.emoji, hint: "só os auxiliares de quarto" },
};

interface AudiencePickerProps {
  value: DocAudience;
  onChange: (v: DocAudience) => void;
  disabled?: boolean;
}

/** Three big tap targets: everyone / caretakers / helpers. */
export default function AudiencePicker({ value, onChange, disabled }: AudiencePickerProps) {
  return (
    <fieldset className="cat-fieldset">
      <legend className="cat-field__label">Quem vê</legend>
      <div className="big-options big-options--row">
        {(Object.keys(DOC_AUDIENCE_META) as DocAudience[]).map((a) => {
          const on = value === a;
          return (
            <button key={a} type="button" className={`big-option ${on ? "big-option--on" : ""}`} aria-pressed={on} disabled={disabled} onClick={() => onChange(a)}>
              <span className="big-option__emoji" aria-hidden="true">{a === "all" ? DOC_AUDIENCE_META[a].emoji : <RoomRoleIcon role={a as RoomRole} size={32} />}</span>
              <span className="big-option__label">{DOC_AUDIENCE_META[a].label}</span>
              <span className="big-option__hint">{DOC_AUDIENCE_META[a].hint}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

// ── Preparação: a section is POSTED to one or more groups (parents / caretakers / helpers) ──

export type PrepAudience = "parent" | "caretaker" | "helper";

export const PREP_AUDIENCE_META: Record<PrepAudience, { label: string; emoji: string; hint: string }> = {
  parent: { label: "Pais", emoji: "👨‍👩‍👧", hint: "ou responsáveis pelas crianças" },
  caretaker: { ...DOC_AUDIENCE_META.caretaker, hint: "quem cuida de crianças" },
  helper: { ...DOC_AUDIENCE_META.helper, hint: "os auxiliares de quarto" },
};
const PREP_ORDER: PrepAudience[] = ["parent", "caretaker", "helper"];

interface PrepAudiencePickerProps {
  value: PrepAudience[];
  onChange: (v: PrepAudience[]) => void;
  disabled?: boolean;
}

/** Multi-select: tap to post the section to each group (at least one). */
export function PrepAudiencePicker({ value, onChange, disabled }: PrepAudiencePickerProps) {
  const toggle = (a: PrepAudience) => onChange(PREP_ORDER.filter((x) => (x === a ? !value.includes(a) : value.includes(x))));
  return (
    <fieldset className="cat-fieldset">
      <legend className="cat-field__label">Publicar para</legend>
      <div className="big-options big-options--row">
        {PREP_ORDER.map((a) => {
          const on = value.includes(a);
          return (
            <button key={a} type="button" className={`big-option ${on ? "big-option--on" : ""}`} aria-pressed={on} disabled={disabled} onClick={() => toggle(a)}>
              <span className="big-option__emoji" aria-hidden="true">{PREP_AUDIENCE_META[a].emoji}</span>
              <span className="big-option__label">{PREP_AUDIENCE_META[a].label}</span>
              <span className="big-option__hint">{PREP_AUDIENCE_META[a].hint}</span>
            </button>
          );
        })}
      </div>
      {value.length === 0 && <p className="cat-hint">Escolha pelo menos um público.</p>}
    </fieldset>
  );
}

/** Tags for lists — one per group the section is posted to. */
export function PrepAudienceTags({ audiences }: { audiences: PrepAudience[] }) {
  return (
    <>
      {PREP_ORDER.filter((a) => audiences.includes(a)).map((a) => (
        <span key={a} className="staff-tag staff-tag--soft" title={PREP_AUDIENCE_META[a].hint}>
          {PREP_AUDIENCE_META[a].emoji} {PREP_AUDIENCE_META[a].label}
        </span>
      ))}
    </>
  );
}

/** Small tag for lists — nothing when the document is for everyone. */
export function AudienceTag({ audience }: { audience: DocAudience }) {
  if (audience === "all") return null;
  return (
    <span className="staff-tag staff-tag--soft" title={DOC_AUDIENCE_META[audience].hint}>
      {DOC_AUDIENCE_META[audience].emoji} {DOC_AUDIENCE_META[audience].label}
    </span>
  );
}
