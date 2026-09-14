import type QrScanner from "qr-scanner";

/** the scan square takes this share of the viewport's shorter side */
const SQUARE = 0.7;

/**
 * Scan region = a square centred on what the user actually SEES. The video
 * is drawn with `object-fit: cover`, so the frame is cropped: the library's
 * default (⅔ of the intrinsic frame) can be wider than the viewport on a
 * portrait phone fed by a landscape camera, which shows up as an oversized,
 * off-centre highlight. This maps the visible square back to frame pixels.
 */
export function visibleScanRegion(video: HTMLVideoElement): QrScanner.ScanRegion {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const dw = video.offsetWidth || vw;
  const dh = video.offsetHeight || vh;
  if (!vw || !vh) return { x: 0, y: 0, width: 0, height: 0 };
  const scale = Math.max(dw / vw, dh / vh); // cover
  const side = Math.round((Math.min(dw, dh) * SQUARE) / scale);
  return {
    x: Math.round((vw - side) / 2),
    y: Math.round((vh - side) / 2),
    width: side,
    height: side,
    downScaledWidth: 400,
    downScaledHeight: 400,
  };
}

type Internals = { _scanRegion?: QrScanner.ScanRegion; _updateOverlay?: () => void };

/**
 * qr-scanner computes the scan region and places its highlight only on
 * video `play` / `loadedmetadata` / window `resize`. Our viewport is sized
 * by CSS after that (flex / dvh on the full-screen phone dialog, the dialog
 * pop-in, the address bar collapsing…). Watch the box and recompute both
 * the region and the overlay on every change.
 */
export function keepOverlayInPlace(scanner: QrScanner, video: HTMLVideoElement): () => void {
  const update = () => {
    const s = scanner as unknown as Internals;
    if (video.videoWidth) s._scanRegion = visibleScanRegion(video);
    s._updateOverlay?.();
  };
  const ro = new ResizeObserver(update);
  ro.observe(video);
  if (video.parentElement) ro.observe(video.parentElement);
  // the dialog's open animation (transform) settles a frame later than the resize
  const t = window.setTimeout(update, 250);
  return () => {
    ro.disconnect();
    window.clearTimeout(t);
  };
}
