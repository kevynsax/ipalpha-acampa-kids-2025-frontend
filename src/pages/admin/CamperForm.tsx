import { useState } from "react";
import type { Bedroom } from "../../api/bedrooms";
import { CAMPER_CATEGORY_KEYS, type Camper, type CamperInput } from "../../api/campers";
import type { Category } from "../../api/categories";
import { BedroomSelect, CategoryChips, CategorySelect } from "../../components/CategoryFields";
import ParentIcon from "../../components/ParentIcon";
import PhoneInput from "../../components/PhoneInput";
import { maskBrazilPhone, toE164 } from "../../phone";

interface CamperFormProps {
  camper?: Camper;
  categories: Category[];
  bedrooms: Bedroom[];
  busy?: boolean;
  onSubmit: (input: CamperInput) => Promise<void>;
  onCancel: () => void;
}

/** Create / edit a camper (kid). The health block is collapsible; the guardian box is always open. */
export default function CamperForm({ camper, categories, bedrooms, busy, onSubmit, onCancel }: CamperFormProps) {
  const editing = !!camper;
  const cat = (key: string) => categories.find((c) => c.key === key);

  const [name, setName] = useState(camper?.name ?? "");
  const [birthDate, setBirthDate] = useState(camper?.birthDate ?? "");
  const [team, setTeam] = useState<string | null>(camper?.team ?? null);
  const [bedroom, setBedroom] = useState<string | null>(camper?.bedroom ?? null);
  const [bed, setBed] = useState<string | null>(camper?.bed ?? null);
  const [transportation, setTransportation] = useState<string | null>(camper?.transportation ?? null);

  const [guardianName, setGuardianName] = useState(camper?.guardianName ?? "");
  const [guardianPhone, setGuardianPhone] = useState(camper?.guardianPhone ? maskBrazilPhone(camper.guardianPhone.replace(/^\+55/, "")) : "");
  const [emergencyContact, setEmergencyContact] = useState(camper?.emergencyContact ?? "");
  const [insurance, setInsurance] = useState(camper?.insurance ?? "");
  const [insuranceCard, setInsuranceCard] = useState(camper?.insuranceCard ?? "");

  const [allergies, setAllergies] = useState<string[]>(camper?.allergies ?? []);
  const [drugAllergies, setDrugAllergies] = useState<string[]>(camper?.drugAllergies ?? []);
  const [healthIssues, setHealthIssues] = useState<string[]>(camper?.healthIssues ?? []);
  const [medicines, setMedicines] = useState(camper?.medicines ?? "");
  const [foodRestrictions, setFoodRestrictions] = useState(camper?.foodRestrictions ?? "");
  const [weight, setWeight] = useState(camper?.weightKg != null ? String(camper.weightKg).replace(".", ",") : "");
  const [healthNotes, setHealthNotes] = useState(camper?.healthNotes ?? "");
  const [generalNotes, setGeneralNotes] = useState(camper?.generalNotes ?? "");
  const [bedroomPreference, setBedroomPreference] = useState(camper?.bedroomPreference ?? "");

  const hasHealth = allergies.length > 0 || drugAllergies.length > 0 || healthIssues.length > 0 || !!medicines || !!foodRestrictions || !!healthNotes || !!generalNotes;
  const [showHealth, setShowHealth] = useState(hasHealth);
  const [error, setError] = useState<string | null>(null);

  const phoneE164 = toE164(guardianPhone);
  const phoneOk = !guardianPhone.trim() || !!phoneE164;
  const weightKg = weight.trim() ? Number(weight.trim().replace(",", ".")) : null;
  const weightOk = weightKg === null || (Number.isFinite(weightKg) && weightKg >= 5 && weightKg <= 200);
  const valid = name.trim().length > 0 && phoneOk && weightOk;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        birthDate: birthDate || null,
        team,
        bedroom,
        bed,
        transportation,
        weightKg: weightOk && weightKg !== null ? Math.round(weightKg * 10) / 10 : null,
        allergies,
        drugAllergies,
        healthIssues,
        medicines: medicines.trim(),
        foodRestrictions: foodRestrictions.trim(),
        healthNotes: healthNotes.trim(),
        generalNotes: generalNotes.trim(),
        bedroomPreference: bedroomPreference.trim(),
        insurance: insurance.trim(),
        insuranceCard: insuranceCard.trim(),
        emergencyContact: emergencyContact.trim(),
        guardianName: guardianName.trim(),
        guardianPhone: phoneE164 ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    }
  }

  const text = (label: string, value: string, set: (v: string) => void, placeholder = "", rows?: number) => (
    <label className="cat-field cat-field--grow">
      <span className="cat-field__label">{label}</span>
      {rows ? (
        <textarea className="cat-input cat-input--area" rows={rows} value={value} placeholder={placeholder} maxLength={1000} disabled={busy} onChange={(e) => set(e.target.value)} />
      ) : (
        <input className="cat-input" value={value} placeholder={placeholder} maxLength={120} disabled={busy} onChange={(e) => set(e.target.value)} />
      )}
    </label>
  );

  return (
    <form className="cat-form" onSubmit={handleSubmit}>
      <h2 className="cat-form__title">{editing ? "✏️ Editar acampante" : "✨ Novo acampante"}</h2>

      <div className="cat-form__row staff-form__row">
        <label className="cat-field cat-field--grow">
          <span className="cat-field__label">Nome</span>
          <input className="cat-input" placeholder="ex.: Helena Sparvoli" value={name} maxLength={100} autoFocus disabled={busy} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="cat-field">
          <span className="cat-field__label">Nascimento</span>
          <input className="cat-input" type="date" value={birthDate} disabled={busy} onChange={(e) => setBirthDate(e.target.value)} />
        </label>
        <label className="cat-field cat-field--weight">
          <span className="cat-field__label">Peso (kg)</span>
          <input className="cat-input" inputMode="decimal" placeholder="ex.: 28,5" value={weight} maxLength={6} disabled={busy} onChange={(e) => setWeight(e.target.value)} />
          {weight.trim() && !weightOk && <p className="cat-hint cat-hint--error">Entre 5 e 200 kg.</p>}
        </label>
      </div>

      <div className="cat-form__row staff-form__row">
        <CategorySelect label="Time" category={cat(CAMPER_CATEGORY_KEYS.team)} value={team} onChange={setTeam} disabled={busy} />
        <BedroomSelect bedrooms={bedrooms} value={bedroom} onChange={setBedroom} current={camper?.bedroom} groups={["girls", "boys"]} disabled={busy} />
        <CategorySelect label="Cama" category={cat(CAMPER_CATEGORY_KEYS.bed)} value={bed} onChange={setBed} disabled={busy} />
        <CategorySelect label="Transporte" category={cat(CAMPER_CATEGORY_KEYS.transportation)} value={transportation} onChange={setTransportation} disabled={busy} />
      </div>
      {text("🛏️ Prefere dividir quarto com", bedroomPreference, setBedroomPreference, "ex.: Bernardo Faria, Lucas (primo)")}

      <section className="form-box" aria-labelledby="guardian-title">
        <h3 id="guardian-title" className="form-box__title">
          <ParentIcon size={22} /> Pai ou Responsável
        </h3>
        <div className="cat-form__row staff-form__row">
          {text("Nome do responsável", guardianName, setGuardianName, "ex.: Daniela Sparvoli")}
          <div className="cat-field cat-field--grow">
            <span className="cat-field__label">Telefone do responsável</span>
            <PhoneInput value={guardianPhone} onChange={setGuardianPhone} disabled={busy} />
            {guardianPhone && !phoneE164 && <p className="cat-hint cat-hint--error">Informe um celular válido com DDD.</p>}
          </div>
        </div>
        {text("Contato de emergência", emergencyContact, setEmergencyContact, "ex.: Marcos (pai) 11 99999-0000")}
        <div className="cat-form__row staff-form__row">
          {text("Convênio médico", insurance, setInsurance, "ex.: Bradesco")}
          {text("Carteirinha", insuranceCard, setInsuranceCard)}
        </div>
      </section>

      <button type="button" className={`disclosure ${showHealth ? "disclosure--open" : ""}`} aria-expanded={showHealth} onClick={() => setShowHealth((v) => !v)}>
        <span className="disclosure__arrow" aria-hidden="true">▶</span>
        📝 Saúde e observações
        {hasHealth && !showHealth && <span className="disclosure__badge">preenchido</span>}
        <span className="disclosure__hint">alergias, condições, medicação, alimentação</span>
      </button>
      {showHealth && (
        <div className="staff-form__obs">
          <CategoryChips label="Alergias" category={cat(CAMPER_CATEGORY_KEYS.allergies)} value={allergies} onChange={setAllergies} disabled={busy} />
          <CategoryChips label="Alergia a medicamentos" category={cat(CAMPER_CATEGORY_KEYS.drugAllergies)} value={drugAllergies} onChange={setDrugAllergies} disabled={busy} />
          <CategoryChips label="Condição crônica" category={cat(CAMPER_CATEGORY_KEYS.healthIssues)} value={healthIssues} onChange={setHealthIssues} disabled={busy} />
          {text("💊 Medicação de uso diário", medicines, setMedicines, "ex.: Ritalina 10mg pela manhã", 2)}
          {text("🍽️ Alimentação / restrições", foodRestrictions, setFoodRestrictions, "ex.: sem lactose", 2)}
          {text("🩺 Observações médicas", healthNotes, setHealthNotes, "ex.: em caso de crise, 4 puffs de Aerolin…", 3)}
          {text("📝 Observações gerais", generalNotes, setGeneralNotes, "ex.: tem dificuldade em dormir sozinha", 3)}
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
