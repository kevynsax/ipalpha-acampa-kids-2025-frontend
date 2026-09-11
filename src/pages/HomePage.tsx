import { GROUP_META } from "../api/bedrooms";
import CamperCard from "../components/CamperCard";
import GroupIcon from "../components/GroupIcon";
import KidIcon from "../components/KidIcon";
import PlayScene from "../components/PlayScene";
import SelfCheckinCard from "../components/SelfCheckinCard";
import StaffIcon from "../components/StaffIcon";
import WhatsAppButton from "../components/WhatsAppButton";
import { kidSexOf } from "../icons";
import type { LoggedUser } from "../roles";
import { useCollection } from "../store";
import { useLabelOf, useMyRoom } from "../store/derive";
import { guardianGreeting, whatsappLink } from "../whatsapp";

interface HomePageProps {
  user: LoggedUser;
  token: string;
}

/**
 * "Início" for a team member: their room — the kids they look after and the
 * colleagues sharing it. It is a view of the ROOM, not of the people: for
 * colleagues only the name is shown (the server already strips phones and
 * health data of other staff; the UI never asks for them).
 */
export default function HomePage({ user, token }: HomePageProps) {
  const data = useMyRoom(user.phone);
  const labelOf = useLabelOf();
  const settings = useCollection("settings");
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

  const { me, bedroom, campers, roommates } = data;

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
        {isStaffRoom ? "Aqui ficam só pessoas da equipe." : "Você cuida das crianças que dormem aqui."}
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
              <li key={r.id} className="staff-tag staff-tag--soft">
                {r.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── kids ── */}
      {!isStaffRoom && (
        <section className="detail-section">
          <h2 className="detail-h2">
            <KidIcon sex={sex} group size={26} /> Crianças <span className="cat-tab__count">{campers.length}</span>
          </h2>
          {campers.length === 0 ? (
            <p className="opt-empty">Nenhuma criança neste quarto ainda.</p>
          ) : (
            <ul className="kid-list">
              {campers.map((k) => (
                <CamperCard
                  key={k.id}
                  camper={k}
                  labelOf={labelOf}
                  hideBedroom
                  corner={
                    k.guardianPhone ? (
                      <WhatsAppButton
                        href={whatsappLink(k.guardianPhone, guardianGreeting({ guardianName: k.guardianName, staffName: me.name, camperName: k.name }))}
                        label={`Falar com ${k.guardianName.split(" ")[0] || "o responsável"} no WhatsApp`}
                      />
                    ) : undefined
                  }
                />
              ))}
            </ul>
          )}
        </section>
      )}

      <PlayScene sex={sex} />
    </div>
  );
}
