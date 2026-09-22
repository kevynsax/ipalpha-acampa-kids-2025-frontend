import { useEffect, useRef, useState, type ReactNode } from "react";
import { handoverCamp } from "../../api/admins";
import { fetchCleanupMarks, runCleanup, type CleanupGroup, type StaffKeepGroup } from "../../api/cleanup";
import type { CampSummary } from "../../auth/store";
import { useConfirm } from "../../components/ConfirmDialog";
import CreateCampDialog from "../../components/CreateCampDialog";
import Dialog from "../../components/Dialog";
import OptionCards, { type OptionCard } from "../../components/OptionCards";
import PhoneInput from "../../components/PhoneInput";
import Toggle from "../../components/Toggle";
import { useCollection } from "../../store";
import type { Settings } from "../../api/settings";
import { useRoute } from "../../router";
import { setWizardDismissed } from "../../wizard/state";
import { ICONS } from "../../icons";
import { roleMeta } from "../../roles";
import { toE164 } from "../../phone";
import { useI18n } from "../../i18n";

interface CleanupPageProps {
  token: string;
  camp: CampSummary;
  onSwitchCamp: (campId: string) => Promise<void>;
}

type NextCampChoice = "create" | "cleanup" | "wizard";

interface Block {
  key: CleanupGroup;
  label: string;
  emoji?: string;
  icon?: string;
  /** second half of a 📖 + mala pair (emoji is the first half) */
  pairIcon?: string;
  /** what the button removes, in one line */
  hint: string;
  /** singular / plural of the thing being counted */
  unit: [string, string];
  /**
   * The two notification blocks do not delete records: they clear the "already
   * sent" memory of an SMS, so it can go out again next year.
   */
  memory?: boolean;
  /** blocks left out of "Limpar tudo" — texts that are reused every year */
  keptOnAll?: boolean;
  /** what the button and the question call the block, when the label is too long ("apagar documentos") */
  noun?: string;
}

const BLOCKS: readonly Block[] = [
  { key: "campers", label: "Acampantes", icon: ICONS.camper, hint: "As crianças, os check-ins, o histórico dos pais e os pontos lidos no crachá.", unit: ["acampante", "acampantes"] },
  { key: "staff", label: "Equipe", icon: ICONS.staffPair, hint: "A equipe, suas funções na programação e as listas das configurações.", unit: ["pessoa", "pessoas"] },
  { key: "bedrooms", label: "Quartos", icon: ICONS.bed, hint: "Os quartos; as crianças e a equipe ficam sem quarto, cama e líder.", unit: ["quarto", "quartos"] },
  { key: "transports", label: "Transporte", icon: ICONS.transport, hint: "Os ônibus e carros; ninguém fica com veículo e os ajudantes do check-in do ônibus saem da função.", unit: ["veículo", "veículos"] },
  { key: "teams", label: "Times", emoji: "🚩", hint: "Os times, o time de cada pessoa e todo o placar.", unit: ["time", "times"] },
  { key: "schedule", label: "Programação", icon: ICONS.schedule, hint: "Os eventos do acampamento.", unit: ["evento", "eventos"] },
  {
    key: "docs",
    label: "Instruções e Preparação",
    emoji: "📖",
    pairIcon: ICONS.preparation,
    hint: "Os documentos para todo mundo: Instruções e Preparações.",
    unit: ["documento", "documentos"],
    noun: "documentos",
    keptOnAll: true,
  },
  { key: "occurrences", label: "Ocorrências", emoji: "📋", hint: "Todo o registro de ocorrências do acampamento.", unit: ["ocorrência", "ocorrências"] },
  { key: "medications", label: "Medicações", icon: ICONS.medications, hint: "As marcações da equipe médica (o que cada criança tomou). A medicação cadastrada das crianças fica.", unit: ["marcação", "marcações"] },
  { key: "scores", label: "Placar", emoji: "🏆", hint: "Todos os pontos dados e tirados dos times.", unit: ["lançamento", "lançamentos"] },
  { key: "gallery", label: "Fotos", icon: ICONS.camera, hint: "Todas as fotos do álbum e os arquivos delas.", unit: ["foto", "fotos"] },
  {
    key: "welcomes",
    label: "Boas-vindas",
    icon: ICONS.notifications,
    hint: "A memória do SMS que sai uma vez quando abre a janela da equipe e a dos pais. Limpar libera o envio de novo.",
    unit: ["pessoa já recebeu", "pessoas já receberam"],
    memory: true,
  },
  {
    key: "notices",
    label: "Avisos únicos",
    emoji: "🔔",
    hint: "A memória dos avisos que saem uma única vez: lembrete do check-in, fotos no app e aniversários.",
    unit: ["aviso guardado", "avisos guardados"],
    memory: true,
  },
];

