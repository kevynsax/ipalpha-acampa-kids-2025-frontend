import type { Locale } from "../locales";

export const LITERALS: Record<string, Partial<Record<Exclude<Locale, "pt">, string>>> = {
  "Sorteio": {
    en: "Giveaway",
    es: "Sorteo",
    fr: "Tirage",
  },
  "Importar equipe de uma planilha": {
    en: "Import staff from a spreadsheet",
    es: "Importar equipo desde una hoja",
    fr: "Importer l'équipe depuis un tableur",
  },
  "Baixar toda a equipe em Excel": {
    en: "Download the whole staff list as Excel",
    es: "Descargar todo el equipo en Excel",
    fr: "Télécharger toute l'équipe en Excel",
  },
  "Novo membro da equipe": {
    en: "New staff member",
    es: "Nuevo miembro del equipo",
    fr: "Nouveau membre de l'équipe",
  },
  "✏️ Editar membro da equipe": {
    en: "✏️ Edit staff member",
    es: "✏️ Editar miembro del equipo",
    fr: "✏️ Modifier le membre de l'équipe",
  },
  "Excluir {name} da equipe?": {
    en: "Remove {name} from the staff?",
    es: "¿Eliminar a {name} del equipo?",
    fr: "Retirer {name} de l'équipe ?",
  },
  "Excluir {name} da equipe": {
    en: "Remove {name} from the staff",
    es: "Eliminar a {name} del equipo",
    fr: "Retirer {name} de l'équipe",
  },
  "Pessoa não encontrada.": {
    en: "Person not found.",
    es: "Persona no encontrada.",
    fr: "Personne introuvable.",
  },
  "{name} é admin: não pode ser excluído da equipe.": {
    en: "{name} is an admin: cannot be removed from the staff.",
    es: "{name} es admin: no puede ser eliminado del equipo.",
    fr: "{name} est admin : ne peut pas être retiré de l'équipe.",
  },
  "{name} é admin: o login continua se sair da equipe.": {
    en: "{name} is an admin: the login stays if they leave the staff.",
    es: "{name} es admin: el acceso se mantiene si sale del equipo.",
    fr: "{name} est admin : la connexion reste s'il quitte l'équipe.",
  },
  "O login de admin continua. Só o cadastro na equipe é apagado.": {
    en: "The admin login stays. Only the staff record is deleted.",
    es: "El acceso de admin se mantiene. Solo se borra el registro del equipo.",
    fr: "La connexion admin reste. Seul le dossier d'équipe est supprimé.",
  },
  "Login de admin é o celular da conta, não o deste cadastro.": {
    en: "The admin login is the account phone, not this staff record's.",
    es: "El acceso de admin es el celular de la cuenta, no el de este registro.",
    fr: "La connexion admin est le téléphone du compte, pas celui de ce dossier.",
  },
  "Ala e time": {
    en: "Wing and team",
    es: "Ala y equipo",
    fr: "Aile et équipe",
  },
  "Tia de meninas": {
    en: "Girls' counsellor",
    es: "Tía de niñas",
    fr: "Animatrice des filles",
  },
  "Tio de meninos": {
    en: "Boys' counsellor",
    es: "Tío de niños",
    fr: "Animateur des garçons",
  },
  "Dorme no quarto de {group}": {
    en: "Sleeps in the {group} room",
    es: "Duerme en el cuarto de {group}",
    fr: "Dort dans la chambre des {group}",
  },
  "Todos os times": {
    en: "All teams",
    es: "Todos los equipos",
    fr: "Toutes les équipes",
  },
  "Filtrar por time": {
    en: "Filter by team",
    es: "Filtrar por equipo",
    fr: "Filtrer par équipe",
  },
  "Cadastre o primeiro voluntário!": {
    en: "Register the first volunteer!",
    es: "¡Registra al primer voluntario!",
    fr: "Inscrivez le premier volontaire !",
  },
  "+ Adicionar membro": {
    en: "+ Add member",
    es: "+ Añadir miembro",
    fr: "+ Ajouter un membre",
  },
  "{count} pessoas": {
    en: "{count} people",
    es: "{count} personas",
    fr: "{count} personnes",
  },
  "{visible} de {total} pessoas": {
    en: "{visible} of {total} people",
    es: "{visible} de {total} personas",
    fr: "{visible} sur {total} personnes",
  },
  "Voltar à ordem alfabética": {
    en: "Back to alphabetical order",
    es: "Volver al orden alfabético",
    fr: "Revenir à l'ordre alphabétique",
  },
  "Mostrar sem quarto no topo": {
    en: "Show people without a room at the top",
    es: "Mostrar sin habitación arriba",
    fr: "Afficher sans chambre en haut",
  },
  "{count} sem quarto": {
    en: "{count} without a room",
    es: "{count} sin habitación",
    fr: "{count} sans chambre",
  },
  "Admin do app": {
    en: "App admin",
    es: "Admin de la app",
    fr: "Admin de l'appli",
  },
  "inativo": {
    en: "inactive",
    es: "inactivo",
    fr: "inactif",
  },
  "Esta pessoa está sem quarto.": {
    en: "This person has no room.",
    es: "Esta persona está sin habitación.",
    fr: "Cette personne n'a pas de chambre.",
  },
  "Função no quarto": {
    en: "Room role",
    es: "Función en la habitación",
    fr: "Rôle dans la chambre",
  },
  "Editar {name}": {
    en: "Edit {name}",
    es: "Editar a {name}",
    fr: "Modifier {name}",
  },
  "pelo próprio celular": {
    en: "on their own phone",
    es: "desde su propio celular",
    fr: "depuis son propre téléphone",
  },
  "por {name}": {
    en: "by {name}",
    es: "por {name}",
    fr: "par {name}",
  },
  "para {name}": {
    en: "to {name}",
    es: "para {name}",
    fr: "à {name}",
  },
  "está": {
    en: "is",
    es: "está",
    fr: "est",
  },
  "estão": {
    en: "are",
    es: "están",
    fr: "sont",
  },
  " e ": {
    en: " and ",
    es: " y ",
    fr: " et ",
  },
  "é a única pessoa da equipe no quarto:": {
    en: "is the only staff member in the room:",
    es: "es la única persona del equipo en la habitación:",
    fr: "est la seule personne de l'équipe dans la chambre :",
  },
  "no mesmo quarto:": {
    en: "in the same room:",
    es: "en la misma habitación:",
    fr: "dans la même chambre :",
  },
  "— admin não entra em time": {
    en: "— admin is not on a team",
    es: "— admin no entra en un equipo",
    fr: "— l'admin n'entre pas dans une équipe",
  },
  "Trocar de time": {
    en: "Change team",
    es: "Cambiar de equipo",
    fr: "Changer d'équipe",
  },
  "Trocar de quarto": {
    en: "Change room",
    es: "Cambiar de habitación",
    fr: "Changer de chambre",
  },
  "Trocar o transporte": {
    en: "Change transport",
    es: "Cambiar el transporte",
    fr: "Changer de transport",
  },
  "Ainda não chegou": {
    en: "Hasn't arrived yet",
    es: "Aún no llegó",
    fr: "N'est pas encore arrivé",
  },
  "Colete": {
    en: "Vest",
    es: "Chaleco",
    fr: "Gilet",
  },
  "Devolvido": {
    en: "Returned",
    es: "Devuelto",
    fr: "Rendu",
  },
  "Não devolvido": {
    en: "Not returned",
    es: "No devuelto",
    fr: "Non rendu",
  },
  "Ocultar detalhes": {
    en: "Hide details",
    es: "Ocultar detalles",
    fr: "Masquer les détails",
  },
  "Ver detalhes": {
    en: "Show details",
    es: "Ver detalles",
    fr: "Voir les détails",
  },
  "Ocultar detalhes do colete": {
    en: "Hide vest details",
    es: "Ocultar detalles del chaleco",
    fr: "Masquer les détails du gilet",
  },
  "Ver detalhes do colete": {
    en: "Show vest details",
    es: "Ver detalles del chaleco",
    fr: "Voir les détails du gilet",
  },
  "🦺 Entregue {when} · {by}": {
    en: "🦺 Handed out {when} · {by}",
    es: "🦺 Entregado {when} · {by}",
    fr: "🦺 Remis {when} · {by}",
  },
  "✅ Devolvido {when} · {by}": {
    en: "✅ Returned {when} · {by}",
    es: "✅ Devuelto {when} · {by}",
    fr: "✅ Rendu {when} · {by}",
  },
  "Este campo está sendo revisado pela IA": {
    en: "This field is under AI review",
    es: "Este campo está siendo revisado por la IA",
    fr: "Ce champ est en révision par l'IA",
  },
  "Observações em revisão pela IA…": {
    en: "Notes under AI review…",
    es: "Observaciones en revisión por la IA…",
    fr: "Notes en révision par l'IA…",
  },
  "Funções": {
    en: "Roles",
    es: "Funciones",
    fr: "Fonctions",
  },
  "+ Vincular função": {
    en: "+ Assign role",
    es: "+ Vincular función",
    fr: "+ Lier une fonction",
  },
  "Nenhuma função específica.": {
    en: "No specific role.",
    es: "Ninguna función específica.",
    fr: "Aucune fonction spécifique.",
  },
  "Ver instruções": {
    en: "View instructions",
    es: "Ver instrucciones",
    fr: "Voir les instructions",
  },
  "Ver instruções de {name}": {
    en: "View instructions for {name}",
    es: "Ver instrucciones de {name}",
    fr: "Voir les instructions de {name}",
  },
  "Desvincular função": {
    en: "Unassign role",
    es: "Desvincular función",
    fr: "Délier la fonction",
  },
  "Desvincular {role} em {title}": {
    en: "Unassign {role} from {title}",
    es: "Desvincular {role} en {title}",
    fr: "Délier {role} de {title}",
  },
  "Ver função {name}": {
    en: "View role {name}",
    es: "Ver función {name}",
    fr: "Voir la fonction {name}",
  },
  " em ": {
    en: " in ",
    es: " en ",
    fr: " dans ",
  },
  "Ver evento {title}": {
    en: "View event {title}",
    es: "Ver evento {title}",
    fr: "Voir l'événement {title}",
  },
  "em {emoji} {title} · {when}": {
    en: "in {emoji} {title} · {when}",
    es: "en {emoji} {title} · {when}",
    fr: "dans {emoji} {title} · {when}",
  },
  "Crianças sob responsabilidade": {
    en: "Children in their care",
    es: "Niños bajo su responsabilidad",
    fr: "Enfants sous leur responsabilité",
  },
  "Sem quarto definido — nenhuma criança vinculada.": {
    en: "No room set — no children linked.",
    es: "Sin habitación definida — ningún niño vinculado.",
    fr: "Pas de chambre définie — aucun enfant lié.",
  },
  "Quarto da equipe — sem crianças.": {
    en: "Staff room — no children.",
    es: "Habitación del equipo — sin niños.",
    fr: "Chambre de l'équipe — pas d'enfants.",
  },
  "Nenhuma criança neste quarto ainda.": {
    en: "No children in this room yet.",
    es: "Ningún niño en esta habitación todavía.",
    fr: "Aucun enfant dans cette chambre pour l'instant.",
  },
  "Líder: ": {
    en: "Leader: ",
    es: "Líder: ",
    fr: "Leader : ",
  },
  "Líderes: ": {
    en: "Leaders: ",
    es: "Líderes: ",
    fr: "Leaders : ",
  },
  "⚠️ {count} sem líder": {
    en: "⚠️ {count} without a leader",
    es: "⚠️ {count} sin líder",
    fr: "⚠️ {count} sans leader",
  },
  "cuida de crianças específicas do quarto": {
    en: "looks after specific children in the room",
    es: "cuida de niños específicos de la habitación",
    fr: "s'occupe d'enfants précis de la chambre",
  },
  "ajuda no quarto, sem crianças próprias": {
    en: "helps in the room, without children of their own",
    es: "ayuda en la habitación, sin niños propios",
    fr: "aide dans la chambre, sans enfants à soi",
  },
  "Salvar alterações?": {
    en: "Save changes?",
    es: "¿Guardar cambios?",
    fr: "Enregistrer les modifications ?",
  },
  "Você fez alterações que ainda não foram salvas.": {
    en: "You made changes that haven't been saved yet.",
    es: "Hiciste cambios que aún no se guardaron.",
    fr: "Vous avez fait des modifications qui n'ont pas encore été enregistrées.",
  },
  "Descartar": {
    en: "Discard",
    es: "Descartar",
    fr: "Abandonner",
  },
  "Informe o celular: é por ele que a pessoa entra no app.": {
    en: "Enter the mobile number: it's how they sign into the app.",
    es: "Indica el celular: es con él que la persona entra a la app.",
    fr: "Indiquez le portable : c'est avec lui que la personne entre dans l'appli.",
  },
  "Este celular já é de {name}.": {
    en: "This mobile already belongs to {name}.",
    es: "Este celular ya es de {name}.",
    fr: "Ce portable appartient déjà à {name}.",
  },
  "ex.: Abimael": {
    en: "e.g. Abimael",
    es: "ej.: Abimael",
    fr: "ex. : Abimael",
  },
  "Celular de admin — é o login, não muda por aqui.": {
    en: "Admin mobile — it's the login, it doesn't change here.",
    es: "Celular de admin — es el login, no se cambia aquí.",
    fr: "Portable admin — c'est l'identifiant, ça ne change pas ici.",
  },
  "Status": {
    en: "Status",
    es: "Estado",
    fr: "Statut",
  },
  "Ao virar auxiliar, as crianças sob sua responsabilidade ficam sem líder.": {
    en: "If they become a helper, the children in their care are left without a leader.",
    es: "Al pasar a auxiliar, los niños bajo su responsabilidad quedan sin líder.",
    fr: "En passant auxiliaire, les enfants sous sa responsabilité restent sans leader.",
  },
  "Admin do app: tem quarto e transporte, mas não cuida de crianças nem entra em um time.": {
    en: "App admin: has a room and transport, but doesn't look after children or join a team.",
    es: "Admin de la app: tiene habitación y transporte, pero no cuida niños ni entra en un equipo.",
    fr: "Admin de l'appli : a une chambre et un transport, mais ne s'occupe pas d'enfants ni n'entre dans une équipe.",
  },
  "🏕️ Time, quarto e transporte": {
    en: "🏕️ Team, room and transport",
    es: "🏕️ Equipo, habitación y transporte",
    fr: "🏕️ Équipe, chambre et transport",
  },
  "📝 Saúde e observações": {
    en: "📝 Health and notes",
    es: "📝 Salud y observaciones",
    fr: "📝 Santé et notes",
  },
  "ex.: vegetariano, sem lactose": {
    en: "e.g. vegetarian, lactose-free",
    es: "ej.: vegetariano, sin lactosa",
    fr: "ex. : végétarien, sans lactose",
  },
  "📝 Outras observações de saúde": {
    en: "📝 Other health notes",
    es: "📝 Otras observaciones de salud",
    fr: "📝 Autres notes de santé",
  },
  "ex.: cole aqui o que a pessoa escreveu na inscrição": {
    en: "e.g. paste here what they wrote on the registration",
    es: "ej.: pega aquí lo que la persona escribió en la inscripción",
    fr: "ex. : collez ici ce que la personne a écrit à l'inscription",
  },
  "Adicionar 🎉": {
    en: "Add 🎉",
    es: "Añadir 🎉",
    fr: "Ajouter 🎉",
  },
  "Trocar com alguém": {
    en: "Swap with someone",
    es: "Cambiar con alguien",
    fr: "Échanger avec quelqu'un",
  },
  "a outra pessoa vem para cá e assume estas crianças; ela leva as dela": {
    en: "the other person comes here and takes these children; they take theirs along",
    es: "la otra persona viene aquí y asume estos niños; se lleva los suyos",
    fr: "l'autre personne vient ici et prend ces enfants ; elle emmène les siens",
  },
  "Levar as crianças junto": {
    en: "Take the children along",
    es: "Llevar a los niños juntos",
    fr: "Emmener les enfants",
  },
  "as crianças mudam de quarto com a pessoa": {
    en: "the children move rooms with the person",
    es: "los niños cambian de habitación con la persona",
    fr: "les enfants changent de chambre avec la personne",
  },
  "Passar para outra pessoa": {
    en: "Hand over to someone else",
    es: "Pasar a otra persona",
    fr: "Passer à quelqu'un d'autre",
  },
  "as crianças ficam e alguém do quarto assume (um auxiliar vira líder)": {
    en: "the children stay and someone in the room takes over (a helper becomes leader)",
    es: "los niños se quedan y alguien de la habitación asume (un auxiliar pasa a líder)",
    fr: "les enfants restent et quelqu'un de la chambre prend le relais (un auxiliaire devient leader)",
  },
  "Deixar sem líder": {
    en: "Leave without a leader",
    es: "Dejar sin líder",
    fr: "Laisser sans leader",
  },
  "as crianças ficam no quarto sem líder, para resolver depois": {
    en: "the children stay in the room without a leader, to sort out later",
    es: "los niños se quedan en la habitación sin líder, para resolver después",
    fr: "les enfants restent dans la chambre sans leader, à régler plus tard",
  },
  "E as {count} criança sob sua responsabilidade?": {
    en: "And the {count} child in their care?",
    es: "¿Y el {count} niño bajo su responsabilidad?",
    fr: "Et le {count} enfant sous sa responsabilité ?",
  },
  "E as {count} crianças sob sua responsabilidade?": {
    en: "And the {count} children in their care?",
    es: "¿Y los {count} niños bajo su responsabilidad?",
    fr: "Et les {count} enfants sous sa responsabilité ?",
  },
  "No mesmo quarto só dá para passar as crianças para outra pessoa.": {
    en: "In the same room you can only hand the children to someone else.",
    es: "En la misma habitación solo se pueden pasar los niños a otra persona.",
    fr: "Dans la même chambre on ne peut que passer les enfants à quelqu'un d'autre.",
  },
  "O quarto de destino está lotado: só dá para trocar de lugar com alguém de lá.": {
    en: "The destination room is full: you can only swap places with someone there.",
    es: "La habitación de destino está llena: solo se puede cambiar de lugar con alguien de allí.",
    fr: "La chambre de destination est pleine : on ne peut qu'échanger de place avec quelqu'un là-bas.",
  },
  "Quem vem do quarto {room}?": {
    en: "Who is coming from room {room}?",
    es: "¿Quién viene de la habitación {room}?",
    fr: "Qui vient de la chambre {room} ?",
  },
  "Quem assume as crianças?": {
    en: "Who takes the children?",
    es: "¿Quién asume a los niños?",
    fr: "Qui prend les enfants ?",
  },
  "⚠️ Ninguém da equipe neste quarto de destino.": {
    en: "⚠️ No staff in this destination room.",
    es: "⚠️ Nadie del equipo en esta habitación de destino.",
    fr: "⚠️ Personne de l'équipe dans cette chambre de destination.",
  },
  "⚠️ Ninguém da equipe no quarto atual.": {
    en: "⚠️ No staff in the current room.",
    es: "⚠️ Nadie del equipo en la habitación actual.",
    fr: "⚠️ Personne de l'équipe dans la chambre actuelle.",
  },
  " · {count} criança": {
    en: " · {count} child",
    es: " · {count} niño",
    fr: " · {count} enfant",
  },
  " · {count} crianças": {
    en: " · {count} children",
    es: " · {count} niños",
    fr: " · {count} enfants",
  },
  " · vira líder": {
    en: " · becomes leader",
    es: " · pasa a líder",
    fr: " · devient leader",
  },
  "⚠️ O quarto de destino está lotado — alguém precisa sair de lá antes.": {
    en: "⚠️ The destination room is full — someone needs to leave there first.",
    es: "⚠️ La habitación de destino está llena — alguien tiene que salir de allí antes.",
    fr: "⚠️ La chambre de destination est pleine — quelqu'un doit en sortir d'abord.",
  },
  "Sem crianças sob responsabilidade: só a pessoa muda.": {
    en: "No children in their care: only the person moves.",
    es: "Sin niños bajo responsabilidad: solo cambia la persona.",
    fr: "Pas d'enfants sous responsabilité : seule la personne bouge.",
  },
  "Importação concluída": {
    en: "Import finished",
    es: "Importación concluida",
    fr: "Importation terminée",
  },
  "{inserted} inseridos, {updated} atualizados e {logins} logins criados.": {
    en: "{inserted} inserted, {updated} updated and {logins} logins created.",
    es: "{inserted} insertados, {updated} actualizados y {logins} inicios de sesión creados.",
    fr: "{inserted} ajoutés, {updated} mis à jour et {logins} connexions créées.",
  },
  "Ver equipe": {
    en: "View staff",
    es: "Ver equipo",
    fr: "Voir l'équipe",
  },
  "Importar planilha": {
    en: "Import spreadsheet",
    es: "Importar hoja",
    fr: "Importer le tableur",
  },
  "Importar equipe": {
    en: "Import staff",
    es: "Importar equipo",
    fr: "Importer l'équipe",
  },
  "Não foi possível analisar.": {
    en: "Could not analyze.",
    es: "No se pudo analizar.",
    fr: "Impossible d'analyser.",
  },
  "Não foi possível importar.": {
    en: "Could not import.",
    es: "No se pudo importar.",
    fr: "Impossible d'importer.",
  },
  "Celular inválido.": {
    en: "Invalid mobile number.",
    es: "Celular inválido.",
    fr: "Portable invalide.",
  },
  "Cadastros repetidos": {
    en: "Duplicate records",
    es: "Registros repetidos",
    fr: "Fiches en double",
  },
  "Telefones": {
    en: "Phone numbers",
    es: "Teléfonos",
    fr: "Téléphones",
  },
  "Ativos": {
    en: "Active status",
    es: "Activos",
    fr: "Actifs",
  },
  "Arraste o CSV ou Excel aqui": {
    en: "Drop the CSV or Excel here",
    es: "Arrastra el CSV o Excel aquí",
    fr: "Déposez le CSV ou Excel ici",
  },
  "Solte o arquivo nesta área ou escolha abaixo. A IA ajuda a reconhecer a planilha e você confirma as dúvidas antes de gravar.": {
    en: "Drop the file in this area or choose below. AI helps recognize the sheet and you confirm questions before saving.",
    es: "Suelta el archivo en esta área o elige abajo. La IA ayuda a reconocer la hoja y confirmas las dudas antes de guardar.",
    fr: "Déposez le fichier dans cette zone ou choisissez ci-dessous. L'IA aide à reconnaître le tableur et vous confirmez les doutes avant d'enregistrer.",
  },
  "Analisando…": {
    en: "Analyzing…",
    es: "Analizando…",
    fr: "Analyse…",
  },
  "Escolher planilha": {
    en: "Choose spreadsheet",
    es: "Elegir hoja",
    fr: "Choisir le tableur",
  },
  "Nada é importado nesta fase. Itens novos ficam em rascunho até você aplicar.": {
    en: "Nothing is imported in this step. New items stay as drafts until you apply.",
    es: "Nada se importa en esta fase. Los ítems nuevos quedan en borrador hasta que apliques.",
    fr: "Rien n'est importé à cette étape. Les nouveaux éléments restent en brouillon jusqu'à ce que vous appliquiez.",
  },
  "{count} pessoas já cadastradas": {
    en: "{count} people already registered",
    es: "{count} personas ya registradas",
    fr: "{count} personnes déjà enregistrées",
  },
  "Escolha a regra antes das outras revisões. A prévia, os contadores e os itens novos usarão esta decisão.": {
    en: "Choose the rule before the other reviews. The preview, counters and new items will use this decision.",
    es: "Elige la regla antes de las otras revisiones. La previa, los contadores y los ítems nuevos usarán esta decisión.",
    fr: "Choisissez la règle avant les autres révisions. L'aperçu, les compteurs et les nouveaux éléments utiliseront cette décision.",
  },
  "Corrija ou ignore as dúvidas; celular e quarto podem ficar vazios.": {
    en: "Fix or skip the questions; mobile and room may stay empty.",
    es: "Corrige o ignora las dudas; celular y habitación pueden quedar vacíos.",
    fr: "Corrigez ou ignorez les doutes ; portable et chambre peuvent rester vides.",
  },
  "Pular": {
    en: "Skip",
    es: "Saltar",
    fr: "Passer",
  },
  "Ignorar": {
    en: "Ignore",
    es: "Ignorar",
    fr: "Ignorer",
  },
  "Pronto para importar": {
    en: "Ready to import",
    es: "Listo para importar",
    fr: "Prêt à importer",
  },
  "transporte novo": {
    en: "new transport",
    es: "transporte nuevo",
    fr: "nouveau transport",
  },
  "transportes novos": {
    en: "new transports",
    es: "transportes nuevos",
    fr: "nouveaux transports",
  },
  "time novo": {
    en: "new team",
    es: "equipo nuevo",
    fr: "nouvelle équipe",
  },
  "times novos": {
    en: "new teams",
    es: "equipos nuevos",
    fr: "nouvelles équipes",
  },
  "quarto novo": {
    en: "new room",
    es: "habitación nueva",
    fr: "nouvelle chambre",
  },
  "quartos novos": {
    en: "new rooms",
    es: "habitaciones nuevas",
    fr: "nouvelles chambres",
  },
  "ignoradas": {
    en: "skipped",
    es: "ignoradas",
    fr: "ignorées",
  },
  "Baixar não importados": {
    en: "Download not imported",
    es: "Descargar no importados",
    fr: "Télécharger les non importés",
  },
  "{count} coluna(s) sem destino; os valores vão para as observações.": {
    en: "{count} column(s) with no target; values go to the notes.",
    es: "{count} columna(s) sin destino; los valores van a las observaciones.",
    fr: "{count} colonne(s) sans destination ; les valeurs vont dans les notes.",
  },
  "Atribuir colunas": {
    en: "Assign columns",
    es: "Asignar columnas",
    fr: "Attribuer les colonnes",
  },
  "Prévia": {
    en: "Preview",
    es: "Previa",
    fr: "Aperçu",
  },
  "Ocultar prévia": {
    en: "Hide preview",
    es: "Ocultar previa",
    fr: "Masquer l'aperçu",
  },
  "Mostrar prévia": {
    en: "Show preview",
    es: "Mostrar previa",
    fr: "Afficher l'aperçu",
  },
  "Importando…": {
    en: "Importing…",
    es: "Importando…",
    fr: "Importation…",
  },
  "Aplicar importação": {
    en: "Apply import",
    es: "Aplicar importación",
    fr: "Appliquer l'importation",
  },
  "Progresso {pct}%": {
    en: "Progress {pct}%",
    es: "Progreso {pct}%",
    fr: "Progression {pct}%",
  },
  "Colunas": {
    en: "Columns",
    es: "Columnas",
    fr: "Colonnes",
  },
  "Revisão": {
    en: "Review",
    es: "Revisión",
    fr: "Révision",
  },
  "Linha {row}": {
    en: "Row {row}",
    es: "Fila {row}",
    fr: "Ligne {row}",
  },
  "Na planilha:": {
    en: "In the spreadsheet:",
    es: "En la hoja:",
    fr: "Dans le tableur :",
  },
  "Esta pessoa": {
    en: "This person",
    es: "Esta persona",
    fr: "Cette personne",
  },
  "Escolha…": {
    en: "Choose…",
    es: "Elige…",
    fr: "Choisissez…",
  },
  "Mesma pessoa: {name} {phone}": {
    en: "Same person: {name} {phone}",
    es: "Misma persona: {name} {phone}",
    fr: "Même personne : {name} {phone}",
  },
  "Pessoa diferente: inserir": {
    en: "Different person: insert",
    es: "Persona diferente: insertar",
    fr: "Personne différente : ajouter",
  },
  "Celular repetido": {
    en: "Repeated phone",
    es: "Celular repetido",
    fr: "Téléphone répété",
  },
  "Este celular aparece em mais de uma linha. Escolha quem fica com o número. As outras pessoas entram na equipe sem celular — sem login no app.": {
    en: "This number appears on more than one row. Choose who keeps it. The others join the staff without a phone — no app login.",
    es: "Este celular aparece en más de una fila. Elige quién se queda con el número. Las demás personas entran al equipo sin celular — sin acceso a la app.",
    fr: "Ce numéro apparaît sur plus d'une ligne. Choisissez qui le garde. Les autres rejoignent l'équipe sans téléphone — sans connexion à l'appli.",
  },
  "Este celular aparece em mais de uma linha. Troque o número, limpe o campo ou ignore uma das pessoas.": {
    en: "This number appears on more than one row. Change it, clear the field, or ignore one of the people.",
    es: "Este celular aparece en más de una fila. Cambia el número, limpia el campo o ignora a una de las personas.",
    fr: "Ce numéro apparaît sur plus d'une ligne. Changez-le, videz le champ ou ignorez l'une des personnes.",
  },
  "Deixar em branco": {
    en: "Leave blank",
    es: "Dejar en blanco",
    fr: "Laisser vide",
  },
  "Quem ficar sem celular é cadastrado mesmo assim, mas não consegue entrar no sistema até alguém preencher o número.": {
    en: "Anyone left without a phone is still added, but cannot sign in until someone fills in the number.",
    es: "Quien quede sin celular se registra igual, pero no puede entrar al sistema hasta que alguien complete el número.",
    fr: "Qui reste sans téléphone est tout de même inscrit, mais ne pourra pas se connecter tant que quelqu'un n'aura pas renseigné le numéro.",
  },
  "Esta pessoa não será inserida.": {
    en: "This person will not be inserted.",
    es: "Esta persona no será insertada.",
    fr: "Cette personne ne sera pas ajoutée.",
  },
  "Linha {row} · {name}": {
    en: "Row {row} · {name}",
    es: "Fila {row} · {name}",
    fr: "Ligne {row} · {name}",
  },
  "Fica com o celular": {
    en: "Keeps the phone",
    es: "Se queda con el celular",
    fr: "Garde le téléphone",
  },
  "Sem celular": {
    en: "No phone",
    es: "Sin celular",
    fr: "Sans téléphone",
  },
  "Novo celular": {
    en: "New phone",
    es: "Nuevo celular",
    fr: "Nouveau téléphone",
  },
  "Ignorado": {
    en: "Ignored",
    es: "Ignorado",
    fr: "Ignoré",
  },
  "Situação": {
    en: "Status",
    es: "Situación",
    fr: "Situation",
  },
  "Editar cadastro": {
    en: "Edit record",
    es: "Editar registro",
    fr: "Modifier la fiche",
  },
  "Já existe um cadastro com esta chave. Quarto, time, função e transporte atuais serão mantidos.": {
    en: "A record with this key already exists. Current room, team, role and transport will be kept.",
    es: "Ya existe un registro con esta clave. Habitación, equipo, función y transporte actuales se mantendrán.",
    fr: "Une fiche avec cette clé existe déjà. Chambre, équipe, rôle et transport actuels seront conservés.",
  },
  "Versão mesclada": {
    en: "Merged version",
    es: "Versión fusionada",
    fr: "Version fusionnée",
  },
  "Sistema": {
    en: "System",
    es: "Sistema",
    fr: "Système",
  },
  "Planilha": {
    en: "Spreadsheet",
    es: "Hoja",
    fr: "Tableur",
  },
  "Ambos": {
    en: "Both",
    es: "Ambos",
    fr: "Les deux",
  },
  "Cadastro atual": {
    en: "Current record",
    es: "Registro actual",
    fr: "Fiche actuelle",
  },
  "Mesclando as versões": {
    en: "Merging the versions",
    es: "Fusionando las versiones",
    fr: "Fusion des versions",
  },
  "Mesclar informações": {
    en: "Merge information",
    es: "Fusionar información",
    fr: "Fusionner les informations",
  },
  "Qual regra deve valer para todos?": {
    en: "Which rule should apply to everyone?",
    es: "¿Qué regla debe valer para todos?",
    fr: "Quelle règle doit s'appliquer à tous ?",
  },
  "Atualizar com a planilha": {
    en: "Update from the spreadsheet",
    es: "Actualizar con la hoja",
    fr: "Mettre à jour avec le tableur",
  },
  "Manter os cadastros atuais": {
    en: "Keep current records",
    es: "Mantener los registros actuales",
    fr: "Garder les fiches actuelles",
  },
  "Mesclar as informações": {
    en: "Merge the information",
    es: "Fusionar las informaciones",
    fr: "Fusionner les informations",
  },
  "Cadastro já criado na revisão: {name}.": {
    en: "Record already created in review: {name}.",
    es: "Registro ya creado en la revisión: {name}.",
    fr: "Fiche déjà créée à la révision : {name}.",
  },
  "Cadastros já criados na revisão: {names}.": {
    en: "Records already created in review: {names}.",
    es: "Registros ya creados en la revisión: {names}.",
    fr: "Fiches déjà créées à la révision : {names}.",
  },
  "Categoria": {
    en: "Category",
    es: "Categoría",
    fr: "Catégorie",
  },
  "Novas opções encontradas": {
    en: "New options found",
    es: "Nuevas opciones encontradas",
    fr: "Nouvelles options trouvées",
  },
  "Marque o que deve entrar nas listas.": {
    en: "Check what should go into the lists.",
    es: "Marca lo que debe entrar en las listas.",
    fr: "Cochez ce qui doit entrer dans les listes.",
  },
  "Inserir": {
    en: "Insert",
    es: "Insertar",
    fr: "Insérer",
  },
  "Lista": {
    en: "List",
    es: "Lista",
    fr: "Liste",
  },
  "Nova opção": {
    en: "New option",
    es: "Nueva opción",
    fr: "Nouvelle option",
  },
  "Exemplos da planilha": {
    en: "Examples from the spreadsheet",
    es: "Ejemplos de la hoja",
    fr: "Exemples du tableur",
  },
  "Inserir {value}": {
    en: "Insert {value}",
    es: "Insertar {value}",
    fr: "Insérer {value}",
  },
  "Linha {row}:": {
    en: "Row {row}:",
    es: "Fila {row}:",
    fr: "Ligne {row} :",
  },
  "As informações desmarcadas serão movidas para as observações de cada pessoa.": {
    en: "Unchecked information will be moved to each person's notes.",
    es: "Las informaciones desmarcadas se moverán a las observaciones de cada persona.",
    fr: "Les informations décochées seront déplacées dans les notes de chaque personne.",
  },
  "Linha": {
    en: "Row",
    es: "Fila",
    fr: "Ligne",
  },
  "Origem": {
    en: "Source",
    es: "Origen",
    fr: "Origine",
  },
  "Sexo": {
    en: "Sex",
    es: "Sexo",
    fr: "Sexe",
  },
  "Função": {
    en: "Role",
    es: "Función",
    fr: "Fonction",
  },
  "Alergia a remédios": {
    en: "Drug allergy",
    es: "Alergia a remedios",
    fr: "Allergie aux médicaments",
  },
  "Condições de saúde": {
    en: "Health conditions",
    es: "Condiciones de salud",
    fr: "Conditions de santé",
  },
  "Restrição alimentar": {
    en: "Food restriction",
    es: "Restricción alimentaria",
    fr: "Restriction alimentaire",
  },
  "Feminino": {
    en: "Female",
    es: "Femenino",
    fr: "Féminin",
  },
  "Masculino": {
    en: "Male",
    es: "Masculino",
    fr: "Masculin",
  },
  "Cadastro existente mantido": {
    en: "Existing record kept",
    es: "Registro existente mantenido",
    fr: "Fiche existante conservée",
  },
  "Revisão ignorada": {
    en: "Review skipped",
    es: "Revisión ignorada",
    fr: "Révision ignorée",
  },
  "Mesclado": {
    en: "Merged",
    es: "Fusionado",
    fr: "Fusionné",
  },
  "Pendente": {
    en: "Pending",
    es: "Pendiente",
    fr: "En attente",
  },
  "Recolher coluna": {
    en: "Collapse column",
    es: "Recoger columna",
    fr: "Replier la colonne",
  },
  "Mostrar o conteúdo completo desta coluna": {
    en: "Show this column's full content",
    es: "Mostrar el contenido completo de esta columna",
    fr: "Afficher le contenu complet de cette colonne",
  },
  "Mostrando as primeiras 200 linhas.": {
    en: "Showing the first 200 rows.",
    es: "Mostrando las primeras 200 filas.",
    fr: "Affichage des 200 premières lignes.",
  },
  "Colunas sem destino": {
    en: "Columns without a target",
    es: "Columnas sin destino",
    fr: "Colonnes sans destination",
  },
  "Escolha a coluna de Nome": {
    en: "Choose the Name column",
    es: "Elige la columna de Nombre",
    fr: "Choisissez la colonne Nom",
  },
  "Atribua um destino ou deixe os valores irem para as observações.": {
    en: "Assign a target or let the values go to the notes.",
    es: "Asigna un destino o deja que los valores vayan a las observaciones.",
    fr: "Attribuez une destination ou laissez les valeurs aller dans les notes.",
  },
  "Não encontrei o ": {
    en: "I couldn't find ",
    es: "No encontré el ",
    fr: "Je n'ai pas trouvé ",
  },
  "escolha a coluna com os nomes": {
    en: "choose the column with the names",
    es: "elige la columna con los nombres",
    fr: "choisissez la colonne avec les noms",
  },
  "Escolha a coluna…": {
    en: "Choose the column…",
    es: "Elige la columna…",
    fr: "Choisissez la colonne…",
  },
  "{count} colunas sem destino": {
    en: "{count} columns without a target",
    es: "{count} columnas sin destino",
    fr: "{count} colonnes sans destination",
  },
  "sem amostra": {
    en: "no sample",
    es: "sin muestra",
    fr: "pas d'échantillon",
  },
  "Preparando…": {
    en: "Preparing…",
    es: "Preparando…",
    fr: "Préparation…",
  },
  "Motivo": {
    en: "Reason",
    es: "Motivo",
    fr: "Motif",
  },
  "Não importados": {
    en: "Not imported",
    es: "No importados",
    fr: "Non importés",
  },
  "Organizador": {
    en: "Organizer",
    es: "Organizador",
    fr: "Organisateur",
  },
  "Ajudante do check-in": {
    en: "Check-in helper",
    es: "Ayudante del check-in",
    fr: "Aide au check-in",
  },
  "Ajudante de coletes": {
    en: "Vest helper",
    es: "Ayudante de chalecos",
    fr: "Aide aux gilets",
  },
  "Ajudante do placar": {
    en: "Score helper",
    es: "Ayudante del marcador",
    fr: "Aide au tableau",
  },
  "Organizador dos jogos": {
    en: "Games organizer",
    es: "Organizador de los juegos",
    fr: "Organisateur des jeux",
  },
  "Jogos": {
    en: "Games",
    es: "Juegos",
    fr: "Jeux",
  },
  "Documento": {
    en: "Document",
    es: "Documento",
    fr: "Document",
  },
  "CPF, RG, identidade, passaporte…": {
    en: "CPF, ID card, passport…",
    es: "CPF, RG, identidad, pasaporte…",
    fr: "CPF, pièce d'identité, passeport…",
  },
};
