import { useEffect, useMemo, useState } from "react";
import { fetchSeeds, resetSeeds, saveSeeds, type Seeds } from "../../api/seeds";
import { BUS_COLORS } from "../../api/transports";
import { useConfirm } from "../../components/ConfirmDialog";
import RichTextEditor from "../../components/RichTextEditor";
import { useCollection } from "../../store";
import { useRoute } from "../../router";
import { setWizardDismissed } from "../../wizard/state";
import { defaultSeeds } from "../../wizard/defaults";
import RoomsEditor from "../../wizard/RoomsEditor";
import { DAY_LABELS, type TemplateEvent, type TemplateRole } from "../../wizard/scheduleTemplate";
import type { KnownPlace } from "../../wizard/places";

interface SeedsPageProps {
  token: string;
}

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `seed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

/** how a função reaches people: só escalada / líderes / auxiliares / toda a equipe */
type Reach = "manual" | "caretaker" | "helper" | "all";
const reachOf = (r: TemplateRole): Reach => (r.detailFromTeam ? "manual" : r.forRoomRoles.length >= 2 ? "all" : r.forRoomRoles[0] ?? "manual");
const applyReach = (r: TemplateRole, reach: Reach): TemplateRole => ({
  ...r,
  forRoomRoles: reach === "all" ? ["caretaker", "helper"] : reach === "manual" ? [] : [reach],
});

const REACH_LABEL: Record<Reach, string> = { manual: "Só escalados", caretaker: "Líderes", helper: "Auxiliares", all: "Toda a equipe" };

/**
 * ⚙️ → Sementes (SUPER ADMIN only): the templates the setup wizard imports —
 * the known camping places (rooms + address + location), the programme model
 * with its funções, the bus fleet and the two starter documents. Everything
 * the wizard imports comes from HERE once it is saved; "Restaurar padrão"
 * brings back the values the app ships with.
 */
export default function SeedsPage({ token }: SeedsPageProps) {
  const settings = useCollection("settings");
  const { navigate } = useRoute();
  const confirm = useConfirm();
  const [saved, setSaved] = useState<Seeds | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Seeds>(() => defaultSeeds());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  // only the deployment owner (SUPER_ADMIN_PHONE) may change the seeds — the tab is hidden from everyone else
  const canEdit = !!settings?.superAdmin;

  useEffect(() => {
    let alive = true;
    setError(null);
    fetchSeeds(token)
      .then((s) => {
        if (!alive) return;
        setSaved(s);
        if (s) setDraft(structuredCopy(s));
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Não foi possível carregar as sementes."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [token]);

  const dirty = useMemo(() => JSON.stringify(strip(draft)) !== JSON.stringify(strip(saved ?? defaultSeeds())), [draft, saved]);

  function patch(p: Partial<Seeds>) {
    setDraft((d) => ({ ...d, ...p }));
    setSavedOk(false);
  }

  async function save() {
    if (busy || !canEdit) return;
    setBusy(true);
    setError(null);
    setSavedOk(false);
    try {
      const s = await saveSeeds(token, strip(draft));
      setSaved(s);
      setDraft(structuredCopy(s));
      setSavedOk(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  /** one section back to the app's built-in default (still needs Salvar) */
  function restore<K extends keyof Omit<Seeds, "updatedAt">>(section: K) {
    if (busy || !canEdit) return;
    patch({ [section]: structuredCopy(defaultSeeds()[section]) } as Partial<Seeds>);
  }

  async function restoreAll() {
    if (busy || !canEdit) return;
    if (!(await confirm({ emoji: "🌱", title: "Restaurar TODAS as sementes?", message: "Volta para os padrões que o app traz e joga fora o que foi salvo. O assistente volta a usar os padrões.", confirmLabel: "Restaurar tudo", danger: true }))) return;
    setBusy(true);
    setError(null);
    try {
      await resetSeeds(token);
      setSaved(null);
      setDraft(defaultSeeds());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <p className="opt-empty">Carregando sementes… 🌱</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-head">
        <h1 className="admin-title">🌱 Sementes</h1>
        {canEdit && (
          <div className="admin-head__actions">
            <button type="button" className="button button--danger admin-head__new" disabled={busy} onClick={() => void restoreAll()}>
              Restaurar tudo
            </button>
            <button type="button" className="button button--primary admin-head__new" disabled={busy || !dirty} onClick={() => void save()}>
              {busy ? "Salvando…" : "Salvar sementes"}
            </button>
          </div>
        )}
      </header>
      <p className="admin-intro">
        Os modelos que o <strong>assistente de configuração</strong> importa: locais de acampamento, programação com suas funções, frota de
        ônibus e os primeiros documentos. {saved ? `Última atualização: ${new Date(saved.updatedAt ?? "").toLocaleString("pt-BR")}.` : "Nada foi salvo ainda — o assistente usa os padrões do app."}
      </p>
      {!canEdit && <p className="message message--warn">🔒 Somente o administrador da implantação (SUPER_ADMIN_PHONE) mantém as sementes.</p>}
      {error && <p className="message message--error">{error}</p>}
      {savedOk && <p className="message message--ok">✅ Sementes salvas — o assistente já usa estes valores.</p>}

      {/* ── locais ── */}
      <section className="cat-form seeds-section">
        <div className="list-head">
          <h2 className="cat-form__title">📍 Locais de acampamento</h2>
          {canEdit && (
            <button
              type="button"
              className="button button--secondary list-head__add"
              disabled={busy}
              onClick={() => patch({ places: [...draft.places, { id: newId(), name: "Novo local", address: "", lat: null, lng: null, rooms: [] }] })}
            >
              ➕ Local
            </button>
          )}
        </div>
        <p className="cat-hint">Quartos e camas, endereço e coordenadas de cada sítio que a igreja usa — o assistente preenche tudo disso.</p>
        {draft.places.map((p, i) => (
          <div key={p.id} className="seeds-place">
            <div className="seeds-place__head">
              <span className="seeds-place__name">{p.name || "(sem nome)"}</span>
              <span className="cat-hint">{p.rooms.length} quarto(s) · {p.rooms.reduce((n, r) => n + r.bunkBeds * 2 + r.singleBeds, 0)} camas</span>
              {canEdit && draft.places.length > 1 && (
                <button type="button" className="helpers-tag__x" title="Remover local" aria-label="Remover local" disabled={busy} onClick={() => patch({ places: draft.places.filter((_, j) => j !== i) })}>
                  ✕
                </button>
              )}
            </div>
            <div className="cat-form__row staff-form__row">
              <SeedsField label="Nome" disabled={!canEdit || busy} value={p.name} maxLength={80} onChange={(v) => patchPlace(i, { name: v })} />
              <SeedsField label="Endereço" disabled={!canEdit || busy} value={p.address} maxLength={200} onChange={(v) => patchPlace(i, { address: v })} />
            </div>
            <div className="cat-form__row staff-form__row">
              <SeedsField label="Latitude" disabled={!canEdit || busy} value={p.lat != null ? String(p.lat) : ""} onChange={(v) => patchPlace(i, { lat: v.trim() ? Number(v.replace(",", ".")) || null : null })} placeholder="-23.480536" />
              <SeedsField label="Longitude" disabled={!canEdit || busy} value={p.lng != null ? String(p.lng) : ""} onChange={(v) => patchPlace(i, { lng: v.trim() ? Number(v.replace(",", ".")) || null : null })} placeholder="-46.830779" />
            </div>
            <SeedsField label="Observações (dica que aparece no assistente)" disabled={!canEdit || busy} value={p.notes ?? ""} maxLength={300} onChange={(v) => patchPlace(i, { notes: v })} />
            <RoomsEditor rooms={p.rooms} onChange={(rooms) => patchPlace(i, { rooms })} disabled={!canEdit || busy} />
          </div>
        ))}
        {canEdit && <SeedsRestore label="Restaurar locais padrão" disabled={busy || !dirtyPlaces(draft, saved)} onClick={() => restore("places")} />}
      </section>

      {/* ── funções ── */}
      <section className="cat-form seeds-section">
        <div className="list-head">
          <h2 className="cat-form__title">🎯 Funções da programação</h2>
          {canEdit && (
            <button
              type="button"
              className="button button--secondary list-head__add"
              disabled={busy}
              onClick={() => patch({ roles: [...draft.roles, { key: newId(), name: "Nova função", emoji: "🎯", forRoomRoles: [] }] })}
            >
              ➕ Função
            </button>
          )}
        </div>
        <p className="cat-hint">As funções que os eventos modelo usam. “Só escalados” precisa de escala na programação; as outras caem por posição (líder / auxiliar / toda a equipe).</p>
        <div className="seeds-roles">
          {draft.roles.map((r, i) => (
            <div key={r.key} className="seeds-roles__row">
              <label className="cat-field seeds-roles__emoji">
                <span className="cat-field__label">Emblema</span>
                <input className="cat-input" value={r.emoji} maxLength={4} disabled={!canEdit || busy} onChange={(e) => patchRole(i, { emoji: e.target.value })} />
              </label>
              <label className="cat-field cat-field--grow">
                <span className="cat-field__label">Nome</span>
                <input className="cat-input" value={r.name} maxLength={80} disabled={!canEdit || busy} onChange={(e) => patchRole(i, { name: e.target.value })} />
              </label>
              <label className="cat-field">
                <span className="cat-field__label">Quem faz</span>
                <select className="cat-input" value={reachOf(r)} disabled={!canEdit || busy} onChange={(e) => patchRole(i, applyReach(r, e.target.value as Reach))}>
                  {(Object.keys(REACH_LABEL) as Reach[]).map((k) => (
                    <option key={k} value={k}>{REACH_LABEL[k]}</option>
                  ))}
                </select>
              </label>
              <label className="cat-field">
                <span className="cat-field__label">Detalhe</span>
                <select
                  className="cat-input"
                  value={r.detailFromTeam ? "team" : r.hasDetail ? "free" : "none"}
                  disabled={!canEdit || busy}
                  onChange={(e) => patchRole(i, { hasDetail: e.target.value === "free", detailFromTeam: e.target.value === "team" })}
                >
                  <option value="none">—</option>
                  <option value="free">Digitado (cor, base…)</option>
                  <option value="team">Time da pessoa</option>
                </select>
              </label>
              {canEdit && (
                <button
                  type="button"
                  className="helpers-tag__x seeds-roles__x"
                  title="Remover função"
                  aria-label="Remover função"
                  disabled={busy || draft.events.some((e) => e.roles.includes(r.key))}
                  onClick={() => patch({ roles: draft.roles.filter((_, j) => j !== i) })}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {canEdit && <SeedsRestore label="Restaurar funções padrão" disabled={busy || !dirtyRoles(draft, saved)} onClick={() => restore("roles")} />}
      </section>

      {/* ── eventos ── */}
      <section className="cat-form seeds-section">
        <div className="list-head">
          <h2 className="cat-form__title">
            📅 Programação modelo <span className="cat-tab__count">{draft.events.length}</span>
          </h2>
          {canEdit && (
            <button
              type="button"
              className="button button--secondary list-head__add"
              disabled={busy}
              onClick={() => patch({ events: [...draft.events, { day: 1, start: "08:00", end: null, title: "Novo evento", emoji: "📌", roles: [], visibleToParents: true }] })}
            >
              ➕ Evento
            </button>
          )}
        </div>
        <p className="cat-hint">Sexta à noite → domingo à tarde. O assistente mostra esta lista para tirar itens antes de importar; o dia 1 é a sexta de saída.</p>
        {([1, 2, 3] as const).map((day) => (
          <div key={day} className="seeds-day">
            <h3 className="seeds-day__title">{DAY_LABELS[day]}</h3>
            {draft.events.map((e, i) => [e, i] as const).filter(([e]) => e.day === day).map(([e, i]) => (
              <div key={i} className="seeds-event">
                <label className="cat-field seeds-event__time">
                  <span className="cat-field__label">Início</span>
                  <input className="cat-input" type="time" value={e.start} disabled={!canEdit || busy} onChange={(ev) => patchEvent(i, { start: ev.target.value })} />
                </label>
                <label className="cat-field seeds-event__time">
                  <span className="cat-field__label">Fim</span>
                  <input className="cat-input" type="time" value={e.end ?? ""} disabled={!canEdit || busy} onChange={(ev) => patchEvent(i, { end: ev.target.value || null })} />
                </label>
                <label className="cat-field seeds-event__emoji">
                  <span className="cat-field__label">Emblema</span>
                  <input className="cat-input" value={e.emoji} maxLength={4} disabled={!canEdit || busy} onChange={(ev) => patchEvent(i, { emoji: ev.target.value })} />
                </label>
                <label className="cat-field cat-field--grow">
                  <span className="cat-field__label">Título</span>
                  <input className="cat-input" value={e.title} maxLength={80} disabled={!canEdit || busy} onChange={(ev) => patchEvent(i, { title: ev.target.value })} />
                </label>
                <label className="cat-field seeds-event__day">
                  <span className="cat-field__label">Dia</span>
                  <select className="cat-input" value={e.day} disabled={!canEdit || busy} onChange={(ev) => patchEvent(i, { day: Number(ev.target.value) as 1 | 2 | 3 })}>
                    {([1, 2, 3] as const).map((d) => (
                      <option key={d} value={d}>{DAY_LABELS[d].split(" ")[0]}</option>
                    ))}
                  </select>
                </label>
                {canEdit && (
                  <button type="button" className="helpers-tag__x seeds-event__x" title="Remover evento" aria-label="Remover evento" disabled={busy} onClick={() => patch({ events: draft.events.filter((_, j) => j !== i) })}>
                    ✕
                  </button>
                )}
                <div className="seeds-event__roles">
                  {draft.roles.map((r) => {
                    const on = e.roles.includes(r.key);
                    return (
                      <button
                        key={r.key}
                        type="button"
                        className={`chip-toggle chip-toggle--small ${on ? "chip-toggle--on" : ""}`}
                        aria-pressed={on}
                        disabled={!canEdit || busy}
                        title={`${r.name}${on ? " — tirar do evento" : " — usar no evento"}`}
                        onClick={() => patchEvent(i, { roles: on ? e.roles.filter((k) => k !== r.key) : [...e.roles, r.key] })}
                      >
                        <span aria-hidden="true">{r.emoji}</span> {r.name}
                      </button>
                    );
                  })}
                  <label className="check-row seeds-event__parents">
                    <input type="checkbox" checked={e.visibleToParents !== false} disabled={!canEdit || busy} onChange={(ev) => patchEvent(i, { visibleToParents: ev.target.checked })} /> os pais veem
                  </label>
                </div>
              </div>
            ))}
          </div>
        ))}
        {canEdit && <SeedsRestore label="Restaurar programação padrão" disabled={busy || !dirtyEvents(draft, saved)} onClick={() => restore("events")} />}
      </section>

      {/* ── frota ── */}
      <section className="cat-form seeds-section">
        <div className="list-head">
          <h2 className="cat-form__title">
            🚌 Frota inicial <span className="cat-tab__count">{draft.fleet.length}</span>
          </h2>
          {canEdit && (
            <button type="button" className="button button--secondary list-head__add" disabled={busy} onClick={() => patch({ fleet: [...draft.fleet, { number: String(draft.fleet.length + 1), color: BUS_COLORS[draft.fleet.length % BUS_COLORS.length].hex, capacity: null }] })}>
              ➕ Ônibus
            </button>
          )}
        </div>
        <p className="cat-hint">Os ônibus que o assistente cria quando o acampamento está sem veículos.</p>
        <div className="seeds-fleet">
          {draft.fleet.map((b, i) => (
            <div key={i} className="seeds-fleet__row">
              <label className="cat-field seeds-fleet__n">
                <span className="cat-field__label">Número</span>
                <input className="cat-input" value={b.number} maxLength={10} disabled={!canEdit || busy} onChange={(e) => patchFleet(i, { number: e.target.value })} />
              </label>
              <label className="cat-field">
                <span className="cat-field__label">Cor</span>
                <select className="cat-input" value={BUS_COLORS.some((c) => c.hex === b.color) ? b.color : ""} disabled={!canEdit || busy} onChange={(e) => patchFleet(i, { color: e.target.value || b.color })}>
                  {!BUS_COLORS.some((c) => c.hex === b.color) && <option value="">{b.color}</option>}
                  {BUS_COLORS.map((c) => (
                    <option key={c.hex} value={c.hex}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="cat-field seeds-fleet__n">
                <span className="cat-field__label">Lugares</span>
                <input
                  className="cat-input"
                  type="number"
                  min={1}
                  max={99}
                  inputMode="numeric"
                  value={b.capacity ?? ""}
                  placeholder="—"
                  disabled={!canEdit || busy}
                  onChange={(e) => patchFleet(i, { capacity: e.target.value ? Math.max(1, Number(e.target.value) || 1) : null })}
                />
              </label>
              {canEdit && (
                <button type="button" className="helpers-tag__x seeds-fleet__x" title="Remover ônibus" aria-label="Remover ônibus" disabled={busy} onClick={() => patch({ fleet: draft.fleet.filter((_, j) => j !== i) })}>
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {canEdit && <SeedsRestore label="Restaurar frota padrão" disabled={busy || !dirtyFleet(draft, saved)} onClick={() => restore("fleet")} />}
      </section>

      {/* ── documentos ── */}
      <section className="cat-form seeds-section">
        <h2 className="cat-form__title">📖 Documentos iniciais</h2>
        <p className="cat-hint">O que o assistente cria nos passos de Documentos: a primeira Preparação e a instrução com o endereço.</p>
        <div className="cat-form__row staff-form__row">
          <label className="cat-field seeds-roles__emoji">
            <span className="cat-field__label">Emblema</span>
            <input className="cat-input" value={draft.docs.prepEmoji} maxLength={4} disabled={!canEdit || busy} onChange={(e) => patch({ docs: { ...draft.docs, prepEmoji: e.target.value } })} />
          </label>
          <label className="cat-field cat-field--grow">
            <span className="cat-field__label">Título da Preparação</span>
            <input className="cat-input" value={draft.docs.prepTitle} maxLength={80} disabled={!canEdit || busy} onChange={(e) => patch({ docs: { ...draft.docs, prepTitle: e.target.value } })} />
          </label>
          <label className="cat-field seeds-roles__emoji">
            <span className="cat-field__label">Emblema</span>
            <input className="cat-input" value={draft.docs.addressEmoji} maxLength={4} disabled={!canEdit || busy} onChange={(e) => patch({ docs: { ...draft.docs, addressEmoji: e.target.value } })} />
          </label>
          <label className="cat-field cat-field--grow">
            <span className="cat-field__label">Título da instrução de endereço</span>
            <input className="cat-input" value={draft.docs.addressTitle} maxLength={80} disabled={!canEdit || busy} onChange={(e) => patch({ docs: { ...draft.docs, addressTitle: e.target.value } })} />
          </label>
        </div>
        <div className="cat-field">
          <span className="cat-field__label">📝 Conteúdo da Preparação</span>
          <RichTextEditor
            token={canEdit ? token : undefined}
            value={draft.docs.prepContent}
            onChange={(html) => patch({ docs: { ...draft.docs, prepContent: html } })}
            disabled={!canEdit || busy}
            placeholder="O que levar na mala…"
          />
        </div>
        {canEdit && <SeedsRestore label="Restaurar documentos padrão" disabled={busy || !dirtyDocs(draft, saved)} onClick={() => restore("docs")} />}
      </section>

      {/* ── assistente ── */}
      <section className="cat-form seeds-section">
        <h2 className="cat-form__title">🏕️ Assistente de configuração</h2>
        <p className="cat-hint">Reabrir o passo a passo que monta o acampamento a partir destas sementes.</p>
        <div className="cat-form__actions">
          <button
            type="button"
            className="button button--primary"
            onClick={() => {
              setWizardDismissed(false);
              navigate("/wizard");
            }}
          >
            Abrir o assistente
          </button>
        </div>
      </section>
    </div>
  );

  // ── draft patchers (keep the shapes the backend validates) ──

  function patchPlace(i: number, p: Partial<KnownPlace>) {
    patch({ places: draft.places.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  }
  function patchRole(i: number, p: Partial<TemplateRole>) {
    patch({ roles: draft.roles.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  }
  function patchEvent(i: number, p: Partial<TemplateEvent>) {
    patch({ events: draft.events.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  }
  function patchFleet(i: number, p: Partial<Seeds["fleet"][number]>) {
    patch({ fleet: draft.fleet.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  }
}

// ── small helpers ──────────────────────────────────────────────────────────

function SeedsField({ label, value, onChange, disabled, maxLength, placeholder }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; maxLength?: number; placeholder?: string }) {
  return (
    <label className="cat-field cat-field--grow">
      <span className="cat-field__label">{label}</span>
      <input className="cat-input" value={value} maxLength={maxLength} placeholder={placeholder} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function SeedsRestore({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <div className="settings-tools">
      <button type="button" className="button button--secondary" disabled={disabled} onClick={onClick}>
        ↺ {label}
      </button>
    </div>
  );
}

/** drop the read-only stamp so drafts and saved values compare cleanly */
function strip(s: Seeds): Omit<Seeds, "updatedAt"> {
  const { updatedAt: _updatedAt, ...rest } = s;
  void _updatedAt;
  return rest;
}

function structuredCopy<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** is this section different from what is effectively in use (saved or default)? */
function sectionDirty<K extends keyof Omit<Seeds, "updatedAt">>(draft: Seeds, saved: Seeds | null, section: K): boolean {
  return JSON.stringify(draft[section]) !== JSON.stringify((saved ?? defaultSeeds())[section]);
}
const dirtyPlaces = (d: Seeds, s: Seeds | null) => sectionDirty(d, s, "places");
const dirtyRoles = (d: Seeds, s: Seeds | null) => sectionDirty(d, s, "roles");
const dirtyEvents = (d: Seeds, s: Seeds | null) => sectionDirty(d, s, "events");
const dirtyFleet = (d: Seeds, s: Seeds | null) => sectionDirty(d, s, "fleet");
const dirtyDocs = (d: Seeds, s: Seeds | null) => sectionDirty(d, s, "docs");
