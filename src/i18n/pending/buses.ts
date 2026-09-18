import type { Locale } from "../locales";

export const LITERALS: Record<string, Partial<Record<Exclude<Locale, "pt">, string>>> = {
  " · lotado": {
    en: " · full",
    es: " · lleno",
    fr: " · complet",
  },
  "· opcional": {
    en: "· optional",
    es: "· opcional",
    fr: "· facultatif",
  },
  "(com sua cor e número) e cada": {
    en: "(with its color and number) and each",
    es: "(con su color y número) y cada",
    fr: "(avec sa couleur et son numéro) et chaque",
  },
  "+ Criar o primeiro": {
    en: "+ Create the first one",
    es: "+ Crear el primero",
    fr: "+ Créer le premier",
  },
  "+ Novo": {
    en: "+ New",
    es: "+ Nuevo",
    fr: "+ Nouveau",
  },
  "{n} criança fica sem ônibus. Isso não pode ser desfeito.": {
    en: "{n} child will be left without a bus. This cannot be undone.",
    es: "{n} niño se queda sin autobús. Esto no se puede deshacer.",
    fr: "{n} enfant restera sans bus. Cette action est irréversible.",
  },
  "{n} crianças ficam sem ônibus. Isso não pode ser desfeito.": {
    en: "{n} children will be left without a bus. This cannot be undone.",
    es: "{n} niños se quedan sin autobús. Esto no se puede deshacer.",
    fr: "{n} enfants resteront sans bus. Cette action est irréversible.",
  },
  "{n} de {capacity} lugar": {
    en: "{n} of {capacity} seat",
    es: "{n} de {capacity} asiento",
    fr: "{n} sur {capacity} place",
  },
  "{n} de {capacity} lugares": {
    en: "{n} of {capacity} seats",
    es: "{n} de {capacity} asientos",
    fr: "{n} sur {capacity} places",
  },
  "✏️ Editar transporte": {
    en: "✏️ Edit transport",
    es: "✏️ Editar transporte",
    fr: "✏️ Modifier le transport",
  },
  "➕ Adicionar": {
    en: "➕ Add",
    es: "➕ Añadir",
    fr: "➕ Ajouter",
  },
  "⚠️ {n} criança ainda sem ônibus.": {
    en: "⚠️ {n} child still without a bus.",
    es: "⚠️ {n} niño aún sin autobús.",
    fr: "⚠️ {n} enfant encore sans bus.",
  },
  "⚠️ {n} crianças ainda sem ônibus.": {
    en: "⚠️ {n} children still without a bus.",
    es: "⚠️ {n} niños aún sin autobús.",
    fr: "⚠️ {n} enfants encore sans bus.",
  },
  "Ajudantes do check-in no ônibus": {
    en: "Bus check-in helpers",
    es: "Ayudantes del check-in en el autobús",
    fr: "Aides du check-in dans le bus",
  },
  "Arraste a turma de um líder para cá.": {
    en: "Drag a leader's group here.",
    es: "Arrastra el grupo de un líder aquí.",
    fr: "Faites glisser le groupe d'un leader ici.",
  },
  "Cadastre cada": {
    en: "Register each",
    es: "Registra cada",
    fr: "Enregistrez chaque",
  },
  "Capacidade (lugares)": {
    en: "Capacity (seats)",
    es: "Capacidad (asientos)",
    fr: "Capacité (places)",
  },
  "Carro": {
    en: "Car",
    es: "Coche",
    fr: "Voiture",
  },
  "carro": {
    en: "car",
    es: "coche",
    fr: "voiture",
  },
  "conferindo que a criança entregue pelos pais chegou até a nossa equipe": {
    en: "checking that the child handed over by the parents reached our team",
    es: "comprobando que el niño entregado por los padres llegó hasta nuestro equipo",
    fr: "vérifiant que l'enfant remis par les parents est bien arrivé jusqu'à notre équipe",
  },
  "Cor do ônibus": {
    en: "Bus color",
    es: "Color del autobús",
    fr: "Couleur du bus",
  },
  "Criar 🎉": {
    en: "Create 🎉",
    es: "Crear 🎉",
    fr: "Créer 🎉",
  },
  "de {n} crianças alocadas": {
    en: "of {n} children assigned",
    es: "de {n} niños asignados",
    fr: "de {n} enfants affectés",
  },
  "Editar transporte": {
    en: "Edit transport",
    es: "Editar transporte",
    fr: "Modifier le transport",
  },
  "Excluir \"{label}\"?": {
    en: "Delete \"{label}\"?",
    es: "¿Eliminar \"{label}\"?",
    fr: "Supprimer « {label} » ?",
  },
  "Excluir transporte": {
    en: "Delete transport",
    es: "Eliminar transporte",
    fr: "Supprimer le transport",
  },
  "ex.: 1": {
    en: "e.g. 1",
    es: "ej.: 1",
    fr: "ex. : 1",
  },
  "ex.: 46": {
    en: "e.g. 46",
    es: "ej.: 46",
    fr: "ex. : 46",
  },
  "ex.: Carro do João": {
    en: "e.g. João's car",
    es: "ej.: Coche de João",
    fr: "ex. : Voiture de João",
  },
  "Mostrar os líderes": {
    en: "Show the leaders",
    es: "Mostrar los líderes",
    fr: "Afficher les leaders",
  },
  "na porta de cada veículo": {
    en: "at the door of each vehicle",
    es: "en la puerta de cada vehículo",
    fr: "à la porte de chaque véhicule",
  },
  "Na porta de qual veículo?": {
    en: "At which vehicle's door?",
    es: "¿En la puerta de qué vehículo?",
    fr: "À la porte de quel véhicule ?",
  },
  "Na porta: {label}": {
    en: "At the door: {label}",
    es: "En la puerta: {label}",
    fr: "À la porte : {label}",
  },
  "Nenhum transporte cadastrado. Crie os veículos em Configurações → Transporte.": {
    en: "No transport registered. Create the vehicles in Settings → Transport.",
    es: "Ningún transporte registrado. Crea los vehículos en Ajustes → Transporte.",
    fr: "Aucun transport enregistré. Créez les véhicules dans Réglages → Transport.",
  },
  "Ninguém na porta de nenhum veículo. Só o admin faz a chamada no ônibus.": {
    en: "Nobody at any vehicle door. Only the admin does roll call on the bus.",
    es: "Nadie en la puerta de ningún vehículo. Solo el admin hace la lista en el autobús.",
    fr: "Personne à la porte d'aucun véhicule. Seul l'admin fait l'appel dans le bus.",
  },
  "Novo transporte": {
    en: "New transport",
    es: "Nuevo transporte",
    fr: "Nouveau transport",
  },
  "Número do ônibus": {
    en: "Bus number",
    es: "Número del autobús",
    fr: "Numéro du bus",
  },
  "O nome do ônibus é automático:": {
    en: "The bus name is automatic:",
    es: "El nombre del autobús es automático:",
    fr: "Le nom du bus est automatique :",
  },
  "ônibus": {
    en: "bus",
    es: "autobús",
    fr: "bus",
  },
  "Qual veículo?": {
    en: "Which vehicle?",
    es: "¿Qué vehículo?",
    fr: "Quel véhicule ?",
  },
  "que traz as crianças ao acampamento.": {
    en: "that brings the children to camp.",
    es: "que trae a los niños al campamento.",
    fr: "qui amène les enfants au camp.",
  },
  "Quem fica": {
    en: "Who stays",
    es: "Quién se queda",
    fr: "Qui reste",
  },
  "Todas as crianças têm ônibus. 🎉": {
    en: "All children have a bus. 🎉",
    es: "Todos los niños tienen autobús. 🎉",
    fr: "Tous les enfants ont un bus. 🎉",
  },
  "Todo mundo tem ônibus. 🎉": {
    en: "Everyone has a bus. 🎉",
    es: "Todo el mundo tiene autobús. 🎉",
    fr: "Tout le monde a un bus. 🎉",
  },
  "Tipo": {
    en: "Type",
    es: "Tipo",
    fr: "Type",
  },
  "Turma de {name}: {who}": {
    en: "{name}'s group: {who}",
    es: "Grupo de {name}: {who}",
    fr: "Groupe de {name} : {who}",
  },
  "alocar os ônibus": {
    en: "assign the buses",
    es: "asignar los autobuses",
    fr: "attribuer les bus",
  },
};
