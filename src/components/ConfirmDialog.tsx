import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import Dialog from "./Dialog";

export interface ConfirmOptions {
  /** short question, e.g. "Excluir Adam?" */
  title: ReactNode;
  /** longer explanation (optional) */
  message?: ReactNode;
  /** label of the confirming button (default "Confirmar") */
  confirmLabel?: string;
  cancelLabel?: string;
  /** red button for destructive actions */
  danger?: boolean;
  /** emoji (or a glyph) shown next to the title */
  emoji?: ReactNode;
}

type Ask = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Ask>(() => Promise.resolve(false));

/**
 * Themed replacement for window.confirm():
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: "Excluir?", danger: true }))) return;
 *
 * Resolves true on confirm, false on cancel / Esc / backdrop click.
 */
export function useConfirm(): Ask {
  return useContext(ConfirmContext);
}

/** Mount once near the root; renders the dialog for every useConfirm() below it. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const ask = useCallback<Ask>((o) => {
    resolver.current?.(false); // a new question cancels a pending one
    setOpts(o);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOpts(null);
  };

  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      <Dialog open={!!opts} onClose={() => settle(false)} title={typeof opts?.title === "string" ? opts.title : "Confirmar"} width={440}>
        {opts && (
          <form
            className="cat-form cat-form--embedded confirm"
            onSubmit={(e) => {
              e.preventDefault();
              settle(true);
            }}
          >
            <h2 className="cat-form__title">
              {opts.emoji && <span className="confirm__emoji" aria-hidden="true">{opts.emoji} </span>}
              {opts.title}
            </h2>
            {opts.message && <div className="confirm__message">{opts.message}</div>}
            <div className="cat-form__actions">
              <button type="button" className="button button--secondary" onClick={() => settle(false)}>
                {opts.cancelLabel ?? "Cancelar"}
              </button>
              <button type="submit" className={`button ${opts.danger ? "button--danger" : "button--primary"}`} autoFocus>
                {opts.confirmLabel ?? "Confirmar"}
              </button>
            </div>
          </form>
        )}
      </Dialog>
    </ConfirmContext.Provider>
  );
}
