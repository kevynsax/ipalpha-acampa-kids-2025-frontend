import type { KidSex } from "./icons";

const INTRO = {
  son: "O acampamento está rolando! Aqui estão os contatos e as informações do seu filho.",
  princess: "O acampamento está rolando! Aqui estão os contatos e as informações da sua princesa.",
  dolls: "O acampamento está rolando! Aqui estão os contatos e as informações das suas bonecas.",
  brood: "O acampamento está rolando! Aqui estão os contatos e as informações das suas crias.",
  children: "O acampamento está rolando! Aqui estão os contatos e as informações das suas crianças.",
} as const;

/** Parent-home intro: playful, gendered by the guardian's kids. */
export function parentHomeIntroLiteral(sexes: Array<KidSex | null>): string {
  if (sexes.length <= 1) {
    if (sexes[0] === "girl") return INTRO.princess;
    if (sexes[0] === "boy") return INTRO.son;
    return INTRO.children;
  }
  if (sexes.every((s) => s === "girl")) return INTRO.dolls;
  if (sexes.every((s) => s === "boy")) return INTRO.brood;
  return INTRO.children;
}

/** "Equipe que cuida da Liz" / "do Pedro" — article follows the kid. */
export function teamLookingAfterLiteral(sex: KidSex | null): string {
  if (sex === "girl") return "Equipe que cuida da {name}";
  if (sex === "boy") return "Equipe que cuida do {name}";
  return "Equipe que cuida de {name}";
}
