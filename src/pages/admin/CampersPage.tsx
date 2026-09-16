import { useConfirm } from "../../components/ConfirmDialog";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ICONS, kidFaceSrc } from "../../icons";
import { ageOf, createCamper, deleteCamper, updateCamper, type Camper, type CamperInput, type CamperSex } from "../../api/campers";
import { useRoute } from "../../router";
import { useCollection, useCollectionOrEmpty } from "../../store";
import { useCategories, useLabelOf } from "../../store/derive";
import HealthAlerts from "../../components/HealthAlerts";
import HealthFilter, { CAMPER_HEALTH_KEYS, matchesHealth, hasHealth, type HealthKey } from "../../components/HealthFilter";
import { downloadCampersXlsx, downloadMedicalCampersXlsx } from "../../export";
import PrintLabelsDialog from "../../components/PrintLabelsDialog";
import BedroomTag from "../../components/BedroomTag";
import GroupIcon from "../../components/GroupIcon";
import TeamFilterDialog from "../../components/TeamFilterDialog";
import RoomRoleIcon from "../../components/RoomRoleIcon";
import TeamTag from "../../components/TeamTag";
import TransportTag from "../../components/TransportTag";
import WhatsAppButton from "../../components/WhatsAppButton";
import { loadAuth } from "../../auth/store";
import { staffGreeting, whatsappLink } from "../../whatsapp";
import { ROOM_ROLE_META, staffSex } from "../../api/staff";

import Breadcrumbs from "../../components/Breadcrumbs";
import CamperForm from "./CamperForm";
import DetailStack from "./DetailStack";
import GiveawayPage from "../GiveawayPage";
import CamperImportPage from "./CamperImportPage";
import { DownloadGlyph, SearchGlyph } from "../../components/Glyph";

interface CampersPageProps {
  token: string;
  /** medical team: see everything, filter and open kids, but no create / edit / delete / Excel / print */
  readOnly?: boolean;
}

/** URL → what to show:  /campers · /campers/new · /campers/import · /campers/giveaway · /campers/:id · /campers/:id/edit */
type Mode = { kind: "view" } | { kind: "create" } | { kind: "import" } | { kind: "giveaway" } | { kind: "edit"; id: string } | { kind: "detail"; id: string };
function modeOf(segments: string[]): Mode {
  const [, id, action] = segments;
  if (!id) return { kind: "view" };
  if (id === "new") return { kind: "create" };
  if (id === "import") return { kind: "import" };
  if (id === "giveaway") return { kind: "giveaway" };
  if (action === "edit") return { kind: "edit", id };
  return { kind: "detail", id };
}

type Wing = "all" | "girls" | "boys";

