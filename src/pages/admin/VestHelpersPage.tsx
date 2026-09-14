import { useEffect, useState } from "react";
import { updateSettings } from "../../api/settings";
import { useCollection } from "../../store";
import StaffListEditor from "./StaffListEditor";
import PageFooter from "../../components/PageFooter";

interface VestHelpersPageProps {
  token: string;
}

/**
 * Admin-only: the VEST (colete) helpers — team members who hand out the team
 * vests at the start of the camp and take them back at the end, the admin
 * does not do it. No time window. They get a "Coletes" tab with every staff
 * member as NAME + PHONE only (never health, room or team) and stamp the
 * delivery / return of each vest.
 */
export default function VestHelpersPage({ token }: VestHelpersPageProps) {
  const settings = useCollection("settings");
  const [ids, setIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) setIds(settings.vestHelpers?.staffIds ?? []);
  }, [settings]);

  async function saveIds(nextIds: string[]) {
    if (busy) return;
    const previous = ids;
    setIds(nextIds);
    setBusy(true);
    setError(null);
    try {
      await updateSettings(token, { vestHelpers: { staffIds: nextIds } });
    } catch (err) {
      setIds(previous);
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  if (!settings && !error) {
    return (
      <div className="admin-page">
        <p className="opt-empty">Carregando configurações… ⚙️</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-head">
        <h1 className="admin-title">🦺 Coletes</h1>
      </header>
      <p className="admin-intro">
        Pessoas da equipe que <strong>entregam e recolhem os coletes</strong> durante o acampamento. Veem só nome e celular da equipe.
      </p>

      {error && <p className="message message--error">{error}</p>}

      <section className="cat-form">
        <StaffListEditor
          title="Quem cuida dos coletes"
          value={ids}
          onChange={(nextIds) => void saveIds(nextIds)}
          disabled={busy}
          pickerTitle="Adicionar responsável pelos coletes"
          empty="Ninguém escolhido ainda."
        />
      </section>

      <PageFooter>
        🔒 Quem cuida dos coletes vê da equipe apenas <strong>nome e celular</strong>: nada de quarto, time, saúde ou check-in. Ao entrar na
        lista a pessoa recebe um SMS avisando (Notificações → Boas-vindas e novas responsabilidades).
      </PageFooter>
    </div>
  );
}
