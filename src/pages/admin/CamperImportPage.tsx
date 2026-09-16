import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { analyzeCamperFile, applyCamperImport, createImportLeader, listImportFields, type CamperImport, type ImportField, type ImportReviewItem } from "../../api/camperImports";
import Breadcrumbs from "../../components/Breadcrumbs";
import { CheckGlyph, DownloadGlyph } from "../../components/Glyph";
import { ICONS } from "../../icons";
import { useRoute } from "../../router";
import { formatCpf } from "../../cpf";
import { maskBrazilPhone } from "../../phone";

interface Props { token: string; /** where "Ver acampantes" / the breadcrumb lead — the setup wizard continues instead of leaving */ onDone?: () => void }
type Delta = Record<string, { value?: string; skip?: boolean }>;

type Stage = "file" | "mapping" | "panic" | "review" | "summary" | "done";

const REVIEW_LABEL: Record<ImportReviewItem["kind"], string> = {
  leader: "Líderes", date: "Datas", guardianName: "Responsáveis", phone: "Telefones", cpf: "CPFs", email: "E-mails",
};
const IMPORTANT = new Set(["leader", "date", "guardianName", "phone"]);
const REVIEW_ORDER: ImportReviewItem["kind"][] = ["leader", "date", "guardianName", "phone", "cpf", "email"];

