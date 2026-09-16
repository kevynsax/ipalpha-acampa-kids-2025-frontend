import type { Seeds } from "../api/seeds";
import { KNOWN_PLACES } from "./places";
import { TEMPLATE_EVENTS, TEMPLATE_ROLES } from "./scheduleTemplate";

/**
 * The seeds' built-in defaults — what the wizard uses when the super admin
 * never saved anything in ⚙️ → Sementes. Same shapes the saved seeds have, so
 * "Restaurar padrão" is just re-copying these values.
 */

/** The fleet a clean camp starts with: 4 named-colour buses. */
export const DEFAULT_FLEET = [
  { number: "1", color: "#0f9a8a", capacity: null },
  { number: "2", color: "#f2843b", capacity: null },
  { number: "3", color: "#e8503a", capacity: null },
  { number: "4", color: "#3b6ff2", capacity: null },
] as const;

/** "O que levar na mala" — the first Preparação the wizard writes. */
export const WHAT_TO_PACK = `<ul>
<li>Roupa de cama para dormir e travesseiro</li>
<li>Roupas para todos os dias + meias e roupas íntimas extras</li>
<li>Calçado confortável, chinelo e um tênis que pode molhar</li>
<li>Toalha de banho, capa de chuva e agasalho</li>
<li>Escova de dente, sabonete e necessaire</li>
<li>Garrafinha de água identificada</li>
<li>Bíblia e caneta</li>
<li>Protetor solar e repelente</li>
</ul>
<p><strong>Não levar:</strong> celular, dinheiro ou objetos de valor.</p>
<p><strong>Medicação de uso contínuo:</strong> entregar na entrada, identificada, com a orientação de uso.</p>`;

export function defaultSeeds(): Seeds {
  return {
    places: KNOWN_PLACES.map((p) => ({ ...p, rooms: p.rooms.map((r) => ({ ...r })) })),
    roles: TEMPLATE_ROLES.map((r) => ({ ...r })),
    events: TEMPLATE_EVENTS.map((e) => ({ ...e })),
    fleet: DEFAULT_FLEET.map((b) => ({ ...b })),
    docs: { prepTitle: "O que levar na mala", prepEmoji: "🎒", prepContent: WHAT_TO_PACK, addressTitle: "Endereço do acampamento", addressEmoji: "📍" },
    updatedAt: null,
  };
}
