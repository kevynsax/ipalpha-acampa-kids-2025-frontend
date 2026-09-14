import { useState } from "react";
import { resetCheckins, updateSettings } from "../../api/settings";
import { useConfirm } from "../../components/ConfirmDialog";
import Toggle from "../../components/Toggle";
import { useCollection } from "../../store";

interface CheckinTestToolsProps {
  token: string;
}

/**
 * Rehearsal tools for the check-in team, on Configurações → Testes:
 *
 *   - test mode: the KIDS' church + bus roll calls open for the helpers even
 *     outside the check-in window (the team's own self check-in keeps its
 *     departure-day rule);
 *   - reset: clears every check-in (kids church + bus, team) and the log.
 */
export default function CheckinTestTools({ token }: CheckinTestToolsProps) {
  const settings = useCollection("settings");
  const campers = useCollection("campers");
  const staff = useCollection("staff");
  const confirm = useConfirm();
  const [busy, setBusy] = useState<"test" | "reset" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const testMode = !!settings?.checkinTestMode;
  const kidsChecked = campers?.filter((k) => k.checkin || k.busCheckin).length ?? 0;
  const staffChecked = staff?.filter((s) => s.checkin).length ?? 0;
  const vestsOut = staff?.filter((s) => s.vest?.delivered).length ?? 0;

  async function toggleTest(value: boolean) {
    if (busy) return;
    setBusy("test");
    setError(null);
    setDone(null);
    try {
      await updateSettings(token, { checkinTestMode: value });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(null);
    }
  }

  async function reset() {
    if (busy) return;
    const ok = await confirm({
      emoji: "🧹",
      title: "Zerar todos os check-ins?",
      message: `Isso apaga o check-in de ${kidsChecked} criança(s), ${staffChecked} pessoa(s) da equipe e ${vestsOut} colete(s), além do histórico. Não pode ser desfeito.`,
      confirmLabel: "Zerar check-ins",
      danger: true,
    });
    if (!ok) return;
    setBusy("reset");
    setError(null);
    setDone(null);
    try {
      const r = await resetCheckins(token);
      setDone(`Check-ins zerados: ${r.campers} criança(s), ${r.staff} pessoa(s) da equipe e ${r.vests} colete(s).`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="cat-form">
      <div className="cat-form__head">
        <h2 className="cat-form__title">🧪 Teste do check-in</h2>
        <Toggle checked={testMode} disabled={!settings || busy !== null} label={testMode ? "Modo de teste ligado" : "Modo de teste desligado"} onChange={(v) => void toggleTest(v)} />
      </div>
      <p className="cat-hint">
        Para a equipe do check-in ensaiar antes do dia da saída: libera <strong>igreja</strong>, <strong>ônibus</strong> e <strong>coletes</strong> fora da
        janela.
      </p>
      {error && <p className="message message--error">{error}</p>}
      {done && <p className="message message--ok">✅ {done}</p>}
      {testMode && <p className="cat-hint cat-hint--error">⚠️ Igreja e ônibus liberados agora. Desligue antes do dia da saída!</p>}
      <div className="settings-tools">
        <button type="button" className="button button--danger" disabled={busy !== null} onClick={() => void reset()}>
          {busy === "reset" ? "Zerando…" : `🧹 Zerar check-ins (${kidsChecked} crianças · ${staffChecked} equipe · ${vestsOut} coletes)`}
        </button>
      </div>
    </section>
  );
}
