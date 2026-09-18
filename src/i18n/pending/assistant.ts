import type { Locale } from "../locales";

export const LITERALS: Record<string, Partial<Record<Exclude<Locale, "pt">, string>>> = {
  "Conversar com o assistente": {
    en: "Talk with the assistant",
    es: "Hablar con el asistente",
    fr: "Parler avec l'assistant",
  },
  "Assistente do acampamento": {
    en: "Camp assistant",
    es: "Asistente del campamento",
    fr: "Assistant du camp",
  },
  "Encerrar conversa": {
    en: "End conversation",
    es: "Terminar conversación",
    fr: "Terminer la conversation",
  },
  "Resposta exibida": {
    en: "On-screen reply",
    es: "Respuesta en pantalla",
    fr: "Réponse à l'écran",
  },
  "Assistente indisponível.": {
    en: "Assistant unavailable.",
    es: "Asistente no disponible.",
    fr: "Assistant indisponible.",
  },
  "Conectando...": {
    en: "Connecting...",
    es: "Conectando...",
    fr: "Connexion...",
  },
  "A conversa caiu. Toque para tentar de novo.": {
    en: "The conversation dropped. Tap to try again.",
    es: "La conversación se cortó. Toca para intentarlo de nuevo.",
    fr: "La conversation s'est interrompue. Touchez pour réessayer.",
  },
  "O assistente não atendeu. Tente novamente.": {
    en: "The assistant didn't answer. Try again.",
    es: "El asistente no respondió. Inténtalo de nuevo.",
    fr: "L'assistant n'a pas répondu. Réessayez.",
  },
  "Preciso do microfone para conversar. Libere o acesso nas permissões do navegador.": {
    en: "I need the microphone to talk. Allow access in the browser permissions.",
    es: "Necesito el micrófono para conversar. Permite el acceso en los permisos del navegador.",
    fr: "J'ai besoin du micro pour parler. Autorisez l'accès dans les permissions du navigateur.",
  },
  "Não consegui abrir a conversa por voz.": {
    en: "I couldn't start the voice conversation.",
    es: "No pude abrir la conversación por voz.",
    fr: "Je n'ai pas pu ouvrir la conversation vocale.",
  },
  "Não foi possível preparar a conexão de áudio. Tente novamente.": {
    en: "Couldn't prepare the audio connection. Try again.",
    es: "No se pudo preparar la conexión de audio. Inténtalo de nuevo.",
    fr: "Impossible de préparer la connexion audio. Réessayez.",
  },
};
