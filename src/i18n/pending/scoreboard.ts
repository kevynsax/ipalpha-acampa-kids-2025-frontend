import type { Locale } from "../locales";

export const LITERALS: Record<string, Partial<Record<Exclude<Locale, "pt">, string>>> = {
  " (agora)": {
    en: " (now)",
    es: " (ahora)",
    fr: " (maintenant)",
  },
  " · ✅ check-in feito": {
    en: " · ✅ check-in done",
    es: " · ✅ check-in hecho",
    fr: " · ✅ check-in effectué",
  },
  "A criança": {
    en: "The child",
    es: "El niño",
    fr: "L'enfant",
  },
  "Abrindo câmera…": {
    en: "Opening camera…",
    es: "Abriendo cámara…",
    fr: "Ouverture de la caméra…",
  },
  "Ainda não há lançamentos no placar.": {
    en: "There are no scoreboard entries yet.",
    es: "Aún no hay registros en el marcador.",
    fr: "Il n'y a pas encore de saisies au score.",
  },
  "ao time da criança.": {
    en: "to the child's team.",
    es: "al equipo del niño.",
    fr: "à l'équipe de l'enfant.",
  },
  "Apagar": {
    en: "Delete",
    es: "Borrar",
    fr: "Supprimer",
  },
  "Apagar esta leitura?": {
    en: "Delete this scan?",
    es: "¿Borrar esta lectura?",
    fr: "Supprimer cette lecture ?",
  },
  "Apagar este lançamento?": {
    en: "Delete this entry?",
    es: "¿Borrar este registro?",
    fr: "Supprimer cette saisie ?",
  },
  "Apagar lançamento": {
    en: "Delete entry",
    es: "Borrar registro",
    fr: "Supprimer la saisie",
  },
  "Apagar lançamento (desfaz os pontos)": {
    en: "Delete entry (undoes the points)",
    es: "Borrar registro (deshace los puntos)",
    fr: "Supprimer la saisie (annule les points)",
  },
  "Atualizando…": {
    en: "Updating…",
    es: "Actualizando…",
    fr: "Mise à jour…",
  },
  "Atualizar todas para {n}": {
    en: "Update all to {n}",
    es: "Actualizar todas a {n}",
    fr: "Tout mettre à {n}",
  },
  "Buscar criança": {
    en: "Search child",
    es: "Buscar niño",
    fr: "Rechercher un enfant",
  },
  "Cada crachá lido dá": {
    en: "Each scanned badge gives",
    es: "Cada credencial leída da",
    fr: "Chaque badge lu donne",
  },
  "Cada ponto do placar vem de um lançamento: quem lançou, para qual time, por qual evento e por quê. Nada é apagado ao zerar — só ao apagar uma linha.": {
    en: "Every scoreboard point comes from an entry: who entered it, for which team, for which event and why. Nothing is deleted when zeroing — only when deleting a line.",
    es: "Cada punto del marcador viene de un registro: quién lo hizo, para qué equipo, por qué evento y por qué. Nada se borra al poner a cero — solo al borrar una línea.",
    fr: "Chaque point du score vient d'une saisie : qui l'a faite, pour quelle équipe, pour quel événement et pourquoi. Rien n'est effacé en remettant à zéro — seulement en supprimant une ligne.",
  },
  "com pontos": {
    en: "with points",
    es: "con puntos",
    fr: "avec points",
  },
  "Crachá lido": {
    en: "Badge scanned",
    es: "Credencial leída",
    fr: "Badge lu",
  },
  "Crachás lidos": {
    en: "Badges scanned",
    es: "Credenciales leídas",
    fr: "Badges lus",
  },
  "crachás lidos de {n}": {
    en: "badges scanned of {n}",
    es: "credenciales leídas de {n}",
    fr: "badges lus sur {n}",
  },
  "criança ganhou pontos neste evento": {
    en: "child earned points in this event",
    es: "niño ganó puntos en este evento",
    fr: "enfant a gagné des points dans cet événement",
  },
  "crianças ganharam pontos neste evento": {
    en: "children earned points in this event",
    es: "niños ganaron puntos en este evento",
    fr: "enfants ont gagné des points dans cet événement",
  },
  "Dar pontos": {
    en: "Give points",
    es: "Dar puntos",
    fr: "Donner des points",
  },
  "Dar pontos a {name}": {
    en: "Give points to {name}",
    es: "Dar puntos a {name}",
    fr: "Donner des points à {name}",
  },
  "Dar {n} ponto": {
    en: "Give {n} point",
    es: "Dar {n} punto",
    fr: "Donner {n} point",
  },
  "Dar {n} pontos": {
    en: "Give {n} points",
    es: "Dar {n} puntos",
    fr: "Donner {n} points",
  },
  "e mais {n}": {
    en: "and {n} more",
    es: "y {n} más",
    fr: "et {n} de plus",
  },
  "em": {
    en: "in",
    es: "en",
    fr: "dans",
  },
  "Encerrar": {
    en: "Close",
    es: "Cerrar",
    fr: "Terminer",
  },
  "Encerrar leitura": {
    en: "End scanning",
    es: "Terminar lectura",
    fr: "Terminer la lecture",
  },
  "Escolha o evento da programação antes de ler.": {
    en: "Choose the schedule event before scanning.",
    es: "Elige el evento de la programación antes de leer.",
    fr: "Choisissez l'événement du programme avant de lire.",
  },
  "Escolha o evento para liberar a lista.": {
    en: "Choose the event to unlock the list.",
    es: "Elige el evento para liberar la lista.",
    fr: "Choisissez l'événement pour débloquer la liste.",
  },
  "Escolha o evento: a leitura fica bloqueada até lá.": {
    en: "Choose the event: scanning stays locked until then.",
    es: "Elige el evento: la lectura queda bloqueada hasta entonces.",
    fr: "Choisissez l'événement : la lecture reste bloquée jusque-là.",
  },
  "Escolha o evento…": {
    en: "Choose the event…",
    es: "Elige el evento…",
    fr: "Choisissez l'événement…",
  },
  "Esta criança": {
    en: "This child",
    es: "Este niño",
    fr: "Cet enfant",
  },
  "Este QR code não é de uma pulseira ou crachá do Acampa Kids.": {
    en: "This QR code is not from an Acampa Kids wristband or badge.",
    es: "Este código QR no es de una pulsera o credencial de Acampa Kids.",
    fr: "Ce code QR n'est pas d'un bracelet ou badge Acampa Kids.",
  },
  "Este time ainda não tem lançamentos.": {
    en: "This team has no entries yet.",
    es: "Este equipo aún no tiene registros.",
    fr: "Cette équipe n'a pas encore de saisies.",
  },
  "Evento removido": {
    en: "Event removed",
    es: "Evento eliminado",
    fr: "Événement supprimé",
  },
  "evento removido": {
    en: "event removed",
    es: "evento eliminado",
    fr: "événement supprimé",
  },
  "Ex.: Arrumaram todo o refeitório": {
    en: "E.g.: They cleaned the whole dining hall",
    es: "Ej.: Ordenaron todo el comedor",
    fr: "Ex. : Ils ont rangé toute la cantine",
  },
  "Ex.: Não arrumou a cama": {
    en: "E.g.: Didn't make the bed",
    es: "Ej.: No ordenó la cama",
    fr: "Ex. : N'a pas fait le lit",
  },
  "faltam:": {
    en: "missing:",
    es: "faltan:",
    fr: "manquants :",
  },
  "Histórico": {
    en: "History",
    es: "Historial",
    fr: "Historique",
  },
  "Histórico do placar": {
    en: "Scoreboard history",
    es: "Historial del marcador",
    fr: "Historique du score",
  },
  "Informe uma quantidade de pontos maior que zero.": {
    en: "Enter a points amount greater than zero.",
    es: "Indica una cantidad de puntos mayor que cero.",
    fr: "Indiquez une quantité de points supérieure à zéro.",
  },
  "Já receberam": {
    en: "Already received",
    es: "Ya recibieron",
    fr: "Déjà reçus",
  },
  "Lançado por": {
    en: "Entered by",
    es: "Registrado por",
    fr: "Saisi par",
  },
  "Lançar pontos em massa": {
    en: "Enter bulk points",
    es: "Lanzar puntos en masa",
    fr: "Saisir des points en masse",
  },
  "Leituras": {
    en: "Scans",
    es: "Lecturas",
    fr: "Lectures",
  },
  "Ler os crachás com a câmera": {
    en: "Scan badges with the camera",
    es: "Leer las credenciales con la cámara",
    fr: "Lire les badges avec la caméra",
  },
  "Lido por": {
    en: "Scanned by",
    es: "Leído por",
    fr: "Lu par",
  },
  "Limpar filtros": {
    en: "Clear filters",
    es: "Limpiar filtros",
    fr: "Effacer les filtres",
  },
  "Linha do tempo": {
    en: "Timeline",
    es: "Línea de tiempo",
    fr: "Chronologie",
  },
  "Nenhum lançamento com esses filtros.": {
    en: "No entries match these filters.",
    es: "Ningún registro con estos filtros.",
    fr: "Aucune saisie avec ces filtres.",
  },
  "Nenhum lançamento.": {
    en: "No entries.",
    es: "Ningún registro.",
    fr: "Aucune saisie.",
  },
  "Nenhum time cadastrado ainda.": {
    en: "No teams registered yet.",
    es: "Ningún equipo registrado aún.",
    fr: "Aucune équipe enregistrée pour l'instant.",
  },
  "Ninguém com check-in e sem pontos com esse nome.": {
    en: "No one with check-in and without points matches that name.",
    es: "Nadie con check-in y sin puntos con ese nombre.",
    fr: "Personne avec check-in et sans points pour ce nom.",
  },
  "Ninguém foi lido neste evento ainda.": {
    en: "No one has been scanned in this event yet.",
    es: "Nadie fue leído en este evento aún.",
    fr: "Personne n'a encore été lu dans cet événement.",
  },
  "no placar": {
    en: "on the scoreboard",
    es: "en el marcador",
    fr: "au score",
  },
  "Não foi possível ler este QR code.": {
    en: "Could not read this QR code.",
    es: "No se pudo leer este código QR.",
    fr: "Impossible de lire ce code QR.",
  },
  "Não foi possível ligar a lanterna.": {
    en: "Could not turn on the flashlight.",
    es: "No se pudo encender la linterna.",
    fr: "Impossible d'allumer la lampe.",
  },
  "o time": {
    en: "the team",
    es: "el equipo",
    fr: "l'équipe",
  },
  "O valor é um só por evento: a próxima leitura (ou o botão) muda todas para": {
    en: "The value is one per event: the next scan (or the button) changes all to",
    es: "El valor es uno solo por evento: la próxima lectura (o el botón) cambia todas a",
    fr: "La valeur est unique par événement : la prochaine lecture (ou le bouton) change toutes à",
  },
  "O valor é um só por evento: o próximo lançamento (ou o botão) muda todas para": {
    en: "The value is one per event: the next entry (or the button) changes all to",
    es: "El valor es uno solo por evento: el próximo registro (o el botón) cambia todas a",
    fr: "La valeur est unique par événement : la prochaine saisie (ou le bouton) change toutes à",
  },
  "Observação (opcional)": {
    en: "Note (optional)",
    es: "Observación (opcional)",
    fr: "Note (facultatif)",
  },
  "Os pontos precisam ser um número inteiro maior que zero.": {
    en: "Points must be a whole number greater than zero.",
    es: "Los puntos deben ser un número entero mayor que cero.",
    fr: "Les points doivent être un entier supérieur à zéro.",
  },
  "Permita o acesso à câmera nas configurações do navegador e tente novamente.": {
    en: "Allow camera access in the browser settings and try again.",
    es: "Permite el acceso a la cámara en la configuración del navegador e inténtalo de nuevo.",
    fr: "Autorisez l'accès à la caméra dans les réglages du navigateur et réessayez.",
  },
  "ponto": {
    en: "point",
    es: "punto",
    fr: "point",
  },
  "ponto por criança": {
    en: "point per child",
    es: "punto por niño",
    fr: "point par enfant",
  },
  "Pontos": {
    en: "Points",
    es: "Puntos",
    fr: "Points",
  },
  "pontos": {
    en: "points",
    es: "puntos",
    fr: "points",
  },
  "Pontos dados": {
    en: "Points given",
    es: "Puntos dados",
    fr: "Points donnés",
  },
  "Pontos em massa": {
    en: "Bulk points",
    es: "Puntos en masa",
    fr: "Points en masse",
  },
  "Pontos por criança": {
    en: "Points per child",
    es: "Puntos por niño",
    fr: "Points par enfant",
  },
  "pontos por criança": {
    en: "points per child",
    es: "puntos por niño",
    fr: "points par enfant",
  },
  "Pontos por QR code": {
    en: "Points by QR code",
    es: "Puntos por código QR",
    fr: "Points par code QR",
  },
  "Pontos tirados": {
    en: "Points taken",
    es: "Puntos quitados",
    fr: "Points retirés",
  },
  "Por evento": {
    en: "By event",
    es: "Por evento",
    fr: "Par événement",
  },
  "Por time": {
    en: "By team",
    es: "Por equipo",
    fr: "Par équipe",
  },
  "pt": {
    en: "pt",
    es: "pt",
    fr: "pt",
  },
  "pts": {
    en: "pts",
    es: "pts",
    fr: "pts",
  },
  "Qtd.": {
    en: "Qty",
    es: "Cant.",
    fr: "Qté",
  },
  "Qualquer pessoa": {
    en: "Anyone",
    es: "Cualquier persona",
    fr: "N'importe qui",
  },
  "Quantos pontos?": {
    en: "How many points?",
    es: "¿Cuántos puntos?",
    fr: "Combien de points ?",
  },
  "saldo": {
    en: "balance",
    es: "saldo",
    fr: "solde",
  },
  "sem pontos": {
    en: "without points",
    es: "sin puntos",
    fr: "sans points",
  },
  "Sem programação": {
    en: "No schedule",
    es: "Sin programación",
    fr: "Pas de programme",
  },
  "só este": {
    en: "only this",
    es: "solo este",
    fr: "celui-ci seulement",
  },
  "Time não encontrado.": {
    en: "Team not found.",
    es: "Equipo no encontrado.",
    fr: "Équipe introuvable.",
  },
  "Time removido": {
    en: "Team removed",
    es: "Equipo eliminado",
    fr: "Équipe supprimée",
  },
  "time removido": {
    en: "team removed",
    es: "equipo eliminado",
    fr: "équipe supprimée",
  },
  "Tipo de lançamento": {
    en: "Entry type",
    es: "Tipo de registro",
    fr: "Type de saisie",
  },
  "Tirar pontos": {
    en: "Take points",
    es: "Quitar puntos",
    fr: "Retirer des points",
  },
  "Tirar pontos de {name}": {
    en: "Take points from {name}",
    es: "Quitar puntos a {name}",
    fr: "Retirer des points à {name}",
  },
  "Tirar {n} ponto": {
    en: "Take {n} point",
    es: "Quitar {n} punto",
    fr: "Retirer {n} point",
  },
  "Tirar {n} pontos": {
    en: "Take {n} points",
    es: "Quitar {n} puntos",
    fr: "Retirer {n} points",
  },
  "todas": {
    en: "all",
    es: "todas",
    fr: "toutes",
  },
  "Todas as crianças com check-in já receberam os pontos deste evento. 🎉": {
    en: "All checked-in children already received points for this event. 🎉",
    es: "Todos los niños con check-in ya recibieron los puntos de este evento. 🎉",
    fr: "Tous les enfants avec check-in ont déjà reçu les points de cet événement. 🎉",
  },
  "Todos os eventos": {
    en: "All events",
    es: "Todos los eventos",
    fr: "Tous les événements",
  },
  "Toque no nome da criança: o time dela ganha": {
    en: "Tap the child's name: their team earns",
    es: "Toca el nombre del niño: su equipo gana",
    fr: "Touchez le nom de l'enfant : son équipe gagne",
  },
  "Toque no nome do time para ver de onde vieram os pontos.": {
    en: "Tap the team name to see where the points came from.",
    es: "Toca el nombre del equipo para ver de dónde vinieron los puntos.",
    fr: "Touchez le nom de l'équipe pour voir d'où viennent les points.",
  },
  "Uma linha de {pts} é escrita no histórico — nada é apagado e dá para desfazer apagando essa linha.": {
    en: "A {pts} line is written in the history — nothing is deleted and you can undo by deleting that line.",
    es: "Se escribe una línea de {pts} en el historial — nada se borra y se puede deshacer borrando esa línea.",
    fr: "Une ligne de {pts} est écrite dans l'historique — rien n'est effacé et on peut annuler en supprimant cette ligne.",
  },
  "Uma vez por criança neste evento.": {
    en: "Once per child in this event.",
    es: "Una vez por niño en este evento.",
    fr: "Une fois par enfant dans cet événement.",
  },
  "Ver de onde vieram os pontos": {
    en: "See where the points came from",
    es: "Ver de dónde vinieron los puntos",
    fr: "Voir d'où viennent les points",
  },
  "ver histórico completo": {
    en: "see full history",
    es: "ver historial completo",
    fr: "voir l'historique complet",
  },
  "ver todas": {
    en: "see all",
    es: "ver todas",
    fr: "voir toutes",
  },
  "ver tudo": {
    en: "see all",
    es: "ver todo",
    fr: "tout voir",
  },
  "Zerado": {
    en: "Reset",
    es: "Puesto a cero",
    fr: "Remis à zéro",
  },
  "Zerados": {
    en: "Resets",
    es: "Puestos a cero",
    fr: "Remises à zéro",
  },
  "Zerar {name}?": {
    en: "Zero {name}?",
    es: "¿Poner a cero {name}?",
    fr: "Remettre {name} à zéro ?",
  },
  "{kids} de {total} criança · {pts} {word} cada": {
    en: "{kids} of {total} child · {pts} {word} each",
    es: "{kids} de {total} niño · {pts} {word} cada uno",
    fr: "{kids} sur {total} enfant · {pts} {word} chacun",
  },
  "{kids} de {total} crianças · {pts} {word} cada": {
    en: "{kids} of {total} children · {pts} {word} each",
    es: "{kids} de {total} niños · {pts} {word} cada uno",
    fr: "{kids} sur {total} enfants · {pts} {word} chacun",
  },
  "{name} já foi lido(a) neste evento.": {
    en: "{name} was already scanned in this event.",
    es: "{name} ya fue leído(a) en este evento.",
    fr: "{name} a déjà été lu(e) dans cet événement.",
  },
  "{name} não está em nenhum time.": {
    en: "{name} is not on any team.",
    es: "{name} no está en ningún equipo.",
    fr: "{name} n'est dans aucune équipe.",
  },
  "{name} volta para a lista de quem ainda não recebeu; {pts} sai do time.": {
    en: "{name} goes back to the list of those who haven't received yet; {pts} leave the team.",
    es: "{name} vuelve a la lista de quien aún no recibió; {pts} salen del equipo.",
    fr: "{name} revient dans la liste de ceux qui n'ont pas encore reçu ; {pts} quittent l'équipe.",
  },
  "{name} · +{n} para {team}{checkin}": {
    en: "{name} · +{n} for {team}{checkin}",
    es: "{name} · +{n} para {team}{checkin}",
    fr: "{name} · +{n} pour {team}{checkin}",
  },
  "{n} criança já com": {
    en: "{n} child already with",
    es: "{n} niño ya con",
    fr: "{n} enfant déjà avec",
  },
  "{n} criança já lida com": {
    en: "{n} child already scanned with",
    es: "{n} niño ya leído con",
    fr: "{n} enfant déjà lu avec",
  },
  "{n} crianças já com": {
    en: "{n} children already with",
    es: "{n} niños ya con",
    fr: "{n} enfants déjà avec",
  },
  "{n} crianças já lidas com": {
    en: "{n} children already scanned with",
    es: "{n} niños ya leídos con",
    fr: "{n} enfants déjà lus avec",
  },
  "{n} lançamento": {
    en: "{n} entry",
    es: "{n} registro",
    fr: "{n} saisie",
  },
  "{n} lançamentos": {
    en: "{n} entries",
    es: "{n} registros",
    fr: "{n} saisies",
  },
  "{n} sem check-in (só pelo crachá)": {
    en: "{n} without check-in (badge only)",
    es: "{n} sin check-in (solo por credencial)",
    fr: "{n} sans check-in (badge seulement)",
  },
  "{n}º": {
    en: "#{n}",
    es: "{n}º",
    fr: "{n}e",
  },
  "{n}º lugar": {
    en: "#{n}",
    es: "{n}º lugar",
    fr: "{n}e place",
  },
  "{pts} para {who} será desfeito. O placar muda na hora.": {
    en: "{pts} for {who} will be undone. The scoreboard updates right away.",
    es: "{pts} para {who} se deshará. El marcador cambia al instante.",
    fr: "{pts} pour {who} sera annulé. Le score change tout de suite.",
  },
  "{read} de {kids} criança": {
    en: "{read} of {kids} child",
    es: "{read} de {kids} niño",
    fr: "{read} sur {kids} enfant",
  },
  "{read} de {kids} crianças": {
    en: "{read} of {kids} children",
    es: "{read} de {kids} niños",
    fr: "{read} sur {kids} enfants",
  },
  "Últimos lançamentos": {
    en: "Latest entries",
    es: "Últimos registros",
    fr: "Dernières saisies",
  },
  "↩︎ Desfazer": {
    en: "↩︎ Undo",
    es: "↩︎ Deshacer",
    fr: "↩︎ Annuler",
  },
  "➕ Dar pontos a {name}": {
    en: "➕ Give points to {name}",
    es: "➕ Dar puntos a {name}",
    fr: "➕ Donner des points à {name}",
  },
  "➖ Tirar pontos de {name}": {
    en: "➖ Take points from {name}",
    es: "➖ Quitar puntos a {name}",
    fr: "➖ Retirer des points à {name}",
  },
  "📋 Pontos em massa dá pontos a várias crianças de uma vez — pelo nome ou lendo os crachás.": {
    en: "📋 Bulk points gives points to several children at once — by name or by scanning badges.",
    es: "📋 Puntos en masa da puntos a varios niños de una vez — por nombre o leyendo las credenciales.",
    fr: "📋 Points en masse donne des points à plusieurs enfants d'un coup — par nom ou en lisant les badges.",
  },
  "🔦 Desligar lanterna": {
    en: "🔦 Turn off flashlight",
    es: "🔦 Apagar linterna",
    fr: "🔦 Éteindre la lampe",
  },
  "🔦 Ligar lanterna": {
    en: "🔦 Turn on flashlight",
    es: "🔦 Encender linterna",
    fr: "🔦 Allumer la lampe",
  },
};
