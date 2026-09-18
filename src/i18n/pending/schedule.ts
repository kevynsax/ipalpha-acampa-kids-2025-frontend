import type { Locale } from "../locales";

export const LITERALS: Record<string, Partial<Record<Exclude<Locale, "pt">, string>>> = {
  "Evento não encontrado.": {
    en: "Event not found.",
    es: "Evento no encontrado.",
    fr: "Événement introuvable.",
  },
  "Ver programação": {
    en: "View schedule",
    es: "Ver programación",
    fr: "Voir le programme",
  },
  "Novo evento": {
    en: "New event",
    es: "Nuevo evento",
    fr: "Nouvel événement",
  },
  "Nova função": {
    en: "New role",
    es: "Nueva función",
    fr: "Nouvelle fonction",
  },
  "✏️ Editar evento": {
    en: "✏️ Edit event",
    es: "✏️ Editar evento",
    fr: "✏️ Modifier l'événement",
  },
  "🎯 Nova função": {
    en: "🎯 New role",
    es: "🎯 Nueva función",
    fr: "🎯 Nouvelle fonction",
  },
  "✏️ Editar função": {
    en: "✏️ Edit role",
    es: "✏️ Editar función",
    fr: "✏️ Modifier la fonction",
  },
  "+ Evento": {
    en: "+ Event",
    es: "+ Evento",
    fr: "+ Événement",
  },
  "+ Função": {
    en: "+ Role",
    es: "+ Función",
    fr: "+ Fonction",
  },
  'Excluir "{title}"?': {
    en: 'Delete "{title}"?',
    es: '¿Eliminar "{title}"?',
    fr: 'Supprimer « {title} » ?',
  },
  '{when} · Isso não pode ser desfeito.': {
    en: "{when} · This cannot be undone.",
    es: "{when} · Esto no se puede deshacer.",
    fr: "{when} · Cette action est irréversible.",
  },
  'Excluir a função "{name}"?': {
    en: 'Delete the role "{name}"?',
    es: '¿Eliminar la función "{name}"?',
    fr: 'Supprimer la fonction « {name} » ?',
  },
  'Excluir evento "{title}"': {
    en: 'Delete event "{title}"',
    es: 'Eliminar evento "{title}"',
    fr: 'Supprimer l\'événement « {title} »',
  },
  "Remova esta função dos {n} evento(s) antes de excluir": {
    en: "Remove this role from the {n} event(s) before deleting",
    es: "Quita esta función de los {n} evento(s) antes de eliminar",
    fr: "Retirez cette fonction des {n} événement(s) avant de supprimer",
  },
  'Excluir função "{name}"': {
    en: 'Delete role "{name}"',
    es: 'Eliminar función "{name}"',
    fr: 'Supprimer la fonction « {name} »',
  },
  "Eventos": {
    en: "Events",
    es: "Eventos",
    fr: "Événements",
  },
  "Função não encontrada.": {
    en: "Role not found.",
    es: "Función no encontrada.",
    fr: "Fonction introuvable.",
  },
  "Nenhum evento ainda. Monte a programação do acampamento!": {
    en: "No events yet. Build the camp schedule!",
    es: "Ningún evento todavía. ¡Arma la programación del campamento!",
    fr: "Aucun événement pour l'instant. Montez le programme du camp !",
  },
  "+ Criar evento": {
    en: "+ Create event",
    es: "+ Crear evento",
    fr: "+ Créer un événement",
  },
  "Novo evento em {day}": {
    en: "New event on {day}",
    es: "Nuevo evento el {day}",
    fr: "Nouvel événement le {day}",
  },
  "Só a equipe vê — clicar para os pais verem": {
    en: "Staff only — click so parents can see it",
    es: "Solo el equipo ve — clic para que los padres vean",
    fr: "L'équipe seule voit — cliquer pour que les parents voient",
  },
  "Os pais veem — clicar para esconder": {
    en: "Parents can see it — click to hide",
    es: "Los padres ven — clic para ocultar",
    fr: "Les parents voient — cliquer pour masquer",
  },
  "Os pais não veem este evento": {
    en: "Parents cannot see this event",
    es: "Los padres no ven este evento",
    fr: "Les parents ne voient pas cet événement",
  },
  "Os pais veem este evento": {
    en: "Parents can see this event",
    es: "Los padres ven este evento",
    fr: "Les parents voient cet événement",
  },
  "{name}: vai sozinha para {who} — ver função": {
    en: "{name}: applies on its own to {who} — view role",
    es: "{name}: va sola para {who} — ver función",
    fr: "{name} : s'applique seule à {who} — voir la fonction",
  },
  "{name}: vai sozinha para {who} + {n} escalado(s) — ver função": {
    en: "{name}: applies on its own to {who} + {n} assigned — view role",
    es: "{name}: va sola para {who} + {n} escalado(s) — ver función",
    fr: "{name} : s'applique seule à {who} + {n} assigné(s) — voir la fonction",
  },
  "{name}: ninguém escalado — ver função": {
    en: "{name}: nobody assigned — view role",
    es: "{name}: nadie escalado — ver función",
    fr: "{name} : personne assignée — voir la fonction",
  },
  "{name}: {n} escalado(s) — ver função": {
    en: "{name}: {n} assigned — view role",
    es: "{name}: {n} escalado(s) — ver función",
    fr: "{name} : {n} assigné(s) — voir la fonction",
  },
  "Nenhuma função ainda. Cadastre o que a equipe faz em cada evento — com instruções!": {
    en: "No roles yet. Add what staff do at each event — with instructions!",
    es: "Ninguna función todavía. ¡Registra lo que el equipo hace en cada evento — con instrucciones!",
    fr: "Aucune fonction pour l'instant. Enregistrez ce que l'équipe fait à chaque événement — avec des instructions !",
  },
  "+ Criar função": {
    en: "+ Create role",
    es: "+ Crear función",
    fr: "+ Créer une fonction",
  },
  "Não usada em nenhum evento": {
    en: "Not used in any event",
    es: "No usada en ningún evento",
    fr: "Utilisée dans aucun événement",
  },
  "Usada em {n} evento": {
    en: "Used in {n} event",
    es: "Usada en {n} evento",
    fr: "Utilisée dans {n} événement",
  },
  "Usada em {n} eventos": {
    en: "Used in {n} events",
    es: "Usada en {n} eventos",
    fr: "Utilisée dans {n} événements",
  },
  "ocultar instruções": {
    en: "hide instructions",
    es: "ocultar instrucciones",
    fr: "masquer les instructions",
  },
  "ver instruções": {
    en: "view instructions",
    es: "ver instrucciones",
    fr: "voir les instructions",
  },
  "sem instruções": {
    en: "no instructions",
    es: "sin instrucciones",
    fr: "pas d'instructions",
  },
  "Editar evento": {
    en: "Edit event",
    es: "Editar evento",
    fr: "Modifier l'événement",
  },
  "Quando": {
    en: "When",
    es: "Cuándo",
    fr: "Quand",
  },
  "veem": {
    en: "can see",
    es: "ven",
    fr: "voient",
  },
  "não veem": {
    en: "cannot see",
    es: "no ven",
    fr: "ne voient pas",
  },
  "Adicionar função neste evento": {
    en: "Add a role to this event",
    es: "Añadir función en este evento",
    fr: "Ajouter une fonction à cet événement",
  },
  "Este evento não tem funções.": {
    en: "This event has no roles.",
    es: "Este evento no tiene funciones.",
    fr: "Cet événement n'a aucune fonction.",
  },
  "adicionar": {
    en: "add",
    es: "añadir",
    fr: "ajouter",
  },
  "Por posição": {
    en: "By position",
    es: "Por posición",
    fr: "Par poste",
  },
  "Editar a função {name}": {
    en: "Edit the role {name}",
    es: "Editar la función {name}",
    fr: "Modifier la fonction {name}",
  },
  "Tirar {name} deste evento": {
    en: "Remove {name} from this event",
    es: "Quitar {name} de este evento",
    fr: "Retirer {name} de cet événement",
  },
  "Tirar {emoji} {name} deste evento?": {
    en: "Remove {emoji} {name} from this event?",
    es: "¿Quitar {emoji} {name} de este evento?",
    fr: "Retirer {emoji} {name} de cet événement ?",
  },
  "As {n} pessoas que fazem esta função aqui saem dela neste evento. A função continua no catálogo.": {
    en: "The {n} people in this role here leave it for this event. The role stays in the catalogue.",
    es: "Las {n} personas que hacen esta función aquí salen de ella en este evento. La función sigue en el catálogo.",
    fr: "Les {n} personnes qui font cette fonction ici la quittent pour cet événement. La fonction reste dans le catalogue.",
  },
  "A 1 pessoa que faz esta função aqui sai dela neste evento. A função continua no catálogo.": {
    en: "The 1 person in this role here leaves it for this event. The role stays in the catalogue.",
    es: "La 1 persona que hace esta función aquí sale de ella en este evento. La función sigue en el catálogo.",
    fr: "La 1 personne qui fait cette fonction ici la quitte pour cet événement. La fonction reste dans le catalogue.",
  },
  "A função sai deste evento. Ela continua no catálogo.": {
    en: "The role leaves this event. It stays in the catalogue.",
    es: "La función sale de este evento. Sigue en el catálogo.",
    fr: "La fonction quitte cet événement. Elle reste dans le catalogue.",
  },
  "Tirar": {
    en: "Remove",
    es: "Quitar",
    fr: "Retirer",
  },
  "🚩 O detalhe é o time de cada um — mude o time na ficha da pessoa.": {
    en: "🚩 The detail is each person's team — change the team on their profile.",
    es: "🚩 El detalle es el equipo de cada uno — cambia el equipo en la ficha de la persona.",
    fr: "🚩 Le détail est l'équipe de chacun — changez l'équipe sur la fiche de la personne.",
  },
  "{n} pessoa: {hint}, sem escalar uma por uma": {
    en: "{n} person: {hint}, without assigning one by one",
    es: "{n} persona: {hint}, sin escalar una por una",
    fr: "{n} personne : {hint}, sans assigner une par une",
  },
  "{n} pessoas: {hint}, sem escalar uma por uma": {
    en: "{n} people: {hint}, without assigning one by one",
    es: "{n} personas: {hint}, sin escalar una por una",
    fr: "{n} personnes : {hint}, sans assigner une par une",
  },
  "{name} foi escalado(a) à mão": {
    en: "{name} was assigned by hand",
    es: "{name} fue escalado(a) a mano",
    fr: "{name} a été assigné(e) à la main",
  },
  "Time de {name}": {
    en: "{name}'s team",
    es: "Equipo de {name}",
    fr: "Équipe de {name}",
  },
  "{name} não tem time": {
    en: "{name} has no team",
    es: "{name} no tiene equipo",
    fr: "{name} n'a pas d'équipe",
  },
  "sem time": {
    en: "no team",
    es: "sin equipo",
    fr: "sans équipe",
  },
  "Mudar o detalhe de {name}": {
    en: "Change {name}'s detail",
    es: "Cambiar el detalle de {name}",
    fr: "Modifier le détail de {name}",
  },
  "Preencher o detalhe de {name}": {
    en: "Fill in {name}'s detail",
    es: "Completar el detalle de {name}",
    fr: "Renseigner le détail de {name}",
  },
  "Mudar o detalhe de {name}: {detail}": {
    en: "Change {name}'s detail: {detail}",
    es: "Cambiar el detalle de {name}: {detail}",
    fr: "Modifier le détail de {name} : {detail}",
  },
  "Tirar {person} de {role}": {
    en: "Remove {person} from {role}",
    es: "Quitar a {person} de {role}",
    fr: "Retirer {person} de {role}",
  },
  "Escalar alguém como {name}": {
    en: "Assign someone as {name}",
    es: "Escalar a alguien como {name}",
    fr: "Assigner quelqu'un comme {name}",
  },
  "Adicionar pessoa": {
    en: "Add person",
    es: "Añadir persona",
    fr: "Ajouter une personne",
  },
  "em {emoji} {title}": {
    en: "in {emoji} {title}",
    es: "en {emoji} {title}",
    fr: "dans {emoji} {title}",
  },
  "🏷️ Detalhe — {name}": {
    en: "🏷️ Detail — {name}",
    es: "🏷️ Detalle — {name}",
    fr: "🏷️ Détail — {name}",
  },
  "ex.: Base 3": {
    en: "e.g. Base 3",
    es: "ej.: Base 3",
    fr: "ex. : Base 3",
  },
  "Sem cor": {
    en: "No colour",
    es: "Sin color",
    fr: "Sans couleur",
  },
  "Cor personalizada": {
    en: "Custom colour",
    es: "Color personalizado",
    fr: "Couleur personnalisée",
  },
  "Rosa": {
    en: "Pink",
    es: "Rosa",
    fr: "Rose",
  },
  "Preparação (antes do acampamento)": {
    en: "Prep (before camp)",
    es: "Preparación (antes del campamento)",
    fr: "Préparation (avant le camp)",
  },
  "Nada a preparar para esta função.": {
    en: "Nothing to prepare for this role.",
    es: "Nada que preparar para esta función.",
    fr: "Rien à préparer pour cette fonction.",
  },
  "📝 Instruções para a equipe": {
    en: "📝 Instructions for staff",
    es: "📝 Instrucciones para el equipo",
    fr: "📝 Instructions pour l'équipe",
  },
  "Sem instruções ainda.": {
    en: "No instructions yet.",
    es: "Sin instrucciones todavía.",
    fr: "Pas encore d'instructions.",
  },
  "ex.: Piscina": {
    en: "e.g. Pool",
    es: "ej.: Piscina",
    fr: "ex. : Piscine",
  },
  "Data": {
    en: "Date",
    es: "Fecha",
    fr: "Date",
  },
  "Hora de início": {
    en: "Start time",
    es: "Hora de inicio",
    fr: "Heure de début",
  },
  "Fim (opcional)": {
    en: "End (optional)",
    es: "Fin (opcional)",
    fr: "Fin (facultatif)",
  },
  "Hora de fim (opcional)": {
    en: "End time (optional)",
    es: "Hora de fin (opcional)",
    fr: "Heure de fin (facultatif)",
  },
  "O fim precisa ser depois do início.": {
    en: "The end must be after the start.",
    es: "El fin debe ser después del inicio.",
    fr: "La fin doit être après le début.",
  },
  "Pais veem": {
    en: "Parents see",
    es: "Padres ven",
    fr: "Les parents voient",
  },
  "Aparece na programação dos pais. A equipe sempre vê.": {
    en: "Shows on the parents' schedule. Staff always see it.",
    es: "Aparece en la programación de los padres. El equipo siempre ve.",
    fr: "Apparaît dans le programme des parents. L'équipe le voit toujours.",
  },
  "ex.: levar apito e prancheta": {
    en: "e.g. bring a whistle and clipboard",
    es: "ej.: llevar silbato y planilla",
    fr: "ex. : apporter un sifflet et un bloc-notes",
  },
  "Criar evento 🎉": {
    en: "Create event 🎉",
    es: "Crear evento 🎉",
    fr: "Créer l'événement 🎉",
  },
  "Editar função": {
    en: "Edit role",
    es: "Editar función",
    fr: "Modifier la fonction",
  },
  "escrever": {
    en: "write",
    es: "escribir",
    fr: "écrire",
  },
  "🎯 Só quem for escalado — pessoa por pessoa, em cada evento.": {
    en: "🎯 Only who is assigned — person by person, at each event.",
    es: "🎯 Solo quien sea escalado — persona por persona, en cada evento.",
    fr: "🎯 Seulement qui est assigné — personne par personne, à chaque événement.",
  },
  "Onde é usada": {
    en: "Where it's used",
    es: "Dónde se usa",
    fr: "Où elle est utilisée",
  },
  "Esta função ainda não está em nenhum evento.": {
    en: "This role is not in any event yet.",
    es: "Esta función aún no está en ningún evento.",
    fr: "Cette fonction n'est encore dans aucun événement.",
  },
  "Escalar alguém como {name} em {title}": {
    en: "Assign someone as {name} in {title}",
    es: "Escalar a alguien como {name} en {title}",
    fr: "Assigner quelqu'un comme {name} dans {title}",
  },
  "ninguém ainda": {
    en: "nobody yet",
    es: "nadie todavía",
    fr: "personne pour l'instant",
  },
  "{name} foi escalado(a) à mão — ver": {
    en: "{name} was assigned by hand — view",
    es: "{name} fue escalado(a) a mano — ver",
    fr: "{name} a été assigné(e) à la main — voir",
  },
  "ex.: Supervisão da piscina": {
    en: "e.g. Pool supervision",
    es: "ej.: Supervisión de la piscina",
    fr: "ex. : Surveillance de la piscine",
  },
  "⚙️ Quem faz esta função": {
    en: "⚙️ Who does this role",
    es: "⚙️ Quién hace esta función",
    fr: "⚙️ Qui fait cette fonction",
  },
  "🏷️ Tem um detalhe por pessoa": {
    en: "🏷️ Has a detail per person",
    es: "🏷️ Tiene un detalle por persona",
    fr: "🏷️ A un détail par personne",
  },
  "🚩 O detalhe é o time da pessoa": {
    en: "🚩 The detail is the person's team",
    es: "🚩 El detalle es el equipo de la persona",
    fr: "🚩 Le détail est l'équipe de la personne",
  },
  "Dica do detalhe (aparece no campo)": {
    en: "Detail hint (shown in the field)",
    es: "Pista del detalle (aparece en el campo)",
    fr: "Indice du détail (affiché dans le champ)",
  },
  "ex.: Base 3 · 14h–14h45": {
    en: "e.g. Base 3 · 2–2:45pm",
    es: "ej.: Base 3 · 14h–14h45",
    fr: "ex. : Base 3 · 14h–14h45",
  },
  "O que a pessoa nesta função precisa fazer.": {
    en: "What the person in this role needs to do.",
    es: "Lo que la persona en esta función necesita hacer.",
    fr: "Ce que la personne dans cette fonction doit faire.",
  },
  "ex.: Fique dentro da área da piscina durante todo o turno…": {
    en: "e.g. Stay inside the pool area for the whole shift…",
    es: "ej.: Quédate dentro del área de la piscina durante todo el turno…",
    fr: "ex. : Restez dans la zone de la piscine pendant tout le créneau…",
  },
  "O que quem faz esta função precisa **levar, vestir ou preparar** — ex.: “roupa verde estilo exército com boné”.": {
    en: "What whoever does this role needs to **bring, wear or prepare** — e.g. “green army-style outfit with a cap”.",
    es: "Lo que quien hace esta función necesita **llevar, vestir o preparar** — ej.: “ropa verde estilo ejército con gorra”.",
    fr: "Ce que celui qui fait cette fonction doit **apporter, porter ou préparer** — ex. : « tenue verte style armée avec casquette ».",
  },
  "ex.: Leve uma camiseta verde e um boné — quanto mais parecido com o exército, melhor! 🥣": {
    en: "e.g. Bring a green T-shirt and a cap — the more army-like, the better! 🥣",
    es: "ej.: Lleva una camiseta verde y una gorra — ¡cuanto más parecido al ejército, mejor! 🥣",
    fr: "ex. : Apportez un T-shirt vert et une casquette — plus c'est armée, mieux c'est ! 🥣",
  },
  "Criar função 🎉": {
    en: "Create role 🎉",
    es: "Crear función 🎉",
    fr: "Créer la fonction 🎉",
  },
  "Quem faz esta função": {
    en: "Who does this role",
    es: "Quién hace esta función",
    fr: "Qui fait cette fonction",
  },
  "Pessoas específicas": {
    en: "Specific people",
    es: "Personas específicas",
    fr: "Personnes spécifiques",
  },
  "escolhidas por você": {
    en: "chosen by you",
    es: "elegidas por ti",
    fr: "choisies par vous",
  },
  "quem cuida de crianças": {
    en: "who looks after children",
    es: "quien cuida de niños",
    fr: "qui s'occupe des enfants",
  },
  "os auxiliares de quarto": {
    en: "the room helpers",
    es: "los auxiliares de habitación",
    fr: "les auxiliaires de chambre",
  },
  "líderes e auxiliares": {
    en: "leaders and helpers",
    es: "líderes y auxiliares",
    fr: "responsables et auxiliaires",
  },
  "Descartar o que você escreveu?": {
    en: "Discard what you wrote?",
    es: "¿Descartar lo que escribiste?",
    fr: "Abandonner ce que vous avez écrit ?",
  },
  "Não foi possível salvar.": {
    en: "Could not save.",
    es: "No se pudo guardar.",
    fr: "Impossible d'enregistrer.",
  },
  "{kind} — {name}": {
    en: "{kind} — {name}",
    es: "{kind} — {name}",
    fr: "{kind} — {name}",
  },
  "Adicionar função": {
    en: "Add role",
    es: "Añadir función",
    fr: "Ajouter une fonction",
  },
  "🎯 Adicionar função": {
    en: "🎯 Add role",
    es: "🎯 Añadir función",
    fr: "🎯 Ajouter une fonction",
  },
  "Escolher existente": {
    en: "Choose existing",
    es: "Elegir existente",
    fr: "Choisir une existante",
  },
  "do catálogo de funções do acampamento": {
    en: "from the camp's role catalogue",
    es: "del catálogo de funciones del campamento",
    fr: "du catalogue de fonctions du camp",
  },
  "Criar nova": {
    en: "Create new",
    es: "Crear nueva",
    fr: "Créer une nouvelle",
  },
  "instruções e preparação ficam para depois": {
    en: "instructions and prep come later",
    es: "instrucciones y preparación quedan para después",
    fr: "instructions et préparation viennent plus tard",
  },
  "Escolher função": {
    en: "Choose role",
    es: "Elegir función",
    fr: "Choisir une fonction",
  },
  "🎯 Escolher função existente": {
    en: "🎯 Choose an existing role",
    es: "🎯 Elegir función existente",
    fr: "🎯 Choisir une fonction existante",
  },
  "Buscar função": {
    en: "Search role",
    es: "Buscar función",
    fr: "Rechercher une fonction",
  },
  "Nenhuma função cadastrada ainda.": {
    en: "No roles registered yet.",
    es: "Ninguna función registrada todavía.",
    fr: "Aucune fonction enregistrée pour l'instant.",
  },
  "Nenhuma função com esse nome.": {
    en: "No role with that name.",
    es: "Ninguna función con ese nombre.",
    fr: "Aucune fonction avec ce nom.",
  },
  "Todas as funções já estão aqui.": {
    en: "All roles are already here.",
    es: "Todas las funciones ya están aquí.",
    fr: "Toutes les fonctions sont déjà ici.",
  },
  "🚩 detalhe = time": {
    en: "🚩 detail = team",
    es: "🚩 detalle = equipo",
    fr: "🚩 détail = équipe",
  },
  "1 função já está aqui.": {
    en: "1 role is already here.",
    es: "1 función ya está aquí.",
    fr: "1 fonction est déjà ici.",
  },
  "{n} funções já estão aqui.": {
    en: "{n} roles are already here.",
    es: "{n} funciones ya están aquí.",
    fr: "{n} fonctions sont déjà ici.",
  },
  "‹ Voltar": {
    en: "‹ Back",
    es: "‹ Volver",
    fr: "‹ Retour",
  },
  "+ Criar nova": {
    en: "+ Create new",
    es: "+ Crear nueva",
    fr: "+ Créer une nouvelle",
  },
  "outra função": {
    en: "another role",
    es: "otra función",
    fr: "une autre fonction",
  },
  "neste evento": {
    en: "in this event",
    es: "en este evento",
    fr: "dans cet événement",
  },
  "Quem?": {
    en: "Who?",
    es: "¿Quién?",
    fr: "Qui ?",
  },
  "Trocar função": {
    en: "Swap role",
    es: "Cambiar función",
    fr: "Changer de fonction",
  },
  "Vincular função": {
    en: "Assign role",
    es: "Vincular función",
    fr: "Lier une fonction",
  },
  "Trocar função?": {
    en: "Swap role?",
    es: "¿Cambiar de función?",
    fr: "Changer de fonction ?",
  },
  "🎯 Vincular função — {name}": {
    en: "🎯 Assign role — {name}",
    es: "🎯 Vincular función — {name}",
    fr: "🎯 Lier une fonction — {name}",
  },
  "Evento": {
    en: "Event",
    es: "Evento",
    fr: "Événement",
  },
  "Escolha o evento": {
    en: "Choose the event",
    es: "Elige el evento",
    fr: "Choisissez l'événement",
  },
  "Este evento só tem funções que já valem para toda a equipe. Nada a escalar aqui.": {
    en: "This event only has roles that already cover the whole staff. Nothing to assign here.",
    es: "Este evento solo tiene funciones que ya valen para todo el equipo. Nada que escalar aquí.",
    fr: "Cet événement n'a que des fonctions qui couvrent déjà toute l'équipe. Rien à assigner ici.",
  },
  "{name} já está como {role} neste evento — vamos confirmar a troca.": {
    en: "{name} is already {role} in this event — we'll confirm the swap.",
    es: "{name} ya está como {role} en este evento — vamos a confirmar el cambio.",
    fr: "{name} est déjà {role} dans cet événement — nous confirmerons le changement.",
  },
  "{name} já está como {role} em {where} — vamos confirmar a troca.": {
    en: "{name} is already {role} in {where} — we'll confirm the swap.",
    es: "{name} ya está como {role} en {where} — vamos a confirmar el cambio.",
    fr: "{name} est déjà {role} dans {where} — nous confirmerons le changement.",
  },
  "{name} já tem função neste evento:": {
    en: "{name} already has a role in this event:",
    es: "{name} ya tiene función en este evento:",
    fr: "{name} a déjà une fonction dans cet événement :",
  },
  "{name} já tem função no mesmo horário:": {
    en: "{name} already has a role at the same time:",
    es: "{name} ya tiene función en el mismo horario:",
    fr: "{name} a déjà une fonction au même horaire :",
  },
  "Troca de função": {
    en: "Role swap",
    es: "Cambio de función",
    fr: "Changement de fonction",
  },
  "Passa a": {
    en: "Becomes",
    es: "Pasa a",
    fr: "Devient",
  },
  "A função no outro evento continua — confira a escala depois.": {
    en: "The role in the other event stays — check the roster afterwards.",
    es: "La función en el otro evento continúa — revisa la escala después.",
    fr: "La fonction dans l'autre événement reste — vérifiez l'échelle ensuite.",
  },
  "{person} como {role} em {event}": {
    en: "{person} as {role} in {event}",
    es: "{person} como {role} en {event}",
    fr: "{person} comme {role} dans {event}",
  },
  "🚩 O detalhe desta função é o time da pessoa — nada a preencher. Só quem tem time aparece na lista.": {
    en: "🚩 This role's detail is the person's team — nothing to fill in. Only people with a team show in the list.",
    es: "🚩 El detalle de esta función es el equipo de la persona — nada que completar. Solo quien tiene equipo aparece en la lista.",
    fr: "🚩 Le détail de cette fonction est l'équipe de la personne — rien à remplir. Seules les personnes avec une équipe apparaissent dans la liste.",
  },
  "detalhe": {
    en: "detail",
    es: "detalle",
    fr: "détail",
  },
  "Vincular": {
    en: "Assign",
    es: "Vincular",
    fr: "Lier",
  },
  "Olá, {name}! Aqui está a sua escala — o que você faz em cada momento do acampamento.": {
    en: "Hi, {name}! Here is your roster — what you do at each moment of camp.",
    es: "¡Hola, {name}! Aquí está tu escala — lo que haces en cada momento del campamento.",
    fr: "Bonjour, {name} ! Voici votre échelle — ce que vous faites à chaque moment du camp.",
  },
  "Olá, {name}! Você ainda não tem nada na escala.": {
    en: "Hi, {name}! You don't have anything on the roster yet.",
    es: "¡Hola, {name}! Todavía no tienes nada en la escala.",
    fr: "Bonjour, {name} ! Vous n'avez encore rien sur l'échelle.",
  },
  "Toda a programação do acampamento. Onde tem algo para você fazer, aparece a sua função.": {
    en: "The whole camp schedule. Where there's something for you to do, your role shows up.",
    es: "Toda la programación del campamento. Donde hay algo para ti, aparece tu función.",
    fr: "Tout le programme du camp. Là où il y a quelque chose à faire pour vous, votre fonction apparaît.",
  },
  "Filtro da programação": {
    en: "Schedule filter",
    es: "Filtro de la programación",
    fr: "Filtre du programme",
  },
  "Minha escala": {
    en: "My roster",
    es: "Mi escala",
    fr: "Mon échelle",
  },
  "Tudo": {
    en: "Everything",
    es: "Todo",
    fr: "Tout",
  },
  "Nenhuma função na sua escala por enquanto. Veja a programação completa!": {
    en: "No roles on your roster for now. See the full schedule!",
    es: "Ninguna función en tu escala por ahora. ¡Mira la programación completa!",
    fr: "Aucune fonction sur votre échelle pour l'instant. Voyez le programme complet !",
  },
  "A programação ainda não foi publicada.": {
    en: "The schedule hasn't been published yet.",
    es: "La programación aún no fue publicada.",
    fr: "Le programme n'a pas encore été publié.",
  },
  "Ver tudo": {
    en: "See everything",
    es: "Ver todo",
    fr: "Tout voir",
  },
  "Esconder o que já aconteceu": {
    en: "Hide what already happened",
    es: "Ocultar lo que ya pasó",
    fr: "Masquer ce qui s'est déjà passé",
  },
  "{n} item já aconteceu": {
    en: "{n} item already happened",
    es: "{n} ítem ya pasó",
    fr: "{n} élément déjà passé",
  },
  "{n} itens já aconteceram": {
    en: "{n} items already happened",
    es: "{n} ítems ya pasaron",
    fr: "{n} éléments déjà passés",
  },
  "recolher": {
    en: "collapse",
    es: "recoger",
    fr: "replier",
  },
  "mostrar": {
    en: "show",
    es: "mostrar",
    fr: "afficher",
  },
  "Você está escalado(a) nesta função": {
    en: "You are assigned to this role",
    es: "Estás escalado(a) en esta función",
    fr: "Vous êtes assigné(e) à cette fonction",
  },
  "Função automática de {audience}": {
    en: "Automatic role for {audience}",
    es: "Función automática de {audience}",
    fr: "Fonction automatique de {audience}",
  },
  "📝 instruções": {
    en: "📝 instructions",
    es: "📝 instrucciones",
    fr: "📝 instructions",
  },
  "Toda a programação do acampamento.": {
    en: "The whole camp schedule.",
    es: "Toda la programación del campamento.",
    fr: "Tout le programme du camp.",
  },
  "Vai sozinha para": {
    en: "Applies on its own to",
    es: "Va sola para",
    fr: "S'applique seule à",
  },
  "nos eventos abaixo, exceto quem tiver outra função lá.": {
    en: "in the events below, except anyone with another role there.",
    es: "en los eventos de abajo, excepto quien tenga otra función allí.",
    fr: "dans les événements ci-dessous, sauf qui a une autre fonction là.",
  },
  "Dá para acrescentar pessoas específicas em cada evento.": {
    en: "You can still add specific people per event.",
    es: "Se pueden añadir personas específicas en cada evento.",
    fr: "On peut encore ajouter des personnes spécifiques par événement.",
  },
  "O que quem faz esta função precisa": {
    en: "What whoever does this role needs to",
    es: "Lo que quien hace esta función necesita",
    fr: "Ce que celui qui fait cette fonction doit",
  },
  "levar, vestir ou preparar": {
    en: "bring, wear or prepare",
    es: "llevar, vestir o preparar",
    fr: "apporter, porter ou préparer",
  },
  "— ex.: “roupa verde estilo exército com boné”.": {
    en: "— e.g. “green army-style outfit with a cap”.",
    es: "— ej.: “ropa verde estilo ejército con gorra”.",
    fr: "— ex. : « tenue verte style armée avec casquette ».",
  },
};
