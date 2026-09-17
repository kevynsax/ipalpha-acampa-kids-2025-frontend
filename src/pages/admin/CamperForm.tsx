import RoomRoleIcon from "../../components/RoomRoleIcon";
import { useEffect, useMemo, useRef, useState } from "react";
import { useConfirmChoice } from "../../components/ConfirmDialog";
import { CAMPER_CATEGORY_KEYS, blankMedication, type Camper, type CamperInput, type CamperSex, type Medication } from "../../api/campers";
import { useHideScanFab } from "../../scanFab";
import { useCollectionOrEmpty } from "../../store";
import AiNotesField from "../../components/AiNotesField";
import { useAiNotesSorter } from "../../hooks/useAiNotesSorter";
import { useFieldDedup } from "../../hooks/useFieldDedup";
import { useGuessCamperSex } from "../../hooks/useGuessCamperSex";
import type { DedupField } from "../../api/ai";
import MedicationsEditor from "../../components/MedicationsEditor";
import NoPillIcon from "../../components/NoPillIcon";
import type { Category } from "../../api/categories";
import { bedroomGroupsForSex } from "../../api/bedrooms";
import { BedroomSelect, CategoryChips, CategoryRadio, TeamSelect, TransportSelect } from "../../components/CategoryFields";
import BunkIcon from "../../components/BunkIcon";
import ParentIcon from "../../components/ParentIcon";
import CpfInput from "../../components/CpfInput";
import PhoneInput from "../../components/PhoneInput";
import Toggle from "../../components/Toggle";
import { formatCpf } from "../../cpf";
import { maskBrazilPhone, toE164 } from "../../phone";

interface CamperFormProps {
  /** session token — lets the form ask the AI to sort the observations */
  token: string;
  camper?: Camper;
  categories: Category[];
  busy?: boolean;
  onSubmit: (input: CamperInput) => Promise<void>;
  /** live boy/girl guess — drives the "Novo acampante" title icon */
  onSexChange?: (sex: CamperSex | null, busy: boolean) => void;
  /**
   * Set by the form to a guard the parent calls before navigating away (breadcrumbs).
   * Resolves true when navigation may proceed, false to stay on the form.
   */
  leaveGuardRef?: React.MutableRefObject<(() => Promise<boolean>) | null>;
}

