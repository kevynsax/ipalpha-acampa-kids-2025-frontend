import ParentIcon from "../../components/ParentIcon";
import { formatBrazilPhoneClient } from "../../phoneFormat";
import { roleMeta, type LoggedUser } from "../../roles";
import { useParentHome } from "../../store/derive";

interface ParentProfileProps {
  user: LoggedUser;
  tokenExpiresAt: string;
}

/**
 * The parent's own page (header → their name): who they are plus, for each
 * kid, the emergency data the registration form collected — guardian,
 * emergency contact, insurance, documents.
 */
export default function ParentProfile({ user, tokenExpiresAt }: ParentProfileProps) {
  const meta = roleMeta(user.activeRole);
  const data = useParentHome();
  const formatted = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(tokenExpiresAt));

  return (
    <div className="admin-page">
      <header className="admin-head">
        <h1 className="admin-title detail-title">
          <ParentIcon size={40} /> {user.name}
        </h1>
      </header>
      <p className="admin-intro">
        Você entrou como <strong>{meta.personLabel}</strong>.
      </p>

      <section className="detail-card">
        <dl className="detail-grid">
          <dt>Celular</dt>
          <dd>{formatBrazilPhoneClient(user.phone)}</dd>
          <dt>Perfil</dt>
          <dd>
            <span className={`role-chip role-chip--${meta.color} role-chip--small`}>
              <img className="role-chip__icon" src={meta.icon} alt="" aria-hidden="true" /> {meta.label}
            </span>
          </dd>
        </dl>
      </section>

      {data?.kids.map(({ camper: k }) => (
        <section key={k.id} className="detail-section">
          <h2 className="detail-h2">🚨 Emergência · {k.name.split(" ")[0]}</h2>
          <div className="detail-card">
            <dl className="detail-grid">
              <dt>Responsável</dt>
              <dd>{k.guardianName || "—"}</dd>
              <dt>Telefone</dt>
              <dd>{k.guardianPhone ? formatBrazilPhoneClient(k.guardianPhone) : "—"}</dd>
              {k.guardianEmail && (
                <>
                  <dt>E-mail</dt>
                  <dd>{k.guardianEmail}</dd>
                </>
              )}
              {k.guardianCpf && (
                <>
                  <dt>CPF</dt>
                  <dd>{k.guardianCpf}</dd>
                </>
              )}
              <dt>Emergência</dt>
              <dd>{k.emergencyContact || "—"}</dd>
              <dt>Convênio</dt>
              <dd>
                {k.insurance || "—"}
                {k.insuranceCard && <span className="cat-hint">· carteirinha {k.insuranceCard}</span>}
              </dd>
              {(k.rg || k.cpf) && (
                <>
                  <dt>Documentos</dt>
                  <dd>{[k.rg && `RG ${k.rg}`, k.cpf && `CPF ${k.cpf}`].filter(Boolean).join(" · ")}</dd>
                </>
              )}
            </dl>
          </div>
          <p className="cat-hint">Para corrigir o contato de emergência ou os documentos, fale com a organização. O convênio você edita em Início → Pontos de atenção.</p>
        </section>
      ))}

      <p className="footer-note">🔑 Sua sessão fica aberta até {formatted} (24h).</p>
    </div>
  );
}
