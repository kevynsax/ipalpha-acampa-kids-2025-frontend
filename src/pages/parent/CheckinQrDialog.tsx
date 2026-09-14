import { useEffect, useState } from "react";
import type { Camper } from "../../api/campers";
import CamperQr from "../../components/CamperQr";
import Dialog from "../../components/Dialog";

interface CheckinQrDialogProps {
  kids: Camper[];
  /** the kids' check-in window is open right now */
  active: boolean;
}

/**
 * While the check-in window is open the parent's phone shows the kids' QR
 * codes in a popup the moment the app opens — so the team scans them and the
 * check-in goes fast. It can be dismissed, but it is STICKY on purpose: it
 * pops again whenever the browser is reopened AND whenever the tab comes
 * back to the foreground (dismissal is kept in memory only). Kids already
 * checked in are left out; once everyone is in it stops showing.
 */
export default function CheckinQrDialog({ kids, active }: CheckinQrDialogProps) {
  const pending = kids.filter((k) => !k.checkin);
  const [dismissed, setDismissed] = useState(false);

  // tab back to the foreground → show again
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") setDismissed(false);
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("pageshow", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
  }, []);

  const open = active && pending.length > 0 && !dismissed;
  return (
    <Dialog open={open} onClose={() => setDismissed(true)} title="Check-in: mostre o QR code" width={480}>
      <div className="cat-form qr-dialog">
        <h2 className="cat-form__title">✅ Hora do check-in!</h2>
        <p className="cat-hint">Mostre {pending.length === 1 ? "este QR code" : "estes QR codes"} para a equipe na entrada. 🏕️</p>
        <div className="qr-dialog__codes">
          {pending.map((k) => (
            <CamperQr key={k.id} camperId={k.id} name={k.name} size={pending.length > 1 ? 180 : 240} />
          ))}
        </div>
        <div className="cat-form__actions">
          <button type="button" className="button button--secondary" onClick={() => setDismissed(true)}>
            Fechar
          </button>
        </div>
      </div>
    </Dialog>
  );
}
