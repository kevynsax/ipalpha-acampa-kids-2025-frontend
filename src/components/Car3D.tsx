import { useEffect, useRef, useState } from "react";
import car from "../assets/scene/car.png";

/** The engine is a separate chunk; unsupported WebGL keeps the image fallback. */
export default function Car3D() {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = host.current!;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    import("./car3dScene").then(({ mountCarScene }) => {
      if (cancelled) return;
      dispose = mountCarScene(element, () => setReady(true), () => setReady(false));
    }).catch(() => {
      // Decoration must never prevent the rest of the page from rendering.
    });
    return () => { cancelled = true; dispose?.(); };
  }, []);

  return (
    <div ref={host} className="play-car" aria-hidden="true">
      {!ready && <img className="play-car__fallback" src={car} alt="" />}
    </div>
  );
}
