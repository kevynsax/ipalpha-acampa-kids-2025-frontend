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
 *
 * Plus the SCORE helpers: people who ONLY do the bulk QR scan tied to a
 * programme event ("everyone in costume earns a point for their team").
 * They never give / take points by team, never zero, delete only their own
 * scans and have no organizer rights. No time window either.
 */
export default function GameOrganizersPage({ token }: GameOrganizersPageProps) {
  const settings = useCollection("settings");
  const [ids, setIds] = useState<string[]>([]);
  const [helperIds, setHelperIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setIds(settings.gameOrganizers?.staffIds ?? []);
      setHelperIds(settings.scoreHelpers?.staffIds ?? []);
    }
  }, [settings]);

  async function saveList(key: "gameOrganizers" | "scoreHelpers", nextIds: string[]) {
    if (busy) return;
    const [get, set] = key === "gameOrganizers" ? [ids, setIds] : [helperIds, setHelperIds];
    const previous = get;
    set(nextIds);
    setBusy(true);
    setError(null);
    try {
      await updateSettings(token, { [key]: { staffIds: nextIds } });
    } catch (err) {
      set(previous);
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
          onChange={(nextIds) => void saveList("gameOrganizers", nextIds)}
          disabled={busy}
          pickerTitle="Adicionar organizador dos jogos"
          empty="Ninguém escolhido ainda. Só o admin lança pontos."
        />
      </section>

      <p className="footer-note">
        🎯 Quem está nesta lista também é <strong>organizador da programação</strong> (Configurações → Organizadores): edita eventos, funções e a escala,
        e vê toda a equipe. Ao entrar na lista a pessoa recebe um SMS avisando (Notificações → Boas-vindas e novas responsabilidades).
      </p>

      <p className="admin-intro">
        <strong>Ajudantes do placar</strong>: pessoas que só <strong>leem crachás</strong> — dão pontos em massa lendo o QR code das crianças na porta,
        sempre ligados a um evento da programação (ex.: quem veio fantasiado ganha ponto para o time). Não lançam pontos por time, não zeram times nem
        mexem na programação. Sem período: valem o tempo todo.
      </p>

      <section className="cat-form">
        <StaffListEditor
          title="Quem ajuda a lançar pontos"
          value={helperIds}
          onChange={(nextIds) => void saveList("scoreHelpers", nextIds)}
          disabled={busy}
          pickerTitle="Adicionar ajudante do placar"
          empty="Ninguém escolhido ainda."
        />
      </section>

      <p className="footer-note">
        📷 O ajudante ganha a aba <strong>Placar</strong> só com o botão de leitura em massa e vê das crianças apenas <strong>nome e time</strong>. Apaga só as
        próprias leituras. Ao entrar na lista a pessoa recebe um SMS avisando.
      </p>
    </div>
  );
}
