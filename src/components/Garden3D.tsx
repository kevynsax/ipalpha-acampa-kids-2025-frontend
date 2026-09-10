import { useEffect, useRef, useState } from "react";
import ballerina from "../assets/scene/ballerina.png";
import butterfly from "../assets/scene/butterfly.png";

/** One lazy-loaded WebGL scene for both characters, with independent image fallbacks. */
export default function Garden3D() {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = host.current!;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    import("./garden3dScene").then(({ mountGardenScene }) => {
      if (cancelled) return;
      dispose = mountGardenScene(element, () => setReady(true), () => setReady(false));
    }).catch(() => {
      // A decorative asset must never break the camper's page.
    });
    return () => { cancelled = true; dispose?.(); };
  }, []);

  return (
    <div ref={host} className="play-garden" aria-hidden="true">
      {!ready && <>
        <img src={ballerina} alt="" className="play-prop play-prop--pirouette" style={{ width: 120, left: "6%", animationDuration: "8s", animationDelay: ".5s" }} />
        <img src={butterfly} alt="" className="play-prop play-prop--flutter" style={{ width: 64, animationDuration: "12s", animationDelay: "1s" }} />
      </>}
    </div>
  );
}
