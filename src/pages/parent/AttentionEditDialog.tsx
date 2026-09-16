import { useState, type ReactNode } from "react";
import { CAMPER_CATEGORY_KEYS, blankMedication, parentUpdateCamper, type Camper, type Medication, type ParentPatch } from "../../api/campers";
import { CategoryChips } from "../../components/CategoryFields";
import MedicationsEditor from "../../components/MedicationsEditor";
import Dialog from "../../components/Dialog";
import AiNotesField from "../../components/AiNotesField";
import NoPillIcon from "../../components/NoPillIcon";
import Toggle from "../../components/Toggle";
import { useAiNotesSorter } from "../../hooks/useAiNotesSorter";
import { useFieldDedup } from "../../hooks/useFieldDedup";
import type { DedupField } from "../../api/ai";
import { useCategories } from "../../store/derive";

interface AttentionEditDialogProps {
  token: string;
  open: boolean;
  camper: Camper;
  onClose: () => void;
}

/**
 * The parent edits the "Pontos de atenção" of their kid: same field order as
 * the registration form, with each medical topic collapsed behind a switch
 * until there's something to declare. Only changed fields are sent; the
 * server logs them and texts the team.
 */
export default function AttentionEditDialog({ token, open, camper: k, onClose }: AttentionEditDialogProps) {
  const categories = useCategories("camper");
  const cat = (key: string) => categories.find((c) => c.key === key);

  const [insurance, setInsurance] = useState(k.insurance);
  const [insuranceCard, setInsuranceCard] = useState(k.insuranceCard);
  const [weight, setWeight] = useState(k.weightKg != null ? String(k.weightKg).replace(".", ",") : "");
  const [allergies, setAllergies] = useState<string[]>(k.allergies);
  const [drugAllergies, setDrugAllergies] = useState<string[]>(k.drugAllergies);
  const [healthIssues, setHealthIssues] = useState<string[]>(k.healthIssues);
  const [medications, setMedications] = useState<Medication[]>(k.medications);
  const [foodRestrictions, setFoodRestrictions] = useState(k.foodRestrictions);
  const [healthNotes, setHealthNotes] = useState(k.healthNotes);
  const [generalNotes, setGeneralNotes] = useState(k.generalNotes);
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

  const patch: ParentPatch = {};
  if (!same(savedAllergies, k.allergies)) patch.allergies = savedAllergies;
  if (!same(savedDrugAllergies, k.drugAllergies)) patch.drugAllergies = savedDrugAllergies;
  if (!same(savedHealthIssues, k.healthIssues)) patch.healthIssues = savedHealthIssues;
  if (JSON.stringify(savedMeds) !== JSON.stringify(k.medications)) patch.medications = savedMeds;
  if (savedFood !== k.foodRestrictions) patch.foodRestrictions = savedFood;
  if (savedHealthNotes !== k.healthNotes) patch.healthNotes = savedHealthNotes;
  const roundedWeight = weightOk && weightKg !== null ? Math.round(weightKg * 10) / 10 : null;
  if (roundedWeight !== k.weightKg) patch.weightKg = roundedWeight;
  if (insurance.trim() !== k.insurance) patch.insurance = insurance.trim();
  if (insuranceCard.trim() !== k.insuranceCard) patch.insuranceCard = insuranceCard.trim();
  if (generalNotes.trim() !== k.generalNotes) patch.generalNotes = generalNotes.trim();
  const changed = Object.keys(patch).length > 0;
  const medicalChange = Object.keys(patch).some((f) => f !== "generalNotes");

  const dedup = useFieldDedup({ token, busy });

  // ✨ sort the observations: on paste / blur the model spreads the text over the medical fields above
  const ai = useAiNotesSorter({
    token,
    subject: "parent",
    initialNotes: k.generalNotes,
    busy,
    getCurrent: () => ({
      allergies: savedAllergies,
      drugAllergies: savedDrugAllergies,
      healthIssues: savedHealthIssues,
      medications: savedMeds,
      foodRestrictions: savedFood,
      healthNotes: savedHealthNotes,
      weightKg: weightOk ? weightKg : null,
      insurance,
      insuranceCard,
    }),
    apply: (f) => {
      if (f.allergies.length) {
        setAllergies(f.allergies);
        setHasAllergies(true);
      }
      if (f.drugAllergies.length) {
        setDrugAllergies(f.drugAllergies);
        setHasDrugAllergies(true);
      }
      if (f.healthIssues.length) {
        setHealthIssues(f.healthIssues);
        setHasHealthIssues(true);
      }
      if (f.medications.length) {
        setMedications(f.medications);
        setHasMedicines(true);
      }
      if (f.foodRestrictions) {
        setFoodRestrictions(f.foodRestrictions);
        setHasFoodRestrictions(true);
      }
      if (f.healthNotes) {
        setHealthNotes(f.healthNotes);
        setHasHealthNotes(true);
      }
      if (f.weightKg != null) setWeight(String(f.weightKg).replace(".", ","));
      if (f.insurance) setInsurance(f.insurance);
      if (f.insuranceCard) setInsuranceCard(f.insuranceCard);
      setGeneralNotes(f.generalNotes);
      dedup.runMany([
        { field: "foodRestrictions", value: f.foodRestrictions, apply: setFoodRestrictions },
        { field: "healthNotes", value: f.healthNotes, apply: setHealthNotes },
        { field: "generalNotes", value: f.generalNotes, apply: setGeneralNotes },
      ]);
    },
  });

  async function submit() {
    if (!changed || !weightOk || busy || ai.holding) return;
    // the sorter had its 8 seconds: whatever it hasn't finished is dropped and the dialog saves as it is
    ai.cancel();
    dedup.cancelAll();
    setBusy(true);
    setError(null);
    try {
      await parentUpdateCamper(token, k.id, patch);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
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
    <Dialog open={open} onClose={onClose} title="Editar pontos de atenção" width={620} dismissible={!busy} className="attention-sheet-dialog">
      <div className="cat-form attention-sheet">
        <header className="attention-sheet__head">
          <span className="attention-sheet__handle" aria-hidden="true" />
          <h2 className="cat-form__title">⚠️ Pontos de atenção de {k.name.split(" ")[0]}</h2>
          <p className="cat-hint">O que você alterar aqui é avisado à equipe que cuida de {k.name.split(" ")[0]} no acampamento.</p>
        </header>

        <div className="attention-sheet__body">
        <div className="cat-form__row staff-form__row">
          {text("🏥 Convênio médico", insurance, setInsurance, "ex.: Bradesco")}
          {text("Carteirinha", insuranceCard, setInsuranceCard)}
        </div>

        <label className="cat-field cat-field--weight">
          <span className="cat-field__label">⚖️ Peso (kg)</span>
          <input className="cat-input" inputMode="decimal" placeholder="ex.: 28,5" value={weight} maxLength={6} disabled={busy} onChange={(e) => setWeight(e.target.value)} />
          {weight.trim() && !weightOk && <p className="cat-hint cat-hint--error">Entre 5 e 200 kg.</p>}
        </label>

        {optional("🤮 Alergias", hasAllergies, setHasAllergies, <CategoryChips label="Quais" category={cat(CAMPER_CATEGORY_KEYS.allergies)} value={allergies} onChange={setAllergies} disabled={busy} />)}
        {optional(
          <>
            <NoPillIcon /> Alergia a medicamentos
          </>,
          hasDrugAllergies,
          setHasDrugAllergies,
          <CategoryChips label="Quais" category={cat(CAMPER_CATEGORY_KEYS.drugAllergies)} value={drugAllergies} onChange={setDrugAllergies} disabled={busy} />,
        )}
        {optional("🩺 Condição crônica", hasHealthIssues, setHasHealthIssues, <CategoryChips label="Quais" category={cat(CAMPER_CATEGORY_KEYS.healthIssues)} value={healthIssues} onChange={setHealthIssues} disabled={busy} />)}
        {optional(
          "💊 Medicação de uso diário",
          hasMedicines,
          (on) => {
            setHasMedicines(on);
            if (on && medications.length === 0) setMedications([blankMedication()]);
          },
          <MedicationsEditor value={medications} onChange={setMedications} disabled={busy} />,
        )}
        {optional("🍽️ Alimentação / restrições", hasFoodRestrictions, setHasFoodRestrictions, text("Quais", foodRestrictions, setFoodRestrictions, "ex.: sem lactose", 2, "foodRestrictions"))}
        {optional("🩺 Observações médicas", hasHealthNotes, setHasHealthNotes, text("Observações", healthNotes, setHealthNotes, "ex.: em caso de crise, 4 puffs de Aerolin…", 3, "healthNotes"))}

        <AiNotesField label="📝 Observações gerais" value={generalNotes} onChange={setGeneralNotes} placeholder="ex.: tem dificuldade em dormir sozinha" disabled={busy} sorter={ai} />

        {changed && (
          <p className="cat-hint">
            {medicalChange ? "🩺 A equipe médica, a organização e o líder do quarto serão avisados." : "O líder do quarto será avisado."}
          </p>
        )}
        {error && <p className="message message--error">{error}</p>}
        </div>

        <div className="cat-form__actions attention-sheet__actions">
          <button type="button" className="button button--secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="button button--primary" disabled={busy || !changed || !weightOk || ai.holding} title={ai.holding ? "Aguardando a IA organizar as observações…" : undefined} onClick={submit}>
            {busy ? "Salvando…" : ai.holding ? "Organizando…" : "Salvar"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
