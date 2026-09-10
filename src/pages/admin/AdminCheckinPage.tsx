import { roleMeta } from "../../roles";
import { useRoute } from "../../router";

const OPTIONS = [
  {
    key: "church",
    path: "/checkin/church",
    emoji: "⛪",
    title: "Igreja",
  },
  {
    key: "bus",
    path: "/checkin/bus",
    emoji: "🚌",
    title: "Ônibus",
  },
  {
    key: "staff",
    path: "/checkin/staff",
    icon: roleMeta("staff").icon,
    title: "Equipe",
  },
] as const;

/** Admin landing page for the three check-in workflows. */
export default function AdminCheckinPage() {
  const { navigate } = useRoute();

  return (
    <div className="admin-page">
      <header className="admin-head">
        <h1 className="admin-title">✅ Check-in</h1>
      </header>
      <p className="admin-intro">Qual check-in você quer abrir?</p>

      <ul className="checkin-picker">
        {OPTIONS.map((option) => (
          <li key={option.key}>
            <button type="button" className="checkin-picker__item" onClick={() => navigate(option.path)}>
              {"icon" in option ? (
                <img className="checkin-picker__icon" src={option.icon} alt="" aria-hidden="true" />
              ) : (
                <span className="checkin-picker__emoji" aria-hidden="true">{option.emoji}</span>
              )}
              <span className="checkin-picker__name">Check-in {option.title}</span>
              <span className="checkin-picker__arrow" aria-hidden="true">›</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