/** Admin: the campers (kids) — searchable list, detail view and create/edit form; read-only for the medical team. */
export default function CampersPage({ token, readOnly = false }: CampersPageProps) {
  // everything comes from the local store (localStorage + live WebSocket feed)
  const campers = useCollection("campers");
  const categories = useCategories("camper");
  const bedrooms = useCollectionOrEmpty("bedrooms");
  const labelOf = useLabelOf();
  const { segments, navigate } = useRoute();
  const rawMode = modeOf(segments);
  // read-only viewers can't reach the forms even by URL
  const mode: Mode = readOnly && (rawMode.kind === "create" || rawMode.kind === "edit" || rawMode.kind === "import" || rawMode.kind === "giveaway") ? { kind: "view" } : rawMode;
  const confirm = useConfirm();
  // set by the open form; asks save/discard before a breadcrumb navigation leaves the form
  const leaveGuardRef = useRef<(() => Promise<boolean>) | null>(null);
  async function guardedNav(to: string) {
    const guard = leaveGuardRef.current;
    if (guard && !(await guard())) return;
    navigate(to);
  }
  const [wing, setWing] = useState<Wing>("all");
  /** team ids to show — empty = every team (the medical team never filters by team / wing) */
  const [teamFilter, setTeamFilter] = useState<Set<string>>(new Set());
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [health, setHealth] = useState<Set<HealthKey>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [createSex, setCreateSex] = useState<CamperSex | null>(null);
  const [createSexBusy, setCreateSexBusy] = useState(false);
  const onCreateSex = useCallback((sex: CamperSex | null, guessing: boolean) => {
    setCreateSex(sex);
    setCreateSexBusy(guessing);
  }, []);
  useEffect(() => {
    if (mode.kind !== "create") {
      setCreateSex(null);
      setCreateSexBusy(false);
    }
  }, [mode.kind]);

  const roomById = useMemo(() => new Map(bedrooms.map((b) => [b.id, b])), [bedrooms]);
  const teams = useCollectionOrEmpty("teams");
  const staff = useCollectionOrEmpty("staff");
  const staffById = useMemo(() => new Map(staff.map((s) => [s.id, s])), [staff]);
  const myName = loadAuth()?.user.name ?? "";

  async function withBusy<T>(fn: () => Promise<T>): Promise<T> {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(input: CamperInput) {
    const created = await withBusy(() => createCamper(token, input));
    navigate(`/campers/${created.id}`, { replace: true });
  }

  async function handleEdit(input: CamperInput) {
    if (mode.kind !== "edit") return;
    const updated = await withBusy(() => updateCamper(token, mode.id, input));
    navigate(`/campers/${updated.id}`, { replace: true });
  }

  async function handleDelete(k: Camper) {
    if (!(await confirm({ emoji: "🗑️", title: `Excluir ${k.name}?`, message: "Isso não pode ser desfeito.", confirmLabel: "Excluir", danger: true }))) return;
    try {
      await withBusy(() => deleteCamper(token, k.id));
      navigate("/campers", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    }
  }

  const visible = useMemo(() => {
    if (!campers) return [];
    const q = normalize(search);
    // no leader / no room first: they need the admin's attention
    const attentionFirst = (a: Camper, b: Camper) =>
      Number(!!a.caretakerId && !!a.bedroom) - Number(!!b.caretakerId && !!b.bedroom);
    return sortByName(campers)
      .sort(attentionFirst)
      .filter((k) => {
      const room = k.bedroom ? roomById.get(k.bedroom) : null;
      if (wing !== "all" && room?.group !== wing) return false;
      if (teamFilter.size > 0 && !(k.team && teamFilter.has(k.team))) return false;
      if (!matchesHealth(k, health)) return false;
      if (!q) return true;
      const hay = normalize([k.name, k.guardianName, labelOf(k.team), room?.name, labelOf(k.transportation), staffById.get(k.caretakerId ?? "")?.name].filter(Boolean).join(" "));
      return hay.includes(q);
    });
  }, [campers, wing, teamFilter, search, health, labelOf, roomById, staffById]);
  const orphanCount = useMemo(() => (campers ?? []).filter((k) => !k.caretakerId).length, [campers]);
  const noRoomCount = useMemo(() => (campers ?? []).filter((k) => !k.bedroom).length, [campers]);

  /** how many kids have each health thing (within the other filters, so the chips stay honest) */
  const healthCounts = useMemo(() => {
    const c: Partial<Record<HealthKey, number>> = {};
    for (const key of CAMPER_HEALTH_KEYS) c[key] = 0;
    for (const k of campers ?? []) {
      const room = k.bedroom ? roomById.get(k.bedroom) : null;
      if (wing !== "all" && room?.group !== wing) continue;
      if (teamFilter.size > 0 && !(k.team && teamFilter.has(k.team))) continue;
      for (const key of CAMPER_HEALTH_KEYS) if (hasHealth(k, key)) c[key]!++;
    }
    return c;
  }, [campers, wing, teamFilter, roomById]);

  /** kids per team (for the chips in the team dialog) */
  const teamCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const k of campers ?? []) if (k.team) m.set(k.team, (m.get(k.team) ?? 0) + 1);
    return m;
  }, [campers]);
  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const teamChipLabel = teamFilter.size === 0 ? "Todos os times" : [...teamFilter].map((id) => teamById.get(id)?.name).filter(Boolean).join(", ");

  const counts = useMemo(() => {
    const c = { all: campers?.length ?? 0, girls: 0, boys: 0 };
    for (const k of campers ?? []) {
      const g = k.bedroom ? roomById.get(k.bedroom)?.group : null;
      if (g === "girls") c.girls++;
      else if (g === "boys") c.boys++;
    }
    return c;
  }, [campers, roomById]);

  // ── render ─────────────────────────────────────────────────────────────

  if (!campers) {
    return (
      <div className="admin-page">
        {error ? <p className="message message--error">{error}</p> : <p className="opt-empty">Sincronizando com o servidor… 🏕️</p>}
      </div>
    );
  }

  if (mode.kind === "giveaway") {
    return <GiveawayPage who="campers" crumbs={[{ label: "Acampantes", onClick: () => navigate("/campers") }, { label: "Sorteio" }]} />;
  }

  if (mode.kind === "import") return <CamperImportPage token={token} />;

  if (mode.kind === "detail") {
    return (
      <DetailStack
        token={token}
        current={{ kind: "camper", id: mode.id }}
        rootCrumbs={[{ label: "Acampantes", onClick: () => navigate("/campers") }]}
        onEditCamper={readOnly ? undefined : (camper) => navigate(`/campers/${camper.id}/edit`)}
        // read-only here = the medical team: they still edit the kids' HEALTH block in place
        canEditHealth={readOnly}
      />
    );
  }

  const editing = mode.kind === "edit" ? campers.find((k) => k.id === mode.id) : undefined;

  return (
    <div className="admin-page">
      {mode.kind === "create" && <Breadcrumbs items={[{ label: "Acampantes", onClick: () => guardedNav("/campers") }, { label: "Novo" }]} />}
      {mode.kind === "edit" && editing && (
        <Breadcrumbs items={[{ label: "Acampantes", onClick: () => guardedNav("/campers") }, { label: editing.name.split(" ")[0], onClick: () => guardedNav(`/campers/${editing.id}`) }, { label: "Editar" }]} />
      )}
      <header className="admin-head">
        <h1 className="admin-title">
          {mode.kind === "create" ? (
            <>
              <img className={`admin-title__icon${createSexBusy ? " admin-title__icon--busy" : ""}`} src={createSex ? kidFaceSrc(createSex) : ICONS.camper} alt="" aria-hidden="true" /> Novo acampante
            </>
          ) : mode.kind === "edit" ? (
            "✏️ Editar acampante"
          ) : (
            "Acampantes"
          )}
        </h1>
        {mode.kind === "view" && !readOnly && (
          <div className="admin-head__actions admin-head__actions--icons">
            <button
              type="button"
              className="button button--secondary admin-head__new"
              title="Sorteio"
              aria-label="Sorteio"
              onClick={() => navigate("/campers/giveaway")}
            >
              <img className="admin-head__action-icon" src={ICONS.giveaway} alt="" aria-hidden="true" />
              <span className="admin-head__action-label">Sorteio</span>
            </button>
            <button
              type="button"
              className="button button--secondary admin-head__new"
              title="Importar acampantes de uma planilha"
              aria-label="Importar acampantes de uma planilha"
              onClick={() => navigate("/campers/import")}
            >
              <img className="admin-head__action-icon" src={ICONS.importCampers} alt="" aria-hidden="true" />
              <span className="admin-head__action-label">Importar</span>
            </button>
            <button
              type="button"
              className="button button--secondary admin-head__new"
              disabled={busy || campers.length === 0}
              title="Baixar todos os acampantes em Excel"
              aria-label="Baixar todos os acampantes em Excel"
              onClick={() => downloadCampersXlsx(campers, bedrooms, labelOf, staff)}
            >
              <DownloadGlyph />
              <span className="admin-head__action-label">Download</span>
            </button>
            <button
              type="button"
              className="button button--secondary admin-head__new admin-head__print"
              disabled={busy || campers.length === 0}
              title="Imprimir crachás ou pulseiras"
              onClick={() => setPrintOpen(true)}
            >
              🖨️ <span className="admin-head__action-label">Imprimir</span>
            </button>
            <button
              type="button"
              className="button button--primary admin-head__new"
              disabled={busy}
              title="Novo acampante"
              aria-label="Novo acampante"
              onClick={() => navigate("/campers/new")}
            >
              <span className="admin-head__action-plus" aria-hidden="true">+</span>
              <span className="admin-head__action-label">Novo</span>
            </button>
          </div>
        )}
        {/* medical team: the health sheet of every camper (no documents / bus roll calls) */}
        {mode.kind === "view" && readOnly && (
          <div className="admin-head__actions admin-head__actions--icons">
            <button
              type="button"
              className="button button--secondary admin-head__new"
              disabled={campers.length === 0}
              title="Baixar a planilha de saúde de todos os acampantes"
              aria-label="Baixar a planilha de saúde de todos os acampantes"
              onClick={() => downloadMedicalCampersXlsx(campers, bedrooms, labelOf, staff)}
            >
              <DownloadGlyph />
              <span className="admin-head__action-label">Download</span>
            </button>
          </div>
        )}
        {mode.kind === "edit" && editing && (
          <button
            type="button"
            className="icon-btn icon-btn--lg icon-btn--danger"
            title={`Excluir ${editing.name}`}
            aria-label={`Excluir ${editing.name}`}
            disabled={busy}
            onClick={() => handleDelete(editing)}
          >
            🗑️
          </button>
        )}
      </header>

      {error && <p className="message message--error">{error}</p>}

      {mode.kind === "view" && !readOnly && (
        <PrintLabelsDialog open={printOpen} onClose={() => setPrintOpen(false)} campers={visible} allCampers={sortByName(campers)} bedrooms={bedrooms} labelOf={labelOf} />
      )}

      {mode.kind === "create" && (
        <CamperForm token={token} categories={categories} busy={busy} onSubmit={handleCreate} onSexChange={onCreateSex} leaveGuardRef={leaveGuardRef} />
      )}
      {mode.kind === "edit" && !editing && <p className="opt-empty">Acampante não encontrado.</p>}
      {mode.kind === "edit" && editing && (
        <CamperForm
          key={editing.id}
          token={token}
          camper={editing}
          categories={categories}
          busy={busy}
          onSubmit={handleEdit}
          leaveGuardRef={leaveGuardRef}
        />
      )}

      {mode.kind === "view" && (
        <>
          <div className="staff-toolbar">
            <label className="staff-toolbar__search">
              <SearchGlyph className="staff-toolbar__search-icon" size="1.2em" />
              <input className="cat-input" type="search" placeholder="Buscar por nome, líder, time, quarto…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar" />
            </label>
          </div>
          {/* wing + team chips, in the same row as the health chips; the medical team gets health only */}
          {!readOnly && (
            <div className="health-filter" role="group" aria-label="Ala e time">
              {(
                [
                  ["all", "Todos"],
                  ["girls", "Meninas"],
                  ["boys", "Meninos"],
                ] as [Wing, string][]
              ).map(([key, label]) => (
                <button key={key} type="button" className={`chip-toggle chip-toggle--small ${wing === key ? "chip-toggle--on" : ""}`} aria-pressed={wing === key} onClick={() => setWing(key)}>
                  {key !== "all" && <GroupIcon group={key} face />}
                  {label}
                  <span className="cat-tab__count">{counts[key]}</span>
                </button>
              ))}
              {teams.length > 0 && (
                <button
                  type="button"
                  className={`chip-toggle chip-toggle--small ${teamFilter.size > 0 ? "chip-toggle--on" : ""}`}
                  aria-pressed={teamFilter.size > 0}
                  title="Filtrar por time"
                  onClick={() => setTeamDialogOpen(true)}
                >
                  🚩 {teamChipLabel}
                  {teamFilter.size > 0 && (
                    <span className="cat-tab__count">{visible.length}</span>
                  )}
                </button>
              )}
            </div>
          )}
          {/* medical team: the big picture at a glance (tap = filter) */}
          {readOnly && (
            <div className="stat-grid" role="group" aria-label="Resumo de saúde">
              {(
                [
                  [null, <img src={kidFaceSrc()} alt="" />, "Crianças", campers.length],
                  ["medicines", "💊", "Tomam medicação", healthCounts.medicines ?? 0],
                  ["allergies", "🤮", "Têm alergias", healthCounts.allergies ?? 0],
                  ["foodRestrictions", "🍽️", "Restrição alimentar", healthCounts.foodRestrictions ?? 0],
                ] as [HealthKey | null, ReactNode, string, number][]
              ).map(([key, emoji, label, n]) => {
                const on = key ? health.has(key) : health.size === 0;
                return (
                  <button key={label} type="button" className={`stat-card ${on ? "stat-card--on" : ""}`} aria-pressed={on} onClick={() => setHealth(key ? new Set(health.has(key) ? [] : [key]) : new Set())}>
                    <span className="stat-card__emoji" aria-hidden="true">{emoji}</span>
                    <span className="stat-card__n">{n}</span>
                    <span className="stat-card__label">{label}</span>
                  </button>
                );
              })}
            </div>
          )}
          <HealthFilter keys={CAMPER_HEALTH_KEYS} value={health} onChange={setHealth} counts={healthCounts} />
          <TeamFilterDialog open={teamDialogOpen} teams={teams} value={teamFilter} counts={teamCounts} onChange={setTeamFilter} onClose={() => setTeamDialogOpen(false)} />

          {campers.length === 0 && (
            <div className="admin-empty">
              <img className="admin-empty__icon" src={ICONS.camper} alt="" aria-hidden="true" />
              <p>Nenhum acampante ainda.{!readOnly && " Cadastre a primeira criança!"}</p>
              {!readOnly && (
                <button type="button" className="button button--primary" onClick={() => navigate("/campers/new")}>
                  + Adicionar
                </button>
              )}
            </div>
          )}
          {campers.length > 0 && visible.length === 0 && <p className="opt-empty">Nenhum resultado. 🔍</p>}

          <p className="admin-intro">
            {visible.length === campers.length ? `${campers.length} crianças` : `${visible.length} de ${campers.length} crianças`}
            {orphanCount > 0 && <span className="orphan-tag"> · ⚠️ {orphanCount} sem líder</span>}
            {noRoomCount > 0 && <span className="orphan-tag"> · ⚠️ {noRoomCount} sem quarto</span>}
          </p>

          <ul className="staff-list">
            {visible.map((k) => {
              const room = k.bedroom ? roomById.get(k.bedroom) : null;
              const age = ageOf(k.birthDate);
              const caretaker = k.caretakerId ? staffById.get(k.caretakerId) : undefined;
              const orphan = !k.caretakerId;
              const noRoom = !k.bedroom;
              const attention = orphan || noRoom;

              return (
                // `staff-card--cover`: every blank spot of the row opens the kid — only the WhatsApp button keeps its own action
                <li key={k.id} className={`staff-card staff-card--clickable staff-card--cover ${attention ? "staff-card--orphan" : ""} ${k.aiReviewStatus === "pending" || k.aiReviewStatus === "processing" ? "camper-ai-review" : ""}`} title={k.aiReviewStatus === "pending" || k.aiReviewStatus === "processing" ? "Cadastro em revisão pela IA" : undefined}>
                  <div
                    className="staff-card__body"
                    role="link"
                    tabIndex={0}
                    title={`Ver ${k.name}`}
                    onClick={() => navigate(`/campers/${k.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/campers/${k.id}`);
                      }
                    }}
                  >
                    <h3 className="staff-card__name">
                      {k.name}
                      {age !== null && <span className="kid-card__age">{age} anos</span>}
                    </h3>
                    {attention && (
                      <p className="staff-card__meta orphan-msg">
                        ⚠️ Esta criança está {orphan && noRoom ? "sem líder e sem quarto" : orphan ? "sem líder" : "sem quarto"}.
                      </p>
                    )}
                    {k.guardianName && (
                      <p className="staff-card__meta">
                        Resp.: {k.guardianName}
                      </p>
                    )}
                    {(room || k.team || caretaker || k.transportation) && (
                      <div className="staff-card__tags">
                        {room && <BedroomTag bedroom={room} />}
                        {caretaker && (
                          <span className="staff-tag" title={ROOM_ROLE_META.caretaker.label}>
                            <RoomRoleIcon role="caretaker" sex={staffSex(caretaker, bedrooms)} /> {caretaker.name.split(" ")[0]}
                          </span>
                        )}
                        <TeamTag teamId={k.team} />
                        <TransportTag transportId={k.transportation} short className="staff-tag--pill" />
                      </div>
                    )}
                    <HealthAlerts person={k} labelOf={labelOf} />
                  </div>
                  {k.guardianPhone && (
                    <WhatsAppButton
                      className="wa-btn--sm staff-card__wa"
                      href={whatsappLink(k.guardianPhone, staffGreeting({ toName: k.guardianName, fromName: myName, about: k.name }))}
                      label={`Falar com ${k.guardianName.split(" ")[0] || "o responsável"} no WhatsApp`}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function sortByName(list: Camper[]): Camper[] {
  return list.slice().sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
}
