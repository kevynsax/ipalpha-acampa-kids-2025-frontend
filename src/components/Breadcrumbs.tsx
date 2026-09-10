import type { ReactNode } from "react";

export interface Crumb {
  label: ReactNode;
  /** absent on the last crumb (current page) */
  onClick?: () => void;
}

/** "Acampantes › Adam › Ana" — every crumb but the last is a link. */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="crumbs" aria-label="Você está em">
      <ol className="crumbs__list">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="crumbs__item">
              {i > 0 && <span className="crumbs__sep" aria-hidden="true">›</span>}
              {!last && c.onClick ? (
                <button type="button" className="crumbs__link" onClick={c.onClick}>
                  {c.label}
                </button>
              ) : (
                <span className="crumbs__current" aria-current={last ? "page" : undefined}>
                  {c.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
