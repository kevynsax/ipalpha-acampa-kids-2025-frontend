import { useEffect, useMemo, useState } from "react";
import { updateSettings } from "../../api/settings";
import { useRoute } from "../../router";
import { useCollection, useCollectionOrEmpty } from "../../store";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { ICONS } from "../../icons";
import { useI18n } from "../../i18n";
import StaffListEditor from "./StaffListEditor";
import PageFooter from "../../components/PageFooter";

interface OrganizersPageProps {
  token: string;
}

/**
 * Admin-only: team members who are ORGANIZERS — the admin's tabs and
 * settings (campers, staff, rooms, programme, check-ins, their own group's
 * occurrences, documents…), except this page, Categorias, Notificações and Sobre. No time
 * window. The GAME organizers (Settings → Jogos) are listed here read-only:
 * they only edit the programme and the scoreboard.
 */
export default function OrganizersPage({ token }: OrganizersPageProps) {
  const { tx } = useI18n();
  const settings = useCollection("settings");
  const staff = useCollectionOrEmpty("staff");
  const { navigate } = useRoute();
  /** phones: this card's "Editar em Jogos" button shrinks to a bare ✏️ on the title line */
  const phone = useMediaQuery("(max-width: 760px)");
  const [ids, setIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** the game organizers (Settings → Jogos) organize the programme too — shown here read-only so the admin sees the whole picture */
  const gameOrganizers = useMemo(() => {
    const byId = new Map(staff.map((s) => [s.id, s]));
    return (settings?.gameOrganizers?.staffIds ?? []).map((id) => byId.get(id)).filter((s): s is NonNullable<typeof s> => !!s);
  }, [settings, staff]);

  useEffect(() => {
    if (settings) setIds(settings.organizers.staffIds);
  }, [settings]);

  async function saveIds(nextIds: string[]) {
    if (busy) return;
    const previous = ids;
    setIds(nextIds);
    setBusy(true);
    setError(null);
    try {
      await updateSettings(token, { organizers: { staffIds: nextIds } });
    } catch (err) {
      setIds(previous);
      setError(err instanceof Error ? err.message : tx("Algo deu errado."));
    } finally {
      setBusy(false);
    }
  }

  if (!settings && !error) {
    return (
      <div className="admin-page">
        <p className="opt-empty">{tx("Carregando configurações… ⚙️")}</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-head">
        <h1 className="admin-title detail-title">
          <img className="audience-icon" src={ICONS.organizer} alt="" aria-hidden="true" />
          {tx("Organizadores")}
        </h1>
      </header>
      <p className="admin-intro">
        {tx("Pessoas da equipe com")} <strong>{tx("acesso de administração")}</strong>
        {tx(": acampantes, equipe, quartos, programação, check-ins, ocorrências e configurações. Veem dados de saúde. Nas ocorrências, só as que os organizadores registraram.")}
      </p>

      {error && <p className="message message--error">{error}</p>}

      <section className="cat-form">
        <StaffListEditor
          title={tx("Quem organiza")}
          value={ids}
          onChange={(nextIds) => void saveIds(nextIds)}
          disabled={busy}
          pickerTitle={tx("Adicionar organizador")}
          empty={tx("Ninguém escolhido ainda. Só o admin administra o app.")}
        />
      </section>

      <section className="cat-form">
        <div className="list-head">
          <h2 className="cat-form__title">
            🏆 {tx("Organizadores dos jogos")} {!phone && <span className="cat-tab__count">{gameOrganizers.length}</span>}
          </h2>
          {phone ? (
            <button type="button" className="icon-btn" title={tx("Editar em Jogos")} aria-label={tx("Editar em Jogos")} onClick={() => navigate("/game-organizers")}>
              <span className="pencil" aria-hidden="true">✏️</span>
            </button>
          ) : (
            <button type="button" className="button button--secondary list-head__add" onClick={() => navigate("/game-organizers")}>
              {tx("Editar em Jogos ›")}
            </button>
          )}
        </div>
        <p className="cat-hint">{tx("Editam a programação e lançam pontos no Placar — sem as outras permissões de organizador.")}</p>
        {gameOrganizers.length === 0 ? (
          <p className="opt-empty">{tx("Ninguém ainda.")}</p>
        ) : (
          <ul className="staff-card__tags helpers-list" aria-label={tx("Organizadores dos jogos")}>
            {gameOrganizers.map((s) => (
              <li key={s.id} className={`staff-tag helpers-tag ${s.aiReviewStatus === "pending" || s.aiReviewStatus === "processing" ? "camper-ai-review" : ""}`} title={s.aiReviewStatus === "pending" || s.aiReviewStatus === "processing" ? tx("Cadastro em revisão pela IA") : undefined}>
                <span className="helpers-tag__name">{s.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PageFooter>
        {tx("🔒 Organizadores não mexem nesta lista nem em Categorias, Notificações e Sobre — só o admin.")}
      </PageFooter>
    </div>
  );
}
