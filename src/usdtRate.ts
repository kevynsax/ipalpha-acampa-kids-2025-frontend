import { useEffect, useState } from "react";

/**
 * Live USDT→BRL rate from cross-otc.com — the OTC desk's public ticker feed
 * (the same websocket its landing page uses). Falls back to the last value
 * seen; null until the first price arrives.
 */
const RATE_WS = "wss://cross-otc.com/api/v1/websocket";

let cachedRate: number | null = null;

export function useUsdtBrl(): number | null {
  const [rate, setRate] = useState<number | null>(cachedRate);

  useEffect(() => {
    if (cachedRate != null) setRate(cachedRate);
    let ws: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let closed = false;

    const connect = () => {
      if (closed) return;
      try {
        ws = new WebSocket(RATE_WS);
      } catch {
        retry = setTimeout(connect, 15_000);
        return;
      }
      ws.onopen = () => ws?.send(JSON.stringify({ subscribe: "tickers" }));
      ws.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data as string) as { event?: string; payload?: { symbol?: string; price?: number } };
          if (d.event === "update-prices" && d.payload?.symbol === "usdt-brl" && typeof d.payload.price === "number") {
            cachedRate = d.payload.price;
            setRate(d.payload.price);
          }
        } catch {
          /* not json — ignore */
        }
      };
      ws.onerror = () => ws?.close();
      ws.onclose = () => {
        if (!closed) retry = setTimeout(connect, 15_000);
      };
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      ws?.close();
    };
  }, []);

  return rate;
}
