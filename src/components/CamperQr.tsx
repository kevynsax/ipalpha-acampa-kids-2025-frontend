import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { camperUrl } from "../print/camperLabels";

interface CamperQrProps {
  camperId: string;
  name: string;
  /** rendered size in px */
  size?: number;
}

/** The kid's QR code (same link as the printed badge: the camper's page in this app) — the team scans it at the check-in. */
export default function CamperQr({ camperId, name, size = 220 }: CamperQrProps) {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toString(camperUrl(camperId), { type: "svg", margin: 1, errorCorrectionLevel: "M" })
      .then((s) => alive && setSvg(s))
      .catch(() => alive && setSvg(null));
    return () => {
      alive = false;
    };
  }, [camperId]);
  return (
    <figure className="camper-qr" style={{ width: size }}>
      <div className="camper-qr__code" role="img" aria-label={`QR code de ${name}`} dangerouslySetInnerHTML={svg ? { __html: svg } : undefined} />
      <figcaption className="camper-qr__name">{name}</figcaption>
    </figure>
  );
}
