import { useEffect, useState } from "react";
import { updateSettings } from "../../api/settings";
import { useCollection } from "../../store";
import StaffListEditor from "./StaffListEditor";

interface GameOrganizersPageProps {
  token: string;
}

/**
 * Admin-only: the GAME organizers — team members who run the games and keep
 * the scoreboard (Placar): give / take points from any team, zero a team.
 * They get everything a programme organizer has too (schedule, roles, the
 * whole team), so they can help there as well. No time window.
 */
export default function GameOrganizersPage({ token }: GameOrganizersPageProps) {
  const settings = useCollection("settings");
  const [ids, setIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) setIds(settings.gameOrganizers?.staffIds ?? []);
  }, [settings]);

  async function saveIds(nextIds: string[]) {
    if (busy) return;
    const previous = ids;
    setIds(nextIds);
    setBusy(true);
    setError(null);
    try {
      await updateSettings(token, { gameOrganizers: { staffIds: nextIds } });
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
        <h1 className="admin-title">🏆 Placar</h1>
      </header>
      <p className="admin-intro">
        Pessoas da equipe que <strong>organizam as gincanas</strong> e mantêm o <strong>Placar</strong>: dão e tiram pontos de qualquer time
        (com uma observação opcional do motivo) e podem zerar um time. Não há período: valem o tempo todo.
      </p>

      {error && <p className="message message--error">{error}</p>}

      <section className="cat-form">
        <StaffListEditor
          title="Quem cuida do placar"
          value={ids}
          onChange={(nextIds) => void saveIds(nextIds)}
          disabled={busy}
          pickerTitle="Adicionar organizador dos jogos"
          empty="Ninguém escolhido ainda. Só o admin lança pontos."
        />
      </section>

      <p className="footer-note">
        🎯 Quem está nesta lista também é <strong>organizador da programação</strong> (Configurações → Organizadores): edita eventos, funções e a escala,
        e vê toda a equipe. Ao entrar na lista a pessoa recebe um SMS avisando (Notificações → Boas-vindas e novas responsabilidades).
      </p>
    </div>
  );
}
