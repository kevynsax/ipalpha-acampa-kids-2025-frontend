import { useCallback, useState } from "react";
import { GROUP_META } from "../api/bedrooms";
import { ROOM_ROLE_META } from "../api/staff";
import CamperCard from "../components/CamperCard";
import GroupIcon from "../components/GroupIcon";
import KidIcon from "../components/KidIcon";
import PlayScene from "../components/PlayScene";
import SelfCheckinCard from "../components/SelfCheckinCard";
import StaffIcon from "../components/StaffIcon";
import { kidSexOf } from "../icons";
import type { LoggedUser } from "../roles";
import { useCollection } from "../store";
import { useLabelOf, useMyRoom } from "../store/derive";
import { useRoute } from "../router";
import CamperDetail from "./admin/CamperDetail";

interface HomePageProps {
  user: LoggedUser;
  token: string;
}

/**
 * "Início" for a team member: their room — the kids under THEIR care (a
 * caretaker), the other kids of the room (collapsed; the server only sends
 * them while the camp is happening) and the colleagues sharing it. For
 * colleagues only the name and room role are shown (the server already
 * strips phones and health data of other staff; the UI never asks for them).
 * Guardian / emergency data never reaches this page.
 */
export default function HomePage({ user, token }: HomePageProps) {
  const data = useMyRoom(user.phone);
  const labelOf = useLabelOf();
  const settings = useCollection("settings");
  const { navigate, segments } = useRoute();
  const [showOthers, setShowOthers] = useState(false);
  /** #/home/<camperId> → the kid's page (only the kids the server sent me are in the store) */
  const openKid = segments[0] === "home" ? segments[1] : undefined;
  const setTitle = useCallback(() => {}, []);
  const openCamper = (id: string) => navigate(`/home/${id}`);
  const first = user.name.split(" ")[0];
  const access = settings?.staffAccessWindow;
  const fmt = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  // ordinary team member outside the access window: the server sends no staff record at all
  if (data === undefined && access && !access.open) {
    return (
      <div className="admin-page">
        <h1 className="admin-title">Olá, {first}! 👋</h1>
        <p className="opt-empty">
          O app ainda não está liberado para a equipe.
          <br />
          {access.from && new Date(access.from).getTime() > Date.now() ? `Abre ${fmt.format(new Date(access.from))}.` : "O período de acesso já terminou."}
        </p>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="admin-page">
        <p className="opt-empty">Sincronizando com o servidor… 🏕️</p>
      </div>
    );
  }

  if (data === undefined) {
    return (
      <div className="admin-page">
        <h1 className="admin-title">Olá, {first}! 👋</h1>
        <p className="opt-empty">
          Seu celular ainda não está vinculado a um cadastro da equipe.
          <br />
          Fale com a organização para ajustar o seu cadastro.
        </p>
      </div>
    );
  }

  const { me, bedroom, myKids, campers, roommates } = data;
  const caretaker = me.roomRole === "caretaker";

  if (openKid) {
    return <CamperDetail token={token} camperId={openKid} nav={{ crumbs: [{ label: "Início", onClick: () => navigate("/home") }, { label: "Criança" }], setTitle }} onOpenCamper={openCamper} />;
  }

  if (!bedroom) {
    return (
      <div className="admin-page">
        <h1 className="admin-title">Olá, {first}! 👋</h1>
        <SelfCheckinCard token={token} user={user} />
        <p className="opt-empty">
          Você ainda não tem um quarto definido.
          <br />
          Assim que a organização te alocar, ele aparece aqui.
        </p>
      </div>
    );
  }

  const m = GROUP_META[bedroom.group];
  const isStaffRoom = bedroom.group === "staff";
  /** the wing decides the playful strip at the bottom (ball/car/kite vs ballerina/butterfly/unicorn) */
  const sex = kidSexOf(bedroom.group);

  return (
    <div className="admin-page">
      <header className="admin-head">
        <h1 className={`admin-title detail-title room-group__title--${m.color}`}>
          <GroupIcon group={bedroom.group} /> Quarto {bedroom.name}
        </h1>
      </header>
      <p className="admin-intro">
        Olá, {first}! Este é o seu quarto ({m.label}).{" "}
        {isStaffRoom ? "Aqui ficam só pessoas da equipe." : caretaker ? "Você é responsável por crianças deste quarto." : "Você é auxiliar neste quarto."}
      </p>

      {/* departure day only: "Cheguei na igreja!" */}
      <SelfCheckinCard token={token} user={user} />

      {/* ── colleagues: name only ── */}
      <section className="detail-section">
        <h2 className="detail-h2">
          <StaffIcon size={24} /> Colegas de equipe no quarto <span className="cat-tab__count">{roommates.length}</span>
        </h2>
        {roommates.length === 0 ? (
          <p className="opt-empty">Só você neste quarto. 😊</p>
        ) : (
          <ul className="staff-card__tags roommate-list" aria-label="Colegas de equipe no quarto">
            {roommates.map((r) => (
              <li key={r.id} className="staff-tag staff-tag--soft" title={ROOM_ROLE_META[r.roomRole]?.label}>
                {r.roomRole === "caretaker" && <span aria-hidden="true">{ROOM_ROLE_META.caretaker.emoji}</span>} {r.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── my kids (caretaker only) ── */}
      {!isStaffRoom && caretaker && (
        <section className="detail-section">
          <h2 className="detail-h2">
            <KidIcon sex={sex} group size={26} /> Minhas crianças <span className="cat-tab__count">{myKids.length}</span>
          </h2>
          <p className="admin-intro">Você é o responsável por elas. Toque para ver saúde, alimentação e observações.</p>
          {myKids.length === 0 ? (
            <p className="opt-empty">Nenhuma criança sob sua responsabilidade ainda.</p>
          ) : (
            <ul className="kid-list">
              {myKids.map((k) => (
                <CamperCard key={k.id} camper={k} labelOf={labelOf} hideBedroom onOpen={openCamper} />
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ── the other kids of the room: collapsed; only sent by the server while the camp is happening ── */}
      {!isStaffRoom && (campers.length > 0 || !caretaker) && (
        <section className="detail-section">
          <button type="button" className={`disclosure ${showOthers ? "disclosure--open" : ""}`} aria-expanded={showOthers} onClick={() => setShowOthers((v) => !v)}>
            <span className="disclosure__arrow" aria-hidden="true">▶</span>
            {caretaker ? "Outras crianças do quarto" : "Crianças do quarto"} <span className="cat-tab__count">{campers.length}</span>
            <span className="disclosure__hint">para ajudar os colegas com saúde e cuidados</span>
          </button>
          {showOthers &&
            (campers.length === 0 ? (
              <p className="opt-empty">As crianças do quarto aparecem aqui durante o acampamento.</p>
            ) : (
              <ul className="kid-list">
                {campers.map((k) => (
                  <CamperCard key={k.id} camper={k} labelOf={labelOf} hideBedroom onOpen={openCamper} />
                ))}
              </ul>
            ))}
        </section>
      )}

      <PlayScene sex={sex} />
    </div>
  );
}
