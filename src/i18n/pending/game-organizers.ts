import type { Locale } from "../locales";

export const LITERALS: Record<string, Partial<Record<Exclude<Locale, "pt">, string>>> = {
  "Pessoas da equipe que": {
    en: "Team members who",
    es: "Personas del equipo que",
    fr: "Personnes de l'équipe qui",
  },
  "organizam as gincanas": {
    en: "run the games",
    es: "organizan las gincanas",
    fr: "organisent les jeux",
  },
  ": editam a": {
    en: ": they edit the",
    es: ": editan la",
    fr: " : ils modifient le",
  },
  "programação": {
    en: "schedule",
    es: "programación",
    fr: "programme",
  },
  " e mantêm o": {
    en: " and keep the",
    es: " y mantienen el",
    fr: " et tiennent le",
  },
  " (dão, tiram e zeram pontos de qualquer time).": {
    en: " (give, take and zero points for any team).",
    es: " (dan, quitan y ponen a cero los puntos de cualquier equipo).",
    fr: " (donnent, retirent et remettent à zéro les points de n'importe quelle équipe).",
  },
  "Organizadores dos jogos": {
    en: "Game organizers",
    es: "Organizadores de los juegos",
    fr: "Organisateurs des jeux",
  },
  "Adicionar organizador dos jogos": {
    en: "Add game organizer",
    es: "Añadir organizador de los juegos",
    fr: "Ajouter un organisateur des jeux",
  },
  "Ninguém escolhido ainda. Só o admin lança pontos.": {
    en: "Nobody chosen yet. Only the admin posts points.",
    es: "Nadie elegido todavía. Solo el admin carga puntos.",
    fr: "Personne choisi pour l'instant. Seul l'admin saisit les points.",
  },
  "Ajudantes do placar": {
    en: "Scoreboard helpers",
    es: "Ayudantes del marcador",
    fr: "Aides du score",
  },
  ": só": {
    en: ": they only",
    es: ": solo",
    fr: " : ils",
  },
  "leem crachás": {
    en: "scan badges",
    es: "leen credenciales",
    fr: "lisent les badges",
  },
  " — dão pontos em massa às crianças de um evento (ex.: quem veio fantasiado).": {
    en: " — give bulk points to children from an event (e.g. whoever came in costume).",
    es: " — dan puntos en masa a los niños de un evento (ej.: quien vino disfrazado).",
    fr: " — donnent des points en masse aux enfants d'un événement (ex. : ceux venus déguisés).",
  },
  "Quem ajuda a lançar pontos": {
    en: "Who helps post points",
    es: "Quién ayuda a cargar puntos",
    fr: "Qui aide à saisir les points",
  },
  "Adicionar ajudante do placar": {
    en: "Add scoreboard helper",
    es: "Añadir ayudante del marcador",
    fr: "Ajouter un aide du score",
  },
  "Ninguém escolhido ainda.": {
    en: "Nobody chosen yet.",
    es: "Nadie elegido todavía.",
    fr: "Personne choisi pour l'instant.",
  },
  "O ajudante ganha a aba": {
    en: "The helper gets the",
    es: "El ayudante gana la pestaña",
    fr: "L'aide obtient l'onglet",
  },
  " só com o botão de leitura em massa e vê das crianças apenas": {
    en: " tab with only the bulk-scan button and sees of each child only",
    es: " solo con el botón de lectura en masa y ve de los niños solo",
    fr: " avec seulement le bouton de lecture en masse et ne voit des enfants que",
  },
  "nome e time": {
    en: "name and team",
    es: "nombre y equipo",
    fr: "nom et équipe",
  },
  ". Apaga só as próprias leituras. Ao entrar na lista a pessoa recebe um SMS avisando.": {
    en: ". They can delete only their own scans. When added to the list the person gets an SMS notice.",
    es: ". Borra solo sus propias lecturas. Al entrar en la lista la persona recibe un SMS avisando.",
    fr: ". Il n'efface que ses propres lectures. En entrant dans la liste, la personne reçoit un SMS d'avis.",
  },
};
