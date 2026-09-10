import { useMemo, useState, type ReactNode } from "react";
import { bedroomLabel, type Bedroom } from "../api/bedrooms";
import { ageOf, checkinCamper, undoCheckinCamper, type Camper } from "../api/campers";
import { useConfirm } from "../components/ConfirmDialog";
import Dialog from "../components/Dialog";
import Breadcrumbs from "../components/Breadcrumbs";
import { healthLines } from "../components/HealthAlerts";
import KidIcon from "../components/KidIcon";
import ParentIcon from "../components/ParentIcon";
import { ICONS, kidSexOf } from "../icons";
import { formatBrazilPhoneClient } from "../phoneFormat";
import { useCollection, useCollectionOrEmpty } from "../store";
import { useLabelOf } from "../store/derive";
import { useRoute } from "../router";
import TransportReport from "./TransportReport";

interface CheckinPageProps {
  token: string;
  /** admin: shows the per-vehicle report (it lists the team too, which helpers don't receive) and links to staff pages */
  canOpenStaff?: boolean;
  /** the admin route is nested below the merged Check-in landing page */
  adminMerged?: boolean;
}

type Filter = "pending" | "done" | "all";

/**
 * Arrival day: search the kid by name, open the check-in dialog, have the
 * parent confirm each piece of health/contact info, then "Confirmar chegada".
 */
