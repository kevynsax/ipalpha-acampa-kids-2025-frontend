import { ROOM_ROLE_META } from "../api/staff";

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
              <span className="big-option__emoji" aria-hidden="true">{DOC_AUDIENCE_META[a].emoji}</span>
              <span className="big-option__label">{DOC_AUDIENCE_META[a].label}</span>
              <span className="big-option__hint">{DOC_AUDIENCE_META[a].hint}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
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
