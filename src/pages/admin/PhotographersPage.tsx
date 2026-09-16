import { useEffect, useState } from "react";
import { updateSettings } from "../../api/settings";
import { setAlbumPublished } from "../../api/gallery";
import { useCollection, useCollectionOrEmpty } from "../../store";
import { ICONS } from "../../icons";
import Toggle from "../../components/Toggle";
import StaffListEditor from "./StaffListEditor";
import PageFooter from "../../components/PageFooter";

interface PhotographersPageProps {
  token: string;
}

/**
 * Settings → Fotógrafos: team members who upload the camp's photos on the
 * Fotos tab, plus the ALBUM switch that decides whether the camp sees them.
 * No time window (photos go up during and after camp).
 */
export default function PhotographersPage({ token }: PhotographersPageProps) {
  const settings = useCollection("settings");
  const photos = useCollectionOrEmpty("gallery");
  const [ids, setIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [albumBusy, setAlbumBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const published = !!settings?.galleryPublished;

  /** same switch as the one in the Fotos tab header — one flag for the whole album */
  async function toggleAlbum(next: boolean) {
    if (albumBusy) return;
    setAlbumBusy(true);
    setError(null);
    try {
      await setAlbumPublished(token, next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setAlbumBusy(false);
    }
  }

  useEffect(() => {
    if (settings) setIds(settings.photographers?.staffIds ?? []);
  }, [settings]);

  async function saveIds(nextIds: string[]) {
    if (busy) return;
    const previous = ids;
    setIds(nextIds);
    setBusy(true);
    setError(null);
    try {
      await updateSettings(token, { photographers: { staffIds: nextIds } });
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
        <h1 className="admin-title">
          <img className="admin-title__icon" src={ICONS.camera} alt="" aria-hidden="true" />
          Fotógrafos
        </h1>
      </header>
      <p className="admin-intro">
        Pessoas da equipe que <strong>enviam as fotos</strong> do acampamento na aba <strong>Fotos</strong>. As fotos só aparecem para <strong>pais e equipe</strong> quando o álbum é publicado.
      </p>

      {error && <p className="message message--error">{error}</p>}

      <section className="cat-form">
        <div className="cat-form__head">
          <h2 className="cat-form__title"><img className="admin-title__icon" src={ICONS.camera} alt="" aria-hidden="true" /> Álbum publicado</h2>
          <Toggle checked={published} disabled={!settings || albumBusy} label={published ? "Publicado" : "Só os fotógrafos"} onChange={(v) => void toggleAlbum(v)} />
        </div>
        <p className="cat-hint">
          Vale para <strong>todas as fotos de uma vez</strong>: ao ligar, pais e equipe veem o álbum na hora e recebem um aviso. Ao desligar, as fotos voltam a ficar só com os fotógrafos.
        </p>
        {published ? (
          <p className="cat-hint">✅ {photos.length} {photos.length === 1 ? "foto visível" : "fotos visíveis"} para o acampamento.</p>
        ) : (
          <p className="cat-hint">🔒 {photos.length} {photos.length === 1 ? "foto guardada" : "fotos guardadas"} — ninguém fora da lista vê.</p>
        )}
      </section>

      <section className="cat-form">
        <StaffListEditor title="Quem pode enviar fotos" value={ids} onChange={(nextIds) => void saveIds(nextIds)} disabled={busy} pickerTitle="Adicionar fotógrafo" empty="Ninguém escolhido ainda." />
      </section>

      <PageFooter><img className="admin-title__icon" src={ICONS.camera} alt="" aria-hidden="true" /> Ao entrar na lista a pessoa recebe um SMS avisando — e ganha a aba Fotos com o botão de enviar. O mesmo botão de publicar está lá.</PageFooter>
    </div>
  );
}
