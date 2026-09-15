import { useState } from "react";
import appIcon from "../assets/app-icon.png";
import { isIosNonSafari, isMobile, platform, useInstallPrompt, useStandalone } from "../pwa/install";
import Dialog from "./Dialog";

const SNOOZE_KEY = "acampa.install.snoozedUntil";
const SNOOZE_HOURS = 6;

function snoozed(): boolean {
  const raw = localStorage.getItem(SNOOZE_KEY);
  return !!raw && Number(raw) > Date.now();
}

interface InstallBannerProps {
  /** a PARENT stays at home: the reason to install is following the camp, not the missing Wi-Fi up there */
  parent?: boolean;
}

/**
 * On a phone, running inside the browser tab instead of the installed app is
 * a real problem at the camp: the browser may evict the tab, there is no icon
 * to come back to, and there's no internet to re-download anything. So this
 * banner is deliberately loud until the app is installed. "Depois" hides it
 * for a few hours only.
 *
 * A PARENT never goes to the camp, so the missing internet means nothing to
 * them: they are told to install it to keep up with their kid instead.
 */
export default function InstallBanner({ parent }: InstallBannerProps) {
  const standalone = useStandalone();
  const { canPrompt, prompt } = useInstallPrompt();
  const [hidden, setHidden] = useState(snoozed);
  const [howOpen, setHowOpen] = useState(false);

  if (standalone || !isMobile() || hidden) return null;

  const os = platform();
  const wrongBrowser = isIosNonSafari();

  async function install() {
    if (canPrompt) {
      const r = await prompt();
      if (r === "accepted") setHidden(true);
      return;
    }
    setHowOpen(true);
  }

  function later() {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_HOURS * 3600_000));
    setHidden(true);
  }

  return (
    <>
      <aside className="install-banner" role="alert">
        <img className="install-banner__icon" src={appIcon} alt="" aria-hidden="true" width={48} height={48} />
        <div className="install-banner__body">
          <strong className="install-banner__title">Instale o Acampa Kids no seu celular</strong>
          <p className="install-banner__text">
            {parent ? <>Acompanhe <strong>cada novidade</strong> do acampamento.</> : <>No acampamento <strong>não há internet</strong>.</>}
          </p>
          <div className="install-banner__actions">
            <button type="button" className="button button--primary install-banner__cta" onClick={install}>
              {canPrompt ? "Instalar agora" : "Como instalar"}
            </button>
            <button type="button" className="link-btn install-banner__later" onClick={later}>
              Depois
            </button>
          </div>
        </div>
      </aside>

      <Dialog open={howOpen} onClose={() => setHowOpen(false)} title="Como instalar" width={480}>
        <div className="install-how">
          <img className="install-how__icon" src={appIcon} alt="" aria-hidden="true" width={72} height={72} />
          <h2 className="install-how__title">Instalar o Acampa Kids</h2>

          {os === "ios" && wrongBrowser && (
            <p className="message message--error">
              No iPhone a instalação só funciona pelo <strong>Safari</strong>. Copie este endereço, abra o Safari e cole lá.
            </p>
          )}

          {os === "ios" && (
            <ol className="install-how__steps">
              <li>
                Toque no botão <strong>Compartilhar</strong> <span className="install-how__glyph" aria-hidden="true">⎋</span> na barra do Safari (o quadrado com a seta para cima).
              </li>
              <li>
                Role a lista e toque em <strong>Adicionar à Tela de Início</strong> <span className="install-how__glyph" aria-hidden="true">⊕</span>.
              </li>
              <li>
                Confirme em <strong>Adicionar</strong>. O ícone do Acampa Kids aparece na sua tela inicial.
              </li>
              <li>
                Abra o app <strong>pelo ícone</strong> e faça login{parent ? "." : <> uma vez com o Wi-Fi ligado.</>}
              </li>
            </ol>
          )}

          {os === "android" && (
            <ol className="install-how__steps">
              <li>
                Toque no menu <strong>⋮</strong> (canto superior direito do Chrome).
              </li>
              <li>
                Toque em <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.
              </li>
              <li>Confirme. O ícone do Acampa Kids aparece na sua tela inicial.</li>
              <li>
                Abra o app <strong>pelo ícone</strong> e faça login{parent ? "." : <> uma vez com o Wi-Fi ligado.</>}
              </li>
            </ol>
          )}

          {os === "other" && (
            <p className="install-how__text">Abra o menu do navegador e procure por "Instalar aplicativo" ou "Adicionar à tela inicial".</p>
          )}

          <button type="button" className="button button--secondary" onClick={() => setHowOpen(false)}>
            Entendi
          </button>
        </div>
      </Dialog>
    </>
  );
}
