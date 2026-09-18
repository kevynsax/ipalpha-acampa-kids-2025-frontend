import type { Locale } from "../locales";

export const LITERALS: Record<string, Partial<Record<Exclude<Locale, "pt">, string>>> = {
  "Pessoas da equipe que": {
    en: "Staff members who",
    es: "Personas del equipo que",
    fr: "Personnes de l'équipe qui",
  },
  "entregam e recolhem os coletes": {
    en: "hand out and collect the vests",
    es: "entregan y recogen los chalecos",
    fr: "distribuent et récupèrent les gilets",
  },
  "durante o acampamento. Veem só nome e celular da equipe.": {
    en: "during camp. They only see staff names and mobile numbers.",
    es: "durante el campamento. Solo ven nombre y celular del equipo.",
    fr: "pendant le camp. Elles ne voient que le nom et le portable de l'équipe.",
  },
  "Quem cuida dos coletes": {
    en: "Who handles the vests",
    es: "Quién cuida de los chalecos",
    fr: "Qui s'occupe des gilets",
  },
  "Adicionar responsável pelos coletes": {
    en: "Add vest helper",
    es: "Añadir responsable de los chalecos",
    fr: "Ajouter un responsable des gilets",
  },
  "Ninguém escolhido ainda.": {
    en: "No one chosen yet.",
    es: "Nadie elegido todavía.",
    fr: "Personne choisie pour l'instant.",
  },
  "Quem cuida dos coletes vê da equipe apenas": {
    en: "Vest helpers see only",
    es: "Quien cuida de los chalecos ve del equipo solo",
    fr: "Ceux qui s'occupent des gilets ne voient de l'équipe que",
  },
  "nome e celular": {
    en: "name and mobile",
    es: "nombre y celular",
    fr: "nom et portable",
  },
  ": nada de quarto, time, saúde ou check-in. Ao entrar na lista a pessoa recebe um SMS avisando (Notificações → Boas-vindas e novas responsabilidades).": {
    en: ": nothing about room, team, health, or check-in. When added to the list the person gets an SMS (Notifications → Welcome and new responsibilities).",
    es: ": nada de habitación, equipo, salud o check-in. Al entrar en la lista la persona recibe un SMS avisando (Notificaciones → Bienvenida y nuevas responsabilidades).",
    fr: " : rien sur la chambre, l'équipe, la santé ou le check-in. En entrant dans la liste, la personne reçoit un SMS (Notifications → Bienvenue et nouvelles responsabilités).",
  },
};
