import { ApiError } from "../api/client";
import Dialog from "./Dialog";
import { speakWhen } from "../dates";
import { useI18n } from "../i18n";

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
  const { tx } = useI18n();
  const ended = error?.code === "STAFF_ACCESS_ENDED";
  const parent = error?.audience === "parent";
  const opensAt = error?.opensAt ? speakWhen(error.opensAt, { long: true }) : null;
  const who = parent ? tx("os pais") : tx("a equipe");
  const nextYear = tx("ano que vem");

  return (
    <Dialog open={!!error} onClose={onClose} width={480} title={ended ? tx("Acampamento encerrado") : tx("App ainda não liberado")}>
      <div className={`access-pop ${ended ? "access-pop--ended" : "access-pop--soon"}`}>
        <div className="access-pop__sky" aria-hidden="true">
          <span className="access-pop__emoji">{ended ? "👋" : "⏳"}</span>
        </div>
        <div className="access-pop__body">
          <h2 className="access-pop__title">
            {ended ? tx("O acampamento acabou! 😢") : tx("Calma, ainda não chegou a hora!")}
          </h2>
          {ended ? (
            <p className="access-pop__text">
              {parent
                ? tx("Obrigado por confiar em nós. Esperamos sua família no {when}! 🌲", { when: nextYear })
                : tx("Obrigado por fazer parte da equipe. Esperamos você no {when}! 🌲", { when: nextYear })}
            </p>
          ) : opensAt ? (
            <p className="access-pop__text">
              {tx("O app fica disponível para {who} a partir de", { who })}
              <span className="access-pop__when">{opensAt}</span>
            </p>
          ) : (
            <p className="access-pop__text">{tx("O app ainda não está liberado para {who}. Fique de olho!", { who })}</p>
          )}
          <div className="access-pop__confetti" aria-hidden="true">
            {ended ? "🎉 🏕️ ✨ 🌲 🎈" : "🏕️ 🌲 🔥 🌙 ⭐"}
          </div>
          <button type="button" className="button button--primary access-pop__btn" onClick={onClose}>
            {tx("Entendi")}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
