import { useConfirm } from "../../components/ConfirmDialog";
import { useMemo, useState } from "react";
import { ICONS } from "../../icons";
import { GROUP_META, bedroomLabel } from "../../api/bedrooms";
import { ageOf, createCamper, deleteCamper, updateCamper, type Camper, type CamperInput } from "../../api/campers";
import { useRoute } from "../../router";
import { useCollection, useCollectionOrEmpty } from "../../store";
import { useCategories, useLabelOf } from "../../store/derive";
import HealthAlerts from "../../components/HealthAlerts";
import HealthFilter, { CAMPER_HEALTH_KEYS, matchesHealth, hasHealth, type HealthKey } from "../../components/HealthFilter";
import { downloadCampersXlsx } from "../../export";
import PrintLabelsDialog from "../../components/PrintLabelsDialog";
import WhatsAppButton from "../../components/WhatsAppButton";
import { loadAuth } from "../../auth/store";
import { staffGreeting, whatsappLink } from "../../whatsapp";
import { ROOM_ROLE_META } from "../../api/staff";

import Breadcrumbs from "../../components/Breadcrumbs";
import CamperForm from "./CamperForm";
import DetailStack from "./DetailStack";
import GiveawayPage from "../GiveawayPage";
import { DownloadGlyph } from "../../components/Glyph";

interface CampersPageProps {
  token: string;
  /** medical team: see everything, filter and open kids, but no create / edit / delete / Excel / print */
  readOnly?: boolean;
}