/** Create / edit a camper (kid). The health block is collapsible; the guardian box is always open. */
export default function CamperForm({ token, camper, categories, busy, onSubmit, onSexChange, leaveGuardRef }: CamperFormProps) {
  // the "Ler crachá" FAB would sit on top of Salvar / Cancelar
  useHideScanFab();
  const editing = !!camper;
  const cat = (key: string) => categories.find((c) => c.key === key);

  const [name, setName] = useState(camper?.name ?? "");
  const [birthDate, setBirthDate] = useState(camper?.birthDate ?? "");
  const [cpf, setCpf] = useState(formatCpf(camper?.cpf ?? ""));
  const [rg, setRg] = useState(camper?.rg ?? "");
  const [school, setSchool] = useState(camper?.school ?? "");
  const [schoolGrade, setSchoolGrade] = useState(camper?.schoolGrade ?? "");
  const [church, setChurch] = useState(camper?.church ?? "");
  const [invitedBy, setInvitedBy] = useState(camper?.invitedBy ?? "");
  const [bed, setBed] = useState<string | null>(camper?.bed ?? null);

  // allocation: only on CREATE — when editing, team, room, leader and transport are changed from the detail page (pencil dialogs)
  const bedrooms = useCollectionOrEmpty("bedrooms");
  const staff = useCollectionOrEmpty("staff");
  const [team, setTeam] = useState<string | null>(camper?.team ?? null);
  const [bedroom, setBedroom] = useState<string | null>(camper?.bedroom ?? null);
  const room = bedroom ? bedrooms.find((b) => b.id === bedroom) : undefined;
  const roomSex: CamperSex | null = room?.group === "girls" ? "F" : room?.group === "boys" ? "M" : null;
  const nameChanged = editing && name.trim() !== (camper?.name ?? "").trim();
  const guessed = useGuessCamperSex({ token, name, enabled: !roomSex && (!editing || nameChanged) });
  // girls/boys room wins; staff room / no room keeps the last GLM guess until a new one lands
  const sex: CamperSex | null = roomSex ?? guessed.sex ?? (editing && !nameChanged ? (camper?.sex ?? null) : null);
  const probableGender: CamperSex | null = guessed.sex ?? (editing && !nameChanged ? (camper?.probableGender ?? null) : null);
  const sexBusy = !roomSex && guessed.busy;
  useEffect(() => {
    onSexChange?.(sex, sexBusy);
  }, [sex, sexBusy, onSexChange]);
  const [caretakerId, setCaretakerId] = useState<string | null>(camper?.caretakerId ?? null);
  const [transportation, setTransportation] = useState<string | null>(camper?.transportation ?? null);
  /** the líderes of the chosen room: the only people who may look after the kid */
  const caretakers = useMemo(
    () => (bedroom ? staff.filter((s) => s.bedroom === bedroom && s.roomRole === "caretaker").sort((a, b) => a.name.localeCompare(b.name, "pt-BR")) : []),
    [staff, bedroom],
  );
  // one líder → picked for you; room changed → a líder from elsewhere is dropped
  useEffect(() => {
    if (editing) return;
    if (caretakers.length === 1) setCaretakerId(caretakers[0].id);
    else if (!caretakers.some((s) => s.id === caretakerId)) setCaretakerId(null);
  }, [caretakers, caretakerId, editing]);

  const [guardianName, setGuardianName] = useState(camper?.guardianName ?? "");
  const [guardianPhone, setGuardianPhone] = useState(camper?.guardianPhone ? maskBrazilPhone(camper.guardianPhone.replace(/^\+55/, "")) : "");
  const [guardianCpf, setGuardianCpf] = useState(formatCpf(camper?.guardianCpf ?? ""));
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

  // any change from the values the form opened with → ask save/discard before leaving
  const askChoice = useConfirmChoice();
  const snapshot = JSON.stringify([
    name, birthDate, sex, cpf, rg, school, schoolGrade, church, invitedBy, bed, team, bedroom, caretakerId, transportation,
    guardianName, guardianPhone, guardianCpf, guardianEmail, emergencyContact, insurance, insuranceCard,
    allergies, drugAllergies, healthIssues, neurodivergent, medications, foodRestrictions, weight, healthNotes, generalNotes, bedroomPreference,
    hasAllergies, hasDrugAllergies, hasHealthIssues, hasMedicines, hasFoodRestrictions, hasHealthNotes,
  ]);
  const initialSnapshot = useRef<string | null>(null);
  if (initialSnapshot.current === null) initialSnapshot.current = snapshot;
  const dirty = initialSnapshot.current !== snapshot;

  // the parent (breadcrumbs / router) calls this before navigating away
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useEffect(() => {
    if (!leaveGuardRef) return;
    leaveGuardRef.current = async () => {
      if (!dirtyRef.current) return true;
      const r = await askChoice({
        title: "Salvar alterações?",
        message: "Você fez alterações que ainda não foram salvas.",
        confirmLabel: "Salvar",
        discardLabel: "Descartar",
        cancelLabel: "Cancelar",
        emoji: "💾",
      });
      if (r === "cancel") return false;
      if (r === "discard") return true;
      return submitRef.current(); // save; proceed only if it succeeded
    };
    return () => {
      leaveGuardRef.current = null;
    };
  }, [leaveGuardRef, askChoice]);


  const phoneE164 = toE164(guardianPhone);
  const phoneOk = !guardianPhone.trim() || !!phoneE164;
  const weightKg = weight.trim() ? Number(weight.trim().replace(",", ".")) : null;
  const weightOk = weightKg === null || (Number.isFinite(weightKg) && weightKg >= 5 && weightKg <= 200);
  const valid = name.trim().length > 0 && phoneOk && weightOk;

  // ✨ background "remove repeats" on individual free-text fields (fires on blur and after the sorter fills them)
  const dedup = useFieldDedup({ token, busy });

  // ✨ sort the observations: on paste / blur the model spreads the text over the fields above
  const ai = useAiNotesSorter({
    token,
    subject: "camper",
    initialNotes: camper?.generalNotes ?? "",
    busy,
    getCurrent: () => ({
      allergies: hasAllergies ? allergies : [],
      drugAllergies: hasDrugAllergies ? drugAllergies : [],
      healthIssues: hasHealthIssues ? healthIssues : [],
      neurodivergent,
      medications: hasMedicines ? medications.filter((m) => m.name.trim()) : [],
      foodRestrictions: hasFoodRestrictions ? foodRestrictions : "",
      healthNotes: hasHealthNotes ? healthNotes : "",
      bedroomPreference,
      emergencyContact,
      weightKg: weightOk ? weightKg : null,
      insurance,
      insuranceCard,
      cpf,
      rg,
      school,
      schoolGrade,
      church,
      invitedBy,
      guardianName,
      guardianPhone,
      guardianCpf,
      guardianEmail,
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
      if (f.neurodivergent) setNeurodivergent(true);
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
      if (f.bedroomPreference) setBedroomPreference(f.bedroomPreference);
      if (f.emergencyContact) setEmergencyContact(f.emergencyContact);
      if (f.weightKg != null) setWeight(String(f.weightKg).replace(".", ","));
      if (f.insurance) setInsurance(f.insurance);
      if (f.insuranceCard) setInsuranceCard(f.insuranceCard);
      if (f.cpf) setCpf(formatCpf(f.cpf));
      if (f.rg) setRg(f.rg);
      if (f.school) setSchool(f.school);
      if (f.schoolGrade) setSchoolGrade(f.schoolGrade);
      if (f.church) setChurch(f.church);
      if (f.invitedBy) setInvitedBy(f.invitedBy);
      if (f.guardianName) setGuardianName(f.guardianName);
      if (f.guardianPhone) setGuardianPhone(maskBrazilPhone(f.guardianPhone.replace(/^\+?55/, "")));
      if (f.guardianCpf) setGuardianCpf(formatCpf(f.guardianCpf));
      if (f.guardianEmail) setGuardianEmail(f.guardianEmail);
      setGeneralNotes(f.generalNotes);
      // the sorter just replaced several fields; clean repeats in all of them in parallel
      dedup.runMany([
        { field: "emergencyContact", value: f.emergencyContact, apply: setEmergencyContact },
        { field: "bedroomPreference", value: f.bedroomPreference, apply: setBedroomPreference },
        { field: "foodRestrictions", value: f.foodRestrictions, apply: setFoodRestrictions },
        { field: "healthNotes", value: f.healthNotes, apply: setHealthNotes },
        { field: "generalNotes", value: f.generalNotes, apply: setGeneralNotes },
      ]);
    },
  });

  const submitRef = useRef<() => Promise<boolean>>(async () => false);
  submitRef.current = handleSubmit;

  async function handleSubmit(e?: React.FormEvent): Promise<boolean> {
    e?.preventDefault();
    if (!valid || ai.holding) return false;
    // the sorter had its 8 seconds: whatever it hasn't finished is dropped and the form saves as it is
    ai.cancel();
    dedup.cancelAll();
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        birthDate: birthDate || null,
        sex,
        probableGender,
        cpf: formatCpf(cpf),
        rg: rg.trim(),
        school: school.trim(),
        schoolGrade: schoolGrade.trim(),
        church: church.trim(),
        invitedBy: invitedBy.trim(),
        qrToken: camper?.qrToken ?? "",
        externalId: camper?.externalId ?? "",
        // when editing, team, room, leader and transportation are changed from the detail page (pencil dialogs), not here
        caretakerId: editing ? (camper.caretakerId ?? null) : caretakerId,
        team: editing ? (camper.team ?? null) : team,
        bedroom: editing ? (camper.bedroom ?? null) : bedroom,
        bed,
        transportation: editing ? (camper.transportation ?? null) : transportation,
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
        guardianCpf: formatCpf(guardianCpf),
        guardianEmail: guardianEmail.trim().toLowerCase(),
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
      return false;
    }
  }

  /** a labelled text field; pass `dedupAs` to run the background repeat clean-up on blur (pulses while it runs) */
  const text = (label: React.ReactNode, value: string, set: (v: string) => void, placeholder = "", rows?: number, dedupAs?: DedupField) => {
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
      <div className="cat-form__row staff-form__row staff-form__row--inline">
        <label className="cat-field cat-field--grow">
          <span className={`cat-field__label${sexBusy ? " cat-field__label--guessing" : ""}`}>Nome</span>
          <input
            className={`cat-input${sexBusy ? " cat-input--busy" : ""}`}
            placeholder="ex.: Helena Sparvoli"
            value={name}
            maxLength={100}
            autoFocus
            disabled={busy}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="cat-field">
          <span className="cat-field__label">Nascimento</span>
          <input className="cat-input" type="date" value={birthDate} disabled={busy} onChange={(e) => setBirthDate(e.target.value)} />
        </label>
        <input type="hidden" name="sex" value={sex ?? ""} />
      </div>

      <div className="cat-form__row staff-form__row">
        <CategoryRadio label="Cama" category={cat(CAMPER_CATEGORY_KEYS.bed)} value={bed} onChange={setBed} disabled={busy} />
        {text(<><BunkIcon size={18} /> Prefere dividir quarto com</>, bedroomPreference, setBedroomPreference, "ex.: Bernardo Faria, Lucas (primo)", undefined, "bedroomPreference")}
      </div>

      {!editing && (
        <section className="form-box form-box--plain" aria-labelledby="alloc-title">
          <h3 id="alloc-title" className="form-box__title">🏕️ Time, quarto e transporte</h3>
          <div className="cat-form__row staff-form__row">
            <TeamSelect value={team} onChange={setTeam} disabled={busy} />
            <TransportSelect value={transportation} onChange={setTransportation} disabled={busy} />
          </div>
          <div className="cat-form__row staff-form__row">
            <BedroomSelect bedrooms={bedrooms} value={bedroom} onChange={setBedroom} groups={bedroomGroupsForSex(sex, probableGender)} disabled={busy} />
            <label className="cat-field cat-field--grow">
              <span className="cat-field__label"><RoomRoleIcon role="caretaker" sex={sex ?? "M"} /> Líder</span>
              <select className="cat-input" value={caretakerId ?? ""} disabled={busy || !bedroom || caretakers.length === 0} onChange={(e) => setCaretakerId(e.target.value || null)}>
                <option value="">{!bedroom ? "Escolha o quarto primeiro" : caretakers.length ? "Sem líder" : "Nenhum líder neste quarto"}</option>
                {caretakers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      )}

      <section className="form-box form-box--plain" aria-labelledby="extra-title">
        <h3 id="extra-title" className="form-box__title">🪪 Documentos e escola</h3>
        <div className="cat-form__row staff-form__row">
          <label className="cat-field cat-field--grow">
            <span className="cat-field__label">CPF</span>
            <CpfInput value={cpf} onChange={setCpf} disabled={busy} placeholder="ex.: 123.456.789-00" />
          </label>
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
          <label className="cat-field cat-field--grow">
            <span className="cat-field__label">CPF do responsável</span>
            <CpfInput value={guardianCpf} onChange={setGuardianCpf} disabled={busy} ariaLabel="CPF do responsável" />
          </label>
          {text("E-mail do responsável", guardianEmail, setGuardianEmail, "ex.: nome@email.com")}
        </div>
        {text("Contato de emergência", emergencyContact, setEmergencyContact, "ex.: Marcos (pai) 11 99999-0000", undefined, "emergencyContact")}
        <div className="cat-form__row staff-form__row">
          {text("Convênio médico", insurance, setInsurance, "ex.: Bradesco")}
          {text("Carteirinha", insuranceCard, setInsuranceCard)}
        </div>
      </section>

      <section className="form-box form-box--plain" aria-labelledby="health-title">
        <h3 id="health-title" className="form-box__title">📝 Saúde e observações</h3>
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
        {optional("🍽️ Alimentação / restrições", hasFoodRestrictions, setHasFoodRestrictions, text("Quais", foodRestrictions, setFoodRestrictions, "ex.: sem lactose", 2, "foodRestrictions"))}
        {optional("🩺 Observações médicas", hasHealthNotes, setHasHealthNotes, text("Observações", healthNotes, setHealthNotes, "ex.: em caso de crise, 4 puffs de Aerolin…", 3, "healthNotes"))}
        <AiNotesField
          label="📝 Observações gerais"
          value={generalNotes}
          onChange={setGeneralNotes}
          placeholder="ex.: cole aqui o texto da inscrição — saúde, contatos e preferências vão para os campos certos"
          disabled={busy}
          sorter={ai}
        />
      </section>

      {error && <p className="message message--error">{error}</p>}

      <div className="cat-form__actions">
        <button type="submit" className="button button--primary" disabled={!valid || busy || ai.holding} title={ai.holding ? "Aguardando a IA organizar as observações…" : undefined}>
          {busy ? "Salvando…" : ai.holding ? "Organizando…" : editing ? "Salvar" : "Adicionar 🎉"}
        </button>
      </div>
    </form>
  );
}
