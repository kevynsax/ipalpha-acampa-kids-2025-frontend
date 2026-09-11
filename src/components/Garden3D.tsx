import { useEffect, useRef } from "react";

/** One lazy-loaded WebGL scene for both characters. Only the 3D ballerina and
 *  butterfly are ever shown: the stage stays empty until the scene is ready. */
export default function Garden3D() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = host.current!;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    import("./garden3dScene").then(({ mountGardenScene }) => {
      if (cancelled) return;
      dispose = mountGardenScene(element, () => {}, () => {});
    }).catch(() => {
      // A decorative asset must never break the camper's page.
    });
    return () => { cancelled = true; dispose?.(); };
  }, []);

  return <div ref={host} className="play-garden" aria-hidden="true" />;
}
