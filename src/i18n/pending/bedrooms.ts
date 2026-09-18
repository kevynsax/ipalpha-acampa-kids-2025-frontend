import type { Locale } from "../locales";

export const LITERALS: Record<string, Partial<Record<Exclude<Locale, "pt">, string>>> = {
  "Algo deu errado.": {
    en: "Something went wrong.",
    es: "Algo salió mal.",
    fr: "Une erreur s'est produite.",
  },
  "Ala": {
    en: "Wing",
    es: "Ala",
    fr: "Aile",
  },
  "Baixar todos os quartos em Excel (uma aba por quarto)": {
    en: "Download all rooms as Excel (one sheet per room)",
    es: "Descargar todos los cuartos en Excel (una hoja por cuarto)",
    fr: "Télécharger toutes les chambres en Excel (un onglet par chambre)",
  },
  "Beliches": {
    en: "Bunk beds",
    es: "Literas",
    fr: "Lits superposés",
  },
  "Cadastre o primeiro com seus beliches e camas!": {
    en: "Add the first one with its bunks and beds!",
    es: "¡Registra el primero con sus literas y camas!",
    fr: "Ajoutez la première avec ses lits superposés et ses lits !",
  },
  "Camas": {
    en: "Beds",
    es: "Camas",
    fr: "Lits",
  },
  "Camas de solteiro": {
    en: "Single beds",
    es: "Camas individuales",
    fr: "Lits simples",
  },
  "Capacidade": {
    en: "Capacity",
    es: "Capacidad",
    fr: "Capacité",
  },
  "Crianças": {
    en: "Children",
    es: "Niños",
    fr: "Enfants",
  },
  "Criar quarto 🎉": {
    en: "Create room 🎉",
    es: "Crear cuarto 🎉",
    fr: "Créer la chambre 🎉",
  },
  "Download": {
    en: "Download",
    es: "Descargar",
    fr: "Télécharger",
  },
  "Editar quarto": {
    en: "Edit room",
    es: "Editar cuarto",
    fr: "Modifier la chambre",
  },
  "Excluir o quarto {name} ({group})?": {
    en: "Delete room {name} ({group})?",
    es: "¿Eliminar el cuarto {name} ({group})?",
    fr: "Supprimer la chambre {name} ({group}) ?",
  },
  "Excluir quarto {name}": {
    en: "Delete room {name}",
    es: "Eliminar cuarto {name}",
    fr: "Supprimer la chambre {name}",
  },
  "Isso não pode ser desfeito.": {
    en: "This cannot be undone.",
    es: "Esto no se puede deshacer.",
    fr: "Cette action est irréversible.",
  },
  "Lotado": {
    en: "Full",
    es: "Lleno",
    fr: "Complet",
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
    fr: "Répartir",
  },
  "Montar os quartos: crianças grudadas por preferência, arrastando para os quartos": {
    en: "Assign rooms: kids kept together by preference, drag into rooms",
    es: "Armar los cuartos: niños juntos por preferencia, arrastrando a los cuartos",
    fr: "Répartir les chambres : enfants regroupés par préférence, en les glissant dans les chambres",
  },
  "Nenhuma criança neste quarto.": {
    en: "No children in this room.",
    es: "Ningún niño en este cuarto.",
    fr: "Aucun enfant dans cette chambre.",
  },
  "Nenhum quarto com equipe.": {
    en: "No rooms with staff.",
    es: "Ningún cuarto con equipo.",
    fr: "Aucune chambre avec équipe.",
  },
  "Nenhum quarto nesta ala.": {
    en: "No rooms in this wing.",
    es: "Ningún cuarto en esta ala.",
    fr: "Aucune chambre dans cette aile.",
  },
  "Nenhum quarto ainda.": {
    en: "No rooms yet.",
    es: "Ningún cuarto todavía.",
    fr: "Aucune chambre pour l'instant.",
  },
  "Ninguém alocado.": {
    en: "Nobody assigned.",
    es: "Nadie asignado.",
    fr: "Personne affectée.",
  },
  "Novo quarto": {
    en: "New room",
    es: "Nuevo cuarto",
    fr: "Nouvelle chambre",
  },
  "Novo quarto em {group}": {
    en: "New room in {group}",
    es: "Nuevo cuarto en {group}",
    fr: "Nouvelle chambre dans {group}",
  },
  "Número": {
    en: "Number",
    es: "Número",
    fr: "Numéro",
  },
  "O quarto precisa ter ao menos uma cama.": {
    en: "The room needs at least one bed.",
    es: "El cuarto necesita al menos una cama.",
    fr: "La chambre doit avoir au moins un lit.",
  },
  "Observações (opcional)": {
    en: "Notes (optional)",
    es: "Observaciones (opcional)",
    fr: "Notes (facultatif)",
  },
  "Ocupação": {
    en: "Occupancy",
    es: "Ocupación",
    fr: "Occupation",
  },
  "Quarto não encontrado.": {
    en: "Room not found.",
    es: "Cuarto no encontrado.",
    fr: "Chambre introuvable.",
  },
  "Quartos com equipe": {
    en: "Rooms with staff",
    es: "Cuartos con equipo",
    fr: "Chambres avec équipe",
  },
  "Quarto {name}": {
    en: "Room {name}",
    es: "Habitación {name}",
    fr: "Chambre {name}",
  },
  "Responsáveis no quarto": {
    en: "Room leaders",
    es: "Responsables del cuarto",
    fr: "Responsables de la chambre",
  },
  "Sincronizando com o servidor… 🏕️": {
    en: "Syncing with the server… 🏕️",
    es: "Sincronizando con el servidor… 🏕️",
    fr: "Synchronisation avec le serveur… 🏕️",
  },
  "Sincronizando… 🏕️": {
    en: "Syncing… 🏕️",
    es: "Sincronizando… 🏕️",
    fr: "Synchronisation… 🏕️",
  },
  "Ver quarto": {
    en: "View room",
    es: "Ver cuarto",
    fr: "Voir la chambre",
  },
  "cada beliche dorme 2": {
    en: "each bunk sleeps 2",
    es: "cada litera duerme a 2",
    fr: "chaque lit superposé dort 2",
  },
  "cada cama dorme 1": {
    en: "each bed sleeps 1",
    es: "cada cama duerme a 1",
    fr: "chaque lit dort 1",
  },
  "camas no total": {
    en: "beds total",
    es: "camas en total",
    fr: "lits au total",
  },
  "crianças": {
    en: "children",
    es: "niños",
    fr: "enfants",
  },
  "da equipe": {
    en: "staff",
    es: "del equipo",
    fr: "de l'équipe",
  },
  "de {capacity} camas ocupadas": {
    en: "of {capacity} beds occupied",
    es: "de {capacity} camas ocupadas",
    fr: "sur {capacity} lits occupés",
  },
  "equipe": {
    en: "staff",
    es: "equipo",
    fr: "équipe",
  },
  "ex.: 103": {
    en: "e.g. 103",
    es: "ej.: 103",
    fr: "ex. : 103",
  },
  "ex.: fica ao lado da enfermaria": {
    en: "e.g. next to the infirmary",
    es: "ej.: queda al lado de la enfermería",
    fr: "ex. : à côté de l'infirmerie",
  },
  "livres": {
    en: "free",
    es: "libres",
    fr: "libres",
  },
  "ocupadas": {
    en: "occupied",
    es: "ocupadas",
    fr: "occupés",
  },
  "pessoa": {
    en: "person",
    es: "persona",
    fr: "personne",
  },
  "pessoas": {
    en: "people",
    es: "personas",
    fr: "personnes",
  },
  "+ Criar quarto": {
    en: "+ Create room",
    es: "+ Crear cuarto",
    fr: "+ Créer une chambre",
  },
  "✏️ Editar quarto": {
    en: "✏️ Edit room",
    es: "✏️ Editar cuarto",
    fr: "✏️ Modifier la chambre",
  },
  "⚠️ Nenhum líder da equipe neste quarto.": {
    en: "⚠️ No staff leader in this room.",
    es: "⚠️ Ningún líder del equipo en este cuarto.",
    fr: "⚠️ Aucun leader de l'équipe dans cette chambre.",
  },
  "{n} beliche": {
    en: "{n} bunk",
    es: "{n} litera",
    fr: "{n} lit superposé",
  },
  "{n} beliches": {
    en: "{n} bunks",
    es: "{n} literas",
    fr: "{n} lits superposés",
  },
  "{n} cama": {
    en: "{n} bed",
    es: "{n} cama",
    fr: "{n} lit",
  },
  "{n} cama de solteiro": {
    en: "{n} single bed",
    es: "{n} cama individual",
    fr: "{n} lit simple",
  },
  "{n} camas": {
    en: "{n} beds",
    es: "{n} camas",
    fr: "{n} lits",
  },
  "{n} camas de solteiro": {
    en: "{n} single beds",
    es: "{n} camas individuales",
    fr: "{n} lits simples",
  },
  "{n} criança": {
    en: "{n} child",
    es: "{n} niño",
    fr: "{n} enfant",
  },
  "{n} crianças": {
    en: "{n} children",
    es: "{n} niños",
    fr: "{n} enfants",
  },
  "{n} livre": {
    en: "{n} free",
    es: "{n} libre",
    fr: "{n} libre",
  },
  "{n} livres": {
    en: "{n} free",
    es: "{n} libres",
    fr: "{n} libres",
  },
  "{n} lugares": {
    en: "{n} places",
    es: "{n} lugares",
    fr: "{n} places",
  },
  "{n} quarto · {occ}/{cap} camas": {
    en: "{n} room · {occ}/{cap} beds",
    es: "{n} cuarto · {occ}/{cap} camas",
    fr: "{n} chambre · {occ}/{cap} lits",
  },
  "{n} quartos": {
    en: "{n} rooms",
    es: "{n} cuartos",
    fr: "{n} chambres",
  },
  "{n} quartos · {occ}/{cap} camas": {
    en: "{n} rooms · {occ}/{cap} beds",
    es: "{n} cuartos · {occ}/{cap} camas",
    fr: "{n} chambres · {occ}/{cap} lits",
  },
  "{n} solteiro": {
    en: "{n} single",
    es: "{n} individual",
    fr: "{n} simple",
  },
};
