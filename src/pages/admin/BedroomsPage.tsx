import { useConfirm } from "../../components/ConfirmDialog";
import { useMemo, useState } from "react";
import BunkIcon from "../../components/BunkIcon";
import CamperIcon from "../../components/CamperIcon";
import {
  BEDROOM_GROUPS,
  GROUP_META,
  bedroomLabel,
  createBedroom,
  deleteBedroom,
  updateBedroom,
  type Bedroom,
  type BedroomGroup,
  type BedroomInput,
} from "../../api/bedrooms";
import GroupIcon from "../../components/GroupIcon";
import StaffIcon from "../../components/StaffIcon";
import Breadcrumbs from "../../components/Breadcrumbs";
import BedroomForm from "./BedroomForm";
import DetailStack from "./DetailStack";
import { useRoute } from "../../router";
import { useCollection, useCollectionOrEmpty } from "../../store";
import { useLabelOf } from "../../store/derive";
import { downloadBedroomsXlsx } from "../../export";
import { DownloadGlyph } from "../../components/Glyph";

interface BedroomsPageProps {
  token: string;
  /** medical team: see every room and who sleeps there, but no create / edit / delete / Excel */
  readOnly?: boolean;
}

/** URL → what to show:  /bedrooms · /bedrooms/new?group=girls · /bedrooms/:id · /bedrooms/:id/edit */
type Mode = { kind: "view" } | { kind: "create"; group?: BedroomGroup } | { kind: "edit"; id: string } | { kind: "detail"; id: string };
function modeOf(segments: string[], params: URLSearchParams): Mode {
  const [, id, action] = segments;
  if (!id) return { kind: "view" };
  if (id === "new") {
    const g = params.get("group");
    return { kind: "create", group: (BEDROOM_GROUPS as readonly string[]).includes(g ?? "") ? (g as BedroomGroup) : undefined };
  }
  if (action === "edit") return { kind: "edit", id };
  return { kind: "detail", id };
}

