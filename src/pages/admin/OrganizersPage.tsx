import { useEffect, useState } from "react";
import { getSettings, updateSettings, type Settings } from "../../api/settings";
import { ICONS } from "../../icons";
import StaffListEditor from "./StaffListEditor";

interface OrganizersPageProps {
  token: string;
}

/**
 * Admin-only: team members who ORGANIZE the programme, like the admin — they
 * create / edit / delete events and roles and assign anyone; for that they
 * see the whole team (health included) and the full schedule. They cannot
 * add / edit / remove staff nor export the list. No time window.
 */
export default function OrganizersPage({ token }: OrganizersPageProps) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [ids, setIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getSettings(token)
      .then((s) => {
        if (!alive) return;
        setSettings(s);
        setIds(s.organizers.staffIds);
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Algo deu errado."));
    return () => {
      alive = false;
    };
  }, [token]);

  async function saveIds(nextIds: string[]) {
    if (busy) return;
    const previous = ids;
    setIds(nextIds);
    setBusy(true);
    setError(null);
    try {
      const s = await updateSettings(token, { organizers: { staffIds: nextIds } });
      setSettings(s);
      setIds(s.organizers.staffIds);
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
        <h1 className="admin-title detail-title">
          <img className="audience-icon" src={ICONS.organizer} alt="" aria-hidden="true" />
          Organizadores
        </h1>
      </header>
      <p className="admin-intro">
        Pessoas da equipe que ajudam a <strong>organizar a programação</strong>, como o admin: criam e alteram eventos e funções e escalam
        qualquer pessoa. Para isso, elas veem <strong>toda a equipe</strong> (incluindo dados de saúde) e a programação completa.
      </p>

      {error && <p className="message message--error">{error}</p>}

      <section className="cat-form">
        <StaffListEditor title="Quem organiza" value={ids} onChange={(nextIds) => void saveIds(nextIds)} disabled={busy} pickerTitle="Adicionar organizador" empty="Ninguém escolhido ainda. Só o admin altera a programação." />
      </section>

      <p className="footer-note">
        🔒 Organizadores não cadastram, editam nem excluem pessoas da equipe, e não baixam a lista em Excel — só consultam, filtram e escalam.
      </p>
    </div>
  );
}
