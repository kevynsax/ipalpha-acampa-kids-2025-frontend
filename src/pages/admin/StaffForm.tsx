import RoomRoleIcon from "../../components/RoomRoleIcon";
import { useEffect, useRef, useState } from "react";
import { useConfirmChoice } from "../../components/ConfirmDialog";
import type { Category } from "../../api/categories";
import { bedroomGroupsForSex } from "../../api/bedrooms";
import { BedroomSelect, CategoryChips, TeamSelect, TransportSelect } from "../../components/CategoryFields";
import { useCollectionOrEmpty } from "../../store";
import { ROOM_ROLE_META, STAFF_CATEGORY_KEYS, type RoomRole, type Staff, type StaffInput } from "../../api/staff";
import { blankMedication, type CamperSex, type Medication } from "../../api/campers";
import MedicationsEditor from "../../components/MedicationsEditor";
import PhoneInput from "../../components/PhoneInput";
import NoPillIcon from "../../components/NoPillIcon";
import Toggle from "../../components/Toggle";
import AiNotesField from "../../components/AiNotesField";
import { useAiNotesSorter } from "../../hooks/useAiNotesSorter";
import { useFieldDedup } from "../../hooks/useFieldDedup";
import { useGuessCamperSex } from "../../hooks/useGuessCamperSex";
import type { DedupField } from "../../api/ai";
import { maskBrazilPhone, toE164 } from "../../phone";
import { useHideScanFab } from "../../scanFab";
import { useI18n } from "../../i18n";

interface StaffFormProps {
  /** session token — lets the form ask the AI to sort the health observations */
  token: string;
  /** when editing, the existing member; when creating, undefined */
  member?: Staff;
  categories: Category[];
  busy?: boolean;
  onSubmit: (input: StaffInput) => Promise<void>;
  /** live man/woman guess — drives the "Novo membro" title icon */
  onSexChange?: (sex: CamperSex | null, busy: boolean) => void;
  /**
   * Set by the form to a guard the parent calls before navigating away (breadcrumbs).
   * Resolves true when navigation may proceed, false to stay on the form.
   */
  leaveGuardRef?: React.MutableRefObject<(() => Promise<boolean>) | null>;
}

/**
 * Create / edit a team member. Team, room and transport are asked only on
 * CREATE; when editing they are changed from the detail page (pencil dialogs). Each health
 * topic is a switch — off = nothing to declare (field hidden, cleared on save).
 */
