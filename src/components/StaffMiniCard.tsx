import { ROOM_ROLE_META, staffSex, type Staff } from "../api/staff";
import { useCollectionOrEmpty } from "../store";
import { loadAuth } from "../auth/store";
import { staffGreeting, whatsappLink } from "../whatsapp";
import RoomRoleIcon from "./RoomRoleIcon";
import TeamTag from "./TeamTag";
import TransportTag from "./TransportTag";
import WhatsAppButton from "./WhatsAppButton";

interface StaffMiniCardProps {
  staff: Staff;
  /** kept for call-site compatibility; the team is resolved from the store */
  labelOf?: (id: string | null | undefined) => string | null;
  /** click → open the person */
  onOpen?: (staffId: string) => void;
}

/** Compact staff row (name, room role, team, WhatsApp). The body is the link. */
export default function StaffMiniCard({ staff: s, onOpen }: StaffMiniCardProps) {
  const open = onOpen ? () => onOpen(s.id) : undefined;
  const myName = loadAuth()?.user.name ?? "";
  const bedrooms = useCollectionOrEmpty("bedrooms");
  return (
    <li className={`staff-card staff-card--compact staff-card--cover ${open ? "staff-card--clickable" : ""} ${s.active ? "" : "staff-card--inactive"} ${s.aiReviewStatus === "pending" || s.aiReviewStatus === "processing" || s.aiReviewStatus === "structured" ? "camper-ai-review" : ""}`} title={s.aiReviewStatus === "pending" || s.aiReviewStatus === "processing" || s.aiReviewStatus === "structured" ? "Cadastro em revisão pela IA" : undefined}>
      <div
        className="staff-card__body"
        role={open ? "link" : undefined}
        tabIndex={open ? 0 : undefined}
        title={open ? `Ver ${s.name}` : undefined}
        onClick={open}
        onKeyDown={
          open
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  open();
                }
              }
            : undefined
        }
      >
        <h3 className="staff-card__name staff-card__name--with-tags">
          <span className="staff-card__name-text">
            {s.name}
            {!s.active && <span className="staff-card__inactive">inativo</span>}
          </span>
          {(s.bedroom || s.team || s.transportation) && (
            <span className="staff-card__tags">
              {s.bedroom && (
                <span className="staff-tag staff-tag--soft" title={ROOM_ROLE_META[s.roomRole].hint}>
                  <RoomRoleIcon role={s.roomRole} sex={staffSex(s, bedrooms)} /> {ROOM_ROLE_META[s.roomRole].label}
                </span>
              )}
              <TeamTag teamId={s.team} />
              <TransportTag transportId={s.transportation} size={18} short className="staff-tag--pill" />
            </span>
          )}
        </h3>
      </div>
      {s.phone && (
        <WhatsAppButton
          className="wa-btn--sm staff-card__wa"
          href={whatsappLink(s.phone, staffGreeting({ toName: s.name, fromName: myName }))}
          label={`Falar com ${s.name.split(" ")[0]} no WhatsApp`}
        />
      )}
    </li>
  );
}
