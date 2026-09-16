import * as XLSX from "xlsx";
import { GROUP_META, bedroomLabel, type Bedroom } from "./api/bedrooms";
import { ageOf, medicationsText, type Camper } from "./api/campers";
import type { Staff } from "./api/staff";
import { formatCpf } from "./cpf";
import { formatBrazilPhoneClient } from "./phoneFormat";
import { speakBirth, speakDateTime } from "./dates";

/**
 * Excel downloads: campers, staff, and bedrooms (one tab per room).
 * Everything is built from the local store, so it works offline too.
 */

type LabelOf = (id: string | null | undefined) => string | null;
type Row = Record<string, string | number>;

const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });

function labels(labelOf: LabelOf, ids: string[]): string {
  return ids.map((id) => labelOf(id) ?? id).join("; ");
}

const brDate = (iso: string | null) => speakBirth(iso) ?? "";

function phone(p: string | null): string {
  return p ? formatBrazilPhoneClient(p) : "";
}

const brDateTime = speakDateTime;

/** Who recorded a check-in: the admin doing the roll call, or the person themself from their phone (self check-in). */
function checkinBy(c: { byName: string; byRole: string } | null): string {
  if (!c) return "";
  return c.byRole === "admin" ? c.byName : `${c.byName} (próprio celular)`;
}

// ── rows ───────────────────────────────────────────────────────────────

export function camperRow(k: Camper, roomById: Map<string, Bedroom>, labelOf: LabelOf, staffName?: Map<string, string>): Row {
  const room = k.bedroom ? roomById.get(k.bedroom) : null;
  const age = ageOf(k.birthDate);
  return {
    Nome: k.name,
    "Data de nascimento": brDate(k.birthDate),
    Idade: age ?? "",
    Sexo: k.sex === "F" ? "Feminino" : k.sex === "M" ? "Masculino" : "",
    CPF: formatCpf(k.cpf),
    RG: k.rg,
    Escola: k.school,
    "Série": k.schoolGrade,
    Igreja: k.church,
    "Convidado por": k.invitedBy,
    "Tio do quarto": k.caretakerId ? (staffName?.get(k.caretakerId) ?? "") : "",
    Equipe: labelOf(k.team) ?? "",
    Ala: room ? GROUP_META[room.group].label : "",
    Quarto: room?.name ?? "",
    Cama: labelOf(k.bed) ?? "",
    Transporte: labelOf(k.transportation) ?? "",
    "Peso (kg)": k.weightKg ?? "",
    Alergias: labels(labelOf, k.allergies),
    "Alergia a medicamentos": labels(labelOf, k.drugAllergies),
    "Condições de saúde": labels(labelOf, k.healthIssues),
    Neurodivergente: k.neurodivergent ? "Sim" : "Não",
    Medicamentos: medicationsText(k.medications),
    "Restrições alimentares": k.foodRestrictions,
    "Observações médicas": k.healthNotes,
    "Observações gerais": k.generalNotes,
    "Preferência de quarto": k.bedroomPreference,
    Convênio: k.insurance,
    "Carteirinha do convênio": k.insuranceCard,
    "Contato de emergência": k.emergencyContact,
    Responsável: k.guardianName,
    "Celular do responsável": phone(k.guardianPhone),
    "CPF do responsável": formatCpf(k.guardianCpf),
    "E-mail do responsável": k.guardianEmail,
    "QR token": k.qrToken,
    "Check-in": k.checkin ? "Sim" : "Não",
    "Check-in em": k.checkin ? brDateTime(k.checkin.at) : "",
    "Check-in por": k.checkin ? `${k.checkin.byName}${k.checkin.note ? ` (${k.checkin.note})` : ""}` : "",
    "Check-in ônibus ida": k.busCheckin ? "Sim" : "Não",
    "Check-in ônibus ida em": k.busCheckin ? brDateTime(k.busCheckin.at) : "",
    "Check-in ônibus ida por": k.busCheckin?.byName ?? "",
    "Check-in ônibus volta": k.busReturnCheckin ? "Sim" : "Não",
    "Check-in ônibus volta em": k.busReturnCheckin ? brDateTime(k.busReturnCheckin.at) : "",
    "Check-in ônibus volta por": k.busReturnCheckin?.byName ?? "",
  };
}

