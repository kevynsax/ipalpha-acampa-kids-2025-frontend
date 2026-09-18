import { useState, type ReactNode } from "react";
import { CAMPER_CATEGORY_KEYS, blankMedication, medicalUpdateCamper, type Camper, type Medication, type MedicalPatch } from "../api/campers";
import { CategoryChips } from "./CategoryFields";
import MedicationsEditor from "./MedicationsEditor";
import Dialog from "./Dialog";
import NoPillIcon from "./NoPillIcon";
import Toggle from "./Toggle";
import { useFieldDedup } from "../hooks/useFieldDedup";
import type { DedupField } from "../api/ai";
import { useCategories } from "../store/derive";
import { useI18n } from "../i18n";

interface HealthEditDialogProps {
  token: string;
  open: boolean;
  camper: Camper;
  onClose: () => void;
}

/**
 * The MEDICAL team edits the health block of a kid (weight included): same
 * fields and order the parents see, plus the neurodivergence switch. Only
 * changed fields are sent — the server re-validates everything and writes the
 * kid's change history.
 */
export default function HealthEditDialog({ token, open, camper: k, onClose }: HealthEditDialogProps) {
  const { tx } = useI18n();
  const categories = useCategories("camper");
  const cat = (key: string) => categories.find((c) => c.key === key);

  const [insurance, setInsurance] = useState(k.insurance);
  const [insuranceCard, setInsuranceCard] = useState(k.insuranceCard);
  const [weight, setWeight] = useState(k.weightKg != null ? String(k.weightKg).replace(".", ",") : "");
  const [allergies, setAllergies] = useState<string[]>(k.allergies);
  const [drugAllergies, setDrugAllergies] = useState<string[]>(k.drugAllergies);
  const [healthIssues, setHealthIssues] = useState<string[]>(k.healthIssues);
  const [neurodivergent, setNeurodivergent] = useState(k.neurodivergent === true);
  const [medications, setMedications] = useState<Medication[]>(k.medications);
  const [foodRestrictions, setFoodRestrictions] = useState(k.foodRestrictions);
  const [healthNotes, setHealthNotes] = useState(k.healthNotes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // each health topic is a switch: off = nothing to declare (field hidden and cleared on save)
  const [hasAllergies, setHasAllergies] = useState(k.allergies.length > 0);
  const [hasDrugAllergies, setHasDrugAllergies] = useState(k.drugAllergies.length > 0);
  const [hasHealthIssues, setHasHealthIssues] = useState(k.healthIssues.length > 0);
  const [hasMedicines, setHasMedicines] = useState(k.medications.length > 0);
  const [hasFoodRestrictions, setHasFoodRestrictions] = useState(!!k.foodRestrictions);
  const [hasHealthNotes, setHasHealthNotes] = useState(!!k.healthNotes);

  const weightKg = weight.trim() ? Number(weight.trim().replace(",", ".")) : null;
  const weightOk = weightKg === null || (Number.isFinite(weightKg) && weightKg >= 5 && weightKg <= 200);

  const same = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));
  const savedAllergies = hasAllergies ? allergies : [];
  const savedDrugAllergies = hasDrugAllergies ? drugAllergies : [];
  const savedHealthIssues = hasHealthIssues ? healthIssues : [];
  const savedMeds = hasMedicines ? medications.filter((m) => m.name.trim()).map((m) => ({ ...m, name: m.name.trim(), dose: m.dose.trim(), notes: m.notes.trim() })) : [];
  const savedFood = hasFoodRestrictions ? foodRestrictions.trim() : "";
  const savedHealthNotes = hasHealthNotes ? healthNotes.trim() : "";

  const patch: MedicalPatch = {};
  if (!same(savedAllergies, k.allergies)) patch.allergies = savedAllergies;
  if (!same(savedDrugAllergies, k.drugAllergies)) patch.drugAllergies = savedDrugAllergies;
  if (!same(savedHealthIssues, k.healthIssues)) patch.healthIssues = savedHealthIssues;
  if (neurodivergent !== (k.neurodivergent === true)) patch.neurodivergent = neurodivergent;
  if (JSON.stringify(savedMeds) !== JSON.stringify(k.medications)) patch.medications = savedMeds;
  if (savedFood !== k.foodRestrictions) patch.foodRestrictions = savedFood;
  if (savedHealthNotes !== k.healthNotes) patch.healthNotes = savedHealthNotes;
  const roundedWeight = weightOk && weightKg !== null ? Math.round(weightKg * 10) / 10 : null;
  if (roundedWeight !== k.weightKg) patch.weightKg = roundedWeight;
  if (insurance.trim() !== k.insurance) patch.insurance = insurance.trim();
  if (insuranceCard.trim() !== k.insuranceCard) patch.insuranceCard = insuranceCard.trim();
  const changed = Object.keys(patch).length > 0;

  const dedup = useFieldDedup({ token, busy });

  async function submit() {
    if (!changed || !weightOk || busy) return;
    dedup.cancelAll();
    setBusy(true);
    setError(null);
    try {
      await medicalUpdateCamper(token, k.id, patch);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : tx("Algo deu errado."));
    } finally {
      setBusy(false);
    }
  }

  /** a labelled text field; pass `dedupAs` to run the background repeat clean-up on blur */
  const text = (label: string, value: string, set: (v: string) => void, placeholder = "", rows?: number, dedupAs?: DedupField) => {
    const cls = `cat-input${rows ? " cat-input--area" : ""}${dedupAs && dedup.busy(dedupAs) ? " cat-input--busy" : ""}`;
    const onBlur = dedupAs ? () => void dedup.run(dedupAs, value, set) : undefined;
    return (
      <label className="cat-field cat-field--grow">
        <span className="cat-field__label">{label}</span>
        {rows ? (
          <textarea className={cls} rows={rows} value={value} placeholder={placeholder} maxLength={1000} disabled={busy} onChange={(e) => set(e.target.value)} onBlur={onBlur} />
        ) : (
          <input className={cls} value={value} placeholder={placeholder} maxLength={120} disabled={busy} onChange={(e) => set(e.target.value)} onBlur={onBlur} />
        )}
      </label>
    );
  };

  /** a switch that reveals its field only when on */
  const optional = (label: ReactNode, on: boolean, setOn: (v: boolean) => void, field: ReactNode) => (
    <div className="cat-field opt-field">
      <div className="opt-field__head">
        <Toggle checked={on} onChange={setOn} disabled={busy} label={label} />
      </div>
      {on && field}
    </div>
  );

  return (
    <Dialog open={open} onClose={onClose} title={tx("Editar saúde")} width={620} dismissible={!busy} className="attention-sheet-dialog">
      <div className="cat-form attention-sheet">
        <header className="attention-sheet__head">
          <span className="attention-sheet__handle" aria-hidden="true" />
          <h2 className="cat-form__title">{tx("🩺 Saúde de {name}", { name: k.name.split(" ")[0] })}</h2>
          <p className="cat-hint">{tx("O que você alterar aqui aparece para toda a equipe na hora e fica no histórico da criança.")}</p>
        </header>

        <div className="attention-sheet__body">
          <div className="cat-form__row staff-form__row">
            {text(tx("🏥 Convênio médico"), insurance, setInsurance, tx("ex.: Bradesco"))}
            {text(tx("Carteirinha"), insuranceCard, setInsuranceCard)}
          </div>

          <label className="cat-field cat-field--weight">
            <span className="cat-field__label">{tx("⚖️ Peso (kg)")}</span>
            <input className="cat-input" inputMode="decimal" placeholder={tx("ex.: 28,5")} value={weight} maxLength={6} disabled={busy} onChange={(e) => setWeight(e.target.value)} />
            {weight.trim() && !weightOk && <p className="cat-hint cat-hint--error">{tx("Entre 5 e 200 kg.")}</p>}
          </label>

          {optional(tx("🤮 Alergias"), hasAllergies, setHasAllergies, <CategoryChips label={tx("Quais")} category={cat(CAMPER_CATEGORY_KEYS.allergies)} value={allergies} onChange={setAllergies} disabled={busy} />)}
          {optional(
            <>
              <NoPillIcon /> {tx("Alergia a medicamentos")}
            </>,
            hasDrugAllergies,
            setHasDrugAllergies,
            <CategoryChips label={tx("Quais")} category={cat(CAMPER_CATEGORY_KEYS.drugAllergies)} value={drugAllergies} onChange={setDrugAllergies} disabled={busy} />,
          )}
          {optional(tx("🩺 Condição crônica"), hasHealthIssues, setHasHealthIssues, <CategoryChips label={tx("Quais")} category={cat(CAMPER_CATEGORY_KEYS.healthIssues)} value={healthIssues} onChange={setHealthIssues} disabled={busy} />)}
          {optional(
            tx("💊 Medicação de uso diário"),
            hasMedicines,
            (on) => {
              setHasMedicines(on);
              if (on && medications.length === 0) setMedications([blankMedication()]);
            },
            <MedicationsEditor value={medications} onChange={setMedications} disabled={busy} />,
          )}
          {optional(tx("🍽️ Alimentação / restrições"), hasFoodRestrictions, setHasFoodRestrictions, text(tx("Quais"), foodRestrictions, setFoodRestrictions, tx("ex.: sem lactose"), 2, "foodRestrictions"))}
          {optional(tx("🩺 Observações médicas"), hasHealthNotes, setHasHealthNotes, text(tx("Observações"), healthNotes, setHealthNotes, tx("ex.: em caso de crise, 4 puffs de Aerolin…"), 3, "healthNotes"))}

          <div className="cat-field opt-field">
            <div className="opt-field__head">
              <Toggle checked={neurodivergent} onChange={setNeurodivergent} disabled={busy} label={tx("🧩 Neurodivergente (TEA, TDAH…)")} />
            </div>
          </div>

          {error && <p className="message message--error">{error}</p>}
        </div>

        <div className="cat-form__actions attention-sheet__actions">
          <button type="button" className="button button--secondary" onClick={onClose} disabled={busy}>
            {tx("Cancelar")}
          </button>
          <button type="button" className="button button--primary" disabled={busy || !changed || !weightOk} onClick={submit}>
            {busy ? tx("Salvando…") : tx("Salvar")}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
