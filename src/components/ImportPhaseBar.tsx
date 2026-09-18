import { CheckGlyph } from "./Glyph";
import { useI18n } from "../i18n";

export interface ImportPhaseInfo {
  key: string;
  pct: number;
}

export interface ImportPhaseDef {
  key: string;
  label: string;
  /** pct at which this phase starts — the previous one is considered done */
  at: number;
}

/** the import analysis phases the camper importer reports */
export const CAMPER_PHASES: ImportPhaseDef[] = [
  { key: "reading", label: "Lendo a planilha", at: 3 },
  { key: "columns", label: "Reconhecendo as colunas", at: 10 },
  { key: "dedupe", label: "Agrupando valores repetidos", at: 24 },
  { key: "dates", label: "Decifrando as datas", at: 40 },
  { key: "crossing", label: "Cruzando quartos, times e transportes", at: 52 },
  { key: "leaders", label: "Buscando os líderes", at: 62 },
  { key: "categories", label: "Resolvendo alergias e condições", at: 74 },
  { key: "preview", label: "Montando a prévia", at: 88 },
];

/** the staff importer skips the date step */
export const STAFF_PHASES: ImportPhaseDef[] = CAMPER_PHASES.filter((p) => p.key !== "dates");

/** live progress of a running analysis: a filling bar plus the label of the phase happening now */
export default function ImportPhaseBar({ phases, progress }: { phases: ImportPhaseDef[]; progress: ImportPhaseInfo | null }) {
  const { tx } = useI18n();
  const pct = progress?.pct ?? 0;
  const current = phases.findIndex((_, i) => pct < (phases[i + 1]?.at ?? 100));
  const phase = current >= 0 ? phases[current] : phases[phases.length - 1]!;
  const finished = pct >= 100 || current < 0;
  const label = tx(phase.label);
  return (
    <div className="import-progress import-progress--phases" role="status" aria-label={tx("Analisando: {label}", { label })}>
      <span style={{ width: `${pct}%` }} />
      <p className="import-phase-current">
        {finished ? <CheckGlyph size="1em" /> : <i className="import-phase-dot" aria-hidden="true" />}
        {finished ? tx("Pronto") : label}…
      </p>
    </div>
  );
}
