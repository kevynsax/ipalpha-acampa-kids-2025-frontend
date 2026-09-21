import { useState } from "react";
import { speakWhen } from "../../dates";
import { ICONS } from "../../icons";
import { useI18n } from "../../i18n";
import { useScoreSuspense } from "../../scoreSuspense";
import { useCollection } from "../../store";
import ScoreSuspenseDialog from "./ScoreSuspenseDialog";

interface ScoreSuspenseCardProps {
  token: string;
}

/**
 * Settings → Jogos: the scoreboard SUSPENSE window at a glance (visible /
 * scheduled / hidden now) with the button that opens the dialog to set it.
 */
export default function ScoreSuspenseCard({ token }: ScoreSuspenseCardProps) {
  const { tx } = useI18n();
  const settings = useCollection("settings");
  const state = useScoreSuspense(settings?.scoreHideWindow);
  const [open, setOpen] = useState(false);

  let status: string;
  let tone = "";
  switch (state.kind) {
    case "on":
      status = tx("🤫 Escondido da equipe agora — revela {until}.", { until: speakWhen(state.until) });
      tone = "message message--warn";
      break;
    case "scheduled":
      status = tx("🕒 Some da equipe {from} e volta {until}.", { from: speakWhen(state.from), until: speakWhen(state.until) });
      tone = "cat-hint";
      break;
    case "over":
      status = tx("🟢 Visível para todos — o suspense terminou {until}.", { until: speakWhen(state.until) });
      tone = "cat-hint";
      break;
    default:
      status = tx("🟢 Visível para todos.");
      tone = "cat-hint";
  }

  return (
    <section className="cat-form">
      <div className="cat-form__head">
        <h2 className="cat-form__title">
          <img className="admin-title__icon" src={ICONS.curtain} alt="" aria-hidden="true" /> {tx("Suspense do placar")}
        </h2>
        <button type="button" className="button button--secondary" disabled={!settings} onClick={() => setOpen(true)}>
          {state.kind === "on" || state.kind === "scheduled" ? tx("Alterar horário") : tx("Definir horário")}
        </button>
      </div>
      <p className="cat-hint">
        {tx("Esconde os pontos da equipe por algumas horas antes do anúncio dos vencedores. Quem lança pontos continua vendo.")}
      </p>
      <p className={tone}>{status}</p>
      <ScoreSuspenseDialog token={token} open={open} onClose={() => setOpen(false)} current={settings?.scoreHideWindow} />
    </section>
  );
}
