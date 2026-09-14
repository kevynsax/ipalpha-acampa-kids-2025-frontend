import { useConfirm } from "../../components/ConfirmDialog";
import { useMemo, useState } from "react";
import { bedroomLabel } from "../../api/bedrooms";
import {
  ROOM_ROLE_META,
  STAFF_CATEGORY_KEYS,
  createStaff,
  deleteStaff,
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
import { ICONS } from "../../icons";

import Breadcrumbs from "../../components/Breadcrumbs";
import StaffForm from "./StaffForm";
import GiveawayPage from "../GiveawayPage";
import { DownloadGlyph } from "../../components/Glyph";

interface StaffPageProps {
  token: string;
  /** organizers: see everything, filter and open people, but no create / edit / delete / Excel */
  readOnly?: boolean;
}

/** URL → what to show:  /staff · /staff/new · /staff/giveaway · /staff/:id · /staff/:id/edit */
type Mode = { kind: "view" } | { kind: "create" } | { kind: "giveaway" } | { kind: "edit"; id: string } | { kind: "detail"; id: string };
function modeOf(segments: string[]): Mode {
  const [, id, action] = segments;
  if (!id) return { kind: "view" };
  if (id === "new") return { kind: "create" };
  if (id === "giveaway") return { kind: "giveaway" };
  if (action === "edit") return { kind: "edit", id };
  return { kind: "detail", id };
}

/** The camp staff (equipe) list + create/edit form (admin); read-only for programme organizers. */
export default function StaffPage({ token, readOnly = false }: StaffPageProps) {
  // everything comes from the local store (localStorage + live WebSocket feed)
  const staff = useCollection("staff");
  const categories = useCategories("staff");
  const bedrooms = useCollectionOrEmpty("bedrooms");
  const labelOf = useLabelOf();
  const { segments, navigate } = useRoute();
  /** read-only: the create / edit URLs fall back to the list */
  const rawMode = modeOf(segments);
  const mode: Mode = readOnly && (rawMode.kind === "create" || rawMode.kind === "edit" || rawMode.kind === "giveaway") ? { kind: "view" } : rawMode;
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [health, setHealth] = useState<Set<HealthKey>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const catByKey = (key: string) => categories.find((c) => c.key === key);

  /** bedroom id → "Meninos - 403" */
  const bedroomOf = useMemo(() => {
    const map = new Map(bedrooms.map((b) => [b.id, bedroomLabel(b)]));
    return (id: string | null | undefined) => (id ? (map.get(id) ?? null) : null);
  }, [bedrooms]);

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
    return sortByName(staff).filter((s) => {
      if (!matchesHealth(s, health)) return false;
      if (!q) return true;
      const hay = normalize(
        [s.name, s.phone, labelOf(s.team), bedroomOf(s.bedroom), labelOf(s.transportation)].filter(Boolean).join(" "),
      );
      return hay.includes(q);
    });
  }, [staff, search, health, labelOf, bedroomOf]);

  const healthCounts = useMemo(() => {
    const c: Partial<Record<HealthKey, number>> = {};
    for (const key of ["healthIssues", "allergies", "drugAllergies", "medicines", "foodRestrictions"] as const) c[key] = 0;
    for (const s of staff ?? []) {
      for (const key of ["healthIssues", "allergies", "drugAllergies", "medicines", "foodRestrictions"] as const) if (hasHealth(s, key)) c[key]!++;
    }
    return c;
  }, [staff]);

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
      {mode.kind === "create" && <Breadcrumbs items={[{ label: "Equipe", onClick: () => navigate("/staff") }, { label: "Novo" }]} />}
      {mode.kind === "edit" && editing && (
        <Breadcrumbs items={[{ label: "Equipe", onClick: () => navigate("/staff") }, { label: editing.name.split(" ")[0], onClick: () => navigate(`/staff/${editing.id}`) }, { label: "Editar" }]} />
      )}
      <header className="admin-head">
        <h1 className="admin-title">{mode.kind === "create" ? "✨ Novo membro da equipe" : mode.kind === "edit" ? "✏️ Editar membro da equipe" : "Equipe"}</h1>
        {mode.kind === "view" && !readOnly && (
          <div className="admin-head__actions">
            <button
              type="button"
              className="button button--secondary admin-head__new"
              title="Sorteio"
              onClick={() => navigate("/staff/giveaway")}
            >
              <img className="admin-head__action-icon" src={ICONS.giveaway} alt="" aria-hidden="true" /> Sorteio
            </button>
            <button
              type="button"
              className="button button--secondary admin-head__new"
              disabled={busy || staff.length === 0}
              title="Baixar toda a equipe em Excel"
              onClick={() => downloadStaffXlsx(staff, bedrooms, labelOf)}
            >
              <DownloadGlyph /> Download
            </button>
            <button
              type="button"
              className="button button--primary admin-head__new"
              disabled={busy}
              onClick={() => navigate("/staff/new")}
            >
              + Novo
            </button>
          </div>
        )}
      </header>

      {error && <p className="message message--error">{error}</p>}

      {mode.kind === "create" && (
        <StaffForm
          categories={categories}
          busy={busy}
          onSubmit={handleCreate}
          onCancel={() => navigate("/staff")}
        />
      )}
      {mode.kind === "edit" && !editing && <p className="opt-empty">Pessoa não encontrada.</p>}
      {mode.kind === "edit" && editing && (
        <>
          <StaffForm
            key={editing.id}
            member={editing}
            categories={categories}
            busy={busy}
            onSubmit={handleEdit}
            onCancel={() => navigate(`/staff/${editing.id}`)}
          />
          {editing.admin ? (
            <p className="cat-hint">🔑 {editing.name} é admin: não pode ser excluído da equipe.</p>
          ) : (
            <button
              type="button"
              className="link-danger"
              disabled={busy}
              onClick={() => handleDelete(editing)}
            >
              🗑️ Excluir {editing.name} da equipe
            </button>
          )}
        </>
      )}

      {mode.kind === "view" && (
        <>
          <div className="staff-toolbar">
            <input
              className="cat-input staff-toolbar__search"
              type="search"
              placeholder="Buscar por nome, celular, time, quarto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          <HealthFilter value={health} onChange={setHealth} counts={healthCounts} />
          </div>

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

          <ul className="staff-list">
            {visible.map((s) => {
              const tags = [
                { key: "team", title: "Time", label: labelOf(s.team) },
                { key: "bedroom", title: "Quarto", label: bedroomOf(s.bedroom) },
                { key: "roomRole", title: "Função no quarto", label: s.bedroom && !s.redacted ? `${ROOM_ROLE_META[s.roomRole].emoji} ${ROOM_ROLE_META[s.roomRole].label}` : null },
                { key: "transport", title: catByKey(STAFF_CATEGORY_KEYS.transportation)?.name, label: labelOf(s.transportation) },
              ].filter((t) => t.label);


              return (
                <li key={s.id} className={`staff-card staff-card--clickable ${s.active ? "" : "staff-card--inactive"}`}>
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
                    {!s.redacted && (
                      <p className="staff-card__meta">
                        {s.phone ? formatBrazilPhoneClient(s.phone) : <em className="staff-card__missing">sem celular</em>}
                      </p>
                    )}
                    {tags.length > 0 && (
                      <div className="staff-card__tags">
                        {tags.map((t) => (
                          <span key={t.key} className="staff-tag" title={t.title}>
                            {t.label}
                          </span>
                        ))}
                      </div>
                    )}
                    <HealthAlerts person={s} labelOf={labelOf} />
                  </div>
                  <button
                    type="button"
                    className="icon-btn icon-btn--lg"
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