export default function StaffForm({ token, member, categories, busy, onSubmit, onSexChange, leaveGuardRef }: StaffFormProps) {
  const { tx } = useI18n();
  // the "Ler crachá" FAB would sit on top of Salvar / Cancelar
  useHideScanFab();
  const editing = !!member;
  const byKey = (key: string) => categories.find((c) => c.key === key);

  /** an admin's roster record: room / transport / vest only — never a líder, never in a time */
  const isAdmin = !!member?.admin;

  const [name, setName] = useState(member?.name ?? "");
  const [phone, setPhone] = useState(member?.phone ? maskBrazilPhone(member.phone.replace(/^\+55/, "")) : "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [active, setActive] = useState(member?.active ?? true);
  const [roomRole, setRoomRole] = useState<RoomRole>(isAdmin ? "helper" : (member?.roomRole ?? "helper"));
  const bedrooms = useCollectionOrEmpty("bedrooms");
  const roster = useCollectionOrEmpty("staff");
  const [team, setTeam] = useState<string | null>(member?.team ?? null);
  const [bedroom, setBedroom] = useState<string | null>(member?.bedroom ?? null);
  const room = bedroom ? bedrooms.find((b) => b.id === bedroom) : undefined;
  const roomSex: CamperSex | null = room?.group === "girls" ? "F" : room?.group === "boys" ? "M" : null;
  const nameChanged = editing && name.trim() !== (member?.name ?? "").trim();
  const guessed = useGuessCamperSex({ token, name, enabled: !roomSex && (!editing || nameChanged) });
  const sex: CamperSex | null = roomSex ?? guessed.sex ?? (editing && !nameChanged ? (member?.sex ?? null) : null);
  const probableGender: CamperSex | null = guessed.sex ?? (editing && !nameChanged ? (member?.probableGender ?? null) : null);
  const sexBusy = !roomSex && guessed.busy;
  useEffect(() => {
    onSexChange?.(sex, sexBusy);
  }, [sex, sexBusy, onSexChange]);
  const [transportation, setTransportation] = useState<string | null>(member?.transportation ?? null);
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
  /** don't paint the "falta o celular" warning red on a form the person just opened */
  const [phoneTouched, setPhoneTouched] = useState(false);

  // any change from the values the form opened with → ask save/discard before leaving
  const askChoice = useConfirmChoice();
  const snapshot = JSON.stringify([
    name, phone, email, active, roomRole, team, bedroom, transportation,
    allergies, drugAllergies, foodRestrictions, healthIssues, medications, healthNotes,
    hasAllergies, hasDrugAllergies, hasHealthIssues, hasMedicines, hasFoodRestrictions,
  ]);
  const initialSnapshot = useRef<string | null>(null);
  if (initialSnapshot.current === null) initialSnapshot.current = snapshot;
  const dirty = initialSnapshot.current !== snapshot;

  // the parent (breadcrumbs / router) calls this before navigating away
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const submitRef = useRef<() => Promise<boolean>>(async () => false);
  useEffect(() => {
    if (!leaveGuardRef) return;
    leaveGuardRef.current = async () => {
      if (!dirtyRef.current) return true;
      const r = await askChoice({
        title: tx("Salvar alterações?"),
        message: tx("Você fez alterações que ainda não foram salvas."),
        confirmLabel: tx("Salvar"),
        discardLabel: tx("Descartar"),
        cancelLabel: tx("Cancelar"),
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

  // the phone IS the login: required here and never shared with another member
  // (imports may still create someone without one — the form asks for it on the first edit)
  const phoneE164 = toE164(phone);
  const phoneTwin = phoneE164 ? roster.find((s) => s.phone === phoneE164 && s.id !== member?.id) : undefined;
  const phoneError = !phone.trim()
    ? tx("Informe o celular: é por ele que a pessoa entra no app.")
    : !phoneE164
      ? tx("Informe um celular válido com DDD.")
      : phoneTwin
        ? tx("Este celular já é de {name}.", { name: phoneTwin.name })
        : null;
  const emailError = email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? tx("Informe um e-mail válido.") : null;
  const valid = name.trim().length > 0 && !phoneError && !emailError;

  // ✨ background "remove repeats" on individual free-text fields (fires on blur and after the sorter fills them)
  const dedup = useFieldDedup({ token, busy });

  // ✨ sort the health observations: on paste / blur the model spreads the text over the fields above
  const ai = useAiNotesSorter({
    token,
    subject: "staff",
    initialNotes: member?.healthNotes ?? "",
    busy,
    getCurrent: () => ({
      allergies: hasAllergies ? allergies : [],
      drugAllergies: hasDrugAllergies ? drugAllergies : [],
      healthIssues: hasHealthIssues ? healthIssues : [],
      medications: hasMedicines ? medications.filter((m) => m.name.trim()) : [],
      foodRestrictions: hasFoodRestrictions ? foodRestrictions : "",
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
      setHealthNotes(f.healthNotes);
      // the sorter just replaced several fields; clean repeats in all of them in parallel
      dedup.runMany([
        { field: "foodRestrictions", value: f.foodRestrictions, apply: setFoodRestrictions },
        { field: "healthNotes", value: f.healthNotes, apply: setHealthNotes },
      ]);
    },
  });

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
        sex,
        probableGender,
        phone: phoneE164 ?? null,
        email: email.trim() ? email.trim().toLowerCase() : null,
        active,
        roomRole,
        // when editing, team, room and transport are changed from the detail page (pencil dialogs), not here
        team: editing ? (member.team ?? null) : team,
        bedroom: editing ? (member.bedroom ?? null) : bedroom,
        transportation: editing ? (member.transportation ?? null) : transportation,
        allergies: hasAllergies ? allergies : [],
        drugAllergies: hasDrugAllergies ? drugAllergies : [],
        foodRestrictions: hasFoodRestrictions ? foodRestrictions.trim() : "",
        healthIssues: hasHealthIssues ? healthIssues : [],
        medications: hasMedicines ? medications.filter((m) => m.name.trim()) : [],
        healthNotes: healthNotes.trim(),
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : tx("Algo deu errado."));
      return false;
    }
  }

  /** a labelled text field; pass `dedupAs` to run the background repeat clean-up on blur (pulses while it runs) */
  const text = (label: string, value: string, set: (v: string) => void, placeholder = "", rows?: number, dedupAs?: DedupField) => {
    const cls = `cat-input${rows ? " cat-input--area" : ""}${dedupAs && dedup.busy(dedupAs) ? " cat-input--busy" : ""}`;
    const onBlur = dedupAs ? () => void dedup.run(dedupAs, value, set) : undefined;
    return (
      <label className="cat-field cat-field--grow">
        <span className="cat-field__label">{label}</span>
        {rows ? (
          <textarea className={cls} rows={rows} value={value} placeholder={placeholder} maxLength={500} disabled={busy} onChange={(e) => set(e.target.value)} onBlur={onBlur} />
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
      <div className="cat-form__row staff-form__row">
        <label className="cat-field cat-field--grow">
          <span className={`cat-field__label${sexBusy ? " cat-field__label--guessing" : ""}`}>{tx("Nome")}</span>
          <input
            className={`cat-input${sexBusy ? " cat-input--busy" : ""}`}
            placeholder={tx("ex.: Abimael")}
            value={name}
            maxLength={80}
            autoFocus
            disabled={busy}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <input type="hidden" name="sex" value={sex ?? ""} />
        <div className="cat-field cat-field--grow">
          <span className="cat-field__label">{tx("Celular")}</span>
          <PhoneInput
            value={phone}
            onChange={(v) => {
              setPhoneTouched(true);
              setPhone(v);
            }}
            disabled={busy || !!member?.admin}
          />
          {phoneError && <p className={`cat-hint${phoneTouched || phone.trim() ? " cat-hint--error" : ""}`}>{phoneError}</p>}
          {member?.admin && <p className="cat-hint">🔑 {tx("Celular de admin — é o login, não muda por aqui.")}</p>}
        </div>
      </div>
      <div className="cat-form__row staff-form__row">
        <label className="cat-field cat-field--grow">
          <span className="cat-field__label">{tx("E-mail")}</span>
          <input className="cat-input" type="email" inputMode="email" autoComplete="email" placeholder={tx("ex.: nome@email.com")} value={email} maxLength={160} disabled={busy} onChange={(e) => setEmail(e.target.value)} />
          {emailError && <p className="cat-hint cat-hint--error">{emailError}</p>}
        </label>
        <div className="cat-field">
          <span className="cat-field__label">{tx("Status")}</span>
          <Toggle checked={active} onChange={setActive} disabled={busy || !!member?.admin} label={active ? tx("Ativo") : tx("Inativo")} />
        </div>
      </div>

      <fieldset className="cat-fieldset">
        <legend className="cat-field__label">{tx("Função no quarto")}</legend>
        <div className="big-options big-options--row">
          {(Object.keys(ROOM_ROLE_META) as RoomRole[]).filter((r) => !isAdmin || r !== "caretaker").map((r) => {
            const on = roomRole === r;
            return (
              <button key={r} type="button" className={`big-option ${on ? "big-option--on" : ""}`} aria-pressed={on} disabled={busy} onClick={() => setRoomRole(r)}>
                <span className="big-option__emoji" aria-hidden="true"><RoomRoleIcon role={r} size={32} sex={sex ?? "M"} /></span>
                <span className="big-option__label">{tx(ROOM_ROLE_META[r].label)}</span>
                <span className="big-option__hint">{tx(ROOM_ROLE_META[r].hint)}</span>
              </button>
            );
          })}
        </div>
        {editing && member?.roomRole === "caretaker" && roomRole === "helper" && <p className="cat-hint cat-hint--error">{tx("Ao virar auxiliar, as crianças sob sua responsabilidade ficam sem líder.")}</p>}
        {isAdmin && <p className="cat-hint">🔑 {tx("Admin do app: tem quarto e transporte, mas não cuida de crianças nem entra em um time.")}</p>}
      </fieldset>

      {!editing && (
        <section className="form-box form-box--plain" aria-labelledby="staff-alloc-title">
          <h3 id="staff-alloc-title" className="form-box__title">{tx("🏕️ Time, quarto e transporte")}</h3>
          <div className="cat-form__row staff-form__row">
            <TeamSelect value={team} onChange={setTeam} disabled={busy} />
            <TransportSelect value={transportation} onChange={setTransportation} disabled={busy} audience="staff" />
          </div>
          <BedroomSelect bedrooms={bedrooms} value={bedroom} onChange={setBedroom} groups={bedroomGroupsForSex(sex, probableGender)} disabled={busy} />
        </section>
      )}

      <section className="form-box form-box--plain" aria-labelledby="staff-health-title">
        <h3 id="staff-health-title" className="form-box__title">{tx("📝 Saúde e observações")}</h3>
        {optional(tx("🤮 Alergias"), hasAllergies, setHasAllergies, <CategoryChips label={tx("Quais")} category={byKey(STAFF_CATEGORY_KEYS.allergies)} value={allergies} onChange={setAllergies} disabled={busy} />)}
        {optional(
          <>
            <NoPillIcon /> {tx("Alergia a medicamentos")}
          </>,
          hasDrugAllergies,
          setHasDrugAllergies,
          <CategoryChips label={tx("Quais")} category={byKey(STAFF_CATEGORY_KEYS.drugAllergies)} value={drugAllergies} onChange={setDrugAllergies} disabled={busy} />,
        )}
        {optional(tx("🩺 Condição crônica"), hasHealthIssues, setHasHealthIssues, <CategoryChips label={tx("Quais")} category={byKey(STAFF_CATEGORY_KEYS.healthIssues)} value={healthIssues} onChange={setHealthIssues} disabled={busy} />)}
        {optional(
          tx("💊 Medicação de uso diário"),
          hasMedicines,
          (on) => {
            setHasMedicines(on);
            if (on && medications.length === 0) setMedications([blankMedication()]);
          },
          <MedicationsEditor value={medications} onChange={setMedications} disabled={busy} />,
        )}
        {optional(tx("🍽️ Alimentação / restrições"), hasFoodRestrictions, setHasFoodRestrictions, text(tx("Quais"), foodRestrictions, setFoodRestrictions, tx("ex.: vegetariano, sem lactose"), 2, "foodRestrictions"))}
        <AiNotesField label={tx("📝 Outras observações de saúde")} value={healthNotes} onChange={setHealthNotes} placeholder={tx("ex.: cole aqui o que a pessoa escreveu na inscrição")} maxLength={500} disabled={busy} sorter={ai} />
      </section>

      {error && <p className="message message--error">{error}</p>}

      <div className="cat-form__actions">
        <button type="submit" className="button button--primary" disabled={!valid || busy || ai.holding} title={ai.holding ? tx("Aguardando a IA organizar as observações…") : undefined}>
          {busy ? tx("Salvando…") : ai.holding ? tx("Organizando…") : editing ? tx("Salvar") : tx("Adicionar 🎉")}
        </button>
      </div>
    </form>
  );
}