export default function CheckinPage({ token, canOpenStaff, adminMerged = false }: CheckinPageProps) {
  const campers = useCollection("campers");
  const bedrooms = useCollectionOrEmpty("bedrooms");
  const labelOf = useLabelOf();
  const { segments, navigate } = useRoute();
  /** #/checkin/report for helpers; #/checkin/church/report for admins */
  const reportOpen = segments[adminMerged ? 2 : 1] === "report";
  const basePath = adminMerged ? "/checkin/church" : "/checkin";
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("pending");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roomById = useMemo(() => new Map(bedrooms.map((b) => [b.id, b])), [bedrooms]);

  const visible = useMemo(() => {
    if (!campers) return [];
    const q = normalize(search);
    return campers
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }))
      .filter((k) => {
        if (filter === "pending" && k.checkin) return false;
        if (filter === "done" && !k.checkin) return false;
        return !q || normalize(k.name).includes(q);
      });
  }, [campers, search, filter]);

  const counts = useMemo(() => {
    const done = campers?.filter((k) => k.checkin).length ?? 0;
    return { done, pending: (campers?.length ?? 0) - done, all: campers?.length ?? 0 };
  }, [campers]);

  const open = openId ? campers?.find((k) => k.id === openId) ?? null : null;
  const openRoom = open?.bedroom ? roomById.get(open.bedroom) ?? null : null;

  async function handleConfirm(k: Camper) {
    setBusy(true);
    setError(null);
    try {
      await checkinCamper(token, k.id);
      setOpenId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUndo(k: Camper) {
    if (!(await confirm({ emoji: "↩️", title: `Desfazer o check-in de ${k.name}?`, message: "A criança voltará para a lista de pendentes.", confirmLabel: "Desfazer", danger: true }))) return;
    setBusy(true);
    setError(null);
    try {
      await undoCheckinCamper(token, k.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  if (reportOpen && canOpenStaff) {
    return (
      <TransportReport
        onBack={() => navigate(basePath)}
        onHome={adminMerged ? () => navigate("/checkin") : undefined}
        onOpenStaff={(id) => navigate(`/staff/${id}`)}
      />
    );
  }

  if (!campers) {
    return (
      <div className="admin-page">
        {adminMerged && <Breadcrumbs items={[{ label: "Check-in", onClick: () => navigate("/checkin") }, { label: "Igreja" }]} />}
        <p className="opt-empty">Sincronizando com o servidor… 🏕️</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {adminMerged && <Breadcrumbs items={[{ label: "Check-in", onClick: () => navigate("/checkin") }, { label: "Igreja" }]} />}
      <header className="admin-head">
        <h1 className="admin-title">⛪ Check-in na igreja</h1>
        <div className="admin-head__actions">
          <span className="checkin-progress" title="Crianças que já chegaram">
            ✅ {counts.done}/{counts.all}
          </span>
          {canOpenStaff && (
            <button type="button" className="button button--secondary admin-head__new" disabled={campers.length === 0} title="Chegadas por veículo" onClick={() => navigate(`${basePath}/report`)}>
              📊 Por veículo
            </button>
          )}
        </div>
      </header>


      {error && <p className="message message--error">{error}</p>}

      <div className="staff-toolbar">
        <input
          className="cat-input staff-toolbar__search"
          type="search"
          placeholder="Buscar pelo nome da criança…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <div className="staff-toolbar__filters" role="tablist" aria-label="Filtro">
          {(
            [
              ["pending", "Aguardando"],
              ["done", "Chegaram"],
              ["all", "Todos"],
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={filter === key} className={`cat-tab ${filter === key ? "cat-tab--active" : ""}`} onClick={() => setFilter(key)}>
              {label}
              <span className="cat-tab__count">{counts[key]}</span>
            </button>
          ))}
        </div>
      </div>

      {campers.length === 0 && (
        <div className="admin-empty">
          <img className="admin-empty__icon" src={ICONS.camper} alt="" aria-hidden="true" />
          <p>Nenhum acampante cadastrado.</p>
        </div>
      )}
      {campers.length > 0 && visible.length === 0 && (
        <p className="opt-empty">{filter === "pending" && !search ? "Todo mundo já chegou! 🎉" : "Nenhum resultado. 🔍"}</p>
      )}

      <ul className="staff-list">
        {visible.map((k) => {
          const room = k.bedroom ? roomById.get(k.bedroom) : null;
          const age = ageOf(k.birthDate);
          const done = !!k.checkin;
          return (
            <li key={k.id} className={`staff-card staff-card--clickable ${done ? "checkin-card--done" : ""}`}>
              <div
                className="staff-card__body"
                role="button"
                tabIndex={0}
                title={done ? `${k.name} já chegou` : `Fazer check-in de ${k.name}`}
                onClick={() => setOpenId(k.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpenId(k.id);
                  }
                }}
              >
                <h3 className="staff-card__name">
                  {done && <span aria-hidden="true">✅ </span>}
                  {k.name}
                  {age !== null && <span className="kid-card__age">{age} anos</span>}
                </h3>
                <p className="staff-card__meta">
                  {room ? bedroomLabel(room) : <span className="staff-card__missing">sem quarto</span>}
                  {labelOf(k.team) && ` · ${labelOf(k.team)}`}
                  {done && k.checkin && <span className="checkin-card__when"> · chegou às {fmtTime(k.checkin.at)}</span>}
                </p>
              </div>
              {done && (
                <button type="button" className="icon-btn icon-btn--lg" title="Desfazer check-in" aria-label={`Desfazer check-in de ${k.name}`} disabled={busy} onClick={() => handleUndo(k)}>
                  ↩️
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <Dialog open={!!open} onClose={() => setOpenId(null)} title={open ? `Check-in de ${open.name}` : "Check-in"} width={560}>
        {open && (
          <CheckinDialog
            key={open.id}
            camper={open}
            bedroom={openRoom}
            sex={kidSexOf(openRoom?.group)}
            labelOf={labelOf}
            busy={busy}
            onConfirm={() => handleConfirm(open)}
            onCancel={() => setOpenId(null)}
          />
        )}
      </Dialog>
    </div>
  );
}

// ── the dialog ─────────────────────────────────────────────────────────

interface CheckinDialogProps {
  camper: Camper;
  bedroom: Bedroom | null;
  sex: "girl" | "boy" | null;
  labelOf: (id: string | null | undefined) => string | null;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

interface CheckItem {
  key: string;
  icon: ReactNode;
  title: string;
  text: string;
}

const CHECK_LABEL = "Perguntei e está correto";

function CheckinDialog({ camper: k, bedroom, sex, labelOf, busy, onConfirm, onCancel }: CheckinDialogProps) {
  const items: CheckItem[] = [
    ...healthLines(k, labelOf).map((l) => ({ key: l.title, icon: l.icon, title: l.title, text: l.text })),
    {
      key: "guardian",
      icon: <ParentIcon size={18} />,
      title: "Responsável",
      text: [k.guardianName || "nome não informado", k.guardianPhone ? formatBrazilPhoneClient(k.guardianPhone) : "celular não informado"].join(" · "),
    },
  ];
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const allChecked = items.every((i) => checked.has(i.key));
  const already = !!k.checkin;

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const age = ageOf(k.birthDate);

  return (
    <form
      className="cat-form cat-form--embedded checkin"
      onSubmit={(e) => {
        e.preventDefault();
        if (allChecked && !already) onConfirm();
      }}
    >
      <h2 className="cat-form__title detail-title">
        <KidIcon sex={sex} size={36} />
        {k.name}
        {age !== null && <span className="kid-card__age">{age} anos</span>}
      </h2>

      {already && k.checkin && (
        <p className="message message--ok">✅ Já fez check-in às {fmtTime(k.checkin.at)} com {k.checkin.byName.split(" ")[0]}.</p>
      )}

      {/* where the kid goes: team + bedroom as compact tags */}
      <div className="staff-card__tags">
        <span className="staff-tag" title="Time">
          🏳️ {labelOf(k.team) ?? <em className="staff-card__missing">sem time</em>}
        </span>
        {bedroom ? (
          <span className="staff-tag" title="Quarto">
            🛏️ {bedroomLabel(bedroom)}
          </span>
        ) : (
          <span className="staff-tag" title="Quarto">
            🛏️ <em className="staff-card__missing">sem quarto</em>
          </span>
        )}
        {labelOf(k.bed) && <span className="staff-tag">Cama {labelOf(k.bed)!.toLowerCase()}</span>}
      </div>

      <dl className="detail-grid">
        <dt>Peso</dt>
        <dd>{k.weightKg != null ? `${String(k.weightKg).replace(".", ",")} kg` : "—"}</dd>
        <dt>Transporte</dt>
        <dd>{labelOf(k.transportation) ?? "—"}</dd>
        {k.bedroomPreference && (
          <>
            <dt>Quer ficar com</dt>
            <dd>{k.bedroomPreference}</dd>
          </>
        )}
      </dl>

      <ul className="checkin-list">
        {items.map((i) => {
          const on = checked.has(i.key);
          return (
            <li key={i.key} className={`checkin-item ${on ? "checkin-item--ok" : ""}`}>
              <div className="checkin-item__info">
                <span className="checkin-item__title">
                  <span className="staff-card__alert-icon" aria-hidden="true">
                    {i.icon}
                  </span>{" "}
                  {i.title}
                </span>
                <span className="checkin-item__text">{i.text}</span>
              </div>
              <label className="checkin-check">
                <input type="checkbox" checked={on} disabled={already || busy} onChange={() => toggle(i.key)} />
                <span>{CHECK_LABEL}</span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="cat-form__actions">
        <button type="button" className="button button--secondary" disabled={busy} onClick={onCancel}>
          {already ? "Fechar" : "Cancelar"}
        </button>
        {!already && (
          <button type="submit" className="button button--primary" disabled={busy || !allChecked} title={allChecked ? undefined : "Confirme todos os itens com o responsável"}>
            {busy ? "Confirmando…" : "✅ Confirmar chegada"}
          </button>
        )}
      </div>
    </form>
  );
}

function fmtTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
