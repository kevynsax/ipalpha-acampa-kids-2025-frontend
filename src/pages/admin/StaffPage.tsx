import { useConfirm } from "../../components/ConfirmDialog";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GROUP_META, bedroomLabel } from "../../api/bedrooms";
import {
  ROOM_ROLE_META,
  createStaff,
  deleteStaff,
  staffSex,
  updateStaff,
  type Staff,
  type StaffInput,
} from "../../api/staff";
import { useCollection, useCollectionOrEmpty } from "../../store";
import { useCategories, useLabelOf } from "../../store/derive";
import { formatBrazilPhoneClient } from "../../phoneFormat";
import { roleMeta } from "../../roles";
import DetailStack from "./DetailStack";
import { useRoute } from "../../router";
import HealthAlerts from "../../components/HealthAlerts";
import HealthFilter, { matchesHealth, hasHealth, type HealthKey } from "../../components/HealthFilter";
import { downloadStaffXlsx } from "../../export";
import type { CamperSex } from "../../api/campers";
import { ICONS } from "../../icons";

import Breadcrumbs from "../../components/Breadcrumbs";
import StaffForm from "./StaffForm";
import GiveawayPage from "../GiveawayPage";
import { DownloadGlyph, SearchGlyph } from "../../components/Glyph";
import BedroomTag from "../../components/BedroomTag";
import GroupIcon from "../../components/GroupIcon";
import TeamFilterDialog from "../../components/TeamFilterDialog";
import RoomRoleIcon from "../../components/RoomRoleIcon";
import TeamTag from "../../components/TeamTag";
import TransportTag from "../../components/TransportTag";
import WhatsAppButton from "../../components/WhatsAppButton";
import { loadAuth } from "../../auth/store";
import { staffGreeting, whatsappLink } from "../../whatsapp";
import StaffImportPage from "./StaffImportPage";

interface StaffPageProps {
  token: string;
  /** organizers: see everything, filter and open people, but no create / edit / delete / Excel */
  readOnly?: boolean;
}

/** URL → what to show:  /staff · /staff/new · /staff/giveaway · /staff/:id · /staff/:id/edit */
type Mode = { kind: "view" } | { kind: "create" } | { kind: "giveaway" } | { kind: "import" } | { kind: "edit"; id: string } | { kind: "detail"; id: string };
function modeOf(segments: string[]): Mode {
  const [, id, action] = segments;
  if (!id) return { kind: "view" };
  if (id === "new") return { kind: "create" };
  if (id === "giveaway") return { kind: "giveaway" };
  if (id === "import") return { kind: "import" };
  if (action === "edit") return { kind: "edit", id };
  return { kind: "detail", id };
}

/** who sleeps in a kids' wing (the "tias" / "tios"); the staff wing is not a filter */
type Wing = "all" | "girls" | "boys";

