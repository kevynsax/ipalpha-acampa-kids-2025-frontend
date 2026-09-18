import type { Locale } from "../locales";

export const LITERALS: Record<string, Partial<Record<Exclude<Locale, "pt">, string>>> = {
  "Faltam {n} dias": {
    en: "{n} days to go",
    es: "Faltan {n} días",
    fr: "Plus que {n} jours",
  },
  "É amanhã!": {
    en: "It's tomorrow!",
    es: "¡Es mañana!",
    fr: "C'est demain !",
  },
  "É hoje!": {
    en: "It's today!",
    es: "¡Es hoy!",
    fr: "C'est aujourd'hui !",
  },
  "Acampamento em andamento": {
    en: "Camp in progress",
    es: "Campamento en curso",
    fr: "Camp en cours",
  },
  "sua função": {
    en: "your role",
    es: "tu función",
    fr: "votre fonction",
  },
  "Desmarcar": {
    en: "Unmark",
    es: "Desmarcar",
    fr: "Décocher",
  },
  "Marcar como feito": {
    en: "Mark as done",
    es: "Marcar como hecho",
    fr: "Marquer comme fait",
  },
  "Em breve.": {
    en: "Coming soon.",
    es: "Pronto.",
    fr: "Bientôt.",
  },
  "Ver as Instruções": {
    en: "See Instructions",
    es: "Ver las Instrucciones",
    fr: "Voir les Instructions",
  },
  "Começou": {
    en: "Started",
    es: "Empezó",
    fr: "A commencé",
  },
  "Começa": {
    en: "Starts",
    es: "Empieza",
    fr: "Commence",
  },
  "{n} de {total} itens feitos": {
    en: "{n} of {total} items done",
    es: "{n} de {total} ítems hechos",
    fr: "{n} sur {total} éléments faits",
  },
  "tudo pronto! 🎉": {
    en: "all set! 🎉",
    es: "¡todo listo! 🎉",
    fr: "tout est prêt ! 🎉",
  },
  "feitos": {
    en: "done",
    es: "hechos",
    fr: "faits",
  },
  "Olá, {name}! Aqui está tudo o que você precisa saber, levar e vestir antes do acampamento.": {
    en: "Hi, {name}! Here's everything you need to know, bring and wear before camp.",
    es: "¡Hola, {name}! Aquí está todo lo que necesitas saber, llevar y vestir antes del campamento.",
    fr: "Bonjour, {name} ! Voici tout ce que vous devez savoir, apporter et porter avant le camp.",
  },
  "Olá, {name}! Aqui está tudo o que sua família precisa saber e preparar antes do acampamento.": {
    en: "Hi, {name}! Here's everything your family needs to know and prepare before camp.",
    es: "¡Hola, {name}! Aquí está todo lo que tu familia necesita saber y preparar antes del campamento.",
    fr: "Bonjour, {name} ! Voici tout ce que votre famille doit savoir et préparer avant le camp.",
  },
  " Conforme for resolvendo cada item, marque como feito.": {
    en: " As you finish each item, mark it as done.",
    es: " Conforme vayas resolviendo cada ítem, márcalo como hecho.",
    fr: " Au fur et à mesure, marquez chaque élément comme fait.",
  },
  "Nada para preparar por enquanto. Assim que a organização publicar as orientações, elas aparecem aqui.": {
    en: "Nothing to prepare for now. Once the organizers publish the guidelines, they'll show up here.",
    es: "Nada que preparar por ahora. En cuanto la organización publique las orientaciones, aparecerán aquí.",
    fr: "Rien à préparer pour l'instant. Dès que l'organisation publiera les consignes, elles apparaîtront ici.",
  },
};
