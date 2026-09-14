import { useMemo, useState } from "react";
import type { Transport } from "../../api/transports";
import type { BusHelper } from "../../api/settings";
import type { Staff } from "../../api/staff";
import Dialog from "../../components/Dialog";
import BusLogo from "../../components/BusLogo";
import CarLogo from "../../components/CarLogo";
import { useCollectionOrEmpty } from "../../store";
import { ICONS } from "../../icons";
import StaffPicker from "./StaffPicker";

/** The vehicle's coloured mark: the bus logo in its colour, or a car emoji. */
function vehicleMark(v: Transport, size = 22) {
  return v.kind === "bus" ? <BusLogo color={v.color ?? "#0f9a8a"} number={v.number} size={size} /> : <CarLogo size={size} />;
}

interface BusHelpersEditorProps {
  value: BusHelper[];
  onChange: (helpers: BusHelper[]) => void;
  disabled?: boolean;
}

/** which step of "add a person" is open: choosing the vehicle, or the person for a known vehicle */
type Adding = { step: "vehicle" } | { step: "person"; vehicleId: string } | null;

/**
 * Who stands at the door of each vehicle. Only vehicles with someone are
 * listed; the section's "add" button asks the vehicle first, then the person;
 * each listed vehicle has its own "add" that goes straight to the person. A
 * person can only be at one door, so the picker hides everyone already placed.
 * Pure UI: the parent owns the list and saves it.
 */
export default function BusHelpersEditor({ value, onChange, disabled }: BusHelpersEditorProps) {
  const staff = useCollectionOrEmpty("staff");
  const transports = useCollectionOrEmpty("transports");
  const [adding, setAdding] = useState<Adding>(null);

  const vehicles = useMemo(() => transports.slice().sort((a, b) => a.order - b.order), [transports]);
  const staffById = useMemo(() => new Map(staff.map((s) => [s.id, s])), [staff]);
  const placed = new Set(value.map((h) => h.staffId));

  const shown = vehicles.filter((v) => value.some((h) => h.vehicleId === v.id));
  const target = adding?.step === "person" ? vehicles.find((v) => v.id === adding.vehicleId) ?? null : null;

  function add(vehicleId: string, staffId: string) {
    if (!placed.has(staffId)) onChange([...value, { staffId, vehicleId }]);
    setAdding(null);
  }
  const remove = (staffId: string) => onChange(value.filter((h) => h.staffId !== staffId));

  const addButton = (vehicleId?: string, label = "➕ Adicionar pessoa") => (
    <button type="button" className="button button--secondary list-head__add" disabled={disabled || vehicles.length === 0} onClick={() => setAdding(vehicleId ? { step: "person", vehicleId } : { step: "vehicle" })}>
      {label}
    </button>
  );

  return (
    <>
      <div className="list-head">
        <h2 className="cat-form__title">
          <img className="admin-title__icon" src={ICONS.transport} alt="" aria-hidden="true" /> Ajudantes do check-in no ônibus <span className="cat-tab__count">{value.length}</span>
        </h2>
        {addButton()}
      </div>
      <p className="cat-hint">
        Quem fica <strong>na porta de cada veículo</strong> conferindo que a criança entregue pelos pais chegou até a nossa equipe
      </p>

      {vehicles.length === 0 ? (
        <p className="opt-empty">Nenhum transporte cadastrado. Crie os veículos em Configurações → Transporte.</p>
      ) : shown.length === 0 ? (
        <p className="opt-empty">Ninguém na porta de nenhum veículo. Só o admin faz a chamada no ônibus.</p>
      ) : (
        <ul className="bus-helpers">
          {shown.map((v) => {
            const people = value
              .filter((h) => h.vehicleId === v.id)
              .map((h) => staffById.get(h.staffId))
              .filter((s): s is Staff => !!s);
            return (
              <li key={v.id} className="bus-helpers__vehicle">
                <header className="list-head">
                  <h3 className="bus-helpers__vehicle-name">
                    {vehicleMark(v)} {v.label} <span className="cat-tab__count">{people.length}</span>
                  </h3>
                  {addButton(v.id, "➕ Adicionar")}
                </header>
                <ul className="staff-card__tags helpers-list" aria-label={`Na porta: ${v.label}`}>
                  {people.map((s) => (
                    <li key={s.id} className="staff-tag helpers-tag">
                      <span className="helpers-tag__name">{s.name}</span>
                      <button type="button" className="helpers-tag__x" aria-label={`Remover ${s.name}`} title="Remover" disabled={disabled} onClick={() => remove(s.id)}>
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}

      {/* step 1 (section button only): which vehicle? */}
      <Dialog
        open={adding?.step === "vehicle"}
        onClose={() => setAdding((current) => (current?.step === "vehicle" ? null : current))}
        title="Qual veículo?"
        width={520}
      >
        <div className="picker">
          <h2 className="cat-form__title">Na porta de qual veículo?</h2>
          <ul className="picker__list" role="listbox">
            {vehicles.map((v) => {
              const n = value.filter((h) => h.vehicleId === v.id).length;
              return (
                <li key={v.id}>
                  <button type="button" role="option" aria-selected={false} className="picker__item" onClick={() => setAdding({ step: "person", vehicleId: v.id })}>
                    <span className="picker__name">
                      {vehicleMark(v)} {v.label}
                    </span>
                    <span className="cat-tab__count">{n}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </Dialog>

      {/* step 2: who? */}
      <StaffPicker
        open={adding?.step === "person"}
        title={target ? `Na porta: ${target.label}` : ""}
        staff={staff.filter((s) => !placed.has(s.id))}
        occupied={new Map()}
        onPick={(id) => adding?.step === "person" && add(adding.vehicleId, id)}
        onClose={() => setAdding(null)}
      />
    </>
  );
}
