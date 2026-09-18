import type { Locale } from "../locales";

export const LITERALS: Record<string, Partial<Record<Exclude<Locale, "pt">, string>>> = {
  " · ": {
    en: " · ",
    es: " · ",
    fr: " · ",
  },
  ", {n} separado(s)": {
    en: ", {n} split",
    es: ", {n} separado(s)",
    fr: ", {n} séparé(s)",
  },
  ", {n} sem quarto": {
    en: ", {n} without a room",
    es: ", {n} sin habitación",
    fr: ", {n} sans chambre",
  },
  "+ Faixa de idade": {
    en: "+ Age band",
    es: "+ Franja de edad",
    fr: "+ Tranche d'âge",
  },
  "+{n} mensagem(ns)": {
    en: "+{n} message(s)",
    es: "+{n} mensaje(s)",
    fr: "+{n} message(s)",
  },
  "{n} criança ganhou quarto": {
    en: "{n} child got a room",
    es: "{n} niño consiguió habitación",
    fr: "{n} enfant a obtenu une chambre",
  },
  "{n} criança mudaram de líder": {
    en: "{n} child changed leader",
    es: "{n} niño cambió de líder",
    fr: "{n} enfant a changé de leader",
  },
  "{n} criança saíram do quarto": {
    en: "{n} child left the room",
    es: "{n} niño salió de la habitación",
    fr: "{n} enfant a quitté la chambre",
  },
  "{n} criança trocaram de quarto": {
    en: "{n} child switched rooms",
    es: "{n} niño cambió de habitación",
    fr: "{n} enfant a changé de chambre",
  },
  "{n} crianças ganharam quarto": {
    en: "{n} children got a room",
    es: "{n} niños consiguieron habitación",
    fr: "{n} enfants ont obtenu une chambre",
  },
  "{n} crianças mudaram de líder": {
    en: "{n} children changed leader",
    es: "{n} niños cambiaron de líder",
    fr: "{n} enfants ont changé de leader",
  },
  "{n} crianças saíram do quarto": {
    en: "{n} children left the room",
    es: "{n} niños salieron de la habitación",
    fr: "{n} enfants ont quitté la chambre",
  },
  "{n} crianças trocaram de quarto": {
    en: "{n} children switched rooms",
    es: "{n} niños cambiaron de habitación",
    fr: "{n} enfants ont changé de chambre",
  },
  "{n} da equipe ganharam quarto": {
    en: "{n} staff got a room",
    es: "{n} del equipo consiguieron habitación",
    fr: "{n} de l'équipe ont obtenu une chambre",
  },
  "{n} da equipe ganhou quarto": {
    en: "{n} staff got a room",
    es: "{n} del equipo consiguió habitación",
    fr: "{n} de l'équipe a obtenu une chambre",
  },
  "{n} da equipe mudaram de função": {
    en: "{n} staff changed role",
    es: "{n} del equipo cambiaron de función",
    fr: "{n} de l'équipe ont changé de rôle",
  },
  "{n} da equipe saíram do quarto": {
    en: "{n} staff left the room",
    es: "{n} del equipo salieron de la habitación",
    fr: "{n} de l'équipe ont quitté la chambre",
  },
  "{n} da equipe trocaram de quarto": {
    en: "{n} staff switched rooms",
    es: "{n} del equipo cambiaron de habitación",
    fr: "{n} de l'équipe ont changé de chambre",
  },
  "{n} pessoa": {
    en: "{n} person",
    es: "{n} persona",
    fr: "{n} personne",
  },
  "{n} pessoas": {
    en: "{n} people",
    es: "{n} personas",
    fr: "{n} personnes",
  },
  "{n} quarto": {
    en: "{n} room",
    es: "{n} habitación",
    fr: "{n} chambre",
  },
  "{n} quartos": {
    en: "{n} rooms",
    es: "{n} habitaciones",
    fr: "{n} chambres",
  },
  "{n} sem líder": {
    en: "{n} without a leader",
    es: "{n} sin líder",
    fr: "{n} sans leader",
  },
  "{n} sem quarto": {
    en: "{n} without a room",
    es: "{n} sin habitación",
    fr: "{n} sans chambre",
  },
  "{used}/{capacity} · {extra} a mais que as {capacity} camas": {
    en: "{used}/{capacity} · {extra} over the {capacity} beds",
    es: "{used}/{capacity} · {extra} de más que las {capacity} camas",
    fr: "{used}/{capacity} · {extra} de plus que les {capacity} lits",
  },
  "{used}/{capacity} · {free} cama livre": {
    en: "{used}/{capacity} · {free} free bed",
    es: "{used}/{capacity} · {free} cama libre",
    fr: "{used}/{capacity} · {free} lit libre",
  },
  "{used}/{capacity} · {free} camas livres": {
    en: "{used}/{capacity} · {free} free beds",
    es: "{used}/{capacity} · {free} camas libres",
    fr: "{used}/{capacity} · {free} lits libres",
  },
  "{used}/{capacity} · lotado": {
    en: "{used}/{capacity} · full",
    es: "{used}/{capacity} · lleno",
    fr: "{used}/{capacity} · complet",
  },
  "a": {
    en: "to",
    es: "a",
    fr: "à",
  },
  "Algo deu errado.": {
    en: "Something went wrong.",
    es: "Algo salió mal.",
    fr: "Une erreur s'est produite.",
  },
  "anos →": {
    en: "years →",
    es: "años →",
    fr: "ans →",
  },
  "Aplicar e avisar": {
    en: "Apply and notify",
    es: "Aplicar y avisar",
    fr: "Appliquer et prévenir",
  },
  "Aplicar no rascunho": {
    en: "Apply to draft",
    es: "Aplicar al borrador",
    fr: "Appliquer au brouillon",
  },
  "Aplicando…": {
    en: "Applying…",
    es: "Aplicando…",
    fr: "Application…",
  },
  "Arraste a equipe para cá": {
    en: "Drag staff here",
    es: "Arrastra al equipo aquí",
    fr: "Faites glisser l'équipe ici",
  },
  "Arraste a equipe para os quartos da ala Equipe à direita.": {
    en: "Drag staff into the Staff wing rooms on the right.",
    es: "Arrastra al equipo a las habitaciones del ala Equipo a la derecha.",
    fr: "Faites glisser l'équipe vers les chambres de l'aile Équipe à droite.",
  },
  "Arraste crianças para cá": {
    en: "Drag kids here",
    es: "Arrastra niños aquí",
    fr: "Faites glisser les enfants ici",
  },
  "Arraste para um quarto à direita. Solte uma criança em cima de outra para grudá-las; para fora do grupo para separar.": {
    en: "Drag into a room on the right. Drop a child onto another to stick them together; outside the group to split them.",
    es: "Arrastra a una habitación a la derecha. Suelta un niño sobre otro para pegarlos; fuera del grupo para separarlos.",
    fr: "Faites glisser vers une chambre à droite. Déposez un enfant sur un autre pour les coller ; hors du groupe pour les séparer.",
  },
  "Automático": {
    en: "Automatic",
    es: "Automático",
    fr: "Automatique",
  },
  "Avisar {n} por SMS": {
    en: "Notify {n} by SMS",
    es: "Avisar a {n} por SMS",
    fr: "Prévenir {n} par SMS",
  },
  "Buscar por nome ou preferência": {
    en: "Search by name or preference",
    es: "Buscar por nombre o preferencia",
    fr: "Rechercher par nom ou préférence",
  },
  "Cada grupo de preferência vai inteiro para um quarto da ala. Um grupo que não cabe é dividido pelas ligações mais fracas — pares que se pediram mutuamente ficam juntos.": {
    en: "Each preference group goes whole into a wing room. A group that does not fit is split at the weakest links — pairs who asked for each other stay together.",
    es: "Cada grupo de preferencia va entero a una habitación del ala. Un grupo que no cabe se divide por los vínculos más débiles — las parejas que se pidieron mutuamente se quedan juntas.",
    fr: "Chaque groupe de préférence va entier dans une chambre de l'aile. Un groupe qui ne rentre pas est divisé aux liens les plus faibles — les paires qui se sont demandées mutuellement restent ensemble.",
  },
  "Confirmar alterações": {
    en: "Confirm changes",
    es: "Confirmar cambios",
    fr: "Confirmer les modifications",
  },
  "Crianças de": {
    en: "Kids of",
    es: "Niños de",
    fr: "Enfants de",
  },
  "Descartar alterações": {
    en: "Discard changes",
    es: "Descartar cambios",
    fr: "Annuler les modifications",
  },
  "Desgrudar {names}": {
    en: "Ungroup {names}",
    es: "Despegar {names}",
    fr: "Détacher {names}",
  },
  "Distribuir": {
    en: "Distribute",
    es: "Distribuir",
    fr: "Répartir",
  },
  "Distribuir nos quartos": {
    en: "Distribute into rooms",
    es: "Distribuir en las habitaciones",
    fr: "Répartir dans les chambres",
  },
  "Distribuir todo mundo nos quartos automaticamente": {
    en: "Automatically place everyone into rooms",
    es: "Distribuir a todos en las habitaciones automáticamente",
    fr: "Répartir tout le monde dans les chambres automatiquement",
  },
  "em destaque · toque numa delas para passar para {other}.": {
    en: "highlighted · tap one of them to hand them to {other}.",
    es: "destacados · toca uno de ellos para pasarlo a {other}.",
    fr: "mis en avant · touchez-en un pour le passer à {other}.",
  },
  "Filtros": {
    en: "Filters",
    es: "Filtros",
    fr: "Filtres",
  },
  "grupo(s) separado(s)": {
    en: "split group(s)",
    es: "grupo(s) separado(s)",
    fr: "groupe(s) séparé(s)",
  },
  "grupos inteiros": {
    en: "whole groups",
    es: "grupos enteros",
    fr: "groupes entiers",
  },
  "Idade máxima": {
    en: "Maximum age",
    es: "Edad máxima",
    fr: "Âge maximum",
  },
  "Idade mediana: {age} anos": {
    en: "Median age: {age} years",
    es: "Edad mediana: {age} años",
    fr: "Âge médian : {age} ans",
  },
  "Idade mínima": {
    en: "Minimum age",
    es: "Edad mínima",
    fr: "Âge minimum",
  },
  "Já está em outra faixa": {
    en: "Already in another band",
    es: "Ya está en otra franja",
    fr: "Déjà dans une autre tranche",
  },
  "líder": {
    en: "leader",
    es: "líder",
    fr: "leader",
  },
  "Manter quem já tem quarto": {
    en: "Keep who already has a room",
    es: "Mantener a quien ya tiene habitación",
    fr: "Garder ceux qui ont déjà une chambre",
  },
  "Meninas": {
    en: "Girls",
    es: "Niñas",
    fr: "Filles",
  },
  "Meninos": {
    en: "Boys",
    es: "Niños",
    fr: "Garçons",
  },
  "Montar": {
    en: "Assign",
    es: "Armar",
    fr: "Composer",
  },
  "montar os quartos": {
    en: "assign the rooms",
    es: "armar las habitaciones",
    fr: "composer les chambres",
  },
  "Montar quartos": {
    en: "Assign rooms",
    es: "Armar habitaciones",
    fr: "Composer les chambres",
  },
  "Nada foi gravado: a distribuição entra no rascunho e você ajusta antes de Salvar. Os grupos separados ficam marcados no quadro.": {
    en: "Nothing was saved: the distribution goes into the draft and you adjust before Save. Split groups stay marked on the board.",
    es: "Nada se guardó: la distribución entra en el borrador y ajustas antes de Guardar. Los grupos separados quedan marcados en el tablero.",
    fr: "Rien n'a été enregistré : la répartition entre dans le brouillon et vous ajustez avant Enregistrer. Les groupes séparés restent marqués sur le tableau.",
  },
  "Nenhuma alteração para aplicar.": {
    en: "No changes to apply.",
    es: "Ningún cambio para aplicar.",
    fr: "Aucune modification à appliquer.",
  },
  "Não avisar ninguém": {
    en: "Don't notify anyone",
    es: "No avisar a nadie",
    fr: "Ne prévenir personne",
  },
  "Ocultar exemplos": {
    en: "Hide examples",
    es: "Ocultar ejemplos",
    fr: "Masquer les exemples",
  },
  "outro líder": {
    en: "another leader",
    es: "otro líder",
    fr: "un autre leader",
  },
  "Para assim que achar uma distribuição sem grupos separados, ou em {seconds} s.": {
    en: "Stops as soon as it finds a distribution with no split groups, or in {seconds} s.",
    es: "Para en cuanto encuentra una distribución sin grupos separados, o en {seconds} s.",
    fr: "S'arrête dès qu'il trouve une répartition sans groupes séparés, ou en {seconds} s.",
  },
  "Por idade": {
    en: "By age",
    es: "Por edad",
    fr: "Par âge",
  },
  "Procurando a melhor distribuição": {
    en: "Searching for the best distribution",
    es: "Buscando la mejor distribución",
    fr: "Recherche de la meilleure répartition",
  },
  "Quem distribuir": {
    en: "Who to distribute",
    es: "A quién distribuir",
    fr: "Qui répartir",
  },
  "Quem já tem quarto": {
    en: "Who already has a room",
    es: "Quién ya tiene habitación",
    fr: "Qui a déjà une chambre",
  },
  "Quartos distribuídos — {kept} grupo(s) inteiro(s){broken}{unplaced}.": {
    en: "Rooms distributed — {kept} whole group(s){broken}{unplaced}.",
    es: "Habitaciones distribuidas — {kept} grupo(s) entero(s){broken}{unplaced}.",
    fr: "Chambres réparties — {kept} groupe(s) entier(s){broken}{unplaced}.",
  },
  "Quartos fora de todas as faixas recebem as crianças que não caem em nenhuma.": {
    en: "Rooms outside every band get the kids who fall in none.",
    es: "Las habitaciones fuera de todas las franjas reciben a los niños que no caen en ninguna.",
    fr: "Les chambres hors de toutes les tranches reçoivent les enfants qui n'entrent dans aucune.",
  },
  "quartos sem líder": {
    en: "rooms without a leader",
    es: "habitaciones sin líder",
    fr: "chambres sans leader",
  },
  "Refazer tudo": {
    en: "Redo everything",
    es: "Rehacer todo",
    fr: "Tout refaire",
  },
  "Remover faixa": {
    en: "Remove band",
    es: "Quitar franja",
    fr: "Retirer la tranche",
  },
  "Resumo das alterações": {
    en: "Summary of changes",
    es: "Resumen de los cambios",
    fr: "Résumé des modifications",
  },
  "saíram: {list}": {
    en: "left: {list}",
    es: "salieron: {list}",
    fr: "sortis : {list}",
  },
  "Sem quarto": {
    en: "No room",
    es: "Sin habitación",
    fr: "Sans chambre",
  },
  "sem quarto": {
    en: "no room",
    es: "sin habitación",
    fr: "sans chambre",
  },
  "separados": {
    en: "split",
    es: "separados",
    fr: "séparés",
  },
  "Só a equipe": {
    en: "Staff only",
    es: "Solo el equipo",
    fr: "Équipe seulement",
  },
  "Só as crianças": {
    en: "Kids only",
    es: "Solo los niños",
    fr: "Enfants seulement",
  },
  "Só preenche as camas vazias; o que você já montou fica.": {
    en: "Only fills empty beds; what you already set stays.",
    es: "Solo llena las camas vacías; lo que ya armaste se queda.",
    fr: "Remplit seulement les lits vides ; ce que vous avez déjà composé reste.",
  },
  "Testando {n} estratégias… {attempts} tentativas · melhor até agora:": {
    en: "Trying {n} strategies… {attempts} attempts · best so far:",
    es: "Probando {n} estrategias… {attempts} intentos · mejor hasta ahora:",
    fr: "Essai de {n} stratégies… {attempts} tentatives · meilleur pour l'instant :",
  },
  "Testando {n} estratégias… começando": {
    en: "Trying {n} strategies… starting",
    es: "Probando {n} estrategias… empezando",
    fr: "Essai de {n} stratégies… démarrage",
  },
  "Tira todo mundo dos quartos e monta do zero.": {
    en: "Takes everyone out of the rooms and builds from scratch.",
    es: "Saca a todos de las habitaciones y arma desde cero.",
    fr: "Sort tout le monde des chambres et reconstruit depuis zéro.",
  },
  "Todas": {
    en: "All",
    es: "Todas",
    fr: "Toutes",
  },
  "Todo mundo tem quarto. 🎉": {
    en: "Everyone has a room. 🎉",
    es: "Todo el mundo tiene habitación. 🎉",
    fr: "Tout le monde a une chambre. 🎉",
  },
  "Ver exemplos de mensagem": {
    en: "See message examples",
    es: "Ver ejemplos de mensaje",
    fr: "Voir des exemples de message",
  },
  "Verificando avisos…": {
    en: "Checking notifications…",
    es: "Verificando avisos…",
    fr: "Vérification des avis…",
  },
  "⚠️ Pendências: {details}. Você pode aplicar assim mesmo.": {
    en: "⚠️ Pending: {details}. You can still apply.",
    es: "⚠️ Pendientes: {details}. Puedes aplicar igual.",
    fr: "⚠️ En attente : {details}. Vous pouvez quand même appliquer.",
  },
};
