import type { Locale } from "../locales";

export const LITERALS: Record<string, Partial<Record<Exclude<Locale, "pt">, string>>> = {
  "{hint} — ver {name}": {
    en: "{hint} — view {name}",
    es: "{hint} — ver {name}",
    fr: "{hint} — voir {name}",
  },
  "{name} ainda não fez check-in na igreja.": {
    en: "{name} has not checked in at the church yet.",
    es: "{name} aún no hizo check-in en la iglesia.",
    fr: "{name} n'a pas encore fait le check-in à l'église.",
  },
  "{name} já fez o check-in da {trip}.": {
    en: "{name} already checked in for the {trip}.",
    es: "{name} ya hizo el check-in de la {trip}.",
    fr: "{name} a déjà fait le check-in du {trip}.",
  },
  "{name} não está neste veículo.": {
    en: "{name} is not on this vehicle.",
    es: "{name} no está en este vehículo.",
    fr: "{name} n'est pas dans ce véhicule.",
  },
  "{name} não está neste veículo — está em {vehicle}.": {
    en: "{name} is not on this vehicle — assigned to {vehicle}.",
    es: "{name} no está en este vehículo — está en {vehicle}.",
    fr: "{name} n'est pas dans ce véhicule — est dans {vehicle}.",
  },
  "{name} não fez o check-in do ônibus na ida.": {
    en: "{name} did not check in on the outbound bus.",
    es: "{name} no hizo el check-in del autobús en la ida.",
    fr: "{name} n'a pas fait le check-in du bus à l'aller.",
  },
  "{name} não tem transporte cadastrado.": {
    en: "{name} has no transport assigned.",
    es: "{name} no tiene transporte registrado.",
    fr: "{name} n'a pas de transport enregistré.",
  },
  "✅ {name} entrou no ônibus da {trip}.": {
    en: "✅ {name} boarded the {trip} bus.",
    es: "✅ {name} subió al autobús de la {trip}.",
    fr: "✅ {name} est monté dans le bus du {trip}.",
  },
  "🔍 Só consulta — a chamada é feita pela organização e pelos ajudantes do ônibus.": {
    en: "🔍 View only — roll call is done by the organization and the bus helpers.",
    es: "🔍 Solo consulta — la lista la hace la organización y los ayudantes del autobús.",
    fr: "🔍 Consultation seule — l'appel est fait par l'organisation et les aides du bus.",
  },
  "⚠️ Nenhum adulto neste veículo.": {
    en: "⚠️ No adult on this vehicle.",
    es: "⚠️ Ningún adulto en este vehículo.",
    fr: "⚠️ Aucun adulte dans ce véhicule.",
  },
  "⚠️ Sem transporte": {
    en: "⚠️ No transport",
    es: "⚠️ Sin transporte",
    fr: "⚠️ Sans transport",
  },
  "A criança voltará para a lista da {trip}.": {
    en: "The child will go back to the {trip} list.",
    es: "El niño volverá a la lista de la {trip}.",
    fr: "L'enfant reviendra dans la liste du {trip}.",
  },
  "Buscar pelo nome": {
    en: "Search by name",
    es: "Buscar por nombre",
    fr: "Rechercher par nom",
  },
  "Check-in: {trip}": {
    en: "Check-in: {trip}",
    es: "Check-in: {trip}",
    fr: "Check-in : {trip}",
  },
  "Chegadas por veículo": {
    en: "Arrivals by vehicle",
    es: "Llegadas por vehículo",
    fr: "Arrivées par véhicule",
  },
  "Crianças de ônibus que já embarcaram — {leg}": {
    en: "Bus children who already boarded — {leg}",
    es: "Niños de autobús que ya embarcaron — {leg}",
    fr: "Enfants du bus déjà montés — {leg}",
  },
  "Crianças que embarcaram": {
    en: "Children who boarded",
    es: "Niños que embarcaron",
    fr: "Enfants qui sont montés",
  },
  "Crianças que já embarcaram": {
    en: "Children who already boarded",
    es: "Niños que ya embarcaron",
    fr: "Enfants déjà montés",
  },
  "Crianças que já embarcaram em {vehicle}": {
    en: "Children who already boarded on {vehicle}",
    es: "Niños que ya embarcaron en {vehicle}",
    fr: "Enfants déjà montés dans {vehicle}",
  },
  "Embarcou às {time}": {
    en: "Boarded at {time}",
    es: "Embarcó a las {time}",
    fr: "Monté à {time}",
  },
  "Embarque de volta para a igreja": {
    en: "Boarding back to the church",
    es: "Embarque de vuelta a la iglesia",
    fr: "Embarquement du retour à l'église",
  },
  "Embarque para o acampamento": {
    en: "Boarding for camp",
    es: "Embarque hacia el campamento",
    fr: "Embarquement pour le camp",
  },
  "Esta criança não está disponível para o seu check-in.": {
    en: "This child is not available for your check-in.",
    es: "Este niño no está disponible para tu check-in.",
    fr: "Cet enfant n'est pas disponible pour votre check-in.",
  },
  "Este QR code não é de uma pulseira ou crachá do Acampa Kids.": {
    en: "This QR code is not from an Acampa Kids wristband or badge.",
    es: "Este código QR no es de una pulsera o credencial de Acampa Kids.",
    fr: "Ce QR code n'est pas celui d'un bracelet ou d'un badge Acampa Kids.",
  },
  "Fale com a organização para ajustar.": {
    en: "Talk to the organization to fix this.",
    es: "Habla con la organización para ajustarlo.",
    fr: "Parlez à l'organisation pour corriger cela.",
  },
  "Falar com {name} no WhatsApp · {phone}": {
    en: "Message {name} on WhatsApp · {phone}",
    es: "Hablar con {name} en WhatsApp · {phone}",
    fr: "Parler à {name} sur WhatsApp · {phone}",
  },
  "Faltam {n}": {
    en: "{n} missing",
    es: "Faltan {n}",
    fr: "Il en manque {n}",
  },
  "ida": {
    en: "outbound",
    es: "ida",
    fr: "aller",
  },
  "Ida": {
    en: "Outbound",
    es: "Ida",
    fr: "Aller",
  },
  "Ir para o check-in da ida para o acampamento": {
    en: "Go to outbound-to-camp check-in",
    es: "Ir al check-in de la ida al campamento",
    fr: "Aller au check-in de l'aller vers le camp",
  },
  "Ir para o check-in da volta para a igreja": {
    en: "Go to return-to-church check-in",
    es: "Ir al check-in de la vuelta a la iglesia",
    fr: "Aller au check-in du retour à l'église",
  },
  "Ler a pulseira ou o crachá": {
    en: "Scan the wristband or badge",
    es: "Leer la pulsera o la credencial",
    fr: "Lire le bracelet ou le badge",
  },
  "Mostrar todos": {
    en: "Show everyone",
    es: "Mostrar todos",
    fr: "Tout afficher",
  },
  "Não foi possível ler este QR code.": {
    en: "Could not read this QR code.",
    es: "No se pudo leer este código QR.",
    fr: "Impossible de lire ce QR code.",
  },
  "não embarcou na ida": {
    en: "did not board outbound",
    es: "no embarcó en la ida",
    fr: "n'a pas monté à l'aller",
  },
  "Nenhum ônibus cadastrado.": {
    en: "No buses registered.",
    es: "Ningún autobús registrado.",
    fr: "Aucun bus enregistré.",
  },
  "o responsável": {
    en: "the guardian",
    es: "el responsable",
    fr: "le responsable",
  },
  "O check-in do ônibus não está aberto agora.": {
    en: "Bus check-in is not open right now.",
    es: "El check-in del autobús no está abierto ahora.",
    fr: "Le check-in du bus n'est pas ouvert pour le moment.",
  },
  "O veículo que você ficaria na porta não existe mais.": {
    en: "The vehicle you would staff at the door no longer exists.",
    es: "El vehículo en cuya puerta estarías ya no existe.",
    fr: "Le véhicule dont vous teniez la porte n'existe plus.",
  },
  "Por veículo": {
    en: "By vehicle",
    es: "Por vehículo",
    fr: "Par véhicule",
  },
  "Precisa fazer o check-in na igreja primeiro": {
    en: "Needs church check-in first",
    es: "Necesita hacer el check-in en la iglesia primero",
    fr: "Doit d'abord faire le check-in à l'église",
  },
  "sem check-in na igreja": {
    en: "no church check-in",
    es: "sin check-in en la iglesia",
    fr: "sans check-in à l'église",
  },
  "Só quem falta": {
    en: "Only who's missing",
    es: "Solo quien falta",
    fr: "Seulement ceux qui manquent",
  },
  "Tirar {name} do ônibus?": {
    en: "Take {name} off the bus?",
    es: "¿Sacar a {name} del autobús?",
    fr: "Retirer {name} du bus ?",
  },
  "Todas as crianças": {
    en: "All children",
    es: "Todos los niños",
    fr: "Tous les enfants",
  },
  "Todas embarcaram! 🎉": {
    en: "Everyone boarded! 🎉",
    es: "¡Todos embarcaron! 🎉",
    fr: "Tout le monde est monté ! 🎉",
  },
  "Trecho da viagem": {
    en: "Trip leg",
    es: "Tramo del viaje",
    fr: "Trajet",
  },
  "Vai neste veículo na {leg}{phone}": {
    en: "Rides this vehicle on the {leg}{phone}",
    es: "Va en este vehículo en la {leg}{phone}",
    fr: "Va dans ce véhicule pour le {leg}{phone}",
  },
  "Veículo": {
    en: "Vehicle",
    es: "Vehículo",
    fr: "Véhicule",
  },
  "volta": {
    en: "return",
    es: "vuelta",
    fr: "retour",
  },
  "Volta": {
    en: "Return",
    es: "Vuelta",
    fr: "Retour",
  },
};
