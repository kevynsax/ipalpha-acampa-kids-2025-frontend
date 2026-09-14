import { useState } from "react";
import { updateSettings } from "../../api/settings";
import { useCampTiming } from "../../campPhase";
import Toggle from "../../components/Toggle";
import { useCollection } from "../../store";

interface ScoreDraftCardProps {
  token: string;
}

/**
 * Settings → Testes: "scoreboard rehearsal". The Placar tab normally only
 * exists on the camp days (first → last programme day) and the server refuses
 * points outside them. With this on, the tab opens for everyone and points
 * may be launched any day — so the organizers and score helpers can test the
 * flow (QR scan included) before the camp.
 */
export default function ScoreDraftCard({ token }: ScoreDraftCardProps) {
  const settings = useCollection("settings");
  const { during } = useCampTiming();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const draft = !!settings?.scoreDraft;

  async function toggle(value: boolean) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await updateSettings(token, { scoreDraft: value });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="cat-form">
      <div className="cat-form__head">
        <h2 className="cat-form__title">🏆 Placar em teste</h2>
        <Toggle checked={draft} disabled={!settings || busy} label={draft ? "Teste ligado" : "Teste desligado"} onChange={(v) => void toggle(v)} />
      </div>
      <p className="cat-hint">
        O <strong>Placar</strong> só aparece e recebe pontos <strong>nos dias do acampamento</strong>. Ligue o teste para a organização dos jogos e os ajudantes do placar{" "}
        <strong>ensaiarem antes</strong> — só eles (e o admin / organizadores) veem a aba.
      </p>
      {error && <p className="message message--error">{error}</p>}
      {draft && !during && <p className="cat-hint cat-hint--error">⚠️ Placar liberado fora do acampamento. Zere os times e desligue antes do primeiro dia!</p>}
      {draft && during && <p className="cat-hint">ℹ️ O acampamento está acontecendo: o placar já estaria aberto de qualquer forma. Pode desligar.</p>}
    </section>
  );
}
