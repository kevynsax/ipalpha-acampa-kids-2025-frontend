import type { Locale } from "../locales";

export const LITERALS: Record<string, Partial<Record<Exclude<Locale, "pt">, string>>> = {
  ". Use só em emergência": {
    en: ". Use only in an emergency",
    es: ". Úsalo solo en emergencia",
    fr: ". À utiliser uniquement en urgence",
  },
  ". Use só em emergência (leitura fora do escopo nº {n})": {
    en: ". Use only in an emergency (out-of-scope scan #{n})",
    es: ". Úsalo solo en emergencia (lectura fuera de alcance n.º {n})",
    fr: ". À utiliser uniquement en urgence (lecture hors périmètre n° {n})",
  },
  "Aponte a câmera para o QR code.": {
    en: "Point the camera at the QR code.",
    es: "Apunta la cámara al código QR.",
    fr: "Pointez la caméra vers le code QR.",
  },
  "Esta criança": {
    en: "This child",
    es: "Este niño",
    fr: "Cet enfant",
  },
  "Esse QR code não é de um crachá / pulseira do Acampa Kids.": {
    en: "This QR code is not an Acampa Kids badge / wristband.",
    es: "Este código QR no es de una credencial / pulsera de Acampa Kids.",
    fr: "Ce code QR n'est pas un badge / bracelet Acampa Kids.",
  },
  "Fazendo check-in…": {
    en: "Checking in…",
    es: "Haciendo check-in…",
    fr: "Check-in en cours…",
  },
  "Fechar câmera": {
    en: "Close camera",
    es: "Cerrar cámara",
    fr: "Fermer la caméra",
  },
  "Ler o crachá de qualquer criança": {
    en: "Scan any child's badge",
    es: "Leer la credencial de cualquier niño",
    fr: "Lire le badge de n'importe quel enfant",
  },
  "Ler o crachá de qualquer criança (emergência)": {
    en: "Scan any child's badge (emergency)",
    es: "Leer la credencial de cualquier niño (emergencia)",
    fr: "Lire le badge de n'importe quel enfant (urgence)",
  },
  "Ler outro": {
    en: "Scan another",
    es: "Leer otro",
    fr: "Lire un autre",
  },
  "Ler pulseira ou crachá": {
    en: "Scan wristband or badge",
    es: "Leer pulsera o credencial",
    fr: "Lire le bracelet ou le badge",
  },
  "Não deu para ler": {
    en: "Couldn't read it",
    es: "No se pudo leer",
    fr: "Impossible de lire",
  },
  "Não foi possível ler o crachá.": {
    en: "Couldn't read the badge.",
    es: "No se pudo leer la credencial.",
    fr: "Impossible de lire le badge.",
  },
  "não é do seu quarto": {
    en: "is not from your room",
    es: "no es de tu habitación",
    fr: "n'est pas de votre chambre",
  },
};
