import { ROOM_ROLE_META, type Staff } from "../api/staff";
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
  return (
    <li className={`staff-card staff-card--compact ${open ? "staff-card--clickable" : ""} ${s.active ? "" : "staff-card--inactive"}`}>
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
        <h3 className="staff-card__name">
          {s.name}
          {!s.active && <span className="staff-card__inactive">inativo</span>}
          {s.bedroom && (
            <span className="staff-tag staff-tag--soft" title={ROOM_ROLE_META[s.roomRole].hint}>
              <RoomRoleIcon role={s.roomRole} /> {ROOM_ROLE_META[s.roomRole].label}
            </span>
          )}
          <TeamTag teamId={s.team} />
          <TransportTag transportId={s.transportation} size={18} short />
        </h3>
      </div>
      {s.phone && (
        <WhatsAppButton
          className="wa-btn--sm"
          href={whatsappLink(s.phone, staffGreeting({ toName: s.name, fromName: myName }))}
          label={`Falar com ${s.name.split(" ")[0]} no WhatsApp`}
        />
      )}
      {open && <span className="kid-card__chevron" aria-hidden="true">›</span>}
    </li>
  );
}
