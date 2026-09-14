import type { Camper } from "../api/campers";
import { loadAuth } from "../auth/store";
import { staffGreeting, whatsappLink } from "../whatsapp";
import WhatsAppButton from "./WhatsAppButton";

interface GuardianWhatsAppProps {
  camper: Pick<Camper, "name" | "guardianName" | "guardianPhone">;
  className?: string;
}

/** WhatsApp link to a kid's guardian (null when the phone isn't in the record the viewer received). */
export default function GuardianWhatsApp({ camper: k, className = "wa-btn--sm" }: GuardianWhatsAppProps) {
  if (!k.guardianPhone) return null;
  const myName = loadAuth()?.user.name ?? "";
  return (
    <WhatsAppButton
      className={className}
      href={whatsappLink(k.guardianPhone, staffGreeting({ toName: k.guardianName, fromName: myName, about: k.name }))}
      label={`Falar com ${k.guardianName.split(" ")[0] || "o responsável"} no WhatsApp`}
    />
  );
}
