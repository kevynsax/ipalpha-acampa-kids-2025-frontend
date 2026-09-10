import type { ReactNode } from "react";
import Logo from "./Logo";
import titleBadge from "../assets/pieces/title-badge.png";
import sun from "../assets/pieces/sun.png";
import cloud from "../assets/pieces/cloud.png";
import cactus from "../assets/pieces/cactus.png";
import greenPanel from "../assets/generated/green-panel.png";

interface CampingLayoutProps {
  /** Rendered inside the green panel. */
  children: ReactNode;
}

/** Poster-style page shell: logo, Acampa Kids badge, cloud, green panel and sun. */
export default function CampingLayout({ children }: CampingLayoutProps) {
  return (
    <main className="camping-home">
      <header className="camping-nav">
        <Logo size={84} />
      </header>

      <section className="camping-hero">
        <img className="camping-cloud" src={cloud} alt="" aria-hidden="true" width={376} height={288} />
        <img className="camping-badge" src={titleBadge} alt="Acampa Kids 2025" width={434} height={247} />

        <div className="camping-panel">
          <img
            className="camping-panel__bg"
            src={greenPanel}
            alt=""
            aria-hidden="true"
            width={1200}
            height={793}
          />
          <div className="camping-panel__content">{children}</div>
        </div>

        <img className="camping-cactus" src={cactus} alt="" aria-hidden="true" width={454} height={654} />
        <img className="camping-sun" src={sun} alt="" aria-hidden="true" width={246} height={251} />
      </section>
    </main>
  );
}
