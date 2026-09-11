export class ApiError extends Error {
  code: string;
  status: number;
  attemptsLeft?: number;
  minutesLeft?: number;
  secondsLeft?: number;
  opensAt?: string | null;
  closesAt?: string | null;

  constructor(
    status: number,
    code: string,
    message: string,
    extra?: { attemptsLeft?: number; minutesLeft?: number; secondsLeft?: number; opensAt?: string | null; closesAt?: string | null },
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.attemptsLeft = extra?.attemptsLeft;
    this.minutesLeft = extra?.minutesLeft;
    this.secondsLeft = extra?.secondsLeft;
    this.opensAt = extra?.opensAt;
    this.closesAt = extra?.closesAt;
  }
}

// In production the API is served by the same origin through the /api Ingress.
// VITE_API_URL is only needed when development uses a separate backend.
const BASE = import.meta.env.VITE_API_URL || window.location.origin;

/** Writes need the server; when it can't be reached this is what the user sees. */
export const OFFLINE_MESSAGE = "Sem conexão com o servidor. Verifique o Wi-Fi do acampamento e tente novamente.";

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { "content-type": "application/json" },
      ...options,
    });
  } catch {
    throw new ApiError(0, "OFFLINE", OFFLINE_MESSAGE);
  }

  const data = (await res.json().catch(() => null)) as
    | T
    | { error?: { code?: string; message?: string; attemptsLeft?: number; minutesLeft?: number; secondsLeft?: number } }
    | null;

  if (!res.ok) {
    const err = (data as { error?: Record<string, unknown> } | null)?.error;
    throw new ApiError(
      res.status,
      (err?.code as string) ?? "UNKNOWN",
      (err?.message as string) ?? "Algo deu errado. Tente novamente.",
      {
        attemptsLeft: err?.attemptsLeft as number | undefined,
        minutesLeft: err?.minutesLeft as number | undefined,
        secondsLeft: err?.secondsLeft as number | undefined,
        opensAt: err?.opensAt as string | null | undefined,
        closesAt: err?.closesAt as string | null | undefined,
      },
    );
  }

  return data as T;
}

/** A REST command whose resulting application state must arrive by WebSocket. */
export async function command<T>(path: string, options: RequestInit, collections: readonly import("../store").CollectionName[]): Promise<T> {
  const { prepareCollectionWait } = await import("../store/realtime");
  const waiter = prepareCollectionWait(collections);
  try {
    const result = await api<T>(path, options);
    await waiter.promise;
    return result;
  } catch (error) {
    waiter.cancel();
    throw error;
  }
}
