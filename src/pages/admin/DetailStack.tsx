import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { Bedroom } from "../../api/bedrooms";
import type { Camper } from "../../api/campers";
import type { ScheduleRole } from "../../api/schedule";
import type { Staff } from "../../api/staff";
import type { Crumb } from "../../components/Breadcrumbs";
import { useTabOverride, type TabKey } from "../../dashTab";
import { navigate, parseVia, serializeVia, useRoute, type Via } from "../../router";
import BedroomDetail from "./BedroomDetail";
import CamperDetail from "./CamperDetail";
import RoleDetail from "./RoleDetail";
import StaffDetail from "./StaffDetail";

export type DetailKind = "staff" | "camper" | "bedroom" | "role" | "event";
export type DetailRef = { kind: DetailKind; id: string };

/** which dashboard tab / URL prefix each detail kind belongs to */
const TAB_OF: Record<DetailKind, TabKey> = { staff: "staff", camper: "campers", bedroom: "bedrooms", role: "schedule", event: "schedule" };
const PATH_OF: Record<DetailKind, string> = { staff: "/staff", camper: "/campers", bedroom: "/bedrooms", role: "/schedule/roles", event: "/schedule/events" };
const PLACEHOLDER: Record<DetailKind, string> = { staff: "Pessoa", camper: "Acampante", bedroom: "Quarto", role: "Função", event: "Evento" };

/** URL of a detail page reached through `via` (the chain of pages before it). */
export function detailUrl(ref: DetailRef, via: Via = []): string {
  const v = serializeVia(via);
  return `${PATH_OF[ref.kind]}/${ref.id}${v ? `?via=${encodeURIComponent(v)}` : ""}`;
}

interface DetailStackProps {
  token: string;
  /** the page to show (from the URL) */
  current: DetailRef;
  /** breadcrumb(s) before the chain, e.g. [{ label: "Acampantes", onClick }] */
  rootCrumbs: Crumb[];
  /** edit handlers — only the ones the hosting page can handle; others fall back to no-op */
  onEditStaff?: (s: Staff) => void;
  onEditCamper?: (k: Camper) => void;
  onEditBedroom?: (b: Bedroom) => void;
  onEditRole?: (r: ScheduleRole) => void;
  /** the MEDICAL team (or admin) may edit a kid's health block on the detail page */
  canEditHealth?: boolean;
}

/** What every detail page receives from the stack. */
export interface DetailNav {
  crumbs: Crumb[];
  /** the page calls this once it knows its own title (name of the person / room / role) */
  setTitle: (title: ReactNode) => void;
}

/** titles of pages already visited — survives navigating back through the chain */
const titleCache = new Map<string, ReactNode>();

/** Remember a page title so a later breadcrumb can show it (e.g. an event opened from a person). */
export function rememberTitle(ref: DetailRef, title: ReactNode): void {
  titleCache.set(`${ref.kind}:${ref.id}`, title);
}

/** Breadcrumbs for the `via` chain in the URL — every crumb jumps back to that page with the chain cut there. */
export function viaCrumbs(params: URLSearchParams): { via: DetailRef[]; crumbs: Crumb[] } {
  const via = parseVia(params).filter((v): v is DetailRef => v.kind in PATH_OF);
  const crumbs = via.map((ref, i) => ({
    label: titleCache.get(`${ref.kind}:${ref.id}`) ?? PLACEHOLDER[ref.kind],
    onClick: () => navigate(detailUrl(ref, via.slice(0, i))),
  }));
  return { via, crumbs };
}

/**
 * Detail pages can link to each other (staff → bedroom → camper → staff …).
 * The chain lives in the URL (`?via=camper:1,staff:2`), so every hop is a real
 * browser history entry: Back returns to the previous page, the breadcrumb
 * jumps to any earlier one, and a reload rebuilds the same trail.
 */
export default function DetailStack({ token, current, rootCrumbs, onEditStaff, onEditCamper, onEditBedroom, onEditRole, canEditHealth }: DetailStackProps) {
  const { params } = useRoute();
  const via = useMemo(() => parseVia(params).filter((v): v is DetailRef => v.kind in PATH_OF), [params]);
  const chain: DetailRef[] = [...via, current];
  const keyOf = (r: DetailRef) => `${r.kind}:${r.id}`;
  useTabOverride(TAB_OF[current.kind]);

  const [, bump] = useState(0);
  const setTitle = useCallback((ref: DetailRef, title: ReactNode) => {
    if (titleCache.get(keyOf(ref)) === title) return;
    titleCache.set(keyOf(ref), title);
    bump((n) => n + 1);
  }, []);

  const crumbs: Crumb[] = [
    ...rootCrumbs,
    ...chain.map((ref, i) => ({
      label: titleCache.get(keyOf(ref)) ?? PLACEHOLDER[ref.kind],
      // earlier pages: jump to them with the chain cut at that point
      onClick: i < chain.length - 1 ? () => navigate(detailUrl(ref, chain.slice(0, i))) : undefined,
    })),
  ];

  const open = (ref: DetailRef) => navigate(detailUrl(ref, chain));
  const nav = {
    onOpenStaff: (id: string) => open({ kind: "staff", id }),
    onOpenCamper: (id: string) => open({ kind: "camper", id }),
    onOpenBedroom: (id: string) => open({ kind: "bedroom", id }),
    onOpenRole: (id: string) => open({ kind: "role", id }),
    onOpenEvent: (id: string) => open({ kind: "event", id }),
  };
  const key = keyOf(current);
  const curKind = current.kind;
  const curId = current.id;
  const setTopTitle = useMemo(() => (t: ReactNode) => setTitle({ kind: curKind, id: curId }, t), [curKind, curId, setTitle]);
  const detailNav: DetailNav = { crumbs, setTitle: setTopTitle };

  if (current.kind === "staff") return <StaffDetail key={key} token={token} staffId={current.id} nav={detailNav} onEdit={onEditStaff} {...nav} />;
  if (current.kind === "role") return <RoleDetail key={key} token={token} roleId={current.id} nav={detailNav} onEdit={onEditRole ?? (() => {})} onOpenStaff={nav.onOpenStaff} onOpenEvent={nav.onOpenEvent} />;
  if (current.kind === "camper") return <CamperDetail key={key} token={token} camperId={current.id} nav={detailNav} onEdit={onEditCamper} canEditHealth={canEditHealth} {...nav} />;
  return <BedroomDetail key={key} token={token} bedroomId={current.id} nav={detailNav} onEdit={onEditBedroom} {...nav} />;
}
