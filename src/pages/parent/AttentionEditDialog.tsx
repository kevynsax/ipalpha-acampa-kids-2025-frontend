import { useState } from "react";
import { CAMPER_CATEGORY_KEYS, parentUpdateCamper, type Camper, type Medication, type ParentPatch } from "../../api/campers";
import { CategoryChips } from "../../components/CategoryFields";
import MedicationsEditor from "../../components/MedicationsEditor";
import Dialog from "../../components/Dialog";
import AiNotesField from "../../components/AiNotesField";
import { useAiNotesSorter } from "../../hooks/useAiNotesSorter";
import { useCategories } from "../../store/derive";

interface AttentionEditDialogProps {
  token: string;
  open: boolean;
  camper: Camper;
  onClose: () => void;
}

/**
 * The parent edits the "Pontos de atenção" of their kid: the medical block
 * (allergies, drug allergies, conditions, medication, food, medical notes,
 * weight, insurance + card) and the observations. Only the fields that
 * actually changed are sent; the server logs them and texts the team.
 */
export default function AttentionEditDialog({ token, open, camper: k, onClose }: AttentionEditDialogProps) {
  const categories = useCategories("camper");
  const cat = (key: string) => categories.find((c) => c.key === key);

  const [allergies, setAllergies] = useState<string[]>(k.allergies);
  const [drugAllergies, setDrugAllergies] = useState<string[]>(k.drugAllergies);
  const [healthIssues, setHealthIssues] = useState<string[]>(k.healthIssues);
  const [medications, setMedications] = useState<Medication[]>(k.medications);
  const [foodRestrictions, setFoodRestrictions] = useState(k.foodRestrictions);
  const [healthNotes, setHealthNotes] = useState(k.healthNotes);
  const [weight, setWeight] = useState(k.weightKg != null ? String(k.weightKg).replace(".", ",") : "");
  const [insurance, setInsurance] = useState(k.insurance);
  const [insuranceCard, setInsuranceCard] = useState(k.insuranceCard);
  const [generalNotes, setGeneralNotes] = useState(k.generalNotes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weightKg = weight.trim() ? Number(weight.trim().replace(",", ".")) : null;
  const weightOk = weightKg === null || (Number.isFinite(weightKg) && weightKg >= 5 && weightKg <= 200);

  const same = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));
  const patch: ParentPatch = {};
  if (!same(allergies, k.allergies)) patch.allergies = allergies;
  if (!same(drugAllergies, k.drugAllergies)) patch.drugAllergies = drugAllergies;
  if (!same(healthIssues, k.healthIssues)) patch.healthIssues = healthIssues;
  const cleanMeds = medications.filter((m) => m.name.trim()).map((m) => ({ ...m, name: m.name.trim(), dose: m.dose.trim(), notes: m.notes.trim() }));
  if (JSON.stringify(cleanMeds) !== JSON.stringify(k.medications)) patch.medications = cleanMeds;
  if (foodRestrictions.trim() !== k.foodRestrictions) patch.foodRestrictions = foodRestrictions.trim();
  if (healthNotes.trim() !== k.healthNotes) patch.healthNotes = healthNotes.trim();
  const roundedWeight = weightOk && weightKg !== null ? Math.round(weightKg * 10) / 10 : null;
  if (roundedWeight !== k.weightKg) patch.weightKg = roundedWeight;
  if (insurance.trim() !== k.insurance) patch.insurance = insurance.trim();
  if (insuranceCard.trim() !== k.insuranceCard) patch.insuranceCard = insuranceCard.trim();
  if (generalNotes.trim() !== k.generalNotes) patch.generalNotes = generalNotes.trim();
  const changed = Object.keys(patch).length > 0;
  const medicalChange = Object.keys(patch).some((f) => f !== "generalNotes");

  // ✨ sort the observations: on paste / blur the model spreads the text over the medical fields above
  const ai = useAiNotesSorter({
    token,
    subject: "parent",
    initialNotes: k.generalNotes,
    busy,
    getCurrent: () => ({ allergies, drugAllergies, healthIssues, medications: cleanMeds, foodRestrictions, healthNotes, weightKg: weightOk ? weightKg : null, insurance, insuranceCard }),
    apply: (f) => {
      if (f.allergies.length) setAllergies(f.allergies);
      if (f.drugAllergies.length) setDrugAllergies(f.drugAllergies);
      if (f.healthIssues.length) setHealthIssues(f.healthIssues);
      if (f.medications.length) setMedications(f.medications);
      if (f.foodRestrictions) setFoodRestrictions(f.foodRestrictions);
      if (f.healthNotes) setHealthNotes(f.healthNotes);
      if (f.weightKg != null) setWeight(String(f.weightKg).replace(".", ","));
      if (f.insurance) setInsurance(f.insurance);
      if (f.insuranceCard) setInsuranceCard(f.insuranceCard);
      setGeneralNotes(f.generalNotes);
    },
  });

  async function submit() {
    if (!changed || !weightOk || busy || ai.holding) return;
    // the sorter had its 8 seconds: whatever it hasn't finished is dropped and the dialog saves as it is
    ai.cancel();
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
    <Dialog open={open} onClose={onClose} title="Editar pontos de atenção" width={620} dismissible={!busy}>
      <div className="cat-form">
        <h2 className="cat-form__title">⚠️ Pontos de atenção de {k.name.split(" ")[0]}</h2>
        <p className="cat-hint">O que você alterar aqui é avisado à equipe que cuida de {k.name.split(" ")[0]} no acampamento.</p>

        <CategoryChips label="Alergias" category={cat(CAMPER_CATEGORY_KEYS.allergies)} value={allergies} onChange={setAllergies} disabled={busy} />
        <CategoryChips label="Alergia a medicamentos" category={cat(CAMPER_CATEGORY_KEYS.drugAllergies)} value={drugAllergies} onChange={setDrugAllergies} disabled={busy} />
        <CategoryChips label="Condição de saúde" category={cat(CAMPER_CATEGORY_KEYS.healthIssues)} value={healthIssues} onChange={setHealthIssues} disabled={busy} />

        <div className="cat-field">
          <span className="cat-field__label">💊 Medicação de uso diário</span>
          <MedicationsEditor value={medications} onChange={setMedications} disabled={busy} />
        </div>
        {text("🍽️ Alimentação / restrições", foodRestrictions, setFoodRestrictions, "ex.: sem lactose", 2)}
        {text("🩺 Observações médicas", healthNotes, setHealthNotes, "ex.: em caso de crise, 4 puffs de Aerolin…", 3)}

        <div className="cat-form__row staff-form__row">
          <label className="cat-field cat-field--weight">
            <span className="cat-field__label">⚖️ Peso (kg)</span>
            <input className="cat-input" inputMode="decimal" placeholder="ex.: 28,5" value={weight} maxLength={6} disabled={busy} onChange={(e) => setWeight(e.target.value)} />
            {weight.trim() && !weightOk && <p className="cat-hint cat-hint--error">Entre 5 e 200 kg.</p>}
          </label>
          {text("🏥 Convênio médico", insurance, setInsurance, "ex.: Bradesco")}
          {text("Carteirinha", insuranceCard, setInsuranceCard)}
        </div>

        <AiNotesField label="📝 Observações" value={generalNotes} onChange={setGeneralNotes} placeholder="ex.: tem dificuldade em dormir sozinha" disabled={busy} sorter={ai} />

        {changed && (
          <p className="cat-hint">
            {medicalChange ? "🩺 A equipe médica, a organização e o líder do quarto serão avisados." : "O líder do quarto será avisado."}
          </p>
        )}
        {error && <p className="message message--error">{error}</p>}

        <div className="cat-form__actions">
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
