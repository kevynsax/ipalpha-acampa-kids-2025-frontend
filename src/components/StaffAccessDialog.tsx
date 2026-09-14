import { ApiError } from "../api/client";
import Dialog from "./Dialog";
import { speakWhen } from "../dates";

export const STAFF_ACCESS_CODES = ["STAFF_ACCESS_NOT_YET", "STAFF_ACCESS_ENDED"] as const;

export function isStaffAccessError(err: unknown): err is ApiError {
  return err instanceof ApiError && (STAFF_ACCESS_CODES as readonly string[]).includes(err.code);
}

interface StaffAccessDialogProps {
  error: ApiError | null;
  onClose: () => void;
}


/** Full-screen colourful popup shown when a team member tries to log in outside the access window. */
export default function StaffAccessDialog({ error, onClose }: StaffAccessDialogProps) {
  const ended = error?.code === "STAFF_ACCESS_ENDED";
  const parent = error?.audience === "parent";
  const opensAt = error?.opensAt ? speakWhen(error.opensAt, { long: true }) : null;

  return (
    <Dialog open={!!error} onClose={onClose} width={480} title={ended ? "Acampamento encerrado" : "App ainda não liberado"}>
      <div className={`access-pop ${ended ? "access-pop--ended" : "access-pop--soon"}`}>
        <div className="access-pop__sky" aria-hidden="true">
          <span className="access-pop__emoji">{ended ? "👋" : "⏳"}</span>
        </div>
        <div className="access-pop__body">
          <h2 className="access-pop__title">
            {ended ? "O acampamento acabou! 😢" : "Calma, ainda não chegou a hora!"}
          </h2>
          {ended ? (
            <p className="access-pop__text">
              {parent ? "Obrigado por confiar em nós. Esperamos sua família no " : "Obrigado por fazer parte da equipe. Esperamos você no "}
              <strong>ano que vem</strong>! 🌲
            </p>
          ) : opensAt ? (
            <p className="access-pop__text">
              O app fica disponível para {parent ? "os pais" : "a equipe"} a partir de
              <span className="access-pop__when">{opensAt}</span>
            </p>
          ) : (
            <p className="access-pop__text">O app ainda não está liberado para {parent ? "os pais" : "a equipe"}. Fique de olho!</p>
          )}
          <div className="access-pop__confetti" aria-hidden="true">
            {ended ? "🎉 🏕️ ✨ 🌲 🎈" : "🏕️ 🌲 🔥 🌙 ⭐"}
          </div>
          <button type="button" className="button button--primary access-pop__btn" onClick={onClose}>
            Entendi
          </button>
        </div>
      </div>
    </Dialog>
  );
}