/**
 * The medical team's sheet: identification, where the kid sleeps and who
 * looks after them, the whole health block, who to call, and whether the kid
 * actually went to the camp ("Foi para o acampamento" = the church check-in).
 * No documents, school, church, invitations, QR token or bus roll calls.
 */
export function medicalCamperRow(k: Camper, roomById: Map<string, Bedroom>, labelOf: LabelOf, staffName?: Map<string, string>): Row {
  const room = k.bedroom ? roomById.get(k.bedroom) : null;
  const age = ageOf(k.birthDate);
  return {
    Nome: k.name,
    "Foi para o acampamento": k.checkin ? "Sim" : "Não",
    "Data de nascimento": brDate(k.birthDate),
    Idade: age ?? "",
    Sexo: k.sex === "F" ? "Feminino" : k.sex === "M" ? "Masculino" : "",
    "Peso (kg)": k.weightKg ?? "",
    Ala: room ? GROUP_META[room.group].label : "",
    Quarto: room?.name ?? "",
    "Tio do quarto": k.caretakerId ? (staffName?.get(k.caretakerId) ?? "") : "",
    Equipe: labelOf(k.team) ?? "",
    Alergias: labels(labelOf, k.allergies),
    "Alergia a medicamentos": labels(labelOf, k.drugAllergies),
    "Condições de saúde": labels(labelOf, k.healthIssues),
    Neurodivergente: k.neurodivergent ? "Sim" : "Não",
    Medicamentos: medicationsText(k.medications),
    "Restrições alimentares": k.foodRestrictions,
    "Observações médicas": k.healthNotes,
    "Observações gerais": k.generalNotes,
    Convênio: k.insurance,
    "Carteirinha do convênio": k.insuranceCard,
    "Contato de emergência": k.emergencyContact,
    Responsável: k.guardianName,
    "Celular do responsável": phone(k.guardianPhone),
  };
}

export function staffRow(s: Staff, roomById: Map<string, Bedroom>, labelOf: LabelOf): Row {
  const room = s.bedroom ? roomById.get(s.bedroom) : null;
  return {
    Nome: s.name,
    Sexo: s.sex === "F" ? "Feminino" : s.sex === "M" ? "Masculino" : "",
    Celular: phone(s.phone),
    Ativo: s.active ? "Sim" : "Não",
    Equipe: labelOf(s.team) ?? "",
    Ala: room ? GROUP_META[room.group].label : "",
    Quarto: room?.name ?? "",
    Transporte: labelOf(s.transportation) ?? "",
    Alergias: labels(labelOf, s.allergies),
    "Alergia a medicamentos": labels(labelOf, s.drugAllergies),
    "Condições de saúde": labels(labelOf, s.healthIssues),
    Medicamentos: medicationsText(s.medications),
    "Restrições alimentares": s.foodRestrictions,
    "Observações médicas": s.healthNotes,
    "Check-in": s.checkin ? "Sim" : "Não",
    "Check-in em": s.checkin ? brDateTime(s.checkin.at) : "",
    "Check-in por": checkinBy(s.checkin),
    "Colete entregue": s.vest?.delivered ? "Sim" : "Não",
    "Colete entregue em": s.vest?.delivered ? brDateTime(s.vest.delivered.at) : "",
    "Colete entregue por": s.vest?.delivered?.byName ?? "",
    "Colete devolvido": s.vest?.returned ? "Sim" : "Não",
    "Colete devolvido em": s.vest?.returned ? brDateTime(s.vest.returned.at) : "",
    "Colete devolvido por": s.vest?.returned?.byName ?? "",
    "Leituras fora do escopo": s.foreignLookupCount ?? 0,
    "Crianças lidas fora do escopo": (s.foreignLookupNames ?? []).join("; "),
  };
}

