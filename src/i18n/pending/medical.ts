import type { Locale } from "../locales";

export const LITERALS: Record<string, Partial<Record<Exclude<Locale, "pt">, string>>> = {
  "Pessoas da equipe que cuidam da": {
    en: "Staff who care for the",
    es: "Personas del equipo que cuidan de la",
    fr: "Personnes de l'équipe qui s'occupent de la",
  },
  "saúde das crianças": {
    en: "children's health",
    es: "salud de los niños",
    fr: "santé des enfants",
  },
  ". Veem a ficha completa de": {
    en: ". They see the full record of",
    es: ". Ven la ficha completa de",
    fr: ". Ils voient la fiche complète de",
  },
  "todos os acampantes": {
    en: "every camper",
    es: "todos los campistas",
    fr: "tous les campeurs",
  },
  "(alergias, remédios, condições, contatos) e baixam a planilha de saúde. Nas ocorrências, só as que a equipe médica registrou.": {
    en: "(allergies, medicines, conditions, contacts) and download the health spreadsheet. In incidents, only those the medical team recorded.",
    es: "(alergias, medicinas, condiciones, contactos) y descargan la planilla de salud. En las ocurrencias, solo las que registró el equipo médico.",
    fr: "(allergies, médicaments, conditions, contacts) et téléchargent la feuille de santé. Dans les incidents, seulement ceux enregistrés par l'équipe médicale.",
  },
  "Quem é da equipe médica": {
    en: "Who is on the medical team",
    es: "Quién forma el equipo médico",
    fr: "Qui fait partie de l'équipe médicale",
  },
  "Adicionar à equipe médica": {
    en: "Add to the medical team",
    es: "Añadir al equipo médico",
    fr: "Ajouter à l'équipe médicale",
  },
  "Ninguém escolhido ainda.": {
    en: "Nobody chosen yet.",
    es: "Nadie elegido todavía.",
    fr: "Personne choisie pour l'instant.",
  },
  "🔒 A equipe médica só consulta: não cadastra, edita nem exclui crianças ou quartos, não faz check-in e não baixa a lista em Excel.": {
    en: "🔒 The medical team is read-only: they don't register, edit or delete children or rooms, don't check people in, and don't download the Excel list.",
    es: "🔒 El equipo médico solo consulta: no registra, edita ni elimina niños o habitaciones, no hace check-in y no descarga la lista en Excel.",
    fr: "🔒 L'équipe médicale consulte seulement : elle n'enregistre, ne modifie ni ne supprime d'enfants ou de chambres, ne fait pas de check-in et ne télécharge pas la liste Excel.",
  },
};
