import type { Locale } from "../locales";

export const LITERALS: Record<string, Partial<Record<Exclude<Locale, "pt">, string>>> = {
  " (a {distance} do ponto de encontro)": {
    en: " ({distance} from the meeting point)",
    es: " (a {distance} del punto de encuentro)",
    fr: " (à {distance} du point de rendez-vous)",
  },
  " (precisão do GPS: ±{m} m)": {
    en: " (GPS accuracy: ±{m} m)",
    es: " (precisión del GPS: ±{m} m)",
    fr: " (précision du GPS : ±{m} m)",
  },
  "✅ Confirmar chegada": {
    en: "✅ Confirm arrival",
    es: "✅ Confirmar llegada",
    fr: "✅ Confirmer l'arrivée",
  },
  "✅ Já fez check-in às {time} com {who}.": {
    en: "✅ Already checked in at {time} with {who}.",
    es: "✅ Ya hizo check-in a las {time} con {who}.",
    fr: "✅ Déjà enregistré à {time} avec {who}.",
  },
  "📡 Lendo o GPS…": {
    en: "📡 Reading GPS…",
    es: "📡 Leyendo el GPS…",
    fr: "📡 Lecture du GPS…",
  },
  "📡 Você está a cerca de {distance} de {place}{accuracy}.": {
    en: "📡 You are about {distance} from {place}{accuracy}.",
    es: "📡 Estás a unos {distance} de {place}{accuracy}.",
    fr: "📡 Vous êtes à environ {distance} de {place}{accuracy}.",
  },
  "🤖 pelo sistema": {
    en: "🤖 by the system",
    es: "🤖 por el sistema",
    fr: "🤖 par le système",
  },
  "⛪ Check-in na igreja": {
    en: "⛪ Church check-in",
    es: "⛪ Check-in en la iglesia",
    fr: "⛪ Check-in à l'église",
  },
  "{done} de {all} criança chegou": {
    en: "{done} of {all} child has arrived",
    es: "{done} de {all} niño llegó",
    fr: "{done} sur {all} enfant est arrivé",
  },
  "{done} de {all} crianças chegaram": {
    en: "{done} of {all} children have arrived",
    es: "{done} de {all} niños llegaron",
    fr: "{done} sur {all} enfants sont arrivés",
  },
  "{name} confirmou sua chegada às {when}": {
    en: "{name} confirmed your arrival at {when}",
    es: "{name} confirmó tu llegada a las {when}",
    fr: "{name} a confirmé votre arrivée à {when}",
  },
  "{name} chegou": {
    en: "{name} arrived",
    es: "{name} llegó",
    fr: "{name} est arrivé",
  },
  "{name} já chegou": {
    en: "{name} already arrived",
    es: "{name} ya llegó",
    fr: "{name} est déjà arrivé",
  },
  "{name} não vem de ônibus — o check-in da igreja é só para quem vem de ônibus.": {
    en: "{name} is not coming by bus — church check-in is only for those coming by bus.",
    es: "{name} no viene en autobús — el check-in de la iglesia es solo para quien viene en autobús.",
    fr: "{name} ne vient pas en bus — le check-in à l'église est réservé à ceux qui viennent en bus.",
  },
  "A criança voltará para a lista de pendentes.": {
    en: "The child will go back to the pending list.",
    es: "El niño volverá a la lista de pendientes.",
    fr: "L'enfant reviendra dans la liste des en attente.",
  },
  "Ao chegar em {place}, confirme sua presença aqui": {
    en: "When you arrive at {place}, confirm your presence here",
    es: "Al llegar a {place}, confirma tu presencia aquí",
    fr: "En arrivant à {place}, confirmez votre présence ici",
  },
  "Boa viagem! 🚌": {
    en: "Have a good trip! 🚌",
    es: "¡Buen viaje! 🚌",
    fr: "Bon voyage ! 🚌",
  },
  "Buscar pelo nome": {
    en: "Search by name",
    es: "Buscar por nombre",
    fr: "Rechercher par nom",
  },
  "Buscar pelo nome da criança": {
    en: "Search by child's name",
    es: "Buscar por el nombre del niño",
    fr: "Rechercher par le nom de l'enfant",
  },
  "celular não informado": {
    en: "phone not provided",
    es: "celular no informado",
    fr: "téléphone non renseigné",
  },
  "Check-in {title}": {
    en: "{title} check-in",
    es: "Check-in {title}",
    fr: "Check-in {title}",
  },
  "Check-in da equipe": {
    en: "Staff check-in",
    es: "Check-in del equipo",
    fr: "Check-in de l'équipe",
  },
  "Check-in de {name}": {
    en: "Check-in for {name}",
    es: "Check-in de {name}",
    fr: "Check-in de {name}",
  },
  "Check-in feito!": {
    en: "Checked in!",
    es: "¡Check-in hecho!",
    fr: "Check-in fait !",
  },
  "Cheguei em {place}! ✋": {
    en: "I've arrived at {place}! ✋",
    es: "¡Llegué a {place}! ✋",
    fr: "Je suis arrivé à {place} ! ✋",
  },
  "Chegaram": {
    en: "Arrived",
    es: "Llegaron",
    fr: "Arrivés",
  },
  "chegou às {time}": {
    en: "arrived at {time}",
    es: "llegó a las {time}",
    fr: "arrivé à {time}",
  },
  "Confirmando…": {
    en: "Confirming…",
    es: "Confirmando…",
    fr: "Confirmation…",
  },
  "Confirme todos os itens com o responsável": {
    en: "Confirm every item with the guardian",
    es: "Confirma todos los ítems con el responsable",
    fr: "Confirmez tous les points avec le responsable",
  },
  "Crianças que já chegaram": {
    en: "Children who have already arrived",
    es: "Niños que ya llegaron",
    fr: "Enfants déjà arrivés",
  },
  "Desfazer: {name}": {
    en: "Undo: {name}",
    es: "Deshacer: {name}",
    fr: "Annuler : {name}",
  },
  "Desfazer check-in": {
    en: "Undo check-in",
    es: "Deshacer check-in",
    fr: "Annuler le check-in",
  },
  "Desfazer check-in de {name}": {
    en: "Undo check-in for {name}",
    es: "Deshacer check-in de {name}",
    fr: "Annuler le check-in de {name}",
  },
  "Desfazer o check-in de {name}": {
    en: "Undo check-in for {name}",
    es: "Deshacer el check-in de {name}",
    fr: "Annuler le check-in de {name}",
  },
  "Desfazer o check-in de {name}?": {
    en: "Undo check-in for {name}?",
    es: "¿Deshacer el check-in de {name}?",
    fr: "Annuler le check-in de {name} ?",
  },
  "Equipe que chegou": {
    en: "Staff who arrived",
    es: "Equipo que llegó",
    fr: "Équipe arrivée",
  },
  "Esta criança não está na lista do check-in.": {
    en: "This child is not on the check-in list.",
    es: "Este niño no está en la lista del check-in.",
    fr: "Cet enfant n'est pas sur la liste du check-in.",
  },
  "Este QR code não é de uma pulseira ou crachá do Acampa Kids.": {
    en: "This QR code is not from an Acampa Kids wristband or badge.",
    es: "Este código QR no es de una pulsera o credencial de Acampa Kids.",
    fr: "Ce QR code n'est pas celui d'un bracelet ou badge Acampa Kids.",
  },
  "Fazer check-in de {name}": {
    en: "Check in {name}",
    es: "Hacer check-in de {name}",
    fr: "Faire le check-in de {name}",
  },
  "Fechar 🎉": {
    en: "Close 🎉",
    es: "Cerrar 🎉",
    fr: "Fermer 🎉",
  },
  "Filtro": {
    en: "Filter",
    es: "Filtro",
    fr: "Filtre",
  },
  "igreja": {
    en: "church",
    es: "iglesia",
    fr: "église",
  },
  "Leia a pulseira ou o crachá para abrir o check-in da criança.": {
    en: "Scan the wristband or badge to open the child's check-in.",
    es: "Lee la pulsera o la credencial para abrir el check-in del niño.",
    fr: "Scannez le bracelet ou le badge pour ouvrir le check-in de l'enfant.",
  },
  "Ler a pulseira ou o crachá": {
    en: "Scan the wristband or badge",
    es: "Leer la pulsera o la credencial",
    fr: "Lire le bracelet ou le badge",
  },
  "Nenhum acampante cadastrado.": {
    en: "No campers registered.",
    es: "Ningún campista registrado.",
    fr: "Aucun campeur enregistré.",
  },
  "nome não informado": {
    en: "name not provided",
    es: "nombre no informado",
    fr: "nom non renseigné",
  },
  "O acampamento é Hoje!!!": {
    en: "Camp is Today!!!",
    es: "¡El campamento es Hoy!!!",
    fr: "Le camp c'est Aujourd'hui !!!",
  },
  "ou": {
    en: "or",
    es: "o",
    fr: "ou",
  },
  "Perguntei e está correto": {
    en: "I asked and it's correct",
    es: "Pregunté y está correcto",
    fr: "J'ai demandé et c'est correct",
  },
  "Pessoas da equipe que já chegaram": {
    en: "Staff members who have already arrived",
    es: "Personas del equipo que ya llegaron",
    fr: "Membres de l'équipe déjà arrivés",
  },
  "Precisamos da sua localização para saber que você já chegou.": {
    en: "We need your location to know that you have arrived.",
    es: "Necesitamos tu ubicación para saber que ya llegaste.",
    fr: "Nous avons besoin de votre position pour savoir que vous êtes arrivé.",
  },
  "Qual check-in você quer abrir?": {
    en: "Which check-in do you want to open?",
    es: "¿Qué check-in quieres abrir?",
    fr: "Quel check-in voulez-vous ouvrir ?",
  },
  "Você confirmou sua chegada às {when}": {
    en: "You confirmed your arrival at {when}",
    es: "Confirmaste tu llegada a las {when}",
    fr: "Vous avez confirmé votre arrivée à {when}",
  },
};