/** Admin: bedrooms grouped by wing, each with its bed layout and occupancy; read-only for the medical team. */
export default function BedroomsPage({ token, readOnly = false }: BedroomsPageProps) {
  // from the local store (localStorage + live WebSocket feed) — occupancy is kept fresh by the server push
  const stored = useCollection("bedrooms");
  const bedrooms = useMemo(() => (stored ? sortRooms(stored) : null), [stored]);
  const campers = useCollectionOrEmpty("campers");
  const staff = useCollectionOrEmpty("staff");
  const labelOf = useLabelOf();
  const { segments, params, navigate } = useRoute();
  const rawMode = modeOf(segments, params);
  // read-only viewers can't reach the forms even by URL
  const mode: Mode = readOnly && (rawMode.kind === "create" || rawMode.kind === "edit") ? { kind: "view" } : rawMode;
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function withBusy<T>(fn: () => Promise<T>): Promise<T> {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(input: BedroomInput) {
    await withBusy(() => createBedroom(token, input));
    navigate("/bedrooms", { replace: true });
  }

  async function handleEdit(input: BedroomInput) {
    if (mode.kind !== "edit") return;
    const updated = await withBusy(() => updateBedroom(token, mode.id, input));
    navigate(`/bedrooms/${updated.id}`, { replace: true });
  }

  async function handleDelete(b: Bedroom) {
    if (!(await confirm({ emoji: "🗑️", title: `Excluir o quarto ${b.name} (${GROUP_META[b.group].label})?`, message: "Isso não pode ser desfeito.", confirmLabel: "Excluir", danger: true }))) return;
    try {
      await withBusy(() => deleteBedroom(token, b.id));
      navigate("/bedrooms", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    }
  }

  if (!bedrooms) {
    return (
      <div className="admin-page">
        {error ? <p className="message message--error">{error}</p> : <p className="opt-empty">Sincronizando com o servidor… 🏕️</p>}
      </div>
    );
  }

  if (mode.kind === "detail") {
    return (
      <DetailStack
        token={token}
        current={{ kind: "bedroom", id: mode.id }}
        rootCrumbs={[{ label: "Quartos", onClick: () => navigate("/bedrooms") }]}
        onEditBedroom={readOnly ? undefined : (bedroom) => navigate(`/bedrooms/${bedroom.id}/edit`)}
      />
    );
  }

  const editing = mode.kind === "edit" ? bedrooms.find((b) => b.id === mode.id) : undefined;

  const totals = bedrooms.reduce(
    (acc, b) => ({ capacity: acc.capacity + b.capacity, occupied: acc.occupied + b.occupied }),
    { capacity: 0, occupied: 0 },
  );

  return (
    <div className="admin-page">
      {mode.kind === "create" && <Breadcrumbs items={[{ label: "Quartos", onClick: () => navigate("/bedrooms") }, { label: "Novo" }]} />}
      {mode.kind === "edit" && editing && (
        <Breadcrumbs items={[{ label: "Quartos", onClick: () => navigate("/bedrooms") }, { label: bedroomLabel(editing), onClick: () => navigate(`/bedrooms/${editing.id}`) }, { label: "Editar" }]} />
      )}
      <header className="admin-head">
        <h1 className="admin-title">{mode.kind === "create" ? "🛏️ Novo quarto" : mode.kind === "edit" ? "✏️ Editar quarto" : "Quartos"}</h1>
        {mode.kind === "view" && !readOnly && (
          <div className="admin-head__actions">
            <button
              type="button"
              className="button button--secondary admin-head__new"
              disabled={busy || bedrooms.length === 0}
              title="Baixar todos os quartos em Excel (uma aba por quarto)"
              onClick={() => downloadBedroomsXlsx(bedrooms, campers, staff, labelOf)}
            >
              <DownloadGlyph /> Download
            </button>
            <button
              type="button"
              className="button button--primary admin-head__new"
              disabled={busy}
              onClick={() => navigate("/bedrooms/new")}
            >
              + Novo
            </button>
          </div>
        )}
        {mode.kind === "edit" && editing && (
          <button
            type="button"
            className="icon-btn icon-btn--lg icon-btn--danger"
            title={`Excluir quarto ${editing.name}`}
            aria-label={`Excluir quarto ${editing.name}`}
            disabled={busy}
            onClick={() => handleDelete(editing)}
          >
            🗑️
          </button>
        )}
      </header>

      {error && <p className="message message--error">{error}</p>}

      {mode.kind === "create" && (
        <BedroomForm key={mode.group ?? "any"} defaultGroup={mode.group} busy={busy} onSubmit={handleCreate} onCancel={() => navigate("/bedrooms")} />
      )}
      {mode.kind === "edit" && !editing && <p className="opt-empty">Quarto não encontrado.</p>}
      {mode.kind === "edit" && editing && (
        <BedroomForm
          key={editing.id}
          bedroom={editing}
          busy={busy}
          onSubmit={handleEdit}
          onCancel={() => navigate(`/bedrooms/${editing.id}`)}
        />
      )}

      {mode.kind === "view" && bedrooms.length === 0 && (
        <div className="admin-empty">
          <span className="admin-empty__emoji">🛏️</span>
          <p>Nenhum quarto ainda.{!readOnly && " Cadastre o primeiro com seus beliches e camas!"}</p>
          {!readOnly && (
            <button type="button" className="button button--primary" onClick={() => navigate("/bedrooms/new")}>
              + Criar quarto
            </button>
          )}
        </div>
      )}

      {mode.kind === "view" && bedrooms.length > 0 && (
        <>
          <p className="admin-intro">
            {bedrooms.length} quartos · <strong>{totals.capacity}</strong> camas no total ·{" "}
            <strong>{totals.occupied}</strong> ocupadas · <strong>{totals.capacity - totals.occupied}</strong> livres
          </p>

          {BEDROOM_GROUPS.map((g) => {
            const rooms = bedrooms.filter((b) => b.group === g);
            const m = GROUP_META[g];
            const cap = rooms.reduce((n, b) => n + b.capacity, 0);
            const occ = rooms.reduce((n, b) => n + b.occupied, 0);
            return (
              <section key={g} className="room-group">
                <header className="room-group__head">
                  <h2 className={`room-group__title room-group__title--${m.color}`}>
                    <GroupIcon group={g} /> {m.label}
                  </h2>
                  <span className="room-group__stats">
                    {rooms.length} {rooms.length === 1 ? "quarto" : "quartos"} · {occ}/{cap} camas
                  </span>
                  {!readOnly && (
                    <button
                      type="button"
                      className="icon-btn"
                      title={`Novo quarto em ${m.label}`}
                      disabled={busy}
                      onClick={() => navigate("/bedrooms/new", { query: { group: g } })}
                    >
                      +
                    </button>
                  )}
                </header>

                {rooms.length === 0 ? (
                  <p className="opt-empty">Nenhum quarto nesta ala.</p>
                ) : (
                  <ul className="room-grid">
                    {rooms.map((b) => {
                      const pct = b.capacity ? Math.round((b.occupied / b.capacity) * 100) : 0;
                      const free = Math.max(0, b.capacity - b.occupied);
                      return (
                        <li key={b.id}>
                          <button
                            type="button"
                            className={`room-card room-card--${m.color}`}
                            disabled={busy}
                            onClick={() => navigate(`/bedrooms/${b.id}`)}
                            title="Ver quarto"
                          >
                            <span className="room-card__row">
                              <span className="room-card__name">{b.name}</span>
                              <span className={`room-card__availability${free === 0 ? " room-card__availability--full" : ""}`}>
                                {free === 0 ? "Lotado" : `${free} ${free === 1 ? "livre" : "livres"}`}
                              </span>
                            </span>

                            <span className="room-card__occupancy-copy">
                              <strong>{b.occupied}</strong> de {b.capacity} camas ocupadas
                            </span>
                            <span className="room-card__bar" aria-hidden="true">
                              <span className="room-card__bar-fill" style={{ width: `${pct}%` }} />
                            </span>

                            <span className="room-card__details">
                              <span className="room-card__beds">
                                {b.bunkBeds > 0 && (
                                  <span title={`${b.bunkBeds} beliche${b.bunkBeds > 1 ? "s" : ""}`}>
                                    <BunkIcon size={16} /> {b.bunkBeds} {b.bunkBeds === 1 ? "beliche" : "beliches"}
                                  </span>
                                )}
                                {b.singleBeds > 0 && (
                                  <span title={`${b.singleBeds} cama${b.singleBeds > 1 ? "s" : ""} de solteiro`}>
                                    {b.singleBeds} {b.singleBeds === 1 ? "cama" : "camas"}
                                  </span>
                                )}
                              </span>
                              {(b.occupiedCampers > 0 || b.occupiedStaff > 0) && (
                                <span className="room-card__who">
                                  {b.occupiedCampers > 0 && (
                                    <span title="crianças">
                                      <CamperIcon size={15} /> {b.occupiedCampers}
                                    </span>
                                  )}
                                  {b.occupiedStaff > 0 && (
                                    <span title="equipe">
                                      <StaffIcon size={15} /> {b.occupiedStaff}
                                    </span>
                                  )}
                                </span>
                              )}
                            </span>
                            {b.notes && <span className="room-card__notes" title={b.notes}>{b.notes}</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}

function sortRooms(list: Bedroom[]): Bedroom[] {
  return list.slice().sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { numeric: true }));
}
