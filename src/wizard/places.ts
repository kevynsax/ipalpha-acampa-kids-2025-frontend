import type { BedroomGroup } from "../api/bedrooms";

/**
 * Locais que a igreja já usa para acampar — o assistente de configuração
 * conhece os quartos (e suas camas), o endereço e as coordenadas de cada um.
 *
 * ➜ Ajuste aqui quando um local mudar (reforma, nova ala…) ou para acrescentar
 *   um sítio novo: o assistente passa a oferecer a versão atualizada.
 */

export interface KnownPlaceRoom {
  /** room name as the team calls it ("104", "Chalé 2"…) */
  name: string;
  group: BedroomGroup;
  /** null while the field is cleared in the editor */
  bunkBeds: number | null;
  /** null while the field is cleared in the editor */
  singleBeds: number | null;
}

export interface KnownPlace {
  id: string;
  name: string;
  address: string;
  /** null = the wizard asks for it before applying */
  lat: number | null;
  lng: number | null;
  notes?: string;
  rooms: KnownPlaceRoom[];
}

const numbered = (group: BedroomGroup, names: string[], bunkBeds: number, singleBeds = 0): KnownPlaceRoom[] =>
  names.map((name) => ({ name, group, bunkBeds, singleBeds }));

export const KNOWN_PLACES: KnownPlace[] = [
  {
    id: "renascimento",
    name: "Acampamento Renascimento",
    address: "",
    lat: null,
    lng: null,
    notes: "O sítio do Acampa Kids. Confira o endereço e as coordenadas na primeira vez — depois atualize o catálogo (frontend/src/wizard/places.ts) para o próximo ano.",
    // meninas e meninos em alas de quartos numerados; equipe perto das crianças
    rooms: [
      ...numbered("girls", ["101", "102", "103", "104", "105", "106", "107", "108"], 4),
      ...numbered("boys", ["201", "202", "203", "204", "205", "206", "207", "208"], 4),
      ...numbered("staff", ["301", "302", "303", "304"], 3, 1),
    ],
  },
];

/** Radius a team member's self check-in accepts around the camp site. */
export const CAMP_SPOT_RADIUS_M = 300;
