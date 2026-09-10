import type { Staff } from "../api/staff";
import { formatBrazilPhoneClient } from "../phoneFormat";

interface StaffMiniCardProps {
  staff: Staff;
  labelOf: (id: string | null | undefined) => string | null;
  /** click → open the person */
  onOpen?: (staffId: string) => void;
}

/** Compact staff row (name, phone, team). The whole card is the link. */
export default function StaffMiniCard({ staff: s, labelOf, onOpen }: StaffMiniCardProps) {
  const open = onOpen ? () => onOpen(s.id) : undefined;
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
        </h3>
        {/* a colleague in the same room comes name-only from the server (no phone, no team) */}
        {!s.redacted && (
          <p className="staff-card__meta">
            {s.phone ? formatBrazilPhoneClient(s.phone) : <em className="staff-card__missing">sem celular</em>}
            {labelOf(s.team) && <> · {labelOf(s.team)}</>}
          </p>
        )}
      </div>
      {open && <span className="kid-card__chevron" aria-hidden="true">›</span>}
    </li>
  );
}
