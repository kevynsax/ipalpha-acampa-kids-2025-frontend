import { useState } from "react";
import type { Bedroom } from "../../api/bedrooms";
import type { Category } from "../../api/categories";
import { BedroomSelect, CategoryChips, CategorySelect } from "../../components/CategoryFields";
import { STAFF_CATEGORY_KEYS, type Staff, type StaffInput } from "../../api/staff";
import PhoneInput from "../../components/PhoneInput";
import Toggle from "../../components/Toggle";
import { maskBrazilPhone, toE164 } from "../../phone";

interface StaffFormProps {
  /** when editing, the existing member; when creating, undefined */
  member?: Staff;
  categories: Category[];
  bedrooms: Bedroom[];
  busy?: boolean;
  onSubmit: (input: StaffInput) => Promise<void>;
  onCancel: () => void;
}

/** Create / edit a staff member. Health-related fields live under "Observações". */
export default function StaffForm({ member, categories, bedrooms, busy, onSubmit, onCancel }: StaffFormProps) {
  const editing = !!member;
  const byKey = (key: string) => categories.find((c) => c.key === key);
  const teamCat = byKey(STAFF_CATEGORY_KEYS.team);
  const transportCat = byKey(STAFF_CATEGORY_KEYS.transportation);
  const allergyCat = byKey(STAFF_CATEGORY_KEYS.allergies);
  const drugCat = byKey(STAFF_CATEGORY_KEYS.drugAllergies);
  const healthCat = byKey(STAFF_CATEGORY_KEYS.healthIssues);

  const [name, setName] = useState(member?.name ?? "");
  const [phone, setPhone] = useState(member?.phone ? maskBrazilPhone(member.phone.replace(/^\+55/, "")) : "");
  const [active, setActive] = useState(member?.active ?? true);
  const [team, setTeam] = useState<string | null>(member?.team ?? null);
  const [bedroom, setBedroom] = useState<string | null>(member?.bedroom ?? null);
  const [transportation, setTransportation] = useState<string | null>(member?.transportation ?? null);
  const [allergies, setAllergies] = useState<string[]>(member?.allergies ?? []);
  const [drugAllergies, setDrugAllergies] = useState<string[]>(member?.drugAllergies ?? []);
  const [foodRestrictions, setFoodRestrictions] = useState(member?.foodRestrictions ?? "");
  const [healthIssues, setHealthIssues] = useState<string[]>(member?.healthIssues ?? []);
  const [medicines, setMedicines] = useState(member?.medicines ?? "");
  const [healthNotes, setHealthNotes] = useState(member?.healthNotes ?? "");

  const hasObservations =
    allergies.length > 0 ||
    drugAllergies.length > 0 ||
    healthIssues.length > 0 ||
    !!foodRestrictions.trim() ||
    !!medicines.trim() ||
    !!healthNotes.trim();
  const [showObs, setShowObs] = useState(hasObservations);
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
        team,
        bedroom,
        transportation,
        allergies,
        drugAllergies,
        foodRestrictions: foodRestrictions.trim(),
        healthIssues,
        medicines: medicines.trim(),
        healthNotes: healthNotes.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    }
  }

  return (
    <form className="cat-form" onSubmit={handleSubmit}>
      <h2 className="cat-form__title">{editing ? "✏️ Editar membro da equipe" : "✨ Novo membro da equipe"}</h2>

      <label className="cat-field">
        <span className="cat-field__label">Nome</span>
        <input
          className="cat-input"
          placeholder="ex.: Abimael"
          value={name}
          maxLength={80}
          autoFocus
          disabled={busy}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <div className="cat-form__row staff-form__row">
        <div className="cat-field cat-field--grow">
          <span className="cat-field__label">Celular</span>
          <PhoneInput value={phone} onChange={setPhone} disabled={busy} />
          {phone && !phoneE164 && <p className="cat-hint cat-hint--error">Informe um celular válido com DDD.</p>}
        </div>

        <div className="cat-field">
          <span className="cat-field__label">Status</span>
          <Toggle checked={active} onChange={setActive} disabled={busy} label={active ? "Ativo" : "Inativo"} />
        </div>
      </div>

      <div className="cat-form__row staff-form__row">
        <CategorySelect label="Time" category={teamCat} value={team} onChange={setTeam} disabled={busy} />

        <BedroomSelect bedrooms={bedrooms} value={bedroom} onChange={setBedroom} current={member?.bedroom} disabled={busy} />

        <CategorySelect label="Transporte" category={transportCat} value={transportation} onChange={setTransportation} disabled={busy} />
      </div>

      <button
        type="button"
        className={`disclosure ${showObs ? "disclosure--open" : ""}`}
        aria-expanded={showObs}
        onClick={() => setShowObs((v) => !v)}
      >
        <span className="disclosure__arrow" aria-hidden="true">▶</span>
        📝 Observações
        {hasObservations && !showObs && <span className="disclosure__badge">preenchido</span>}
        <span className="disclosure__hint">alergias, restrições alimentares, saúde e medicamentos</span>
      </button>

      {showObs && (
        <div className="staff-form__obs">
          <CategoryChips label="Alergias" category={allergyCat} value={allergies} onChange={setAllergies} disabled={busy} />
          <CategoryChips label="Alergia a medicamentos" category={drugCat} value={drugAllergies} onChange={setDrugAllergies} disabled={busy} />

          <label className="cat-field">
            <span className="cat-field__label">🍽️ Restrições alimentares</span>
            <textarea
              className="cat-input cat-input--area"
              rows={2}
              placeholder="ex.: vegetariano, sem lactose…"
              value={foodRestrictions}
              maxLength={500}
              disabled={busy}
              onChange={(e) => setFoodRestrictions(e.target.value)}
            />
          </label>

          <CategoryChips label="Problemas de saúde" category={healthCat} value={healthIssues} onChange={setHealthIssues} disabled={busy} />

          <label className="cat-field">
            <span className="cat-field__label">💊 Medicamentos</span>
            <textarea
              className="cat-input cat-input--area"
              rows={2}
              placeholder="ex.: Losartana 50mg pela manhã"
              value={medicines}
              maxLength={500}
              disabled={busy}
              onChange={(e) => setMedicines(e.target.value)}
            />
          </label>

          <label className="cat-field">
            <span className="cat-field__label">📝 Outras observações de saúde</span>
            <textarea
              className="cat-input cat-input--area"
              rows={2}
              placeholder="texto livre — ex.: o que a pessoa escreveu na inscrição"
              value={healthNotes}
              maxLength={500}
              disabled={busy}
              onChange={(e) => setHealthNotes(e.target.value)}
            />
          </label>
        </div>
      )}

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
