import { useEffect, useState } from "react";
import { updateSettings } from "../../api/settings";
import { useCollection } from "../../store";
import { roleMeta } from "../../roles";
import StaffListEditor from "./StaffListEditor";
import PageFooter from "../../components/PageFooter";

interface MedicalStaffPageProps {
  token: string;
}

/**
 * Admin-only: the MEDICAL team — team members who see every camper in full
 * (health included), every bedroom and every vehicle, the WHOLE time: no
 * check-in window, before / during / after the camp. Read-only: they never
 * add, edit or check kids in.
 */
export default function MedicalStaffPage({ token }: MedicalStaffPageProps) {
  const settings = useCollection("settings");
  const [ids, setIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** the header's top-right slot — the editor's "add" button is portalled there */

  useEffect(() => {
    if (settings) setIds(settings.medicalStaff.staffIds);
  }, [settings]);

  async function saveIds(nextIds: string[]) {
    if (busy) return;
    const previous = ids;
    setIds(nextIds);
    setBusy(true);
    setError(null);
    try {
      await updateSettings(token, { medicalStaff: { staffIds: nextIds } });
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
          <img className="audience-icon" src={roleMeta("health_staff").icon} alt="" aria-hidden="true" />
          Equipe médica
        </h1>
      </header>
      <p className="admin-intro">
        Pessoas da equipe que cuidam da <strong>saúde das crianças</strong>. Veem a ficha completa de <strong>todos os acampantes</strong> (alergias, remédios, condições, contatos) e baixam a planilha de saúde. Nas ocorrências, só as que a equipe médica registrou.
      </p>

      {error && <p className="message message--error">{error}</p>}

      <section className="cat-form">
        <StaffListEditor title="Quem é da equipe médica" value={ids} onChange={(nextIds) => void saveIds(nextIds)} disabled={busy} pickerTitle="Adicionar à equipe médica" empty="Ninguém escolhido ainda." />
      </section>

      <PageFooter>
        🔒 A equipe médica só consulta: não cadastra, edita nem exclui crianças ou quartos, não faz check-in e não baixa a lista em Excel.
      </PageFooter>
    </div>
  );
}