/** URL → what to show:  /campers · /campers/new · /campers/giveaway · /campers/:id · /campers/:id/edit */
type Mode = { kind: "view" } | { kind: "create" } | { kind: "giveaway" } | { kind: "edit"; id: string } | { kind: "detail"; id: string };
function modeOf(segments: string[]): Mode {
  const [, id, action] = segments;
  if (!id) return { kind: "view" };
  if (id === "new") return { kind: "create" };
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
  const mode: Mode = readOnly && (rawMode.kind === "create" || rawMode.kind === "edit" || rawMode.kind === "giveaway") ? { kind: "view" } : rawMode;
  const confirm = useConfirm();
  const [wing, setWing] = useState<Wing>("all");
  const [team, setTeam] = useState<string>("");
  const [search, setSearch] = useState("");
  const [health, setHealth] = useState<Set<HealthKey>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printOpen, setPrintOpen] = useState(false);

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
    // orphans (no caretaker) first: they need the admin's attention
    const orphanFirst = (a: Camper, b: Camper) => Number(!!a.caretakerId) - Number(!!b.caretakerId);
    return sortByName(campers)
      .sort(orphanFirst)
      .filter((k) => {
      const room = k.bedroom ? roomById.get(k.bedroom) : null;
      if (wing !== "all" && room?.group !== wing) return false;
      if (team && k.team !== team) return false;
      if (!matchesHealth(k, health)) return false;
      if (!q) return true;
      const hay = normalize([k.name, k.guardianName, labelOf(k.team), room?.name, labelOf(k.transportation), staffById.get(k.caretakerId ?? "")?.name].filter(Boolean).join(" "));
      return hay.includes(q);
    });
  }, [campers, wing, team, search, health, labelOf, roomById, staffById]);
  const orphanCount = useMemo(() => (campers ?? []).filter((k) => !k.caretakerId).length, [campers]);

  /** how many kids have each health thing (within the other filters, so the chips stay honest) */
  const healthCounts = useMemo(() => {
    const c: Partial<Record<HealthKey, number>> = {};
    for (const key of CAMPER_HEALTH_KEYS) c[key] = 0;
    for (const k of campers ?? []) {
      const room = k.bedroom ? roomById.get(k.bedroom) : null;
      if (wing !== "all" && room?.group !== wing) continue;
      if (team && k.team !== team) continue;
      for (const key of CAMPER_HEALTH_KEYS) if (hasHealth(k, key)) c[key]!++;
    }
    return c;
  }, [campers, wing, team, roomById]);

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

  if (mode.kind === "detail") {
    return (
      <DetailStack
        token={token}
        current={{ kind: "camper", id: mode.id }}
        rootCrumbs={[{ label: "Acampantes", onClick: () => navigate("/campers") }]}
        onEditCamper={readOnly ? undefined : (camper) => navigate(`/campers/${camper.id}/edit`)}
      />
    );
  }

  const editing = mode.kind === "edit" ? campers.find((k) => k.id === mode.id) : undefined;

  return (
    <div className="admin-page">
      {mode.kind === "create" && <Breadcrumbs items={[{ label: "Acampantes", onClick: () => navigate("/campers") }, { label: "Novo" }]} />}
      {mode.kind === "edit" && editing && (
        <Breadcrumbs items={[{ label: "Acampantes", onClick: () => navigate("/campers") }, { label: editing.name.split(" ")[0], onClick: () => navigate(`/campers/${editing.id}`) }, { label: "Editar" }]} />
      )}
      <header className="admin-head">
        <h1 className="admin-title">{mode.kind === "create" ? "✨ Novo acampante" : mode.kind === "edit" ? "✏️ Editar acampante" : "Acampantes"}</h1>
        {mode.kind === "view" && !readOnly && (
          <div className="admin-head__actions">
            <button
              type="button"
              className="button button--secondary admin-head__new"
              title="Sorteio"
              onClick={() => navigate("/campers/giveaway")}
            >
              <img className="admin-head__action-icon" src={ICONS.giveaway} alt="" aria-hidden="true" /> Sorteio
            </button>
            <button
              type="button"
              className="button button--secondary admin-head__new"
              disabled={busy || campers.length === 0}
              title="Baixar todos os acampantes em Excel"
              onClick={() => downloadCampersXlsx(campers, bedrooms, labelOf, staff)}
            >
              <DownloadGlyph /> Download
            </button>
            <button
              type="button"
              className="button button--secondary admin-head__new"
              disabled={busy || campers.length === 0}
              title="Imprimir crachás ou pulseiras"
              onClick={() => setPrintOpen(true)}
            >
              🖨️ Imprimir
            </button>
            <button type="button" className="button button--primary admin-head__new" disabled={busy} onClick={() => navigate("/campers/new")}>
              + Novo
            </button>
          </div>
        )}
      </header>

      {error && <p className="message message--error">{error}</p>}

      {mode.kind === "view" && !readOnly && (
        <PrintLabelsDialog open={printOpen} onClose={() => setPrintOpen(false)} campers={visible} allCampers={sortByName(campers)} bedrooms={bedrooms} labelOf={labelOf} />
      )}

      {mode.kind === "create" && (
        <CamperForm categories={categories} busy={busy} onSubmit={handleCreate} onCancel={() => navigate("/campers")} />
      )}
      {mode.kind === "edit" && !editing && <p className="opt-empty">Acampante não encontrado.</p>}
      {mode.kind === "edit" && editing && (
        <>
          <CamperForm
            key={editing.id}
            camper={editing}
            categories={categories}
            busy={busy}
            onSubmit={handleEdit}
            onCancel={() => navigate(`/campers/${editing.id}`)}
          />
          <button type="button" className="link-danger" disabled={busy} onClick={() => handleDelete(editing)}>
            🗑️ Excluir {editing.name}
          </button>
        </>
      )}

      {mode.kind === "view" && (
        <>
          <div className="staff-toolbar">
            <input
              className="cat-input staff-toolbar__search"
              type="search"
              placeholder="Buscar por nome, líder, time, quarto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="staff-toolbar__filters" role="tablist" aria-label="Ala">
              {(
                [
                  ["all", "Todos"],
                  ["girls", `${GROUP_META.girls.emoji} Meninas`],
                  ["boys", `${GROUP_META.boys.emoji} Meninos`],
                ] as [Wing, string][]
              ).map(([key, label]) => (
                <button key={key} type="button" role="tab" aria-selected={wing === key} className={`cat-tab ${wing === key ? "cat-tab--active" : ""}`} onClick={() => setWing(key)}>
                  {label}
                  <span className="cat-tab__count">{counts[key]}</span>
                </button>
              ))}
            </div>
            {teams.length > 0 && (
              <select className="cat-input staff-toolbar__select" value={team} onChange={(e) => setTeam(e.target.value)} aria-label="Filtrar por time">
                <option value="">Todos os times</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          {/* medical team: the big picture at a glance (tap = filter) */}
          {readOnly && (
            <div className="stat-grid" role="group" aria-label="Resumo de saúde">
              {(
                [
                  [null, "🧒", "Crianças", campers.length],
                  ["medicines", "💊", "Tomam medicação", healthCounts.medicines ?? 0],
                  ["allergies", "🤮", "Têm alergias", healthCounts.allergies ?? 0],
                  ["foodRestrictions", "🍽️", "Restrição alimentar", healthCounts.foodRestrictions ?? 0],
                ] as [HealthKey | null, string, string, number][]
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
          </p>

          <ul className="staff-list">
            {visible.map((k) => {
              const room = k.bedroom ? roomById.get(k.bedroom) : null;
              const age = ageOf(k.birthDate);
              const caretaker = k.caretakerId ? staffById.get(k.caretakerId) : undefined;
              const orphan = !k.caretakerId;
              const tags = [room && bedroomLabel(room), labelOf(k.bed) && `Cama ${labelOf(k.bed)!.toLowerCase()}`, labelOf(k.team), labelOf(k.transportation), caretaker && `${ROOM_ROLE_META.caretaker.emoji} ${caretaker.name.split(" ")[0]}`].filter(Boolean) as string[];

              return (
                <li key={k.id} className={`staff-card staff-card--clickable ${orphan ? "staff-card--orphan" : ""}`}>
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
                    {orphan && <p className="staff-card__meta orphan-msg">⚠️ Esta criança está sem líder{!k.bedroom ? " e sem quarto" : ""}.</p>}
                    {k.guardianName && (
                      <p className="staff-card__meta">
                        Resp.: {k.guardianName}
                        {!k.bedroom && !orphan && <span className="staff-card__missing"> · sem quarto</span>}
                      </p>
                    )}
                    {tags.length > 0 && (
                      <div className="staff-card__tags">
                        {tags.map((t) => (
                          <span key={t} className="staff-tag">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <HealthAlerts person={k} labelOf={labelOf} />
                  </div>
                  {k.guardianPhone && (
                    <WhatsAppButton
                      className="wa-btn--sm"
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