/**
 * The admin lists the Equipe block may SPARE. All off by default: without a
 * toggle on, the whole team goes (only the admins' own records stay).
 */
const KEEP: readonly { key: StaffKeepGroup; label: string; icon?: string; emoji?: string }[] = [
  { key: "organizers", label: "Organizadores", icon: ICONS.organizer },
  { key: "gameOrganizers", label: "Organizadores dos jogos", emoji: "🏆" },
  { key: "scoreHelpers", label: "Ajudantes do placar", emoji: "🎯" },
  { key: "medicalStaff", label: "Equipe médica", icon: roleMeta("health_staff").icon },
  { key: "checkinHelpers", label: "Ajudantes do check-in", emoji: "✅" },
  { key: "busHelpers", label: "Ajudantes do ônibus", icon: ICONS.transport },
  { key: "vestHelpers", label: "Coletes", emoji: "🦺" },
  { key: "photographers", label: "Fotógrafos", icon: ICONS.camera },
  { key: "parentContacts", label: "Contatos dos pais", emoji: "📞" },
];

/** The staff ids one admin list holds (each list has its own shape). */
function idsOf(settings: Settings | null | undefined, group: StaffKeepGroup): string[] {
  if (!settings) return [];
  if (group === "busHelpers") return settings.busHelpers.helpers.map((h) => h.staffId);
  if (group === "parentContacts") return settings.parentContacts.map((p) => p.staffId);
  return settings[group].staffIds;
}

/**
 * Configurações → Limpeza (ADMIN ONLY): apaga o acampamento que acabou, um
 * bloco de cada vez, para preparar o do ano que vem. Nada aqui tem volta —
 * cada botão pergunta antes, com a quantidade que vai sumir.
 */
