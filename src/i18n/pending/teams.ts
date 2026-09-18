import type { Locale } from "../locales";

export const LITERALS: Record<string, Partial<Record<Exclude<Locale, "pt">, string>>> = {
  "{kids} criança(s) e {staff} pessoa(s) da equipe ficam sem time e o placar do time é apagado. Não dá para desfazer.": {
    en: "{kids} child(ren) and {staff} staff member(s) are left without a team and the team scoreboard is cleared. This can't be undone.",
    es: "{kids} niño(s) y {staff} persona(s) del equipo se quedan sin equipo y el marcador del equipo se borra. No se puede deshacer.",
    fr: "{kids} enfant(s) et {staff} membre(s) de l'équipe se retrouvent sans équipe et le score de l'équipe est effacé. Impossible d'annuler.",
  },
  "{n} da equipe": {
    en: "{n} staff",
    es: "{n} del equipo",
    fr: "{n} de l'équipe",
  },
  "✏️ Editar time": {
    en: "✏️ Edit team",
    es: "✏️ Editar equipo",
    fr: "✏️ Modifier l'équipe",
  },
  "🚩 Novo time": {
    en: "🚩 New team",
    es: "🚩 Nuevo equipo",
    fr: "🚩 Nouvelle équipe",
  },
  "A distribuição usa todos os times e tenta manter as quantidades equilibradas.": {
    en: "Distribution uses all teams and tries to keep the numbers balanced.",
    es: "La distribución usa todos los equipos e intenta mantener las cantidades equilibradas.",
    fr: "La répartition utilise toutes les équipes et essaie de garder les quantités équilibrées.",
  },
  "Agrupar crianças": {
    en: "Group children",
    es: "Agrupar niños",
    fr: "Grouper les enfants",
  },
  "Agrupar:": {
    en: "Group:",
    es: "Agrupar:",
    fr: "Grouper :",
  },
  "Aleatoriamente": {
    en: "Randomly",
    es: "Aleatoriamente",
    fr: "Au hasard",
  },
  "Arraste o fundo de um grupo para mover todos. Arraste uma pessoa para movê-la sozinha. Cada mudança é salva na hora.": {
    en: "Drag a group's background to move everyone. Drag a person to move them alone. Each change is saved right away.",
    es: "Arrastra el fondo de un grupo para mover a todos. Arrastra a una persona para moverla sola. Cada cambio se guarda al momento.",
    fr: "Faites glisser le fond d'un groupe pour tout déplacer. Faites glisser une personne pour la déplacer seule. Chaque changement est enregistré tout de suite.",
  },
  "Buscar por nome": {
    en: "Search by name",
    es: "Buscar por nombre",
    fr: "Rechercher par nom",
  },
  "Cada criança é sorteada separadamente.": {
    en: "Each child is drawn separately.",
    es: "Cada niño se sortea por separado.",
    fr: "Chaque enfant est tiré séparément.",
  },
  "Carregando times… 🚩": {
    en: "Loading teams… 🚩",
    es: "Cargando equipos… 🚩",
    fr: "Chargement des équipes… 🚩",
  },
  "Ciano": {
    en: "Cyan",
    es: "Cian",
    fr: "Cyan",
  },
  "Como distribuir": {
    en: "How to distribute",
    es: "Cómo distribuir",
    fr: "Comment répartir",
  },
  "Como distribuir as crianças?": {
    en: "How should the children be distributed?",
    es: "¿Cómo distribuir a los niños?",
    fr: "Comment répartir les enfants ?",
  },
  "Cor do time": {
    en: "Team color",
    es: "Color del equipo",
    fr: "Couleur de l'équipe",
  },
  "Cores sugeridas": {
    en: "Suggested colors",
    es: "Colores sugeridos",
    fr: "Couleurs suggérées",
  },
  "Criar time": {
    en: "Create team",
    es: "Crear equipo",
    fr: "Créer l'équipe",
  },
  "Crianças do mesmo líder ficam juntas.": {
    en: "Children with the same leader stay together.",
    es: "Los niños del mismo líder se quedan juntos.",
    fr: "Les enfants du même leader restent ensemble.",
  },
  "Crianças ligadas pelas preferências ficam juntas.": {
    en: "Children linked by preferences stay together.",
    es: "Los niños unidos por las preferencias se quedan juntos.",
    fr: "Les enfants liés par les préférences restent ensemble.",
  },
  "Descer {name}": {
    en: "Move {name} down",
    es: "Bajar {name}",
    fr: "Descendre {name}",
  },
  "Distribuir crianças": {
    en: "Distribute children",
    es: "Distribuir niños",
    fr: "Répartir les enfants",
  },
  "distribuir crianças e equipe nos times": {
    en: "assign children and staff to teams",
    es: "distribuir niños y equipo en los equipos",
    fr: "répartir enfants et équipe dans les équipes",
  },
  "Editar time": {
    en: "Edit team",
    es: "Editar equipo",
    fr: "Modifier l'équipe",
  },
  "Escolher outra cor": {
    en: "Pick another color",
    es: "Elegir otro color",
    fr: "Choisir une autre couleur",
  },
  "Excluir {name}": {
    en: "Delete {name}",
    es: "Eliminar {name}",
    fr: "Supprimer {name}",
  },
  "Excluir {name}?": {
    en: "Delete {name}?",
    es: "¿Eliminar {name}?",
    fr: "Supprimer {name} ?",
  },
  "Líder: {name}": {
    en: "Leader: {name}",
    es: "Líder: {name}",
    fr: "Leader : {name}",
  },
  "Lima": {
    en: "Lime",
    es: "Lima",
    fr: "Citron vert",
  },
  "Manter grupos por líder": {
    en: "Keep groups by leader",
    es: "Mantener grupos por líder",
    fr: "Garder les groupes par leader",
  },
  "Manter preferências de quarto": {
    en: "Keep room preferences",
    es: "Mantener preferencias de habitación",
    fr: "Garder les préférences de chambre",
  },
  "Marrom": {
    en: "Brown",
    es: "Marrón",
    fr: "Marron",
  },
  "Montar times": {
    en: "Build teams",
    es: "Armar equipos",
    fr: "Composer les équipes",
  },
  "Nenhum time ainda. Crie o primeiro!": {
    en: "No teams yet. Create the first one!",
    es: "Ningún equipo todavía. ¡Crea el primero!",
    fr: "Pas encore d'équipe. Créez la première !",
  },
  "Não foi possível distribuir as crianças.": {
    en: "Could not distribute the children.",
    es: "No se pudo distribuir a los niños.",
    fr: "Impossible de répartir les enfants.",
  },
  "Não foi possível mudar o time.": {
    en: "Could not change the team.",
    es: "No se pudo cambiar el equipo.",
    fr: "Impossible de changer d'équipe.",
  },
  "não visível": {
    en: "not visible",
    es: "no visible",
    fr: "non visible",
  },
  "Novo time": {
    en: "New team",
    es: "Nuevo equipo",
    fr: "Nouvelle équipe",
  },
  "O placar do time é apagado. Não dá para desfazer.": {
    en: "The team scoreboard is cleared. This can't be undone.",
    es: "El marcador del equipo se borra. No se puede deshacer.",
    fr: "Le score de l'équipe est effacé. Impossible d'annuler.",
  },
  "Por líder": {
    en: "By leader",
    es: "Por líder",
    fr: "Par leader",
  },
  "Por preferência de quarto": {
    en: "By room preference",
    es: "Por preferencia de habitación",
    fr: "Par préférence de chambre",
  },
  "Preto": {
    en: "Black",
    es: "Negro",
    fr: "Noir",
  },
  "Quem mostrar": {
    en: "Who to show",
    es: "A quién mostrar",
    fr: "Qui afficher",
  },
  "🔒 Quem lança pontos no Placar é definido em Configurações → Jogos.": {
    en: "🔒 Who can award points on the Scoreboard is set in Settings → Games.",
    es: "🔒 Quién suma puntos en el Marcador se define en Ajustes → Juegos.",
    fr: "🔒 Qui peut attribuer des points au Score est défini dans Réglages → Jeux.",
  },
  "Sem agrupar": {
    en: "Ungrouped",
    es: "Sin agrupar",
    fr: "Sans grouper",
  },
  "Sem time": {
    en: "No team",
    es: "Sin equipo",
    fr: "Sans équipe",
  },
  "sem ninguém ainda": {
    en: "nobody yet",
    es: "nadie todavía",
    fr: "personne pour l'instant",
  },
  "Solte pessoas aqui": {
    en: "Drop people here",
    es: "Suelta personas aquí",
    fr: "Déposez des personnes ici",
  },
  "Subir {name}": {
    en: "Move {name} up",
    es: "Subir {name}",
    fr: "Monter {name}",
  },
  "Time Belém": {
    en: "Team Belém",
    es: "Equipo Belém",
    fr: "Équipe Belém",
  },
  "Todo mundo está em um time.": {
    en: "Everyone is on a team.",
    es: "Todo el mundo está en un equipo.",
    fr: "Tout le monde est dans une équipe.",
  },
};
