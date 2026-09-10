/** Thin wrapper around the browser Geolocation API with friendly pt-BR errors. */

export interface DevicePosition {
  lat: number;
  lng: number;
  /** GPS error margin in metres (0 when unknown) */
  accuracyM: number;
}

export class GeoError extends Error {
  kind: "unsupported" | "denied" | "unavailable" | "timeout";
  constructor(kind: GeoError["kind"], message: string) {
    super(message);
    this.kind = kind;
  }
}

/** One fresh GPS fix (no cache): needs HTTPS (or localhost) and the user's permission. */
export function readPosition(timeoutMs = 15_000): Promise<DevicePosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new GeoError("unsupported", "Este aparelho não tem GPS disponível para o navegador."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracyM: Math.round(p.coords.accuracy || 0) }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new GeoError("denied", "Precisamos da sua localização para confirmar que você está na igreja. Permita o acesso nas configurações do navegador e tente de novo."));
        } else if (err.code === err.TIMEOUT) {
          reject(new GeoError("timeout", "O GPS demorou demais para responder. Tente de novo em um lugar mais aberto."));
        } else {
          reject(new GeoError("unavailable", "Não foi possível ler a sua localização. Ative o GPS e tente de novo."));
        }
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    );
  });
}

export function describeGeoError(err: unknown): string {
  if (err instanceof GeoError) return err.message;
  return err instanceof Error ? err.message : "Algo deu errado.";
}

/** Great-circle distance in metres (haversine) — same formula as the server. */
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1).replace(".", ",")} km` : `${Math.round(m)} m`;
}
