import type { Locale } from "../locales";

export const LITERALS: Record<string, Partial<Record<Exclude<Locale, "pt">, string>>> = {
  "Não foi possível carregar as sementes.": {
    en: "Could not load the seeds.",
    es: "No se pudieron cargar las semillas.",
    fr: "Impossible de charger les graines.",
  },
  "Restaurar TODAS as sementes?": {
    en: "Restore ALL seeds?",
    es: "¿Restaurar TODAS las semillas?",
    fr: "Restaurer TOUTES les graines ?",
  },
  "Volta para os padrões que o app traz e joga fora o que foi salvo. O assistente volta a usar os padrões.": {
    en: "Returns to the app's built-in defaults and discards what was saved. The assistant goes back to using the defaults.",
    es: "Vuelve a los valores predeterminados que trae la app y descarta lo guardado. El asistente vuelve a usar los valores predeterminados.",
    fr: "Revient aux valeurs par défaut de l'appli et jette ce qui a été enregistré. L'assistant reprend les valeurs par défaut.",
  },
  "Restaurar tudo": {
    en: "Restore all",
    es: "Restaurar todo",
    fr: "Tout restaurer",
  },
  "Carregando sementes… 🌱": {
    en: "Loading seeds… 🌱",
    es: "Cargando semillas… 🌱",
    fr: "Chargement des graines… 🌱",
  },
  "Salvar sementes": {
    en: "Save seeds",
    es: "Guardar semillas",
    fr: "Enregistrer les graines",
  },
  "Os modelos que o": {
    en: "The templates that the",
    es: "Los modelos que el",
    fr: "Les modèles que l'",
  },
  "importa: locais de acampamento, programação com suas funções, frota de ônibus e os primeiros documentos.": {
    en: "imports: camping venues, schedule with its roles, bus fleet and the starter documents.",
    es: "importa: locales de campamento, programación con sus funciones, flota de autobuses y los primeros documentos.",
    fr: "importe : lieux de camp, programme avec ses fonctions, flotte de bus et les premiers documents.",
  },
  "Última atualização: {when}.": {
    en: "Last updated: {when}.",
    es: "Última actualización: {when}.",
    fr: "Dernière mise à jour : {when}.",
  },
  "Nada foi salvo ainda — o assistente usa os padrões do app.": {
    en: "Nothing saved yet — the assistant uses the app defaults.",
    es: "Aún no se guardó nada — el asistente usa los valores predeterminados de la app.",
    fr: "Rien n'a encore été enregistré — l'assistant utilise les valeurs par défaut de l'appli.",
  },
  "🔒 Somente o administrador da implantação (SUPER_ADMIN_PHONE) mantém as sementes.": {
    en: "🔒 Only the deployment administrator (SUPER_ADMIN_PHONE) maintains the seeds.",
    es: "🔒 Solo el administrador de la implantación (SUPER_ADMIN_PHONE) mantiene las semillas.",
    fr: "🔒 Seul l'administrateur du déploiement (SUPER_ADMIN_PHONE) gère les graines.",
  },
  "✅ Sementes salvas — o assistente já usa estes valores.": {
    en: "✅ Seeds saved — the assistant already uses these values.",
    es: "✅ Semillas guardadas — el asistente ya usa estos valores.",
    fr: "✅ Graines enregistrées — l'assistant utilise déjà ces valeurs.",
  },
  "📍 Locais de acampamento": {
    en: "📍 Camping venues",
    es: "📍 Locales de campamento",
    fr: "📍 Lieux de camp",
  },
  "➕ Local": {
    en: "➕ Venue",
    es: "➕ Local",
    fr: "➕ Lieu",
  },
  "Quartos e camas, endereço e coordenadas de cada sítio que a igreja usa — o assistente preenche tudo disso.": {
    en: "Rooms and beds, address and coordinates of each site the church uses — the assistant fills all of that in.",
    es: "Habitaciones y camas, dirección y coordenadas de cada sitio que usa la iglesia — el asistente rellena todo eso.",
    fr: "Chambres et lits, adresse et coordonnées de chaque site utilisé par l'église — l'assistant remplit tout cela.",
  },
  "(sem nome)": {
    en: "(unnamed)",
    es: "(sin nombre)",
    fr: "(sans nom)",
  },
  "{rooms} quarto(s) · {beds} camas": {
    en: "{rooms} room(s) · {beds} beds",
    es: "{rooms} habitación(es) · {beds} camas",
    fr: "{rooms} chambre(s) · {beds} lits",
  },
  "Remover local": {
    en: "Remove venue",
    es: "Quitar local",
    fr: "Retirer le lieu",
  },
  "Endereço": {
    en: "Address",
    es: "Dirección",
    fr: "Adresse",
  },
  "Observações (dica que aparece no assistente)": {
    en: "Notes (hint shown in the assistant)",
    es: "Observaciones (pista que aparece en el asistente)",
    fr: "Notes (indice affiché dans l'assistant)",
  },
  "Restaurar locais padrão": {
    en: "Restore default venues",
    es: "Restaurar locales predeterminados",
    fr: "Restaurer les lieux par défaut",
  },
  "🎯 Funções da programação": {
    en: "🎯 Schedule roles",
    es: "🎯 Funciones de la programación",
    fr: "🎯 Fonctions du programme",
  },
  "➕ Função": {
    en: "➕ Role",
    es: "➕ Función",
    fr: "➕ Fonction",
  },
  "As funções que os eventos modelo usam. “Só escalados” precisa de escala na programação; as outras caem por posição (líder / auxiliar / toda a equipe).": {
    en: "The roles that template events use. “Assigned only” needs a schedule assignment; the others fall by position (leader / helper / whole staff).",
    es: "Las funciones que usan los eventos modelo. “Solo asignados” necesita escala en la programación; las otras caen por posición (líder / auxiliar / todo el equipo).",
    fr: "Les fonctions utilisées par les événements modèle. « Assignés seulement » nécessite une affectation au programme ; les autres dépendent du poste (responsable / auxiliaire / toute l'équipe).",
  },
  "Emblema": {
    en: "Badge",
    es: "Emblema",
    fr: "Emblème",
  },
  "Quem faz": {
    en: "Who does it",
    es: "Quién lo hace",
    fr: "Qui le fait",
  },
  "Só escalados": {
    en: "Assigned only",
    es: "Solo asignados",
    fr: "Assignés seulement",
  },
  "Líderes": {
    en: "Leaders",
    es: "Líderes",
    fr: "Responsables",
  },
  "Auxiliares": {
    en: "Helpers",
    es: "Auxiliares",
    fr: "Auxiliaires",
  },
  "Toda a equipe": {
    en: "Whole staff",
    es: "Todo el equipo",
    fr: "Toute l'équipe",
  },
  "Detalhe": {
    en: "Detail",
    es: "Detalle",
    fr: "Détail",
  },
  "Digitado (cor, base…)": {
    en: "Typed (color, base…)",
    es: "Escrito (color, base…)",
    fr: "Saisi (couleur, base…)",
  },
  "Time da pessoa": {
    en: "Person's team",
    es: "Equipo de la persona",
    fr: "Équipe de la personne",
  },
  "Remover função": {
    en: "Remove role",
    es: "Quitar función",
    fr: "Retirer la fonction",
  },
  "Restaurar funções padrão": {
    en: "Restore default roles",
    es: "Restaurar funciones predeterminadas",
    fr: "Restaurer les fonctions par défaut",
  },
  "📅 Programação modelo": {
    en: "📅 Template schedule",
    es: "📅 Programación modelo",
    fr: "📅 Programme modèle",
  },
  "➕ Evento": {
    en: "➕ Event",
    es: "➕ Evento",
    fr: "➕ Événement",
  },
  "Sexta à noite → domingo à tarde. O assistente mostra esta lista para tirar itens antes de importar; o dia 1 é a sexta de saída.": {
    en: "Friday night → Sunday afternoon. The assistant shows this list so you can remove items before importing; day 1 is departure Friday.",
    es: "Viernes por la noche → domingo por la tarde. El asistente muestra esta lista para quitar ítems antes de importar; el día 1 es el viernes de salida.",
    fr: "Vendredi soir → dimanche après-midi. L'assistant montre cette liste pour retirer des éléments avant l'import ; le jour 1 est le vendredi de départ.",
  },
  "6ª-feira (saída)": {
    en: "Friday (departure)",
    es: "Viernes (salida)",
    fr: "Vendredi (départ)",
  },
  "Sábado": {
    en: "Saturday",
    es: "Sábado",
    fr: "Samedi",
  },
  "Domingo (volta)": {
    en: "Sunday (return)",
    es: "Domingo (vuelta)",
    fr: "Dimanche (retour)",
  },
  "6ª-feira": {
    en: "Friday",
    es: "Viernes",
    fr: "Vendredi",
  },
  "Domingo": {
    en: "Sunday",
    es: "Domingo",
    fr: "Dimanche",
  },
  "Fim": {
    en: "End",
    es: "Fin",
    fr: "Fin",
  },
  "Dia": {
    en: "Day",
    es: "Día",
    fr: "Jour",
  },
  "Remover evento": {
    en: "Remove event",
    es: "Quitar evento",
    fr: "Retirer l'événement",
  },
  "{name} — tirar do evento": {
    en: "{name} — remove from event",
    es: "{name} — quitar del evento",
    fr: "{name} — retirer de l'événement",
  },
  "{name} — usar no evento": {
    en: "{name} — use in event",
    es: "{name} — usar en el evento",
    fr: "{name} — utiliser dans l'événement",
  },
  "os pais veem": {
    en: "parents see it",
    es: "los padres lo ven",
    fr: "les parents le voient",
  },
  "Restaurar programação padrão": {
    en: "Restore default schedule",
    es: "Restaurar programación predeterminada",
    fr: "Restaurer le programme par défaut",
  },
  "🚌 Frota inicial": {
    en: "🚌 Starter fleet",
    es: "🚌 Flota inicial",
    fr: "🚌 Flotte initiale",
  },
  "➕ Ônibus": {
    en: "➕ Bus",
    es: "➕ Autobús",
    fr: "➕ Bus",
  },
  "Os ônibus que o assistente cria quando o acampamento está sem veículos.": {
    en: "The buses the assistant creates when the camp has no vehicles.",
    es: "Los autobuses que el asistente crea cuando el campamento no tiene vehículos.",
    fr: "Les bus que l'assistant crée quand le camp n'a pas de véhicules.",
  },
  "Número": {
    en: "Number",
    es: "Número",
    fr: "Numéro",
  },
  "Cor": {
    en: "Color",
    es: "Color",
    fr: "Couleur",
  },
  "Verde": {
    en: "Green",
    es: "Verde",
    fr: "Vert",
  },
  "Laranja": {
    en: "Orange",
    es: "Naranja",
    fr: "Orange",
  },
  "Amarelo": {
    en: "Yellow",
    es: "Amarillo",
    fr: "Jaune",
  },
  "Vermelho": {
    en: "Red",
    es: "Rojo",
    fr: "Rouge",
  },
  "Azul": {
    en: "Blue",
    es: "Azul",
    fr: "Bleu",
  },
  "Roxo": {
    en: "Purple",
    es: "Morado",
    fr: "Violet",
  },
  "Verde-escuro": {
    en: "Dark green",
    es: "Verde oscuro",
    fr: "Vert foncé",
  },
  "Cinza": {
    en: "Gray",
    es: "Gris",
    fr: "Gris",
  },
  "Lugares": {
    en: "Seats",
    es: "Lugares",
    fr: "Places",
  },
  "Remover ônibus": {
    en: "Remove bus",
    es: "Quitar autobús",
    fr: "Retirer le bus",
  },
  "Restaurar frota padrão": {
    en: "Restore default fleet",
    es: "Restaurar flota predeterminada",
    fr: "Restaurer la flotte par défaut",
  },
  "📖 Documentos iniciais": {
    en: "📖 Starter documents",
    es: "📖 Documentos iniciales",
    fr: "📖 Documents initiaux",
  },
  "O que o assistente cria nos passos de Documentos: a primeira Preparação e a instrução com o endereço.": {
    en: "What the assistant creates in the Documents steps: the first Prep and the address instruction.",
    es: "Lo que el asistente crea en los pasos de Documentos: la primera Preparación y la instrucción con la dirección.",
    fr: "Ce que l'assistant crée dans les étapes Documents : la première Préparation et l'instruction avec l'adresse.",
  },
  "Título da Preparação": {
    en: "Prep title",
    es: "Título de la Preparación",
    fr: "Titre de la Préparation",
  },
  "Título da instrução de endereço": {
    en: "Address instruction title",
    es: "Título de la instrucción de dirección",
    fr: "Titre de l'instruction d'adresse",
  },
  "📝 Conteúdo da Preparação": {
    en: "📝 Prep content",
    es: "📝 Contenido de la Preparación",
    fr: "📝 Contenu de la Préparation",
  },
  "O que levar na mala…": {
    en: "What to pack…",
    es: "Qué llevar en la maleta…",
    fr: "Quoi mettre dans la valise…",
  },
  "Restaurar documentos padrão": {
    en: "Restore default documents",
    es: "Restaurar documentos predeterminados",
    fr: "Restaurer les documents par défaut",
  },
  "🏕️ Assistente de configuração": {
    en: "🏕️ Setup assistant",
    es: "🏕️ Asistente de configuración",
    fr: "🏕️ Assistant de configuration",
  },
  "Reabrir o passo a passo que monta o acampamento a partir destas sementes.": {
    en: "Reopen the step-by-step that builds the camp from these seeds.",
    es: "Reabrir el paso a paso que arma el campamento a partir de estas semillas.",
    fr: "Rouvrir le pas à pas qui monte le camp à partir de ces graines.",
  },
  "Abrir o assistente": {
    en: "Open the assistant",
    es: "Abrir el asistente",
    fr: "Ouvrir l'assistant",
  },
};
