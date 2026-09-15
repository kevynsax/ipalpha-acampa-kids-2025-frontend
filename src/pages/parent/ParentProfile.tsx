import { useEffect, useState } from "react";
import ParentIcon from "../../components/ParentIcon";
import ParentKidTabs from "../../components/ParentKidTabs";
import { formatCpf } from "../../cpf";
import { formatBrazilPhoneClient } from "../../phoneFormat";
import { roleMeta, type LoggedUser, type Role } from "../../roles";
import { useParentHome, type MyKid } from "../../store/derive";

interface ParentProfileProps {
  user: LoggedUser;
  onLogout: () => void;
  loggingOut: boolean;
  /** switches the session to another profile the same person holds (mãe que também é da equipe) */
  onSwitchRole: (role: Role) => Promise<void>;
}

/** The emergency block of ONE kid — what the registration form collected, read-only. */
function KidEmergency({ kid: { camper: k }, tabbed }: { kid: MyKid; tabbed: boolean }) {
  return (
    <section
      id="parent-profile-kid-panel"
      role={tabbed ? "tabpanel" : undefined}
      aria-labelledby={tabbed ? `parent-profile-kid-tab-${k.id}` : undefined}
      className="detail-section"
    >
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
              <dd>{formatCpf(k.guardianCpf)}</dd>
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
              <dd>{[k.rg && `RG ${k.rg}`, k.cpf && `CPF ${formatCpf(k.cpf)}`].filter(Boolean).join(" · ")}</dd>
            </>
          )}
        </dl>
      </div>
      <p className="cat-hint">Para corrigir o contato de emergência ou os documentos, fale com a organização. O convênio você edita em Início → Pontos de atenção.</p>
    </section>
  );
}

/**
 * The parent's own page (header → their name): who they are plus the
 * emergency data the registration form collected for the selected kid —
 * guardian, emergency contact, insurance, documents. With more than one kid
 * the same tab strip as Início picks which one is shown.
 */
export default function ParentProfile({ user, onLogout, loggingOut, onSwitchRole }: ParentProfileProps) {
  const meta = roleMeta(user.activeRole);
  const data = useParentHome();
  const [selectedKidId, setSelectedKidId] = useState<string | null>(null);
  /** the same person may also be on the team / an admin — one tap enters that profile */
  const otherRoles = user.roles.filter((r) => r !== user.activeRole);
  const [switchingTo, setSwitchingTo] = useState<Role | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);

  async function enterAs(role: Role) {
    if (switchingTo) return;
    setSwitchingTo(role);
    setSwitchError(null);
    try {
      await onSwitchRole(role);
    } catch (err) {
      setSwitchError(err instanceof Error ? err.message : "Não foi possível trocar de perfil.");
      setSwitchingTo(null);
    }
  }

  useEffect(() => {
    if (!data?.kids.length) return;
    if (!selectedKidId || !data.kids.some((kid) => kid.camper.id === selectedKidId)) {
      setSelectedKidId(data.kids[0].camper.id);
    }
  }, [data, selectedKidId]);

  const kids = data?.kids ?? [];
  const selectedKid = kids.find((kid) => kid.camper.id === selectedKidId) ?? kids[0] ?? null;

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
            {/* the one they are already in: a plain label, nothing to tap */}
            <span className="role-chip role-chip--small role-chip--bare">
              <img className="role-chip__icon" src={meta.icon} alt="" aria-hidden="true" /> {meta.label}
            </span>
          </dd>
          {otherRoles.length > 0 && (
            <>
              <dt>Outros perfis</dt>
              <dd>
                {otherRoles.map((r) => {
                  const m = roleMeta(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      className={`role-chip role-chip--${m.color} role-chip--small role-chip--switch`}
                      disabled={!!switchingTo}
                      onClick={() => void enterAs(r)}
                      title={`Entrar como ${m.label}`}
                    >
                      <img className="role-chip__icon" src={m.icon} alt="" aria-hidden="true" /> {switchingTo === r ? "Entrando…" : m.label}
                    </button>
                  );
                })}
              </dd>
            </>
          )}
        </dl>
      </section>

      {switchError && <p className="message message--error">{switchError}</p>}

      <ParentKidTabs kids={kids} selectedId={selectedKid?.camper.id ?? ""} onSelect={setSelectedKidId} idPrefix="parent-profile-kid-tab" panelId="parent-profile-kid-panel" />

      {selectedKid && <KidEmergency key={selectedKid.camper.id} kid={selectedKid} tabbed={kids.length > 1} />}

      <div className="profile-actions">
        <button type="button" className="button button--danger profile-logout" onClick={onLogout} disabled={loggingOut}>
          {loggingOut ? "Saindo…" : "Sair do aplicativo"}
        </button>
      </div>
    </div>
  );
}
