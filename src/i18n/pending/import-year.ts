import type { Locale } from "../locales";

export const LITERALS: Record<string, Partial<Record<Exclude<Locale, "pt">, string>>> = {
  "De onde importar": {
    en: "Where to import from",
    es: "De dónde importar",
    fr: "D'où importer",
  },
  "Ano de origem": {
    en: "Source year",
    es: "Año de origen",
    fr: "Année source",
  },
  "Outro ano": {
    en: "Another year",
    es: "Otro año",
    fr: "Une autre année",
  },
  "Importar acampantes": {
    en: "Import campers",
    es: "Importar campistas",
    fr: "Importer des campeurs",
  },
  "Importar equipe": {
    en: "Import staff",
    es: "Importar equipo",
    fr: "Importer l'équipe",
  },
  "Importar de outro ano": {
    en: "Import from another year",
    es: "Importar de otro año",
    fr: "Importer d'une autre année",
  },
  "Não há outro ano para importar.": {
    en: "There is no other year to import from.",
    es: "No hay otro año para importar.",
    fr: "Il n'y a pas d'autre année à importer.",
  },
  "Buscando… 🔍": {
    en: "Searching… 🔍",
    es: "Buscando… 🔍",
    fr: "Recherche… 🔍",
  },
  "Ninguém encontrado em {label}.": {
    en: "No one found in {label}.",
    es: "No se encontró a nadie en {label}.",
    fr: "Personne trouvé dans {label}.",
  },
  "Selecionar todos ({n})": {
    en: "Select all ({n})",
    es: "Seleccionar todos ({n})",
    fr: "Tout sélectionner ({n})",
  },
  "Limpar seleção": {
    en: "Clear selection",
    es: "Limpiar selección",
    fr: "Effacer la sélection",
  },
  "{n} selecionado(s)": {
    en: "{n} selected",
    es: "{n} seleccionado(s)",
    fr: "{n} sélectionné(s)",
  },
  "Importar {n} selecionado(s)": {
    en: "Import {n} selected",
    es: "Importar {n} seleccionado(s)",
    fr: "Importer {n} sélectionné(s)",
  },
  "já está neste ano": {
    en: "already in this year",
    es: "ya está en este año",
    fr: "déjà dans cette année",
  },
  "Selecionar {name}": {
    en: "Select {name}",
    es: "Seleccionar a {name}",
    fr: "Sélectionner {name}",
  },
  "Pode repetir sem medo: quem já está neste ano só é atualizado se você marcar.": {
    en: "Safe to repeat: anyone already in this year is only updated if you check them.",
    es: "Puedes repetirlo sin miedo: quien ya está en este año solo se actualiza si lo marcas.",
    fr: "Sans risque à répéter : qui est déjà dans cette année n'est mis à jour que si vous le cochez.",
  },
  "✅ {n} importado(s)": {
    en: "✅ {n} imported",
    es: "✅ {n} importado(s)",
    fr: "✅ {n} importé(s)",
  },
  "Nome, responsável ou CPF": {
    en: "Name, guardian or CPF",
    es: "Nombre, responsable o CPF",
    fr: "Nom, responsable ou CPF",
  },
  "Nome ou celular": {
    en: "Name or mobile",
    es: "Nombre o celular",
    fr: "Nom ou portable",
  },
};