// ── download ───────────────────────────────────────────────────────────

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function saveWorkbook(wb: XLSX.WorkBook, basename: string) {
  XLSX.writeFile(wb, `${basename}-${stamp()}.xlsx`, { compression: true });
}

// ── public API ─────────────────────────────────────────────────────────

export function downloadCampersXlsx(campers: Camper[], bedrooms: Bedroom[], labelOf: LabelOf, staff: Staff[] = []) {
  const roomById = new Map(bedrooms.map((b) => [b.id, b]));
  const staffName = new Map(staff.map((s) => [s.id, s.name]));
  const rows = campers.slice().sort(byName).map((k) => camperRow(k, roomById, labelOf, staffName));
  const headers = Object.keys(camperRow(blankCamper, roomById, labelOf));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet(rows, headers), "Acampantes");
  saveWorkbook(wb, "acampantes");
}

/** The medical team's download: every camper, health-relevant columns only (see medicalCamperRow). */
export function downloadMedicalCampersXlsx(campers: Camper[], bedrooms: Bedroom[], labelOf: LabelOf, staff: Staff[] = []) {
  const roomById = new Map(bedrooms.map((b) => [b.id, b]));
  const staffName = new Map(staff.map((s) => [s.id, s.name]));
  const rows = campers.slice().sort(byName).map((k) => medicalCamperRow(k, roomById, labelOf, staffName));
  const headers = Object.keys(medicalCamperRow(blankCamper, roomById, labelOf));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet(rows, headers), "Acampantes");
  saveWorkbook(wb, "acampantes-saude");
}

export function downloadStaffXlsx(staff: Staff[], bedrooms: Bedroom[], labelOf: LabelOf) {
  const roomById = new Map(bedrooms.map((b) => [b.id, b]));
  const rows = staff.slice().sort(byName).map((s) => staffRow(s, roomById, labelOf));
  const headers = Object.keys(staffRow(blankStaff, roomById, labelOf));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet(rows, headers), "Equipe");
  saveWorkbook(wb, "equipe");
}

/** One workbook: a "Resumo" tab plus one tab per bedroom listing its staff and kids. */
export function downloadBedroomsXlsx(bedrooms: Bedroom[], campers: Camper[], staff: Staff[], labelOf: LabelOf) {
  const wb = XLSX.utils.book_new();
  const rooms = bedrooms.slice().sort((a, b) => GROUP_ORDER[a.group] - GROUP_ORDER[b.group] || a.name.localeCompare(b.name, "pt-BR", { numeric: true }));

  const summary: Row[] = rooms.map((b) => {
    const kids = campers.filter((k) => k.bedroom === b.id);
    const people = staff.filter((s) => s.bedroom === b.id);
    const occupied = kids.length + people.length;
    return {
      Ala: GROUP_META[b.group].label,
      Quarto: b.name,
      Beliches: b.bunkBeds,
      "Camas de solteiro": b.singleBeds,
      Capacidade: b.capacity,
      Ocupadas: occupied,
      Livres: b.capacity - occupied,
      Crianças: kids.length,
      Equipe: people.length,
      Responsáveis: people
        .slice()
        .sort(byName)
        .map((s) => s.name)
        .join("; "),
      Observações: b.notes,
    };
  });
  XLSX.utils.book_append_sheet(wb, sheet(summary), "Resumo");

  const used = new Set<string>(["Resumo"]);
  for (const b of rooms) {
    const people = staff.filter((s) => s.bedroom === b.id).sort(byName);
    const kids = campers.filter((k) => k.bedroom === b.id).sort(byName);
    const rows: Row[] = [
      ...people.map((s) => ({ Tipo: "Equipe", ...roomPersonRow(s, labelOf) })),
      ...kids.map((k) => ({ Tipo: "Criança", ...roomPersonRow(k, labelOf) })),
    ];
    const headers = ["Tipo", ...Object.keys(roomPersonRow(blankCamper, labelOf))];
    const ws = sheet(rows, headers);
    XLSX.utils.book_append_sheet(wb, ws, sheetName(bedroomLabel(b), used));
  }

  saveWorkbook(wb, "quartos");
}