export default function CamperImportPage({ token, onDone }: Props) {
  const { navigate } = useRoute();
  /** finished: continue the wizard when embedded, else back to the campers list */
  const leave = () => (onDone ? onDone() : navigate("/campers"));
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<{ key: ImportField; label: string }[]>([]);
  const [record, setRecord] = useState<CamperImport | null>(null);
  const [stage, setStage] = useState<Stage>("file");
  const [delta, setDelta] = useState<Delta>({});
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showOptional, setShowOptional] = useState(false);
  const [optionalDismissed, setOptionalDismissed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const activeInput = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => { void listImportFields(token).then(setFields).catch(() => undefined); }, [token]);

  const reviews = useMemo(() => {
    if (!record) return [];
    return record.reviews
      .filter((r) => IMPORTANT.has(r.kind) || showOptional)
      .slice()
      .sort((a, b) => REVIEW_ORDER.indexOf(a.kind) - REVIEW_ORDER.indexOf(b.kind) || a.row - b.row);
  }, [record, showOptional]);
  const current = reviews[reviewIndex] ?? null;
  const completed = reviews.filter((r) => delta[r.id]?.skip || (delta[r.id]?.value ?? r.value)).length;
  const skippedRows = useMemo(() => new Set(reviews.flatMap((r) => IMPORTANT.has(r.kind) && delta[r.id]?.skip ? (r.affectedRows?.length ? r.affectedRows : [r.row]) : [])).size, [reviews, delta]);
  const optionalReviews = record?.reviews.filter((r) => !IMPORTANT.has(r.kind)) ?? [];

  useEffect(() => {
    if (stage === "review" && current && ["leader", "guardianName", "phone", "cpf", "email"].includes(current.kind)) window.setTimeout(() => activeInput.current?.focus(), 80);
  }, [stage, current?.id]);

  async function analyze(mapping?: Record<string, string | null>) {
    if (!file) return;
    setBusy(true); setError(null);
    try {
      const next = await analyzeCamperFile(token, file, mapping);
      const firstColumnPass = !mapping;
      setRecord(next);
      setDelta(Object.fromEntries(next.reviews.map((r) => [r.id, { value: r.value, skip: r.skip }])));
      setReviewIndex(0);
      setOptionalDismissed(false);
      if (next.status === "panic") setStage("panic");
      else if (next.status === "needs_mapping" || firstColumnPass) setStage("mapping");
      else if (next.reviews.some((r) => IMPORTANT.has(r.kind))) setStage("review");
      else setStage("summary");
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível analisar a planilha."); }
    finally { setBusy(false); }
  }

  function setValue(item: ImportReviewItem, value: string) { setDelta((d) => ({ ...d, [item.id]: { ...d[item.id], value, skip: false } })); }
  function skip(item: ImportReviewItem) { setDelta((d) => ({ ...d, [item.id]: { ...d[item.id], skip: true } })); next(); }
  function next() { if (reviewIndex + 1 < reviews.length) setReviewIndex((n) => n + 1); else setStage("summary"); }
  function previous() { setReviewIndex((n) => Math.max(0, n - 1)); }

  async function createLeader(item: ImportReviewItem) {
    const phone = delta[item.id]?.value ?? "";
    setBusy(true); setError(null);
    try {
      const created = await createImportLeader(token, record!.id, item.id, phone);
      setValue(item, created.staff.id);
      setRecord(created.import);
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível criar o líder."); }
    finally { setBusy(false); }
  }

  async function apply() {
    if (!record) return;
    setBusy(true); setError(null);
    try {
      if (!file) throw new Error("Escolha novamente a planilha original.");
      const result = await applyCamperImport(token, record.id, file, delta);
      setRecord(result.import); setStage("done");
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível importar."); }
    finally { setBusy(false); }
  }

  function downloadSkipped() {
    if (!record) return;
    const reasons = new Map<number, string>();
    for (const review of reviews) if (delta[review.id]?.skip) {
      for (const row of review.affectedRows?.length ? review.affectedRows : [review.row]) reasons.set(row, `Ignorado: ${REVIEW_LABEL[review.kind]}`);
    }
    const labels = previewLabelMap(record);
    const rows = previewRows(record, delta).filter((item) => reasons.has(Number(item.row))).map((item) => ({
      ...Object.fromEntries(PREVIEW_COLUMNS.map((column) => [column.label, displayPreview(item[column.key], labels)])),
      Motivo: reasons.get(Number(item.row)),
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Não importados");
    XLSX.writeFile(wb, `nao-importados-${record.fileName.replace(/\.[^.]+$/, "")}.xlsx`);
  }

  if (stage === "done" && record) return (
    <div className="admin-page import-page">
      <Breadcrumbs items={[{ label: "Acampantes", onClick: leave }, { label: "Importação concluída" }]} />
      <section className="import-success">
        <span className="import-success__check"><CheckGlyph size={54} /></span>
        <h1 className="admin-title">Importação concluída</h1>
        <p className="admin-intro">As crianças já estão no sistema. A revisão das observações por IA continua em segundo plano.</p>
        <button type="button" className="button button--primary" onClick={leave}>Ver acampantes</button>
      </section>
    </div>
  );

  return (
    <div className="admin-page admin-page--wide import-page">
      <Breadcrumbs items={[{ label: "Acampantes", onClick: leave }, { label: "Importar planilha" }]} />
      <header className="admin-head">
        <h1 className="admin-title"><img className="admin-title__icon" src={ICONS.importCampers} alt="" /> Importar acampantes</h1>
      </header>
      {stage !== "file" && <ImportProgress stage={stage} reviewDone={completed} reviewTotal={reviews.length} />}
      {error && <p className="message message--error">{error}</p>}

      {stage === "file" && (
        <section className="import-drop">
          <img src={ICONS.importCampers} alt="" className="import-drop__icon" />
          <h2>Escolha o CSV ou Excel</h2>
          <p>A IA compara as colunas; depois o sistema cruza quartos, líderes, transporte, times e saúde em paralelo.</p>
          <input ref={fileInput} hidden type="file" accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button type="button" className="button button--secondary" onClick={() => fileInput.current?.click()}>{file ? file.name : "Escolher planilha"}</button>
          <button type="button" className="button button--primary" disabled={!file || busy} onClick={() => void analyze()}>{busy ? "Analisando…" : "Analisar planilha"}</button>
          <p className="cat-hint">Nada é importado nesta fase. Itens novos ficam em rascunho até você aplicar.</p>
        </section>
      )}

      {stage === "mapping" && record && (
        <ColumnMapping record={record} fields={fields} busy={busy} onSubmit={(mapping) => void analyze(mapping)} />
      )}

      {stage === "panic" && record && (
        <section className="import-review">
          <h2>As datas precisam ser corrigidas</h2>
          <p className="message message--error">{record.error}</p>
          <p className="admin-intro">A análise dos outros campos terminou e o dicionário foi guardado. Corrija as datas na planilha para dd/MM/aaaa e envie o arquivo novamente.</p>
          <div className="cat-form__actions">
            <button type="button" className="button button--primary" onClick={() => { setRecord(null); setFile(null); setStage("file"); window.setTimeout(() => fileInput.current?.click(), 0); }}>Escolher arquivo corrigido</button>
          </div>
        </section>
      )}

      {stage === "review" && record && current && (
        <section className="import-review">
          <header className="import-review__head">
            <div><p className="import-review__eyebrow">{REVIEW_LABEL[current.kind]}</p><h2>{current.kidName}</h2></div>
            <span className="checkin-progress">{reviewIndex + 1}/{reviews.length}</span>
          </header>
          <p className="admin-intro">Algumas coisas eu não consegui resolver sozinho. Você pode corrigir ou ignorar; itens obrigatórios ignorados não serão importados.</p>
          <ReviewContext item={current} />
          {current.affectedRows && current.affectedRows.length > 1 && <p className="cat-hint">Esta correção vale para {current.affectedRows.length} crianças.</p>}
          <ReviewEditor item={current} value={delta[current.id]?.value ?? current.value} inputRef={activeInput} busy={busy} onChange={(v) => setValue(current, v)} onCreateLeader={() => void createLeader(current)} onEditLeader={(id) => window.open(`/staff/${id}/edit`, "_blank", "noopener,noreferrer")} />
          <div className="cat-form__actions import-review__actions">
            <button type="button" className="button button--secondary" disabled={reviewIndex === 0} onClick={previous}>Voltar</button>
            <button type="button" className="button button--secondary" onClick={() => skip(current)}>Ignorar</button>
            <button type="button" className="button button--primary" disabled={busy || (!delta[current.id]?.value && current.kind !== "cpf" && current.kind !== "email")} onClick={next}>Continuar</button>
          </div>
        </section>
      )}

      {stage === "summary" && record && (
        <section className="import-summary">
          <h2>Pronto para importar</h2>
          <div className="import-stats">
            <span><b>{record.preview.length - skippedRows}</b> crianças</span>
            <span><b>{record.createdItems.length}</b> itens novos</span>
            <span><b>{skippedRows}{skippedRows > 0 && <button type="button" className="icon-btn icon-btn--bare import-download-icon" title="Baixar não importados" aria-label="Baixar não importados" onClick={downloadSkipped}><DownloadGlyph /></button>}</b> ignoradas</span>
          </div>
          {record.createdItems.length > 0 && <p className="admin-intro">Também serão publicados: {record.createdItems.map((x) => x.label).join(", ")}.</p>}
          <button type="button" className="button button--secondary" onClick={() => setPreviewOpen((v) => !v)}>{previewOpen ? "Fechar prévia" : "Ver prévia"}</button>
          {previewOpen && <PreviewTable record={record} delta={delta} />}
          {optionalReviews.length > 0 && !optionalDismissed && <div className="import-optional-review"><p>Encontrei {optionalReviews.length} CPF(s) ou e-mail(s) inválido(s). Quer revisar ou deixar esses campos em branco?</p><div className="cat-form__actions"><button type="button" className="button button--secondary" onClick={() => { setDelta((currentDelta) => ({ ...currentDelta, ...Object.fromEntries(optionalReviews.map((item) => [item.id, { ...currentDelta[item.id], skip: true }])) })); setOptionalDismissed(true); }}>Ignorar</button><button type="button" className="button button--primary" onClick={() => { setShowOptional(true); setOptionalDismissed(true); setReviewIndex(record.reviews.filter((r) => IMPORTANT.has(r.kind)).length); setStage("review"); }}>Revisar {optionalReviews.length}</button></div></div>}
          {optionalReviews.length > 0 && optionalDismissed && !showOptional && <p className="cat-hint">CPFs e e-mails inválidos serão deixados em branco.</p>}
          <div className="cat-form__actions">
            <button type="button" className="button button--secondary" onClick={() => reviews.length ? setStage("review") : setStage("file")}>Voltar</button>
            <button type="button" className="button button--primary" disabled={busy || record.status === "panic" || record.status === "needs_mapping"} onClick={() => void apply()}>{busy ? "Importando…" : "Aplicar importação"}</button>
          </div>
        </section>
      )}
    </div>
  );
}

function ImportProgress({ stage, reviewDone, reviewTotal }: { stage: Stage; reviewDone: number; reviewTotal: number }) {
  const index = stage === "mapping" || stage === "panic" ? 1 : stage === "review" ? 2 : 3;
  const pct = stage === "review" && reviewTotal ? 33 + Math.round((reviewDone / reviewTotal) * 34) : index * 33;
  return <div className="import-progress" aria-label={`Progresso ${Math.min(pct, 100)}%`}><span style={{ width: `${Math.min(pct, 100)}%` }} /><ol><li className={index >= 1 ? "on" : ""}>Colunas</li><li className={index >= 2 ? "on" : ""}>Revisão</li><li className={index >= 3 ? "on" : ""}>Prévia</li></ol></div>;
}

function ColumnMapping({ record, fields, busy, onSubmit }: { record: CamperImport; fields: { key: ImportField; label: string }[]; busy: boolean; onSubmit: (mapping: Record<string, string | null>) => void }) {
  const [mapping, setMapping] = useState<Record<string, string | null>>(Object.fromEntries(record.columns.map((c) => [c.source, c.target])));
  const used = new Set(Object.values(mapping).filter(Boolean));
  return <section className="import-mapping"><h2>Compare as colunas</h2><p className="admin-intro">Confira o destino usando os cinco exemplos. Nome e data de nascimento são obrigatórios.</p>
    <div className="import-mapping__list">{record.columns.map((c) => <label key={c.source} className="import-column"><span className="import-column__source">{c.source}</span><span className="import-column__samples">{c.samples.length ? c.samples.join(" · ") : "Sem exemplos"}</span><select className="cat-input" value={mapping[c.source] ?? ""} onChange={(e) => setMapping((m) => ({ ...m, [c.source]: e.target.value || null }))}><option value="">Ignorar</option>{fields.map((f) => <option key={f.key} value={f.key} disabled={used.has(f.key) && mapping[c.source] !== f.key}>{f.label}</option>)}</select></label>)}</div>
    {record.error && <p className="message message--error">{record.error}</p>}
    <div className="cat-form__actions"><button type="button" className="button button--primary" disabled={busy || !Object.values(mapping).includes("name") || !Object.values(mapping).includes("birthDate")} onClick={() => onSubmit(mapping)}>{busy ? "Analisando…" : "Continuar"}</button></div>
  </section>;
}

function ReviewContext({ item }: { item: ImportReviewItem }) {
  const parts = [`Linha ${item.row}`, item.birthDate ? `Nascimento: ${item.birthDate}` : null, item.age != null ? `${item.age} anos` : null, item.guardianName ? `Responsável: ${item.guardianName}` : null, item.emergencyContact ? `Emergência: ${item.emergencyContact}` : null].filter((p): p is string => !!p);
  return <div className="import-review__context">{parts.map((p) => <span key={p}>{p}</span>)}{item.original && <p><b>Na planilha:</b> {item.original}</p>}</div>;
}

function ReviewEditor({ item, value, inputRef, busy, onChange, onCreateLeader, onEditLeader }: { item: ImportReviewItem; value: string; inputRef: React.RefObject<HTMLInputElement | HTMLSelectElement | null>; busy: boolean; onChange: (v: string) => void; onCreateLeader: () => void; onEditLeader: (id: string) => void }) {
  if (item.kind === "leader" && item.resolved && value) return <div className="import-leader import-leader--created"><span className="import-success__check import-success__check--small"><CheckGlyph size={26} /></span><strong>Líder criado</strong><button type="button" className="icon-btn icon-btn--bare" aria-label="Editar líder" title="Editar líder" onClick={() => onEditLeader(value)}><img className="pencil-icon" src={ICONS.pencil} alt="" /></button></div>;
  if (item.kind === "leader" && item.options?.length) return <label className="cat-field"><span className="cat-field__label">Escolha o líder</span><select ref={inputRef as React.RefObject<HTMLSelectElement>} className="cat-input" value={value} onChange={(e) => onChange(e.target.value)}><option value="">Selecione…</option>{item.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select></label>;
  if (item.kind === "leader") return <div className="import-leader"><label className="cat-field cat-field--grow"><span className="cat-field__label">Novo líder</span><input className="cat-input" value={item.original} readOnly /></label><label className="cat-field cat-field--grow"><span className="cat-field__label">Celular</span><input ref={inputRef as React.RefObject<HTMLInputElement>} className="cat-input" inputMode="tel" placeholder="(11) 99999-9999" value={maskBrazilPhone(value)} onChange={(e) => onChange(e.target.value)} /></label><button type="button" className="button button--primary" disabled={busy || value.replace(/\D/g, "").length !== 11} onClick={onCreateLeader}>Criar</button></div>;
  const type = item.kind === "date" ? "text" : item.kind === "email" ? "email" : "text";
  const display = item.kind === "cpf" ? formatCpf(value) : item.kind === "phone" ? maskBrazilPhone(value) : value;
  return <label className="cat-field"><span className="cat-field__label">Correção</span><input ref={inputRef as React.RefObject<HTMLInputElement>} className="cat-input" type={type} inputMode={item.kind === "cpf" || item.kind === "phone" ? "numeric" : undefined} placeholder={item.kind === "date" ? "dd/MM/aaaa" : item.kind === "guardianName" ? "Nome do responsável" : "Digite o valor correto"} value={display} onChange={(e) => onChange(e.target.value)} /></label>;
}

const PREVIEW_COLUMNS: { key: string; label: string }[] = [
  { key: "row", label: "Linha" }, { key: "name", label: "Nome" }, { key: "birthDate", label: "Nascimento" },
  { key: "bed", label: "Cama" }, { key: "bedroomPreference", label: "Preferência de quarto" }, { key: "team", label: "Time" },
  { key: "transportation", label: "Transporte" }, { key: "bedroom", label: "Quarto" }, { key: "caretakerId", label: "Líder" },
  { key: "cpf", label: "CPF" }, { key: "guardianCpf", label: "CPF do responsável" }, { key: "rg", label: "RG" },
  { key: "school", label: "Escola" }, { key: "schoolGrade", label: "Série" }, { key: "church", label: "Igreja" },
  { key: "invitedBy", label: "Convidado por" }, { key: "guardianName", label: "Responsável" }, { key: "guardianPhone", label: "Telefone" },
  { key: "guardianEmail", label: "E-mail" }, { key: "emergencyContact", label: "Emergência" }, { key: "insurance", label: "Convênio" },
  { key: "insuranceCard", label: "Carteirinha" }, { key: "weightKg", label: "Peso" }, { key: "allergies", label: "Alergias" },
  { key: "drugAllergies", label: "Alergia a remédios" }, { key: "healthIssues", label: "Condições de saúde" }, { key: "neurodivergent", label: "Neurodivergente" },
  { key: "dailyMedicationText", label: "Medicação diária" }, { key: "foodRestrictionText", label: "Restrição alimentar" }, { key: "healthNotes", label: "Observações médicas" },
  { key: "generalNotes", label: "Observações" },
];

function PreviewTable({ record, delta }: { record: CamperImport; delta: Delta }) {
  const rows = previewRows(record, delta);
  const shown = rows.slice(0, 200);
  const labels = previewLabelMap(record);
  return <div className="import-table-wrap"><table className="import-table"><thead><tr>{PREVIEW_COLUMNS.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{shown.map((r, i) => <tr key={`${r.row}-${i}`}>{PREVIEW_COLUMNS.map((column) => <td key={column.key}>{displayPreview(r[column.key], labels)}</td>)}</tr>)}</tbody></table>{rows.length > shown.length && <p className="cat-hint">Mostrando as primeiras {shown.length} linhas.</p>}</div>;
}

function previewRows(record: CamperImport, delta: Delta): Record<string, unknown>[] {
  const rows = record.preview.map((row) => ({ ...row }));
  for (const review of record.reviews) {
    const change = delta[review.id];
    if (!change || change.skip || !change.value) continue;
    const affected = new Set(review.affectedRows?.length ? review.affectedRows : [review.row]);
    for (const row of rows) if (affected.has(Number(row.row))) {
      if (review.kind === "leader") row.caretakerId = change.value;
      else if (review.kind === "date") row.birthDate = change.value;
      else if (review.kind === "guardianName") row.guardianName = change.value;
      else if (review.kind === "phone") row.guardianPhone = maskBrazilPhone(change.value);
      else if (review.kind === "cpf") row[review.field] = formatCpf(change.value);
      else if (review.kind === "email") row.guardianEmail = change.value.trim().toLowerCase();
    }
  }
  return rows;
}

function previewLabelMap(record: CamperImport): Map<string, string> {
  const labels = new Map<string, string>();
  for (const entry of record.dictionaries) if (typeof entry.value === "string" && entry.value) labels.set(entry.value, entry.label);
  for (const item of record.createdItems) labels.set(item.id, item.label);
  return labels;
}

function displayPreview(value: unknown, labels: Map<string, string>): string {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.map((v) => labels.get(String(v)) ?? String(v)).join(", ") || "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return labels.get(String(value)) ?? String(value);
}
