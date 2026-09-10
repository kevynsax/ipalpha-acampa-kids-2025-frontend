import KidIcon, { AdultIcon } from "../components/KidIcon";
import PlayScene from "../components/PlayScene";
import type { KidSex } from "../icons";

/**
 * Dev-only preview of the kid icons + play scene without logging in:
 *   http://localhost:5173/?scene=girl   (or boy)
 * Only reachable in `vite` dev (see main.tsx).
 */
export default function ScenePreview({ sex }: { sex: KidSex }) {
  return (
    <div className="dash">
      <div className="dash-body">
        <div className="admin-page">
          <h1 className="admin-title detail-title">
            <KidIcon sex={sex} size={40} /> {sex === "girl" ? "Helena Sparvoli" : "Adam Jala Lucas"} <span className="kid-card__age">9 anos</span>
          </h1>
          <h1 className="admin-title detail-title">
            <AdultIcon sex={sex === "girl" ? "woman" : "man"} size={40} /> Kevyn Klava
          </h1>
          <h2 className="detail-h2">
            <KidIcon sex={sex} group size={26} /> No mesmo quarto <span className="cat-tab__count">3</span>
          </h2>
          <section className="detail-card">Conteúdo da página…</section>
          <section className="detail-card">Conteúdo da página…</section>
          <PlayScene sex={sex} />
        </div>
      </div>
    </div>
  );
}
