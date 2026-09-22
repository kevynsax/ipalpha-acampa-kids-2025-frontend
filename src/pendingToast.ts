/** In-memory handoff from a page to the list it navigates back to (same reasoning as useFileDrop's pendingImportFile: survives a StrictMode remount, no localStorage needed for a same-session handoff). */
let pendingToast: string | null = null;

export function setPendingToast(message: string): void {
  pendingToast = message;
}

/** Reads and clears the pending toast — call once, on mount. */
export function takePendingToast(): string | null {
  const message = pendingToast;
  pendingToast = null;
  return message;
}
