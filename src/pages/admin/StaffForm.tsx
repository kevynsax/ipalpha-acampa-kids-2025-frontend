import { useState } from "react";
import type { Category } from "../../api/categories";
import { CategoryChips } from "../../components/CategoryFields";
import { ROOM_ROLE_META, STAFF_CATEGORY_KEYS, type RoomRole, type Staff, type StaffInput } from "../../api/staff";
import { blankMedication, type Medication } from "../../api/campers";
import MedicationsEditor from "../../components/MedicationsEditor";
import PhoneInput from "../../components/PhoneInput";
import NoPillIcon from "../../components/NoPillIcon";
import Toggle from "../../components/Toggle";
import { maskBrazilPhone, toE164 } from "../../phone";

interface StaffFormProps {
  /** when editing, the existing member; when creating, undefined */
  member?: Staff;
  categories: Category[];
  busy?: boolean;
  onSubmit: (input: StaffInput) => Promise<void>;
  onCancel: () => void;
}

/**
 * Create / edit a team member. Team, room and transport are NOT here: they
 * are changed from the detail page (pencil dialogs). Each health
 * topic is a switch — off = nothing to declare (field hidden, cleared on save).
 */
export default function StaffForm({ member, categories, busy, onSubmit, onCancel }: StaffFormProps) {
  const editing = !!member;
  const byKey = (key: string) => categories.find((c) => c.key === key);

  const [name, setName] = useState(member?.name ?? "");
  const [phone, setPhone] = useState(member?.phone ? maskBrazilPhone(member.phone.replace(/^\+55/, "")) : "");
  const [active, setActive] = useState(member?.active ?? true);
  const [roomRole, setRoomRole] = useState<RoomRole>(member?.roomRole ?? "helper");
  const [allergies, setAllergies] = useState<string[]>(member?.allergies ?? []);
  const [drugAllergies, setDrugAllergies] = useState<string[]>(member?.drugAllergies ?? []);
  const [foodRestrictions, setFoodRestrictions] = useState(member?.foodRestrictions ?? "");
  const [healthIssues, setHealthIssues] = useState<string[]>(member?.healthIssues ?? []);
  const [medications, setMedications] = useState<Medication[]>(member?.medications ?? []);
  const [healthNotes, setHealthNotes] = useState(member?.healthNotes ?? "");

  const [hasAllergies, setHasAllergies] = useState(allergies.length > 0);
  const [hasDrugAllergies, setHasDrugAllergies] = useState(drugAllergies.length > 0);
  const [hasHealthIssues, setHasHealthIssues] = useState(healthIssues.length > 0);
  const [hasMedicines, setHasMedicines] = useState(medications.length > 0);
  const [hasFoodRestrictions, setHasFoodRestrictions] = useState(!!foodRestrictions);
  const [error, setError] = useState<string | null>(null);

  // phone is optional (some volunteers haven't registered one yet) but must be valid when given
  const phoneE164 = toE164(phone);
  const phoneOk = !phone.trim() || !!phoneE164;
  const valid = name.trim().length > 0 && phoneOk;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        phone: phoneE164 ?? null,
        active,
        roomRole,
        // team, room and transport are edited from the detail page (pencil dialogs), not here
        team: member?.team ?? null,
        bedroom: member?.bedroom ?? null,
        transportation: member?.transportation ?? null,
        allergies: hasAllergies ? allergies : [],
        drugAllergies: hasDrugAllergies ? drugAllergies : [],
        foodRestrictions: hasFoodRestrictions ? foodRestrictions.trim() : "",
        healthIssues: hasHealthIssues ? healthIssues : [],
        medications: hasMedicines ? medications.filter((m) => m.name.trim()) : [],
        healthNotes: healthNotes.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    }
  }

  const text = (label: string, value: string, set: (v: string) => void, placeholder = "", rows?: number) => (
    <label className="cat-field cat-field--grow">
      <span className="cat-field__label">{label}</span>
      {rows ? (
        <textarea className="cat-input cat-input--area" rows={rows} value={value} placeholder={placeholder} maxLength={500} disabled={busy} onChange={(e) => set(e.target.value)} />
      ) : (
        <input className="cat-input" value={value} placeholder={placeholder} maxLength={120} disabled={busy} onChange={(e) => set(e.target.value)} />
      )}
    </label>
  );

  /** a switch that reveals its field only when on */
  const optional = (label: React.ReactNode, on: boolean, setOn: (v: boolean) => void, field: React.ReactNode) => (
    <div className="cat-field opt-field">
      <div className="opt-field__head">
        <Toggle checked={on} onChange={setOn} disabled={busy} label={label} />
      </div>
      {on && field}
    </div>
  );

  return (
    <form className="cat-form cat-form--plain" onSubmit={handleSubmit}>
      <div className="cat-form__row staff-form__row">
        <label className="cat-field cat-field--grow">
          <span className="cat-field__label">Nome</span>
          <input className="cat-input" placeholder="ex.: Abimael" value={name} maxLength={80} autoFocus disabled={busy} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="cat-field cat-field--grow">
          <span className="cat-field__label">Celular</span>
          <PhoneInput value={phone} onChange={setPhone} disabled={busy || !!member?.admin} />
          {phone && !phoneE164 && <p className="cat-hint cat-hint--error">Informe um celular válido com DDD.</p>}
          {member?.admin && <p className="cat-hint">🔑 Celular de admin — é o login, não muda por aqui.</p>}
        </div>
        <div className="cat-field">
          <span className="cat-field__label">Status</span>
          <Toggle checked={active} onChange={setActive} disabled={busy || !!member?.admin} label={active ? "Ativo" : "Inativo"} />
        </div>
      </div>

      <fieldset className="cat-fieldset">
        <legend className="cat-field__label">Função no quarto</legend>
        <div className="big-options big-options--row">
          {(Object.keys(ROOM_ROLE_META) as RoomRole[]).map((r) => {
            const on = roomRole === r;
            return (
              <button key={r} type="button" className={`big-option ${on ? "big-option--on" : ""}`} aria-pressed={on} disabled={busy} onClick={() => setRoomRole(r)}>
                <span className="big-option__emoji" aria-hidden="true">{ROOM_ROLE_META[r].emoji}</span>
                <span className="big-option__label">{ROOM_ROLE_META[r].label}</span>
                <span className="big-option__hint">{ROOM_ROLE_META[r].hint}</span>
              </button>
            );
          })}
        </div>
        {editing && member?.roomRole === "caretaker" && roomRole === "helper" && <p className="cat-hint cat-hint--error">Ao virar auxiliar, as crianças sob sua responsabilidade ficam sem líder.</p>}
      </fieldset>

      <section className="form-box form-box--plain" aria-labelledby="staff-health-title">
        <h3 id="staff-health-title" className="form-box__title">📝 Saúde e observações</h3>
        {optional("🤧 Alergias", hasAllergies, setHasAllergies, <CategoryChips label="Quais" category={byKey(STAFF_CATEGORY_KEYS.allergies)} value={allergies} onChange={setAllergies} disabled={busy} />)}
        {optional(
          <>
            <NoPillIcon /> Alergia a medicamentos
          </>,
          hasDrugAllergies,
          setHasDrugAllergies,
          <CategoryChips label="Quais" category={byKey(STAFF_CATEGORY_KEYS.drugAllergies)} value={drugAllergies} onChange={setDrugAllergies} disabled={busy} />,
        )}
        {optional("🩺 Condição crônica", hasHealthIssues, setHasHealthIssues, <CategoryChips label="Quais" category={byKey(STAFF_CATEGORY_KEYS.healthIssues)} value={healthIssues} onChange={setHealthIssues} disabled={busy} />)}
        {optional(
          "💊 Medicação de uso diário",
          hasMedicines,
          (on) => {
            setHasMedicines(on);
            if (on && medications.length === 0) setMedications([blankMedication()]);
          },
          <MedicationsEditor value={medications} onChange={setMedications} disabled={busy} />,
        )}
        {optional("🍽️ Alimentação / restrições", hasFoodRestrictions, setHasFoodRestrictions, text("Quais", foodRestrictions, setFoodRestrictions, "ex.: vegetariano, sem lactose", 2))}
        {text("📝 Outras observações de saúde", healthNotes, setHealthNotes, "ex.: o que a pessoa escreveu na inscrição", 3)}
      </section>

      {error && <p className="message message--error">{error}</p>}

      <div className="cat-form__actions">
        <button type="button" className="button button--secondary" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
        <button type="submit" className="button button--primary" disabled={!valid || busy}>
          {busy ? "Salvando…" : editing ? "Salvar" : "Adicionar 🎉"}
        </button>
      </div>
    </form>
  );
}
