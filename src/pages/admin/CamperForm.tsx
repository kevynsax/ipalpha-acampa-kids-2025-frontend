import { useState } from "react";
import { CAMPER_CATEGORY_KEYS, blankMedication, type Camper, type CamperInput, type CamperSex, type Medication } from "../../api/campers";
import MedicationsEditor from "../../components/MedicationsEditor";
import NoPillIcon from "../../components/NoPillIcon";
import type { Category } from "../../api/categories";
import { CategoryChips, CategoryRadio } from "../../components/CategoryFields";
import ParentIcon from "../../components/ParentIcon";
import PhoneInput from "../../components/PhoneInput";
import Toggle from "../../components/Toggle";
import { maskBrazilPhone, toE164 } from "../../phone";

interface CamperFormProps {
  camper?: Camper;
  categories: Category[];
  busy?: boolean;
  onSubmit: (input: CamperInput) => Promise<void>;
  onCancel: () => void;
}

/** Create / edit a camper (kid). The health block is collapsible; the guardian box is always open. */
export default function CamperForm({ camper, categories, busy, onSubmit, onCancel }: CamperFormProps) {
  const editing = !!camper;
  const cat = (key: string) => categories.find((c) => c.key === key);

  const [name, setName] = useState(camper?.name ?? "");
  const [birthDate, setBirthDate] = useState(camper?.birthDate ?? "");
  const [sex, setSex] = useState<CamperSex | null>(camper?.sex ?? null);
  const [cpf, setCpf] = useState(camper?.cpf ?? "");
  const [rg, setRg] = useState(camper?.rg ?? "");
  const [school, setSchool] = useState(camper?.school ?? "");
  const [schoolGrade, setSchoolGrade] = useState(camper?.schoolGrade ?? "");
  const [church, setChurch] = useState(camper?.church ?? "");
  const [invitedBy, setInvitedBy] = useState(camper?.invitedBy ?? "");
  const [bed, setBed] = useState<string | null>(camper?.bed ?? null);

  const [guardianName, setGuardianName] = useState(camper?.guardianName ?? "");
  const [guardianPhone, setGuardianPhone] = useState(camper?.guardianPhone ? maskBrazilPhone(camper.guardianPhone.replace(/^\+55/, "")) : "");
  const [guardianCpf, setGuardianCpf] = useState(camper?.guardianCpf ?? "");
  const [guardianEmail, setGuardianEmail] = useState(camper?.guardianEmail ?? "");
  const [emergencyContact, setEmergencyContact] = useState(camper?.emergencyContact ?? "");
  const [insurance, setInsurance] = useState(camper?.insurance ?? "");
  const [insuranceCard, setInsuranceCard] = useState(camper?.insuranceCard ?? "");

  const [allergies, setAllergies] = useState<string[]>(camper?.allergies ?? []);
  const [drugAllergies, setDrugAllergies] = useState<string[]>(camper?.drugAllergies ?? []);
  const [healthIssues, setHealthIssues] = useState<string[]>(camper?.healthIssues ?? []);
  const [neurodivergent, setNeurodivergent] = useState(camper?.neurodivergent ?? false);
  const [medications, setMedications] = useState<Medication[]>(camper?.medications ?? []);
  const [foodRestrictions, setFoodRestrictions] = useState(camper?.foodRestrictions ?? "");
  const [weight, setWeight] = useState(camper?.weightKg != null ? String(camper.weightKg).replace(".", ",") : "");
  const [healthNotes, setHealthNotes] = useState(camper?.healthNotes ?? "");
  const [generalNotes, setGeneralNotes] = useState(camper?.generalNotes ?? "");
  const [bedroomPreference, setBedroomPreference] = useState(camper?.bedroomPreference ?? "");

  // each health topic is a switch: off = nothing to declare (field hidden and cleared on save)
  const [hasAllergies, setHasAllergies] = useState(allergies.length > 0);
  const [hasDrugAllergies, setHasDrugAllergies] = useState(drugAllergies.length > 0);
  const [hasHealthIssues, setHasHealthIssues] = useState(healthIssues.length > 0);
  const [hasMedicines, setHasMedicines] = useState(medications.length > 0);
  const [hasFoodRestrictions, setHasFoodRestrictions] = useState(!!foodRestrictions);
  const [hasHealthNotes, setHasHealthNotes] = useState(!!healthNotes);
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
        sex,
        cpf: cpf.trim(),
        rg: rg.trim(),
        school: school.trim(),
        schoolGrade: schoolGrade.trim(),
        church: church.trim(),
        invitedBy: invitedBy.trim(),
        qrToken: camper?.qrToken ?? "",
        externalId: camper?.externalId ?? "",
        // team, room, leader and transportation are edited from the detail page (pencil dialogs), not here
        caretakerId: camper?.caretakerId ?? null,
        team: camper?.team ?? null,
        bedroom: camper?.bedroom ?? null,
        bed,
        transportation: camper?.transportation ?? null,
        weightKg: weightOk && weightKg !== null ? Math.round(weightKg * 10) / 10 : null,
        allergies: hasAllergies ? allergies : [],
        drugAllergies: hasDrugAllergies ? drugAllergies : [],
        healthIssues: hasHealthIssues ? healthIssues : [],
        neurodivergent,
        medications: hasMedicines ? medications.filter((m) => m.name.trim()) : [],
        foodRestrictions: hasFoodRestrictions ? foodRestrictions.trim() : "",
        healthNotes: hasHealthNotes ? healthNotes.trim() : "",
        generalNotes: generalNotes.trim(),
        bedroomPreference: bedroomPreference.trim(),
        insurance: insurance.trim(),
        insuranceCard: insuranceCard.trim(),
        emergencyContact: emergencyContact.trim(),
        guardianName: guardianName.trim(),
        guardianPhone: phoneE164 ?? null,
        guardianCpf: guardianCpf.trim(),
        guardianEmail: guardianEmail.trim().toLowerCase(),
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
          <input className="cat-input" placeholder="ex.: Helena Sparvoli" value={name} maxLength={100} autoFocus disabled={busy} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="cat-field">
          <span className="cat-field__label">Nascimento</span>
          <input className="cat-input" type="date" value={birthDate} disabled={busy} onChange={(e) => setBirthDate(e.target.value)} />
        </label>
        <label className="cat-field">
          <span className="cat-field__label">Sexo</span>
          <select className="cat-input" value={sex ?? ""} disabled={busy} onChange={(e) => setSex((e.target.value || null) as CamperSex | null)}>
            <option value="">—</option>
            <option value="F">Feminino</option>
            <option value="M">Masculino</option>
          </select>
        </label>
        <label className="cat-field cat-field--weight">
          <span className="cat-field__label">Peso (kg)</span>
          <input className="cat-input" inputMode="decimal" placeholder="ex.: 28,5" value={weight} maxLength={6} disabled={busy} onChange={(e) => setWeight(e.target.value)} />
          {weight.trim() && !weightOk && <p className="cat-hint cat-hint--error">Entre 5 e 200 kg.</p>}
        </label>
      </div>

      <div className="cat-form__row staff-form__row">
        <CategoryRadio label="Cama" category={cat(CAMPER_CATEGORY_KEYS.bed)} value={bed} onChange={setBed} disabled={busy} />
        {text("🛏️ Prefere dividir quarto com", bedroomPreference, setBedroomPreference, "ex.: Bernardo Faria, Lucas (primo)")}
      </div>

      <section className="form-box form-box--plain" aria-labelledby="extra-title">
        <h3 id="extra-title" className="form-box__title">🪪 Documentos e escola</h3>
        <div className="cat-form__row staff-form__row">
          {text("CPF", cpf, setCpf, "ex.: 123.456.789-00")}
          {text("RG", rg, setRg)}
        </div>
        <div className="cat-form__row staff-form__row">
          {text("Escola", school, setSchool, "ex.: Mackenzie")}
          {text("Série", schoolGrade, setSchoolGrade, "ex.: 4º ano")}
        </div>
        <div className="cat-form__row staff-form__row">
          {text("Frequenta igreja", church, setChurch, "ex.: IPAlpha")}
          {text("Convidado por", invitedBy, setInvitedBy, "ex.: Pedro Brassioli")}
        </div>
      </section>

      <section className="form-box form-box--plain" aria-labelledby="guardian-title">
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
        <div className="cat-form__row staff-form__row">
          {text("CPF do responsável", guardianCpf, setGuardianCpf)}
          {text("E-mail do responsável", guardianEmail, setGuardianEmail, "ex.: nome@email.com")}
        </div>
        {text("Contato de emergência", emergencyContact, setEmergencyContact, "ex.: Marcos (pai) 11 99999-0000")}
        <div className="cat-form__row staff-form__row">
          {text("Convênio médico", insurance, setInsurance, "ex.: Bradesco")}
          {text("Carteirinha", insuranceCard, setInsuranceCard)}
        </div>
      </section>

      <section className="form-box form-box--plain" aria-labelledby="health-title">
        <h3 id="health-title" className="form-box__title">📝 Saúde e observações</h3>
        {optional("🤧 Alergias", hasAllergies, setHasAllergies, <CategoryChips label="Quais" category={cat(CAMPER_CATEGORY_KEYS.allergies)} value={allergies} onChange={setAllergies} disabled={busy} />)}
        {optional(
          <>
            <NoPillIcon /> Alergia a medicamentos
          </>,
          hasDrugAllergies,
          setHasDrugAllergies,
          <CategoryChips label="Quais" category={cat(CAMPER_CATEGORY_KEYS.drugAllergies)} value={drugAllergies} onChange={setDrugAllergies} disabled={busy} />,
        )}
        {optional("🩺 Condição crônica", hasHealthIssues, setHasHealthIssues, <CategoryChips label="Quais" category={cat(CAMPER_CATEGORY_KEYS.healthIssues)} value={healthIssues} onChange={setHealthIssues} disabled={busy} />)}
        <div className="cat-field opt-field">
          <div className="opt-field__head">
            <Toggle checked={neurodivergent} onChange={setNeurodivergent} disabled={busy} label="🧩 Neurodivergente" />
          </div>
          <p className="cat-hint">TEA, TDAH… Visível só para a organização e a equipe médica.</p>
        </div>
        {optional(
          "💊 Medicação de uso diário",
          hasMedicines,
          (on) => {
            setHasMedicines(on);
            if (on && medications.length === 0) setMedications([blankMedication()]);
          },
          <MedicationsEditor value={medications} onChange={setMedications} disabled={busy} />,
        )}
        {optional("🍽️ Alimentação / restrições", hasFoodRestrictions, setHasFoodRestrictions, text("Quais", foodRestrictions, setFoodRestrictions, "ex.: sem lactose", 2))}
        {optional("🩺 Observações médicas", hasHealthNotes, setHasHealthNotes, text("Observações", healthNotes, setHealthNotes, "ex.: em caso de crise, 4 puffs de Aerolin…", 3))}
        {text("📝 Observações gerais", generalNotes, setGeneralNotes, "ex.: tem dificuldade em dormir sozinha", 3)}
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
