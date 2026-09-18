import type { Locale } from "../locales";

export const LITERALS: Record<string, Partial<Record<Exclude<Locale, "pt">, string>>> = {
  " · devolvido {when}": {
    en: " · returned {when}",
    es: " · devuelto {when}",
    fr: " · rendu {when}",
  },
  " · entregue {when}": {
    en: " · handed out {when}",
    es: " · entregado {when}",
    fr: " · remis {when}",
  },
  "{name} devolveu o colete": {
    en: "{name} returned the vest",
    es: "{name} devolvió el chaleco",
    fr: "{name} a rendu le gilet",
  },
  "{name} recebeu o colete": {
    en: "{name} received the vest",
    es: "{name} recibió el chaleco",
    fr: "{name} a reçu le gilet",
  },
  "🦺 Coletes da equipe": {
    en: "🦺 Staff vests",
    es: "🦺 Chalecos del equipo",
    fr: "🦺 Gilets de l'équipe",
  },
  "Buscar pelo nome": {
    en: "Search by name",
    es: "Buscar por nombre",
    fr: "Rechercher par nom",
  },
  "Coletes devolvidos": {
    en: "Vests returned",
    es: "Chalecos devueltos",
    fr: "Gilets rendus",
  },
  "Coletes já devolvidos": {
    en: "Vests already returned",
    es: "Chalecos ya devueltos",
    fr: "Gilets déjà rendus",
  },
  "Com a pessoa": {
    en: "With the person",
    es: "Con la persona",
    fr: "Avec la personne",
  },
  "Com o tio": {
    en: "With staff",
    es: "Con el tío",
    fr: "Avec l'équipe",
  },
  "Desfazer devolução": {
    en: "Undo return",
    es: "Deshacer devolución",
    fr: "Annuler le retour",
  },
  "Desfazer devolução de {name}": {
    en: "Undo return for {name}",
    es: "Deshacer devolución de {name}",
    fr: "Annuler le retour de {name}",
  },
  "Desfazer entrega": {
    en: "Undo hand-out",
    es: "Deshacer entrega",
    fr: "Annuler la remise",
  },
  "Desfazer entrega de {name}": {
    en: "Undo hand-out for {name}",
    es: "Deshacer entrega de {name}",
    fr: "Annuler la remise de {name}",
  },
  "Desfazer: {name}": {
    en: "Undo: {name}",
    es: "Deshacer: {name}",
    fr: "Annuler : {name}",
  },
  "Entregar": {
    en: "Hand out",
    es: "Entregar",
    fr: "Remettre",
  },
  "Entregue o colete no início e recolha no fim.": {
    en: "Hand out the vest at the start and collect it at the end.",
    es: "Entrega el chaleco al inicio y recógelo al final.",
    fr: "Remettez le gilet au début et récupérez-le à la fin.",
  },
  "Entreguei": {
    en: "Handed out",
    es: "Entregué",
    fr: "Remis",
  },
  "Filtrar por situação": {
    en: "Filter by status",
    es: "Filtrar por situación",
    fr: "Filtrer par situation",
  },
  "Já me devolveu": {
    en: "Returned to me",
    es: "Ya me lo devolvió",
    fr: "Me l'a rendu",
  },
  "Nenhum colete com a equipe. ✅": {
    en: "No vests out with staff. ✅",
    es: "Ningún chaleco con el equipo. ✅",
    fr: "Aucun gilet avec l'équipe. ✅",
  },
  "Sem colete": {
    en: "No vest",
    es: "Sin chaleco",
    fr: "Sans gilet",
  },
  "Todo mundo já está de colete. 🦺": {
    en: "Everyone already has a vest. 🦺",
    es: "Todo el mundo ya tiene chaleco. 🦺",
    fr: "Tout le monde a déjà un gilet. 🦺",
  },
};
