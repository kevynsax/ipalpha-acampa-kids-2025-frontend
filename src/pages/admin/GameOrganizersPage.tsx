import { useEffect, useState } from "react";
import { updateSettings } from "../../api/settings";
import { useCollection } from "../../store";
import StaffListEditor from "./StaffListEditor";
import { QrGlyph } from "../../components/Glyph";

interface GameOrganizersPageProps {
  token: string;
}

/**
 * Settings → Jogos (admin or organizer): the GAME organizers — team members
 * who run the games and keep the scoreboard (Placar): give / take points from
 * any team, zero a team. They also edit the programme (events, roles, the
 * roster) and see the whole team for that, but have none of the other
 * organizer (admin-like) rights. No time window.
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
        <h1 className="admin-title">🏆 Jogos</h1>
      </header>
      <p className="admin-intro">
        Pessoas da equipe que <strong>organizam as gincanas</strong>: editam a <strong>programação</strong> e mantêm o <strong>Placar</strong> (dão, tiram e
        zeram pontos de qualquer time).
      </p>

      {error && <p className="message message--error">{error}</p>}

      <section className="cat-form">
        <StaffListEditor
          title="Organizadores dos jogos"
          value={ids}
          onChange={(nextIds) => void saveList("gameOrganizers", nextIds)}
          disabled={busy}
          pickerTitle="Adicionar organizador dos jogos"
          empty="Ninguém escolhido ainda. Só o admin lança pontos."
        />
      </section>

      <p className="admin-intro">
        <strong>Ajudantes do placar</strong>: só <strong>leem crachás</strong> — dão pontos em massa às crianças de um evento (ex.: quem veio fantasiado).
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
        <QrGlyph /> O ajudante ganha a aba <strong>Placar</strong> só com o botão de leitura em massa e vê das crianças apenas <strong>nome e time</strong>. Apaga só as
        próprias leituras. Ao entrar na lista a pessoa recebe um SMS avisando.
      </p>
    </div>
  );
}
