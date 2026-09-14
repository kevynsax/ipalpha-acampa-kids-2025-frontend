import { useState } from "react";
import { updateSettings } from "../../api/settings";
import Toggle from "../../components/Toggle";
import { useCollection } from "../../store";

interface KidsRoomsDraftCardProps {
  token: string;
}

/**
 * Settings → Geral and → Testes: "kids' rooms not defined yet". While on, room caretakers
 * don't see the kids of their room and no room-change SMS goes out (kids
 * moving rooms, or the person's own room changing).
 */
export default function KidsRoomsDraftCard({ token }: KidsRoomsDraftCardProps) {
  const settings = useCollection("settings");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const draft = !!settings?.kidsRoomsDraft;

  async function toggle(value: boolean) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await updateSettings(token, { kidsRoomsDraft: value });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="cat-form">
      <div className="cat-form__head">
        <h2 className="cat-form__title">🛏️ Quartos em rascunho</h2>
        <Toggle checked={draft} disabled={!settings || busy} label={draft ? "Ainda não definidos" : "Definidos"} onChange={(v) => void toggle(v)} />
      </div>
      <p className="cat-hint">
        Ligue enquanto a organização ainda está montando os quartos.
        <br />
        Nesse período <strong>ninguém da equipe vê o próprio quarto nem as crianças que estão no seu quarto</strong>.
        <br />
        Desligue quando todos os quartos já tiverem definidos.
      </p>
      {error && <p className="message message--error">{error}</p>}
      {draft && <p className="cat-hint cat-hint--error">⚠️ A equipe não está vendo os quartos. Desligue quando os quartos estiverem definidos.</p>}
    </section>
  );
}