export default function CleanupPage({ token, camp, onSwitchCamp }: CleanupPageProps) {
  const { tx } = useI18n();
  const confirm = useConfirm();
  const { navigate } = useRoute();
  const [busy, setBusy] = useState<CleanupGroup | "all" | "handover" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [marks, setMarks] = useState({ welcomes: 0, notices: 0 });
  const keepRef = useRef<StaffKeepGroup[]>([]);
  /** Programação only: the admin asked for the funções (and their texts) to go too */
  const rolesRef = useRef(false);
  const [reload, setReload] = useState(0);
  const [handoverOpen, setHandoverOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const settings = useCollection("settings");
  const isSuper = !!settings?.superAdmin;

  useEffect(() => {
    let alive = true;
    void fetchCleanupMarks(token)
      .then((m) => {
        if (alive) setMarks(m);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [token, reload]);

  const counts: Record<CleanupGroup, number> = {
    campers: useCollection("campers")?.length ?? 0,
    staff: useCollection("staff")?.length ?? 0,
    bedrooms: useCollection("bedrooms")?.length ?? 0,
    transports: useCollection("transports")?.length ?? 0,
    teams: useCollection("teams")?.length ?? 0,
    schedule: useCollection("events")?.length ?? 0,
    docs: (useCollection("instructions")?.length ?? 0) + (useCollection("preparation")?.length ?? 0),
    occurrences: useCollection("occurrences")?.length ?? 0,
    medications: useCollection("medications")?.length ?? 0,
    scores: useCollection("scores")?.length ?? 0,
    gallery: useCollection("gallery")?.length ?? 0,
    welcomes: marks.welcomes,
    notices: marks.notices,
  };
  // "Limpar tudo" leaves the reused texts alone, so they are out of its total
  const total = BLOCKS.filter((b) => !b.keptOnAll).reduce((a, b) => a + counts[b.key], 0);
  const roles = useCollection("roles")?.length ?? 0;

  /** the admin lists that still have someone on them — the only ones worth sparing */
  function keepSwitches() {
    return KEEP.map((g) => ({ ...g, count: idsOf(settings, g.key).length }))
      .filter((g) => g.count > 0)
      .map((g) => ({ key: g.key, label: tx("{label} ({n})", { label: tx(g.label), n: g.count }), icon: g.icon, emoji: g.emoji }));
  }

  function amount(block: Block): string {
    const n = counts[block.key];
    return tx("{n} {unit}", { n, unit: tx(block.unit[n === 1 ? 0 : 1]) });
  }

  async function clean(group: CleanupGroup | "all", title: string, message: ReactNode, confirmLabel: string) {
    if (busy) return;
    const memory = group === "welcomes" || group === "notices";
    const wipesStaff = group === "staff" || group === "all";
    const asksRoles = group === "schedule" && roles > 0;
    const switches = wipesStaff
      ? keepSwitches()
      : asksRoles
        ? [{ key: "roles", label: tx("Apagar também as funções ({n}) com suas instruções e preparação", { n: roles }) }]
        : [];
    keepRef.current = [];
    rolesRef.current = false;
    const ok = await confirm({
      emoji: memory ? "♻️" : "🧹",
      title,
      message,
      confirmLabel,
      danger: true,
      options: switches,
      optionsTitle: switches.length ? (wipesStaff ? tx("Não apagar:") : tx("Apagar junto:")) : undefined,
      onOptions: (keys) => {
        if (wipesStaff) keepRef.current = keys as StaffKeepGroup[];
        else rolesRef.current = keys.includes("roles");
      },
    });
    if (!ok) return;
    setBusy(group);
    setError(null);
    setDone(null);
    try {
      const removed = await runCleanup(token, group, keepRef.current, rolesRef.current);
      const n = Object.values(removed).reduce((a, b) => a + b, 0);
      setReload((r) => r + 1);
      setDone(
        group === "all"
          ? tx("Acampamento limpo: {n} registro(s) apagado(s).", { n })
          : memory
            ? tx("{n} aviso(s) liberado(s).", { n })
            : tx("{n} registro(s) apagado(s).", { n }),
      );
      // the camp is zero again → the setup wizard may open by itself on the next login
      if (group === "all") setWizardDismissed(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : tx("Algo deu errado."));
    } finally {
      setBusy(null);
    }
  }

  const nextCampOptions: OptionCard<NextCampChoice>[] = [
    {
      key: "create",
      icon: ICONS.createNew,
      title: tx("Novo acampamento"),
      subtitle: tx("Guarda {year} como está e começa {nextYear} do zero.", { year: camp.year, nextYear: camp.year + 1 }),
    },
    ...(isSuper
      ? [{ key: "cleanup" as const, icon: ICONS.cleanup, title: tx("Limpar este acampamento"), subtitle: tx("Apaga os blocos deste ano e passa para outro admin.") }]
      : []),
    { key: "wizard", icon: ICONS.wizard, title: tx("Abrir o assistente") },
  ];

  return (
    <div className="admin-page">
      <header className="admin-head">
        <h1 className="admin-title">
          <img className="admin-title__icon" src={ICONS.cleanup} alt="" aria-hidden="true" /> {tx("Limpeza")}
        </h1>
      </header>
      <p className="admin-intro">{tx("Apaga o acampamento que acabou para preparar o do ano que vem. Nada aqui tem volta.")}</p>
      <p className="message message--warn">{tx("⚠️ Só use depois que tudo estiver exportado ou impresso.")}</p>
      {error && <p className="message message--error">{error}</p>}
      {done && <p className="message message--ok">✅ {done}</p>}

      <div className="cleanup-grid">
        {BLOCKS.map((b) => {
          // Programação also offers the funções, so it is still worth pressing with zero events
          const empty = counts[b.key] === 0 && !(b.key === "schedule" && roles > 0);
          const low = tx(b.noun ?? b.label.toLowerCase());
          const message = (
            <>
              {tx(b.hint)}
              <br />
              {b.memory
                ? tx("Hoje {amount} — depois de limpar o aviso pode sair de novo.", { amount: amount(b) })
                : tx("Isso apaga {amount} e não pode ser desfeito.", { amount: amount(b) })}
            </>
          );
          return (
            <section key={b.key} className="cleanup-card">
              <h2 className="cleanup-card__title">
                {b.pairIcon ? (
                  <span className="cleanup-card__pair" aria-hidden="true">
                    <span>{b.emoji}</span>
                    <i>+</i>
                    <img className="cleanup-card__icon" src={b.pairIcon} alt="" />
                  </span>
                ) : b.icon ? (
                  <img className="cleanup-card__icon" src={b.icon} alt="" aria-hidden="true" />
                ) : (
                  <span aria-hidden="true">{b.emoji}</span>
                )}{" "}
                {tx(b.label)}
              </h2>
              <p className="cleanup-card__count">{amount(b)}</p>
              <p className="cat-hint">{tx(b.hint)}</p>
              <button
                type="button"
                className="button button--danger"
                disabled={empty || busy !== null}
                onClick={() =>
                  void clean(
                    b.key,
                    b.memory ? tx("Liberar {thing}?", { thing: low }) : tx("Apagar {thing}?", { thing: low }),
                    message,
                    b.memory ? tx("Liberar {thing}", { thing: low }) : tx("Apagar {thing}", { thing: low }),
                  )
                }
              >
                {busy === b.key
                  ? b.memory
                    ? tx("Liberando…")
                    : tx("Apagando…")
                  : empty
                    ? b.memory
                      ? tx("Nada guardado")
                      : tx("Já está limpo")
                    : b.memory
                      ? tx("♻️ Liberar {thing}", { thing: low })
                      : tx("🧹 Apagar {thing}", { thing: low })}
              </button>
            </section>
          );
        })}
      </div>

      <section className="cleanup-all">
        <h2 className="cleanup-all__title">🧹 {tx("Limpar tudo")}</h2>
        <p className="cleanup-all__text">
          {tx(
            "Apaga os {total} registro(s) dos blocos acima de uma vez — menos as Instruções e a Preparação, que têm botão próprio —, libera a memória dos avisos e zera as datas do check-in, as janelas de acesso, o lembrete e os ensaios. Ficam para o ano que vem: os logins, as categorias e as funções. Na confirmação dá para escolher quem da equipe fica.",
            { total },
          )}
        </p>
        <button
          type="button"
          className="button button--danger cleanup-all__button"
          disabled={busy !== null}
          onClick={() =>
            void clean(
              "all",
              tx("Limpar TODO o acampamento?"),
              <>
                {tx(
                  "Isso apaga {total} registro(s) — acampantes, equipe, quartos, ônibus, times, programação, ocorrências, placar e fotos —, libera as boas-vindas e os avisos únicos e zera as datas do acampamento.",
                  { total },
                )}
                <br />
                {tx("Não pode ser desfeito.")}
              </>,
              tx("Limpar tudo"),
            )
          }
        >
          {busy === "all" ? tx("Limpando tudo…") : tx("🧹 Limpar tudo")}
        </button>
      </section>
      <section className="cleanup-all cleanup-next">
        <h2 className="cleanup-all__title">
          <img className="audience-icon" src={ICONS.wizard} alt="" aria-hidden="true" /> {tx("Próximo acampamento")}
        </h2>
        <OptionCards<NextCampChoice>
          label={tx("Próximo acampamento")}
          value={null}
          disabled={busy !== null}
          options={nextCampOptions}
          onChange={(key) => {
            if (key === "create") {
              setError(null);
              setCreateOpen(true);
            } else if (key === "cleanup") {
              setError(null);
              setHandoverOpen(true);
            } else {
              setWizardDismissed(false);
              navigate("/wizard");
            }
          }}
        />
      </section>
      <CreateCampDialog open={createOpen} token={token} currentYear={camp.year} onClose={() => setCreateOpen(false)} onSwitchCamp={onSwitchCamp} />
      {isSuper && (
        <HandoverDialog
          open={handoverOpen}
          busy={busy === "handover"}
          error={error}
          onClose={() => busy !== "handover" && setHandoverOpen(false)}
          onSubmit={async (admin) => {
            if (busy) return;
            setBusy("handover");
            setError(null);
            setDone(null);
            try {
              const r = await handoverCamp(token, admin);
              setHandoverOpen(false);
              setReload((n) => n + 1);
              setDone(
                tx("{name} agora administra. {n} login(s) apagado(s).{mail}", {
                  name: r.admin.name,
                  n: r.usersRemoved,
                  mail: admin.notify ? (r.mailed ? tx(" E-mail enviado.") : tx(" O e-mail não saiu.")) : "",
                }),
              );
            } catch (e) {
              setError(e instanceof Error ? e.message : tx("Algo deu errado."));
            } finally {
              setBusy(null);
            }
          }}
        />
      )}
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function HandoverDialog({
  open,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (admin: { name: string; phone: string; email: string; notify: boolean }) => Promise<void>;
}) {
  const { tx } = useI18n();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notify, setNotify] = useState(true);
  const e164 = toE164(phone);
  const emailOk = EMAIL_RE.test(email.trim());
  const ready = !!name.trim() && !!e164 && emailOk;

  useEffect(() => {
    if (!open) return;
    setName("");
    setPhone("");
    setEmail("");
    setNotify(true);
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} title={tx("Limpar tudo e forçar o assistente")} width={520} dismissible={!busy} autofocus>
      <form
        className="cat-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!ready || busy || !e164) return;
          void onSubmit({ name: name.trim(), phone: e164, email: email.trim().toLowerCase(), notify });
        }}
      >
        <h2 className="cat-form__title">{tx("Novo administrador")}</h2>
        <p className="admin-intro">
          {tx("Apaga o acampamento e todos os logins, menos o seu. Cria este admin e, no primeiro login dele, o assistente abre — Configurações fica bloqueado até concluir ou sair.")}
        </p>
        <label className="cat-field">
          <span className="cat-field__label">{tx("Nome")}</span>
          <input className="cat-input" value={name} maxLength={80} disabled={busy} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="cat-field">
          <span className="cat-field__label">{tx("E-mail")}</span>
          <input className="cat-input" type="email" inputMode="email" autoComplete="email" placeholder={tx("ex.: nome@email.com")} value={email} maxLength={160} disabled={busy} onChange={(e) => setEmail(e.target.value)} />
          {email.trim() && !emailOk && <p className="cat-hint cat-hint--error">{tx("Informe um e-mail válido.")}</p>}
        </label>
        <label className="cat-field">
          <span className="cat-field__label">{tx("Celular")}</span>
          <PhoneInput value={phone} onChange={setPhone} disabled={busy} />
        </label>
        <Toggle checked={notify} disabled={busy} label={tx("Avisar por e-mail")} onChange={setNotify} />
        <p className="cat-hint">{tx("⚠️ Não tem volta.")}</p>
        {error && <p className="message message--error">{error}</p>}
        <div className="cat-form__actions">
          <button type="button" className="button button--secondary" disabled={busy} onClick={onClose}>
            {tx("Cancelar")}
          </button>
          <button type="submit" className="button button--danger" disabled={busy || !ready}>
            {busy ? tx("Limpando…") : tx("Limpar e passar")}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
