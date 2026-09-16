import type { RoomRole } from "../api/staff";

/**
 * A programação-modelo do Acampa Kids (sexta à noite → domingo à tarde), com
 * as funções que cada evento costuma precisar. O assistente lista tudo isso
 * para o admin TIRAR o que não vale antes de importar — os eventos escolhidos
 * e as funções que eles usam são criados de uma vez.
 *
 * `day` é relativo: 1 = sexta (saída), 2 = sábado, 3 = domingo (volta).
 */

export interface TemplateRole {
  key: string;
  name: string;
  emoji: string;
  /** positions the função falls on by itself ([] = só escalados à mão) */
  forRoomRoles: RoomRole[];
  /** the escala carries a per-person detail (cor, base…) */
  hasDetail?: boolean;
  /** the detail IS the person's team (coringa / caminhar com o time) */
  detailFromTeam?: boolean;
  detailPlaceholder?: string;
}

export interface TemplateEvent {
  day: 1 | 2 | 3;
  start: string;
  end: string | null;
  title: string;
  emoji: string;
  /** template role keys used by this event */
  roles: string[];
  /** parents see it on their programme (default true) */
  visibleToParents?: boolean;
  notes?: string;
}

export const TEMPLATE_ROLES: TemplateRole[] = [
  { key: "arrumar-quarto", name: "Ajudar as crianças a arrumar o quarto", emoji: "🧹", forRoomRoles: ["caretaker", "helper"] },
  { key: "inspecao", name: "Inspeção", emoji: "👮", forRoomRoles: [] },
  { key: "radio", name: "Rádio", emoji: "📻", forRoomRoles: [] },
  { key: "cuidar", name: "Cuidar das crianças", emoji: "🧒", forRoomRoles: ["caretaker", "helper"] },
  { key: "fora-piscina", name: "Cuidar das crianças fora da piscina", emoji: "🏖️", forRoomRoles: ["caretaker", "helper"] },
  { key: "nao-querem", name: "Cuidar das crianças que não querem jogar", emoji: "🪑", forRoomRoles: [] },
  { key: "piscina", name: "Supervisão da piscina", emoji: "🏊", forRoomRoles: [] },
  { key: "fantasia", name: "Pontuação fantasia", emoji: "🏆", forRoomRoles: [] },
  { key: "organizacao", name: "Organização", emoji: "📋", forRoomRoles: [] },
  { key: "canibal", name: "Canibal", emoji: "👹", forRoomRoles: [] },
  { key: "cor", name: "Cor", emoji: "🎨", forRoomRoles: [], hasDetail: true, detailPlaceholder: "Qual cor (1 a 7)" },
  { key: "coringa", name: "Coringa do time", emoji: "🃏", forRoomRoles: [], detailFromTeam: true },
  { key: "base", name: "Base", emoji: "🚩", forRoomRoles: [], hasDetail: true, detailPlaceholder: "Qual base (1 a 8)" },
  { key: "caminhar", name: "Caminhar com o time", emoji: "🚶", forRoomRoles: [], detailFromTeam: true },
  { key: "lider-pg", name: "Líder do PG", emoji: "📖", forRoomRoles: [] },
  { key: "auxiliar-pg", name: "Auxiliar do PG", emoji: "🤝", forRoomRoles: [] },
];

