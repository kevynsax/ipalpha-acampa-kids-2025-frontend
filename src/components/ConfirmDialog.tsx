import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { useI18n } from "../i18n";
import Dialog from "./Dialog";
import Toggle from "./Toggle";

/** One switch offered inside a prompt (see ConfirmOptions.options). */
export interface ConfirmSwitch {
  key: string;
  label: ReactNode;
  /** paper-cut icon shown before the label (takes precedence over emoji) */
  icon?: string;
  emoji?: ReactNode;
}

export interface ConfirmOptions {
  /** short question, e.g. "Excluir Adam?" */
  title: ReactNode;
  /** longer explanation (optional) */
  message?: ReactNode;
  /** label of the confirming button (default "Confirmar") */
  confirmLabel?: string;
  cancelLabel?: string;
  /**
   * label of an optional third button (macOS "Don't Save" style). When set the
   * dialog offers three choices; the promise resolves "discard" if it is picked.
   */
  discardLabel?: string;
  /** red button for destructive actions */
  danger?: boolean;
  /** emoji (or a glyph) shown next to the title */
  emoji?: ReactNode;
  /**
   * Switches shown inside the prompt, all OFF when it opens (e.g. "do not
   * delete these"). `onOptions` fires on every change with the keys that are
   * on, so the caller can read the choice once the promise resolves.
   */
  options?: ConfirmSwitch[];
  optionsTitle?: ReactNode;
  onOptions?: (keys: string[]) => void;
}

/** How the user dismissed the prompt. Esc / backdrop / cancel button → "cancel". */
export type ConfirmResult = "confirm" | "discard" | "cancel";

interface ConfirmApi {
  /** two-button prompt; resolves true on confirm, false otherwise */
  ask: (opts: ConfirmOptions) => Promise<boolean>;
  /** three-way prompt; resolves "confirm" | "discard" | "cancel" */
  askChoice: (opts: ConfirmOptions) => Promise<ConfirmResult>;
}

const noop: ConfirmApi = {
  ask: () => Promise.resolve(false),
  askChoice: () => Promise.resolve("cancel"),
};

const ConfirmContext = createContext<ConfirmApi>(noop);

/**
 * Themed replacement for window.confirm():
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: "Excluir?", danger: true }))) return;
 *
 * Resolves true on confirm, false on cancel / Esc / backdrop click.
 */
export function useConfirm(): ConfirmApi["ask"] {
  return useContext(ConfirmContext).ask;
}

/**
 * macOS-style "save / don't save / cancel" prompt:
 *
 *   const askChoice = useConfirmChoice();
 *   const r = await askChoice({ title: "Salvar alterações?", confirmLabel: "Salvar", discardLabel: "Descartar" });
 *   if (r === "cancel") return;
 *   if (r === "confirm") await save();
 *   close();
 */
export function useConfirmChoice(): ConfirmApi["askChoice"] {
  return useContext(ConfirmContext).askChoice;
}

/** Mount once near the root; renders the dialog for every useConfirm() below it. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const resolver = useRef<((r: ConfirmResult) => void) | null>(null);

  const askChoice = useCallback((o: ConfirmOptions) => {
    resolver.current?.("cancel"); // a new question cancels a pending one
    setPicked([]);
    setOpts(o);
    return new Promise<ConfirmResult>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const ask = useCallback((o: ConfirmOptions) => askChoice(o).then((r) => r === "confirm"), [askChoice]);

  const settle = (r: ConfirmResult) => {
    resolver.current?.(r);
    resolver.current = null;
    setOpts(null);
  };

  return (
    <ConfirmContext.Provider value={{ ask, askChoice }}>
      {children}
      <Dialog open={!!opts} onClose={() => settle("cancel")} title={typeof opts?.title === "string" ? opts.title : t("common.confirm")} width={440}>
        {opts && (
          <form
            className="cat-form cat-form--embedded confirm"
            onSubmit={(e) => {
              e.preventDefault();
              settle("confirm");
            }}
          >
            <button type="button" className="confirm__close" aria-label={opts.cancelLabel ?? t("common.cancel")} onClick={() => settle("cancel")}>
              ✕
            </button>
            <h2 className="cat-form__title">
              {opts.emoji && <span className="confirm__emoji" aria-hidden="true">{opts.emoji} </span>}
              {opts.title}
            </h2>
            {opts.message && <div className="confirm__message">{opts.message}</div>}
            {!!opts.options?.length && (
              <div className="confirm__options">
                {opts.optionsTitle && <p className="confirm__options-title">{opts.optionsTitle}</p>}
                {opts.options.length > 1 && (
                  <div className="confirm__options-all">
                    <Toggle
                      checked={picked.length === opts.options.length}
                      label={t("common.all")}
                      onChange={(v) => {
                        const next = v ? opts.options!.map((o) => o.key) : [];
                        setPicked(next);
                        opts.onOptions?.(next);
                      }}
                    />
                  </div>
                )}
                {opts.options.map((o) => (
                  <Toggle
                    key={o.key}
                    checked={picked.includes(o.key)}
                    label={
                      <>
                        {o.icon ? <img className="confirm__option-icon" src={o.icon} alt="" aria-hidden="true" /> : o.emoji && <span aria-hidden="true">{o.emoji}</span>} {o.label}
                      </>
                    }
                    onChange={(v) => {
                      const next = v ? [...picked, o.key] : picked.filter((k) => k !== o.key);
                      setPicked(next);
                      opts.onOptions?.(next);
                    }}
                  />
                ))}
              </div>
            )}
            <div className="cat-form__actions">
              {opts.discardLabel ? (
                <>
                  {/* three-way prompt: Salvar is the green (positive) action; discarding is a yellow warn button */}
                  <button type="submit" className="button button--primary">
                    {opts.confirmLabel ?? t("common.confirm")}
                  </button>
                  <button type="button" className="button button--warn" autoFocus onClick={() => settle("discard")}>
                    {opts.discardLabel}
                  </button>
                </>
              ) : (
                <button type="submit" className={`button ${opts.danger ? "button--danger" : "button--primary"}`} autoFocus>
                  {opts.confirmLabel ?? t("common.confirm")}
                </button>
              )}
            </div>
          </form>
        )}
      </Dialog>
    </ConfirmContext.Provider>
  );
}
