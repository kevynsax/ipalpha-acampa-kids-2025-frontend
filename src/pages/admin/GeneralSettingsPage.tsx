import { useCollection } from "../../store";
import AccessWindowCard from "./AccessWindowCard";
import CheckinReminderCard from "./CheckinReminderCard";
import CheckinTestTools from "./CheckinTestTools";
import KidsRoomsDraftCard from "./KidsRoomsDraftCard";
import ScoreDraftCard from "./ScoreDraftCard";

interface GeneralSettingsPageProps {
  token: string;
}

/**
 * Admin-only "Geral":
 *   1. the ACCESS window of the ordinary team (people on no list: not
 *      organizers, check-in helpers, medical team or parent contacts) — outside
 *      it the server sends them nothing and the app shows no data;
 *   2. the ACCESS window of the parents (same idea; the welcome SMS goes out when it opens);
 *   3. the check-in reminder date (SMS to the whole team; also on Notificações);
 *   4. the "kids' rooms still a draft" switch (hides kids from caretakers, mutes room SMS);
 *   5. the "scoreboard draft" switch (opens the Placar and accepts points outside the camp days);
 *   6. the check-in rehearsal tools (also on the Check-in settings page).
 */
export default function GeneralSettingsPage({ token }: GeneralSettingsPageProps) {
  const settings = useCollection("settings");

  if (!settings) {
    return (
      <div className="admin-page">
        <p className="opt-empty">Carregando configurações… ⚙️</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-head">
        <h1 className="admin-title">⚙️ Geral</h1>
      </header>

      <AccessWindowCard token={token} which="staffAccessWindow" />
      <AccessWindowCard token={token} which="parentAccessWindow" />

      <CheckinReminderCard token={token} />

      <KidsRoomsDraftCard token={token} />

      <ScoreDraftCard token={token} />

      <CheckinTestTools token={token} />
    </div>
  );
}
