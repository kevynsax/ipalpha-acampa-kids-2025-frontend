import type { Locale } from "../locales";

export const LITERALS: Record<string, Partial<Record<Exclude<Locale, "pt">, string>>> = {
  'Excluir "{title}"?': {
    en: 'Delete "{title}"?',
    es: '¿Eliminar "{title}"?',
    fr: 'Supprimer « {title} » ?',
  },
  "O documento inteiro será apagado. Isso não pode ser desfeito.": {
    en: "The whole document will be deleted. This cannot be undone.",
    es: "Se eliminará el documento completo. Esto no se puede deshacer.",
    fr: "Le document entier sera supprimé. Cette action est irréversible.",
  },
  "Novo documento": {
    en: "New document",
    es: "Nuevo documento",
    fr: "Nouveau document",
  },
  "Editar documento": {
    en: "Edit document",
    es: "Editar documento",
    fr: "Modifier le document",
  },
  'Excluir "{title}"': {
    en: 'Delete "{title}"',
    es: 'Eliminar "{title}"',
    fr: 'Supprimer « {title} »',
  },
  "+ Documento": {
    en: "+ Document",
    es: "+ Documento",
    fr: "+ Document",
  },
  "Documentos gerais do acampamento, para toda a equipe ler: regras, plano de emergência, rotina do dia…": {
    en: "General camp documents for the whole staff to read: rules, emergency plan, daily routine…",
    es: "Documentos generales del campamento, para que todo el equipo lea: reglas, plan de emergencia, rutina del día…",
    fr: "Documents généraux du camp, à lire par toute l'équipe : règles, plan d'urgence, routine du jour…",
  },
  "Nenhum documento ainda. Comece com “Regras do acampamento” ou “Plano de emergência”.": {
    en: "No documents yet. Start with “Camp rules” or “Emergency plan”.",
    es: "Ningún documento aún. Empieza con “Reglas del campamento” o “Plan de emergencia”.",
    fr: "Aucun document pour l'instant. Commencez par « Règles du camp » ou « Plan d'urgence ».",
  },
  "+ Criar documento": {
    en: "+ Create document",
    es: "+ Crear documento",
    fr: "+ Créer un document",
  },
  'Abrir "{title}"': {
    en: 'Open "{title}"',
    es: 'Abrir "{title}"',
    fr: 'Ouvrir « {title} »',
  },
  "Atualizado {when}": {
    en: "Updated {when}",
    es: "Actualizado {when}",
    fr: "Mis à jour {when}",
  },
  "sem conteúdo": {
    en: "no content",
    es: "sin contenido",
    fr: "sans contenu",
  },
  "Documento vazio — toque em ✏️ para escrever.": {
    en: "Empty document — tap ✏️ to write.",
    es: "Documento vacío — toca ✏️ para escribir.",
    fr: "Document vide — appuyez sur ✏️ pour écrire.",
  },
  "Última alteração": {
    en: "Last updated",
    es: "Última modificación",
    fr: "Dernière modification",
  },
  "ex.: Regras do acampamento": {
    en: "e.g. Camp rules",
    es: "ej.: Reglas del campamento",
    fr: "ex. : Règles du camp",
  },
  "📝 Documento": {
    en: "📝 Document",
    es: "📝 Documento",
    fr: "📝 Document",
  },
  "Texto, títulos, listas, links e fotos (🖼️ ou cole / arraste uma imagem).": {
    en: "Text, headings, lists, links and photos (🖼️ or paste / drop an image).",
    es: "Texto, títulos, listas, enlaces y fotos (🖼️ o pega / arrastra una imagen).",
    fr: "Texte, titres, listes, liens et photos (🖼️ ou collez / déposez une image).",
  },
  "Escreva o documento aqui…": {
    en: "Write the document here…",
    es: "Escribe el documento aquí…",
    fr: "Écrivez le document ici…",
  },
  "Criar documento 🎉": {
    en: "Create document 🎉",
    es: "Crear documento 🎉",
    fr: "Créer le document 🎉",
  },
  "Quem vê": {
    en: "Who sees this",
    es: "Quién ve",
    fr: "Qui voit",
  },
  "só quem cuida de crianças": {
    en: "only those who look after children",
    es: "solo quien cuida de niños",
    fr: "seulement ceux qui s'occupent des enfants",
  },
  "só os auxiliares de quarto": {
    en: "only the room helpers",
    es: "solo los auxiliares de habitación",
    fr: "seulement les auxiliaires de chambre",
  },
  "Publicar para": {
    en: "Publish to",
    es: "Publicar para",
    fr: "Publier pour",
  },
  "ou responsáveis pelas crianças": {
    en: "or children's guardians",
    es: "o responsables de los niños",
    fr: "ou responsables des enfants",
  },
  "Escolha pelo menos um público.": {
    en: "Choose at least one audience.",
    es: "Elige al menos un público.",
    fr: "Choisissez au moins un public.",
  },
};
