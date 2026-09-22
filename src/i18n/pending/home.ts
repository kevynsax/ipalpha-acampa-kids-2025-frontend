import type { Locale } from "../locales";

export const LITERALS: Record<string, Partial<Record<Exclude<Locale, "pt">, string>>> = {
  "Seu ônibus: {label}": {
    en: "Your bus: {label}",
    es: "Tu autobús: {label}",
    fr: "Votre bus : {label}",
  },
  "Seu ônibus": {
    en: "Your bus",
    es: "Tu autobús",
    fr: "Votre bus",
  },
  "É neste que você vai.": {
    en: "This is the one you're taking.",
    es: "En este es en el que vas.",
    fr: "C'est celui que vous prenez.",
  },
  "Aniversários no acampamento": {
    en: "Birthdays at camp",
    es: "Cumpleaños en el campamento",
    fr: "Anniversaires au camp",
  },
  "Aniversário no acampamento!": {
    en: "Birthday at camp!",
    es: "¡Cumpleaños en el campamento!",
    fr: "Anniversaire au camp !",
  },
  "Ver criança": {
    en: "View child",
    es: "Ver niño",
    fr: "Voir l'enfant",
  },
  "faz": {
    en: "turns",
    es: "cumple",
    fr: "fête",
  },
  "faz aniversário": {
    en: "has a birthday",
    es: "cumple años",
    fr: "fête son anniversaire",
  },
  "{age} anos": {
    en: "{age} years old",
    es: "{age} años",
    fr: "{age} ans",
  },
  "hoje": {
    en: "today",
    es: "hoy",
    fr: "aujourd'hui",
  },
  "Olá, {name}! 👋": {
    en: "Hi, {name}! 👋",
    es: "¡Hola, {name}! 👋",
    fr: "Bonjour, {name} ! 👋",
  },
  "O app ainda não está liberado para a equipe.": {
    en: "The app is not open for staff yet.",
    es: "La app aún no está liberada para el equipo.",
    fr: "L'appli n'est pas encore ouverte pour l'équipe.",
  },
  "Abre {when}.": {
    en: "Opens {when}.",
    es: "Abre {when}.",
    fr: "Ouvre {when}.",
  },
  "O período de acesso já terminou.": {
    en: "The access period has already ended.",
    es: "El período de acceso ya terminó.",
    fr: "La période d'accès est déjà terminée.",
  },
  "Seu celular ainda não está vinculado a um cadastro da equipe.": {
    en: "Your phone is not linked to a staff record yet.",
    es: "Tu celular aún no está vinculado a un registro del equipo.",
    fr: "Votre portable n'est pas encore lié à une fiche de l'équipe.",
  },
  "Fale com a organização para ajustar o seu cadastro.": {
    en: "Talk to the organization to fix your record.",
    es: "Habla con la organización para ajustar tu registro.",
    fr: "Parlez à l'organisation pour ajuster votre fiche.",
  },
  "Criança": {
    en: "Child",
    es: "Niño",
    fr: "Enfant",
  },
  "Você ainda não tem um quarto definido.": {
    en: "You don't have a room assigned yet.",
    es: "Aún no tienes una habitación definida.",
    fr: "Vous n'avez pas encore de chambre définie.",
  },
  "Assim que a organização te alocar, ele aparece aqui.": {
    en: "As soon as the organization assigns you one, it shows up here.",
    es: "En cuanto la organización te asigne una, aparece aquí.",
    fr: "Dès que l'organisation vous en attribue une, elle apparaît ici.",
  },
  "Quarto {name}": {
    en: "Room {name}",
    es: "Habitación {name}",
    fr: "Chambre {name}",
  },
  "Olá, {name}! Este é o seu quarto.": {
    en: "Hi, {name}! This is your room.",
    es: "¡Hola, {name}! Esta es tu habitación.",
    fr: "Bonjour, {name} ! Voici votre chambre.",
  },
  "Aqui ficam só pessoas da equipe.": {
    en: "Only staff stay here.",
    es: "Aquí solo quedan personas del equipo.",
    fr: "Seules des personnes de l'équipe restent ici.",
  },
  "Você é líder de crianças deste quarto.": {
    en: "You are a children's leader in this room.",
    es: "Eres líder de niños de esta habitación.",
    fr: "Vous êtes leader d'enfants de cette chambre.",
  },
  "Você é auxiliar neste quarto.": {
    en: "You are a helper in this room.",
    es: "Eres auxiliar en esta habitación.",
    fr: "Vous êtes auxiliaire dans cette chambre.",
  },
  "Minhas crianças": {
    en: "My children",
    es: "Mis niños",
    fr: "Mes enfants",
  },
  "Você é o líder delas.": {
    en: "You are their leader.",
    es: "Eres su líder.",
    fr: "Vous êtes leur leader.",
  },
  "Nenhuma criança sob sua responsabilidade ainda.": {
    en: "No children under your care yet.",
    es: "Ningún niño bajo tu responsabilidad todavía.",
    fr: "Aucun enfant sous votre responsabilité pour l'instant.",
  },
  "Equipe no quarto": {
    en: "Staff in the room",
    es: "Equipo en la habitación",
    fr: "Équipe dans la chambre",
  },
  "Só você neste quarto. 😊": {
    en: "Just you in this room. 😊",
    es: "Solo tú en esta habitación. 😊",
    fr: "Juste vous dans cette chambre. 😊",
  },
  "Falar com {name} no WhatsApp": {
    en: "Message {name} on WhatsApp",
    es: "Hablar con {name} en WhatsApp",
    fr: "Parler à {name} sur WhatsApp",
  },
  "Líder": {
    en: "Leader",
    es: "Líder",
    fr: "Leader",
  },
  "Auxiliar": {
    en: "Helper",
    es: "Auxiliar",
    fr: "Auxiliaire",
  },
  "Outras crianças do quarto": {
    en: "Other children in the room",
    es: "Otros niños de la habitación",
    fr: "Autres enfants de la chambre",
  },
  "Crianças do quarto": {
    en: "Children in the room",
    es: "Niños de la habitación",
    fr: "Enfants de la chambre",
  },
  "para ajudar os colegas com saúde e cuidados": {
    en: "to help colleagues with health and care",
    es: "para ayudar a los compañeros con salud y cuidados",
    fr: "pour aider les collègues avec la santé et les soins",
  },
  "As crianças do quarto aparecem aqui durante o acampamento.": {
    en: "The room's children appear here during camp.",
    es: "Los niños de la habitación aparecen aquí durante el campamento.",
    fr: "Les enfants de la chambre apparaissent ici pendant le camp.",
  },
  "sem celular": {
    en: "no mobile",
    es: "sin celular",
    fr: "pas de portable",
  },
  "✅ check-in feito": {
    en: "✅ checked in",
    es: "✅ check-in hecho",
    fr: "✅ check-in fait",
  },
  "Nascimento": {
    en: "Birth date",
    es: "Nacimiento",
    fr: "Naissance",
  },
  "Cama {bed}": {
    en: "Bed {bed}",
    es: "Cama {bed}",
    fr: "Lit {bed}",
  },
  "disponível a partir do check-in": {
    en: "available from check-in",
    es: "disponible a partir del check-in",
    fr: "disponible à partir du check-in",
  },
  "Equipe que cuida de {name}": {
    en: "Team looking after {name}",
    es: "Equipo que cuida de {name}",
    fr: "Équipe qui s'occupe de {name}",
  },
  "Equipe que cuida da {name}": {
    en: "Team looking after {name}",
    es: "Equipo que cuida de {name}",
    fr: "Équipe qui s'occupe de {name}",
  },
  "Equipe que cuida do {name}": {
    en: "Team looking after {name}",
    es: "Equipo que cuida de {name}",
    fr: "Équipe qui s'occupe de {name}",
  },
  "A equipe do quarto ainda não foi definida.": {
    en: "The room team has not been set yet.",
    es: "El equipo de la habitación aún no fue definido.",
    fr: "L'équipe de la chambre n'a pas encore été définie.",
  },
  "Líder de {name}": {
    en: "Leader of {name}",
    es: "Líder de {name}",
    fr: "Leader de {name}",
  },
  "Equipe do quarto": {
    en: "Room staff",
    es: "Equipo de la habitación",
    fr: "Équipe de la chambre",
  },
  "Equipe do quarto {name}": {
    en: "Room {name} staff",
    es: "Equipo de la habitación {name}",
    fr: "Équipe de la chambre {name}",
  },
  "Informações de saúde": {
    en: "Health information",
    es: "Información de salud",
    fr: "Informations de santé",
  },
  "Peso": {
    en: "Weight",
    es: "Peso",
    fr: "Poids",
  },
  "{weight} kg": {
    en: "{weight} kg",
    es: "{weight} kg",
    fr: "{weight} kg",
  },
  "Nenhuma alergia, condição ou medicação informada.": {
    en: "No allergy, condition or medication reported.",
    es: "Ninguna alergia, condición o medicación informada.",
    fr: "Aucune allergie, condition ou médication signalée.",
  },
  "sem observações": {
    en: "no notes",
    es: "sin observaciones",
    fr: "pas de notes",
  },
  "🎟️ QR code de {name}": {
    en: "🎟️ {name}'s QR code",
    es: "🎟️ Código QR de {name}",
    fr: "🎟️ QR code de {name}",
  },
  "Mostre à equipe na entrada do acampamento para o check-in.": {
    en: "Show it to staff at the camp entrance for check-in.",
    es: "Muéstralo al equipo en la entrada del campamento para el check-in.",
    fr: "Montrez-le à l'équipe à l'entrée du camp pour le check-in.",
  },
  "Não encontramos nenhuma criança inscrita com o seu celular.": {
    en: "We found no child registered with your phone.",
    es: "No encontramos ningún niño inscrito con tu celular.",
    fr: "Nous n'avons trouvé aucun enfant inscrit avec votre portable.",
  },
  "Fale com a organização para ajustar o cadastro.": {
    en: "Talk to the organization to fix the record.",
    es: "Habla con la organización para ajustar el registro.",
    fr: "Parlez à l'organisation pour ajuster la fiche.",
  },
  "O acampamento está rolando! Aqui estão os contatos e as informações das suas crianças.": {
    en: "Camp is on! Here are the contacts and info for your children.",
    es: "¡El campamento está en marcha! Aquí están los contactos y la información de tus niños.",
    fr: "Le camp bat son plein ! Voici les contacts et les infos de vos enfants.",
  },
  "O acampamento está rolando! Aqui estão os contatos e as informações do seu filho.": {
    en: "Camp is on! Here are the contacts and info for your son.",
    es: "¡El campamento está en marcha! Aquí están los contactos y la información de tu hijo.",
    fr: "Le camp bat son plein ! Voici les contacts et les infos de votre fils.",
  },
  "O acampamento está rolando! Aqui estão os contatos e as informações da sua princesa.": {
    en: "Camp is on! Here are the contacts and info for your princess.",
    es: "¡El campamento está en marcha! Aquí están los contactos y la información de tu princesa.",
    fr: "Le camp bat son plein ! Voici les contacts et les infos de votre princesse.",
  },
  "O acampamento está rolando! Aqui estão os contatos e as informações das suas bonecas.": {
    en: "Camp is on! Here are the contacts and info for your girls.",
    es: "¡El campamento está en marcha! Aquí están los contactos y la información de tus muñecas.",
    fr: "Le camp bat son plein ! Voici les contacts et les infos de vos poupées.",
  },
  "O acampamento está rolando! Aqui estão os contatos e as informações das suas crias.": {
    en: "Camp is on! Here are the contacts and info for your boys.",
    es: "¡El campamento está en marcha! Aquí están los contactos y la información de tus críos.",
    fr: "Le camp bat son plein ! Voici les contacts et les infos de vos garçons.",
  },
  "A equipe do quarto aparece aqui a partir do check-in ({when}).": {
    en: "The room team appears here from check-in ({when}).",
    es: "El equipo de la habitación aparece aquí a partir del check-in ({when}).",
    fr: "L'équipe de la chambre apparaît ici à partir du check-in ({when}).",
  },
  "O acampamento terminou. Obrigado por confiar em nós! 💚": {
    en: "Camp is over. Thanks for trusting us! 💚",
    es: "El campamento terminó. ¡Gracias por confiar en nosotros! 💚",
    fr: "Le camp est terminé. Merci de nous faire confiance ! 💚",
  },
  "Editar informações de saúde": {
    en: "Edit health information",
    es: "Editar información de salud",
    fr: "Modifier les informations de santé",
  },
  "Informações de saúde de {name}": {
    en: "Health information for {name}",
    es: "Información de salud de {name}",
    fr: "Informations de santé de {name}",
  },
  "O que você alterar aqui é avisado à equipe que cuida de {name} no acampamento.": {
    en: "What you change here is sent to the team looking after {name} at camp.",
    es: "Lo que cambies aquí se avisa al equipo que cuida de {name} en el campamento.",
    fr: "Ce que vous changez ici est signalé à l'équipe qui s'occupe de {name} au camp.",
  },
  "🏥 Convênio médico": {
    en: "🏥 Medical insurance",
    es: "🏥 Seguro médico",
    fr: "🏥 Assurance médicale",
  },
  "ex.: Bradesco": {
    en: "e.g. Bradesco",
    es: "ej.: Bradesco",
    fr: "ex. : Bradesco",
  },
  "Carteirinha": {
    en: "Card number",
    es: "Carnet",
    fr: "Carte",
  },
  "⚖️ Peso (kg)": {
    en: "⚖️ Weight (kg)",
    es: "⚖️ Peso (kg)",
    fr: "⚖️ Poids (kg)",
  },
  "ex.: 28,5": {
    en: "e.g. 28.5",
    es: "ej.: 28,5",
    fr: "ex. : 28,5",
  },
  "Entre 5 e 200 kg.": {
    en: "Between 5 and 200 kg.",
    es: "Entre 5 y 200 kg.",
    fr: "Entre 5 et 200 kg.",
  },
  "🤮 Alergias": {
    en: "🤮 Allergies",
    es: "🤮 Alergias",
    fr: "🤮 Allergies",
  },
  "Quais": {
    en: "Which",
    es: "Cuáles",
    fr: "Lesquelles",
  },
  "Alergia a medicamentos": {
    en: "Drug allergy",
    es: "Alergia a medicamentos",
    fr: "Allergie médicamenteuse",
  },
  "🩺 Condição crônica": {
    en: "🩺 Chronic condition",
    es: "🩺 Condición crónica",
    fr: "🩺 Condition chronique",
  },
  "💊 Medicação de uso diário": {
    en: "💊 Daily medication",
    es: "💊 Medicación de uso diario",
    fr: "💊 Médication quotidienne",
  },
  "🍽️ Alimentação / restrições": {
    en: "🍽️ Food / restrictions",
    es: "🍽️ Alimentación / restricciones",
    fr: "🍽️ Alimentation / restrictions",
  },
  "ex.: sem lactose": {
    en: "e.g. lactose-free",
    es: "ej.: sin lactosa",
    fr: "ex. : sans lactose",
  },
  "🩺 Observações médicas": {
    en: "🩺 Medical notes",
    es: "🩺 Observaciones médicas",
    fr: "🩺 Notes médicales",
  },
  "ex.: em caso de crise, 4 puffs de Aerolin…": {
    en: "e.g. in a crisis, 4 puffs of Aerolin…",
    es: "ej.: en caso de crisis, 4 puffs de Aerolin…",
    fr: "ex. : en cas de crise, 4 bouffées d'Aerolin…",
  },
  "📝 Observações gerais": {
    en: "📝 General notes",
    es: "📝 Observaciones generales",
    fr: "📝 Notes générales",
  },
  "ex.: tem dificuldade em dormir sozinha": {
    en: "e.g. has trouble sleeping alone",
    es: "ej.: tiene dificultad para dormir sola",
    fr: "ex. : a du mal à dormir seule",
  },
  "🩺 A equipe médica, a organização e o líder do quarto serão avisados.": {
    en: "🩺 The medical team, the organization and the room leader will be notified.",
    es: "🩺 El equipo médico, la organización y el líder de la habitación serán avisados.",
    fr: "🩺 L'équipe médicale, l'organisation et le leader de la chambre seront prévenus.",
  },
  "O líder do quarto será avisado.": {
    en: "The room leader will be notified.",
    es: "El líder de la habitación será avisado.",
    fr: "Le leader de la chambre sera prévenu.",
  },
  "Organizando…": {
    en: "Organizing…",
    es: "Organizando…",
    fr: "Organisation…",
  },
  "Aguardando a IA organizar as observações…": {
    en: "Waiting for AI to organize the notes…",
    es: "Esperando que la IA organice las observaciones…",
    fr: "En attente que l'IA organise les notes…",
  },
  "Check-in: mostre o QR code": {
    en: "Check-in: show the QR code",
    es: "Check-in: muestra el código QR",
    fr: "Check-in : montrez le QR code",
  },
  "✅ Hora do check-in!": {
    en: "✅ Check-in time!",
    es: "✅ ¡Hora del check-in!",
    fr: "✅ C'est l'heure du check-in !",
  },
  "Mostre este QR code para a equipe na entrada. 🏕️": {
    en: "Show this QR code to staff at the entrance. 🏕️",
    es: "Muestra este código QR al equipo en la entrada. 🏕️",
    fr: "Montrez ce QR code à l'équipe à l'entrée. 🏕️",
  },
  "Mostre um QR code de cada vez para a equipe na entrada. 🏕️": {
    en: "Show one QR code at a time to staff at the entrance. 🏕️",
    es: "Muestra un código QR a la vez al equipo en la entrada. 🏕️",
    fr: "Montrez un QR code à la fois à l'équipe à l'entrée. 🏕️",
  },
  "Escolha o QR code da criança": {
    en: "Choose the child's QR code",
    es: "Elige el código QR del niño",
    fr: "Choisissez le QR code de l'enfant",
  },
};