export const TEMPLATE_EVENTS: TemplateEvent[] = [
  // ── sexta: logística da equipe (os pais não veem) ──
  { day: 1, start: "15:30", end: null, title: "Saída da equipe de louvor", emoji: "🎶", roles: [], visibleToParents: false },
  { day: 1, start: "17:00", end: null, title: "Chegada da equipe de check-in", emoji: "📍", roles: [], visibleToParents: false },
  { day: 1, start: "18:00", end: null, title: "Chegada de toda a equipe", emoji: "🧢", roles: [], visibleToParents: false },
  { day: 1, start: "18:30", end: null, title: "Check-in", emoji: "✅", roles: [] },
  { day: 1, start: "19:30", end: null, title: "Pais no templo", emoji: "⛪", roles: [] },
  { day: 1, start: "19:45", end: null, title: "Divisão para os ônibus", emoji: "🚌", roles: [] },
  { day: 1, start: "20:00", end: null, title: "Saída dos ônibus", emoji: "🚌", roles: [] },
  { day: 1, start: "21:30", end: null, title: "Chegada e lanche", emoji: "🥪", roles: [] },
  { day: 1, start: "22:30", end: null, title: "Louvor e introdução ao tema", emoji: "🎶", roles: [] },
  { day: 1, start: "23:30", end: null, title: "Dormir", emoji: "💤", roles: [] },
  { day: 1, start: "23:59", end: null, title: "Silêncio total", emoji: "🤫", roles: [] },
  // ── sábado ──
  { day: 2, start: "08:00", end: null, title: "Acordar", emoji: "⏰", roles: [] },
  { day: 2, start: "08:15", end: null, title: "Inspeção nos quartos", emoji: "🧹", roles: ["arrumar-quarto", "inspecao"] },
  { day: 2, start: "08:30", end: null, title: "Café da manhã", emoji: "🥞", roles: [] },
  { day: 2, start: "09:30", end: null, title: "Louvor", emoji: "🎶", roles: ["radio"] },
  { day: 2, start: "10:00", end: null, title: "Palavra", emoji: "📖", roles: [] },
  { day: 2, start: "10:45", end: null, title: "PG", emoji: "📖", roles: ["lider-pg", "auxiliar-pg"] },
  { day: 2, start: "11:30", end: null, title: "Livre", emoji: "🎲", roles: ["cuidar"] },
  { day: 2, start: "12:30", end: null, title: "Almoço", emoji: "🍽️", roles: ["cuidar"] },
  { day: 2, start: "13:30", end: null, title: "Desfile de fantasias", emoji: "🎭", roles: ["fantasia", "cuidar"] },
  { day: 2, start: "14:30", end: "15:10", title: "Piscina — grupo 1", emoji: "🏊", roles: ["piscina", "fora-piscina"] },
  { day: 2, start: "15:10", end: "15:50", title: "Piscina — grupo 2", emoji: "🏊", roles: ["piscina", "fora-piscina"] },
  { day: 2, start: "15:50", end: "16:30", title: "Piscina — grupo 3", emoji: "🏊", roles: ["piscina", "fora-piscina"] },
  { day: 2, start: "16:30", end: null, title: "Lanche", emoji: "🍎", roles: ["cuidar"] },
  { day: 2, start: "17:30", end: null, title: "Banho", emoji: "🚿", roles: ["cuidar"] },
  { day: 2, start: "19:00", end: null, title: "Jantar temático", emoji: "🍕", roles: ["cuidar"] },
  { day: 2, start: "20:00", end: null, title: "Louvor no salão", emoji: "🎶", roles: ["radio"] },
  { day: 2, start: "20:30", end: null, title: "Fogueira", emoji: "🔥", roles: [] },
  { day: 2, start: "21:30", end: null, title: "Preparação da brincadeira noturna", emoji: "🧙", roles: ["organizacao"], visibleToParents: false },
  { day: 2, start: "21:45", end: "22:30", title: "Brincadeira noturna", emoji: "🌙", roles: ["base", "caminhar", "coringa", "cor", "nao-querem"], visibleToParents: false },
  { day: 2, start: "22:30", end: null, title: "Chá da noite", emoji: "☕", roles: ["cuidar"] },
  { day: 2, start: "23:30", end: null, title: "Dormir", emoji: "💤", roles: [] },
  { day: 2, start: "23:59", end: null, title: "Silêncio total", emoji: "🤫", roles: [] },
  // ── domingo ──
  { day: 3, start: "08:00", end: null, title: "Acordar", emoji: "⏰", roles: [] },
  { day: 3, start: "08:15", end: null, title: "Inspeção nos quartos", emoji: "🧹", roles: ["arrumar-quarto", "inspecao"] },
  { day: 3, start: "08:30", end: null, title: "Café da manhã", emoji: "🥞", roles: [] },
  { day: 3, start: "09:30", end: null, title: "Louvor", emoji: "🎶", roles: ["radio"] },
  { day: 3, start: "10:00", end: null, title: "Palavra", emoji: "📖", roles: [] },
  { day: 3, start: "10:50", end: null, title: "PG", emoji: "📖", roles: ["lider-pg", "auxiliar-pg"] },
  { day: 3, start: "11:30", end: null, title: "Canibal", emoji: "👹", roles: ["canibal", "cuidar"], visibleToParents: false },
  { day: 3, start: "12:30", end: null, title: "Almoço", emoji: "🍽️", roles: ["cuidar"] },
  { day: 3, start: "13:30", end: null, title: "Premiações", emoji: "🏆", roles: [] },
  { day: 3, start: "14:00", end: null, title: "Arrumar malas", emoji: "🧳", roles: ["cuidar"] },
  { day: 3, start: "14:45", end: null, title: "Arrastão de malas para os ônibus", emoji: "🧳", roles: ["organizacao"], visibleToParents: false },
  { day: 3, start: "15:00", end: null, title: "Saída dos ônibus", emoji: "🚌", roles: [] },
  { day: 3, start: "16:30", end: null, title: "Chegada na igreja", emoji: "⛪", roles: [] },
];

export const templateRoleByKey = (key: string): TemplateRole | undefined => TEMPLATE_ROLES.find((r) => r.key === key);

export const DAY_LABELS: Record<1 | 2 | 3, string> = { 1: "6ª-feira (saída)", 2: "Sábado", 3: "Domingo (volta)" };
