import type { Locale } from "../locales";

export const LITERALS: Record<string, Partial<Record<Exclude<Locale, "pt">, string>>> = {
  "A medicação de uso contínuo de cada criança, hora a hora. Toque para marcar que foi dada — todo mundo da equipe vê na hora, então ninguém repete a dose.": {
    en: "Each child's continuous medication, hour by hour. Tap to mark it as given — the whole team sees it right away, so nobody repeats a dose.",
    es: "La medicación de uso continuo de cada niño, hora a hora. Toca para marcar que se dio — todo el equipo lo ve al momento, así nadie repite la dosis.",
    fr: "Le médicament en continu de chaque enfant, heure par heure. Touchez pour marquer qu'il a été donné — toute l'équipe le voit tout de suite, personne ne répète la dose.",
  },
  "🔒 Só a equipe médica e a organização veem esta página.": {
    en: "🔒 Only the medical team and organizers see this page.",
    es: "🔒 Solo el equipo médico y la organización ven esta página.",
    fr: "🔒 Seuls l'équipe médicale et l'organisation voient cette page.",
  },
  "Não foi possível salvar a marcação.": {
    en: "Could not save the mark.",
    es: "No se pudo guardar la marca.",
    fr: "Impossible d'enregistrer la marque.",
  },
  "Sincronizando medicações… 🏕️": {
    en: "Syncing medications… 🏕️",
    es: "Sincronizando medicaciones… 🏕️",
    fr: "Synchronisation des médicaments… 🏕️",
  },
  "Nenhuma criança com medicação cadastrada.": {
    en: "No children with medication registered.",
    es: "Ningún niño con medicación registrada.",
    fr: "Aucun enfant avec médicament enregistré.",
  },
  "Quando necessário": {
    en: "As needed",
    es: "Cuando sea necesario",
    fr: "Si nécessaire",
  },
  "Sem horário fixo. Cada dose fica registrada com a hora e quem deu.": {
    en: "No fixed time. Each dose is logged with the time and who gave it.",
    es: "Sin horario fijo. Cada dosis queda registrada con la hora y quién la dio.",
    fr: "Pas d'horaire fixe. Chaque dose est enregistrée avec l'heure et qui l'a donnée.",
  },
  "Ver {name}": {
    en: "View {name}",
    es: "Ver {name}",
    fr: "Voir {name}",
  },
  "Desfazer a última dose": {
    en: "Undo the last dose",
    es: "Deshacer la última dosis",
    fr: "Annuler la dernière dose",
  },
  "+ Dose": {
    en: "+ Dose",
    es: "+ Dosis",
    fr: "+ Dose",
  },
  "Dado por {name} · {when} — desmarque para desfazer": {
    en: "Given by {name} · {when} — uncheck to undo",
    es: "Dado por {name} · {when} — desmarca para deshacer",
    fr: "Donné par {name} · {when} — décochez pour annuler",
  },
  "Marcar como dado": {
    en: "Mark as given",
    es: "Marcar como dado",
    fr: "Marquer comme donné",
  },
  "{med} de {name} — marcar como dado": {
    en: "{med} for {name} — mark as given",
    es: "{med} de {name} — marcar como dado",
    fr: "{med} de {name} — marquer comme donné",
  },
  "{done}/{total} dadas": {
    en: "{done}/{total} given",
    es: "{done}/{total} dadas",
    fr: "{done}/{total} données",
  },
  "Horário a confirmar": {
    en: "Schedule to confirm",
    es: "Horario por confirmar",
    fr: "Horaire à confirmer",
  },
  "Sem horário nem \"quando necessário\": confirme com os pais antes de dar.": {
    en: "No schedule and not \"as needed\": confirm with the parents before giving.",
    es: "Sin horario ni \"cuando sea necesario\": confirma con los padres antes de dar.",
    fr: "Ni horaire ni « si nécessaire » : confirmez avec les parents avant de donner.",
  },
  "Abrir a ficha de {name}": {
    en: "Open {name}'s record",
    es: "Abrir la ficha de {name}",
    fr: "Ouvrir la fiche de {name}",
  },
  "✅ Tudo em dia por aqui.": {
    en: "✅ All caught up here.",
    es: "✅ Todo al día por aquí.",
    fr: "✅ Tout est à jour ici.",
  },
  "Nenhuma criança encontrada.": {
    en: "No children found.",
    es: "Ningún niño encontrado.",
    fr: "Aucun enfant trouvé.",
  },
  "Nada pendente por aqui. ✅": {
    en: "Nothing pending here. ✅",
    es: "Nada pendiente por aquí. ✅",
    fr: "Rien en attente ici. ✅",
  },
  "Medicações de hoje": {
    en: "Today's medications",
    es: "Medicaciones de hoy",
    fr: "Médicaments d'aujourd'hui",
  },
  "A criança tem alergia a medicamentos — confira antes de dar": {
    en: "The child has a drug allergy — check before giving",
    es: "El niño tiene alergia a medicamentos — revisa antes de dar",
    fr: "L'enfant a une allergie médicamenteuse — vérifiez avant de donner",
  },
  "Procurar criança": {
    en: "Find a child",
    es: "Buscar niño",
    fr: "Trouver un enfant",
  },
};