const GROUP_ORDER: Record<Bedroom["group"], number> = { girls: 0, boys: 1, staff: 2 };

/** Columns shared by kids and staff inside a room tab (kid-only fields are blank for staff). */
function roomPersonRow(p: Camper | Staff, labelOf: LabelOf): Row {
  const kid = "guardianName" in p ? p : null;
  const age = kid ? ageOf(kid.birthDate) : null;
  return {
    Nome: p.name,
    Idade: age ?? "",
    Cama: kid ? (labelOf(kid.bed) ?? "") : "",
    Equipe: labelOf(p.team) ?? "",
    Celular: kid ? "" : phone((p as Staff).phone),
    Responsável: kid?.guardianName ?? "",
    "Celular do responsável": kid ? phone(kid.guardianPhone) : "",
    "Contato de emergência": kid?.emergencyContact ?? "",
    Alergias: labels(labelOf, p.allergies),
    "Alergia a medicamentos": labels(labelOf, p.drugAllergies),
    "Condições de saúde": labels(labelOf, p.healthIssues),
    Medicamentos: medicationsText(p.medications),
    "Restrições alimentares": p.foodRestrictions,
    "Observações médicas": p.healthNotes,
    "Observações gerais": kid?.generalNotes ?? "",
  };
}

function sheet(rows: Row[], headers?: string[]): XLSX.WorkSheet {
  const cols = headers ?? (rows[0] ? Object.keys(rows[0]) : []);
  const ws = XLSX.utils.json_to_sheet(rows, { header: cols });
  // auto-ish column widths (capped so long notes don't blow the sheet up)
  ws["!cols"] = cols.map((c) => ({ wch: Math.min(60, Math.max(c.length, ...rows.map((r) => String(r[c] ?? "").length)) + 2) }));
  return ws;
}

/** Excel tab names: max 31 chars, no  : \ / ? * [ ]  and unique within the workbook. */
function sheetName(raw: string, used: Set<string>): string {
  const base = raw.replace(/[:\\/?*[\]]/g, "-").slice(0, 31).trim() || "Quarto";
  let name = base;
  let n = 2;
  while (used.has(name)) name = `${base.slice(0, 31 - ` (${n})`.length)} (${n})`, n++;
  used.add(name);
  return name;
}

// used only to derive the header order when the list is empty
const blankCamper: Camper = {
  id: "",
  name: "",
  birthDate: null,
  sex: null,
  cpf: "",
  rg: "",
  school: "",
  schoolGrade: "",
  church: "",
  invitedBy: "",
  caretakerId: null,
  qrToken: "",
  externalId: "",
  team: null,
  transportation: null,
  bed: null,
  bedroom: null,
  weightKg: null,
  allergies: [],
  drugAllergies: [],
  healthIssues: [],
  neurodivergent: false,
  medications: [],
  foodRestrictions: "",
  healthNotes: "",
  generalNotes: "",
  bedroomPreference: "",
  insurance: "",
  insuranceCard: "",
  emergencyContact: "",
  guardianName: "",
  guardianPhone: null,
  guardianCpf: "",
  guardianEmail: "",
  checkin: null,
  busCheckin: null,
  busReturnCheckin: null,
  parentEditedAt: null,
  importId: null,
  aiReviewStatus: null,
  aiReviewError: "",
  aiReviewStartedAt: null,
  aiReviewFinishedAt: null,
  createdAt: "",
  updatedAt: "",
};

const blankStaff: Staff = {
  id: "",
  name: "",
  sex: null,
  phone: null,
  active: true,
  team: null,
  transportation: null,
  bedroom: null,
  roomRole: "helper",
  allergies: [],
  drugAllergies: [],
  foodRestrictions: "",
  healthIssues: [],
  medications: [],
  healthNotes: "",
  checkin: null,
  vest: { delivered: null, returned: null },
  createdAt: "",
  updatedAt: "",
  prepDone: [],
  foreignLookupCount: 0,
  foreignLookupNames: [],
};