/** The camp staff (equipe) list + create/edit form (admin); read-only for programme organizers. */
export default function StaffPage({ token, readOnly = false }: StaffPageProps) {
  const myName = loadAuth()?.user.name ?? "";
  // everything comes from the local store (localStorage + live WebSocket feed)
  const staff = useCollection("staff");
  const categories = useCategories("staff");
  const bedrooms = useCollectionOrEmpty("bedrooms");
  const labelOf = useLabelOf();
  const { segments, navigate } = useRoute();
  /** read-only: the create / edit URLs fall back to the list */
  const rawMode = modeOf(segments);
  const mode: Mode = readOnly && (rawMode.kind === "create" || rawMode.kind === "edit" || rawMode.kind === "giveaway" || rawMode.kind === "import") ? { kind: "view" } : rawMode;
  const confirm = useConfirm();
  // set by the open form; asks save/discard before a breadcrumb navigation leaves the form
  const leaveGuardRef = useRef<(() => Promise<boolean>) | null>(null);
  async function guardedNav(to: string) {
    const guard = leaveGuardRef.current;
    if (guard && !(await guard())) return;
    navigate(to);
  }
  const [search, setSearch] = useState("");
  const [wing, setWing] = useState<Wing>("all");
  /** team ids to show — empty = every team */
  const [teamFilter, setTeamFilter] = useState<Set<string>>(new Set());
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [health, setHealth] = useState<Set<HealthKey>>(new Set());
  /** tap "sem quarto" in the intro to bubble those cards to the top */
  const [noRoomFirst, setNoRoomFirst] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  /** bedroom id → "Meninos - 403" */
  const bedroomOf = useMemo(() => {
    const map = new Map(bedrooms.map((b) => [b.id, bedroomLabel(b)]));
    return (id: string | null | undefined) => (id ? (map.get(id) ?? null) : null);
  }, [bedrooms]);
  /** bedroom id → wing */
  const wingOf = useMemo(() => {
    const map = new Map(bedrooms.map((b) => [b.id, b.group]));
    return (id: string | null | undefined) => (id ? (map.get(id) ?? null) : null);
  }, [bedrooms]);
  const roomById = useMemo(() => new Map(bedrooms.map((b) => [b.id, b])), [bedrooms]);
  const teams = useCollectionOrEmpty("teams");
  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  async function withBusy<T>(fn: () => Promise<T>): Promise<T> {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(input: StaffInput) {
    const created = await withBusy(() => createStaff(token, input));
    navigate(`/staff/${created.id}`, { replace: true });
  }

  async function handleEdit(input: StaffInput) {
    if (mode.kind !== "edit") return;
    const updated = await withBusy(() => updateStaff(token, mode.id, input));
    navigate(`/staff/${updated.id}`, { replace: true });
  }

  async function handleDelete(member: Staff) {
    if (!(await confirm({ emoji: "🗑️", title: `Excluir ${member.name} da equipe?`, message: "Isso não pode ser desfeito.", confirmLabel: "Excluir", danger: true }))) return;
    try {
      await withBusy(() => deleteStaff(token, member.id));
      navigate("/staff", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    }
  }

  const visible = useMemo(() => {
    if (!staff) return [];
    const q = normalize(search);
    const list = sortByName(staff).filter((s) => {
      if (wing !== "all" && wingOf(s.bedroom) !== wing) return false;
      if (teamFilter.size > 0 && !(s.team && teamFilter.has(s.team))) return false;
      if (!matchesHealth(s, health)) return false;
      if (!q) return true;
      const hay = normalize(
        [s.name, s.phone, labelOf(s.team), bedroomOf(s.bedroom), labelOf(s.transportation)].filter(Boolean).join(" "),
      );
      return hay.includes(q);
    });
    // only bubble "sem quarto" when the intro tag is toggled on
    if (noRoomFirst) list.sort((a, b) => Number(!!a.bedroom) - Number(!!b.bedroom));
    return list;
  }, [staff, search, wing, teamFilter, health, labelOf, bedroomOf, wingOf, noRoomFirst]);
  const noRoomCount = useMemo(() => (staff ?? []).filter((s) => !s.bedroom).length, [staff]);

  const healthCounts = useMemo(() => {
    const c: Partial<Record<HealthKey, number>> = {};
    for (const key of ["healthIssues", "allergies", "drugAllergies", "medicines", "foodRestrictions"] as const) c[key] = 0;
    for (const s of staff ?? []) {
      if (wing !== "all" && wingOf(s.bedroom) !== wing) continue;
      if (teamFilter.size > 0 && !(s.team && teamFilter.has(s.team))) continue;
      for (const key of ["healthIssues", "allergies", "drugAllergies", "medicines", "foodRestrictions"] as const) if (hasHealth(s, key)) c[key]!++;
    }
    return c;
  }, [staff, wing, teamFilter, wingOf]);

  /** people per wing (by the room they sleep in) */
  const wingCounts = useMemo(() => {
    const c: Record<Wing, number> = { all: staff?.length ?? 0, girls: 0, boys: 0 };
    for (const s of staff ?? []) {
      const g = wingOf(s.bedroom);
      if (g === "girls" || g === "boys") c[g]++;
    }
    return c;
  }, [staff, wingOf]);
  /** people per team (for the chips in the team dialog) */
  const teamCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of staff ?? []) if (s.team) m.set(s.team, (m.get(s.team) ?? 0) + 1);
    return m;
  }, [staff]);
  const teamChipLabel = teamFilter.size === 0 ? "Todos os times" : [...teamFilter].map((id) => teamById.get(id)?.name).filter(Boolean).join(", ");

  // ── render ─────────────────────────────────────────────────────────────

  if (!staff) {
    return (
      <div className="admin-page">
        {error ? <p className="message message--error">{error}</p> : <p className="opt-empty">Sincronizando com o servidor… 🏕️</p>}
      </div>
    );
  }

  if (mode.kind === "giveaway") {
    return <GiveawayPage who="staff" crumbs={[{ label: "Equipe", onClick: () => navigate("/staff") }, { label: "Sorteio" }]} />;
  }
  if (mode.kind === "import") return <StaffImportPage token={token} onBack={() => navigate("/staff")} />;

  if (mode.kind === "detail") {
    return (
      <DetailStack
        token={token}
        current={{ kind: "staff", id: mode.id }}
        rootCrumbs={[{ label: "Equipe", onClick: () => navigate("/staff") }]}
        onEditStaff={readOnly ? undefined : (member) => navigate(`/staff/${member.id}/edit`)}
      />
    );
  }

  const editing = mode.kind === "edit" ? staff.find((s) => s.id === mode.id) : undefined;

  return (
    <div className="admin-page">
      {mode.kind === "create" && <Breadcrumbs items={[{ label: "Equipe", onClick: () => guardedNav("/staff") }, { label: "Novo" }]} />}
      {mode.kind === "edit" && editing && (
        <Breadcrumbs items={[{ label: "Equipe", onClick: () => guardedNav("/staff") }, { label: editing.name.split(" ")[0], onClick: () => guardedNav(`/staff/${editing.id}`) }, { label: "Editar" }]} />
      )}
      <header className="admin-head">
        <h1 className="admin-title">
          {mode.kind === "create" ? (
            <>
              <img className={`admin-title__icon${createSexBusy ? " admin-title__icon--busy" : ""}`} src={createSex === "M" ? ICONS.man : ICONS.woman} alt="" aria-hidden="true" /> <span>Novo membro da equipe</span>
            </>
          ) : mode.kind === "edit" ? (
            "✏️ Editar membro da equipe"
          ) : (
            "Equipe"
          )}
        </h1>
        {mode.kind === "view" && !readOnly && (
          <div className="admin-head__actions admin-head__actions--icons">
            <button
              type="button"
              className="button button--secondary admin-head__new"
              disabled={busy}
              title="Importar equipe de uma planilha"
              aria-label="Importar equipe de uma planilha"
              onClick={() => navigate("/staff/import")}
            >
              <img className="admin-head__action-icon" src={ICONS.importCampers} alt="" aria-hidden="true" />
              <span className="admin-head__action-label">Importar</span>
            </button>
            <button
              type="button"
              className="button button--secondary admin-head__new"
              title="Sorteio"
              aria-label="Sorteio"
              onClick={() => navigate("/staff/giveaway")}
            >
              <img className="admin-head__action-icon" src={ICONS.giveaway} alt="" aria-hidden="true" />
              <span className="admin-head__action-label">Sorteio</span>
            </button>
            <button
              type="button"
              className="button button--secondary admin-head__new"
              disabled={busy || staff.length === 0}
              title="Baixar toda a equipe em Excel"
              aria-label="Baixar toda a equipe em Excel"
              onClick={() => downloadStaffXlsx(staff, bedrooms, labelOf)}
            >
              <DownloadGlyph />
              <span className="admin-head__action-label">Download</span>
            </button>
            <button
              type="button"
              className="button button--primary admin-head__new"
              disabled={busy}
              title="Novo membro da equipe"
              aria-label="Novo membro da equipe"
              onClick={() => navigate("/staff/new")}
            >
              <span className="admin-head__action-plus" aria-hidden="true">+</span>
              <span className="admin-head__action-label">Novo</span>
            </button>
          </div>
        )}
        {mode.kind === "edit" && editing && !editing.admin && (
          <button
            type="button"
            className="icon-btn icon-btn--lg icon-btn--danger"
            title={`Excluir ${editing.name} da equipe`}
            aria-label={`Excluir ${editing.name} da equipe`}
            disabled={busy}
            onClick={() => handleDelete(editing)}
          >
            🗑️
          </button>
        )}
      </header>

      {error && <p className="message message--error">{error}</p>}

      {mode.kind === "create" && (
        <StaffForm
          token={token}
          categories={categories}
          busy={busy}
          onSubmit={handleCreate}
          onSexChange={onCreateSex}
          leaveGuardRef={leaveGuardRef}
        />
      )}
      {mode.kind === "edit" && !editing && <p className="opt-empty">Pessoa não encontrada.</p>}
      {mode.kind === "edit" && editing && (
        <>
          <StaffForm
            token={token}
            key={editing.id}
            member={editing}
            categories={categories}
            busy={busy}
            onSubmit={handleEdit}
            leaveGuardRef={leaveGuardRef}
          />
          {editing.admin && <p className="cat-hint">🔑 {editing.name} é admin: não pode ser excluído da equipe.</p>}
        </>
      )}

      {mode.kind === "view" && (
        <>
          <div className="staff-toolbar">
            <label className="staff-toolbar__search">
              <SearchGlyph className="staff-toolbar__search-icon" size="1.2em" />
              <input className="cat-input" type="search" placeholder="Buscar por nome, celular, time, quarto…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar" />
            </label>
          </div>
          <div className="health-filter" role="group" aria-label="Ala e time">
            {(
              [
                ["all", "Todos"],
                ["girls", "Tia de meninas"],
                ["boys", "Tio de meninos"],
              ] as [Wing, string][]
            ).map(([key, label]) => (
              <button key={key} type="button" className={`chip-toggle chip-toggle--small ${wing === key ? "chip-toggle--on" : ""}`} aria-pressed={wing === key} title={key === "all" ? undefined : `Dorme no quarto de ${GROUP_META[key].label.toLowerCase()}`} onClick={() => setWing(key)}>
                {key !== "all" && <GroupIcon group={key} face />}
                {label}
                <span className="cat-tab__count">{wingCounts[key]}</span>
              </button>
            ))}
            {teams.length > 0 && (
              <button type="button" className={`chip-toggle chip-toggle--small ${teamFilter.size > 0 ? "chip-toggle--on" : ""}`} aria-pressed={teamFilter.size > 0} title="Filtrar por time" onClick={() => setTeamDialogOpen(true)}>
                🚩 {teamChipLabel}
                {teamFilter.size > 0 && <span className="cat-tab__count">{visible.length}</span>}
              </button>
            )}
          </div>
          <HealthFilter value={health} onChange={setHealth} counts={healthCounts} />
          <TeamFilterDialog open={teamDialogOpen} teams={teams} value={teamFilter} counts={teamCounts} onChange={setTeamFilter} onClose={() => setTeamDialogOpen(false)} />

          {staff.length === 0 && (
            <div className="admin-empty">
              <img className="admin-empty__icon" src={roleMeta("staff").icon} alt="" aria-hidden="true" />
              <p>Ninguém na equipe ainda.{!readOnly && " Cadastre o primeiro voluntário!"}</p>
              {!readOnly && (
                <button type="button" className="button button--primary" onClick={() => navigate("/staff/new")}>
                  + Adicionar membro
                </button>
              )}
            </div>
          )}

          {staff.length > 0 && visible.length === 0 && <p className="opt-empty">Nenhum resultado. 🔍</p>}

          <p className="admin-intro">
            {visible.length === staff.length ? `${staff.length} pessoas` : `${visible.length} de ${staff.length} pessoas`}
            {noRoomCount > 0 && (
              <>
                {" · "}
                <button
                  type="button"
                  className={`orphan-tag orphan-tag--btn ${noRoomFirst ? "orphan-tag--on" : ""}`}
                  aria-pressed={noRoomFirst}
                  title={noRoomFirst ? "Voltar à ordem alfabética" : "Mostrar sem quarto no topo"}
                  onClick={() => setNoRoomFirst((v) => !v)}
                >
                  ⚠️ {noRoomCount} sem quarto
                </button>
              </>
            )}
          </p>

          <ul className="staff-list">
            {visible.map((s) => {
              const room = s.bedroom ? roomById.get(s.bedroom) : null;
              const noRoom = !s.bedroom;

              return (
                <li key={s.id} className={`staff-card staff-card--clickable staff-card--cover ${noRoom ? "staff-card--orphan" : ""} ${s.active ? "" : "staff-card--inactive"} ${s.aiReviewStatus === "pending" || s.aiReviewStatus === "processing" ? "camper-ai-review" : ""}`} title={s.aiReviewStatus === "pending" || s.aiReviewStatus === "processing" ? "Cadastro em revisão pela IA" : undefined}>
                  <div
                    className="staff-card__body"
                    role="link"
                    tabIndex={0}
                    title={`Ver ${s.name}`}
                    onClick={() => navigate(`/staff/${s.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/staff/${s.id}`);
                      }
                    }}
                  >
                    <h3 className="staff-card__name">
                      {s.name}
                      {s.admin && <span className="staff-card__inactive" title="Admin do app">admin</span>}
                      {!s.active && <span className="staff-card__inactive">inativo</span>}
                    </h3>
                    {noRoom && <p className="staff-card__meta orphan-msg">⚠️ Esta pessoa está sem quarto.</p>}
                    <p className="staff-card__meta">
                      {s.phone ? formatBrazilPhoneClient(s.phone) : <em className="staff-card__missing">sem celular</em>}
                    </p>
                    {(room || s.team || s.transportation) && (
                      <div className="staff-card__tags">
                        {room && <BedroomTag bedroom={room} />}
                        {room && (
                          <span className="staff-tag" title="Função no quarto">
                            <RoomRoleIcon role={s.roomRole} sex={staffSex(s, bedrooms)} /> {ROOM_ROLE_META[s.roomRole].label}
                          </span>
                        )}
                        <TeamTag teamId={s.team} />
                        <TransportTag transportId={s.transportation} short className="staff-tag--pill" />
                      </div>
                    )}
                    <HealthAlerts person={s} labelOf={labelOf} />
                  </div>
                  {s.phone && (
                    <WhatsAppButton
                      className="wa-btn--sm staff-card__wa"
                      href={whatsappLink(s.phone, staffGreeting({ toName: s.name, fromName: myName }))}
                      label={`Falar com ${s.name.split(" ")[0]} no WhatsApp`}
                    />
                  )}
                  <button
                    type="button"
                    className="icon-btn icon-btn--lg staff-card__edit"
                    title="Editar"
                    aria-label={`Editar ${s.name}`}
                    disabled={busy}
                    onClick={() => navigate(`/staff/${s.id}/edit`)}
                  >
                    <span className="pencil" aria-hidden="true">✏️</span>
                  </button>
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

function sortByName(list: Staff[]): Staff[] {
  return list.slice().sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
}
