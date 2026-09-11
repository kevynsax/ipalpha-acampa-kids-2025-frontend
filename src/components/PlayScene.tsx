import type { KidSex } from "../icons";
import ball from "../assets/scene/ball.png";
import Car3D from "./Car3D";
import kite from "../assets/scene/kite.png";
import Garden3D from "./Garden3D";

interface Prop {
  src: string;
  /** css animation name (see styles.css "Play scene") */
  motion: "bounce-in" | "float";
  /** px */
  size: number;
  /** duration / delay in s — staggered so things don't all move at once */
  dur: number;
  delay: number;
  /** left offset for the static-ish props (%) */
  left?: number;
}

/**
 * What plays on each kid's page. Motions are tuned per prop:
 *  - bounce-in: ball drops in from the left edge, bounces, settles and rolls off
 *  - Car3D: real WebGL car drives left to right during the second half of
 *    the ball's 16-second cycle (shared timing lives in styles.css).
 *  - float: kite hovers up/down on the right
 *  - Garden3D: articulated ballerina pirouettes, a mesh butterfly flaps
 *    along a closed flight path and a unicorn gallops in from the right,
 *    stops mid-stage to toss its mane, then gallops off to the left —
 *    all sharing one lazy-loaded WebGL renderer
 */
const SCENES: Record<KidSex, Prop[]> = {
  boy: [
    { src: ball, motion: "bounce-in", size: 72, dur: 16, delay: 0.5 },
    { src: kite, motion: "float", size: 90, dur: 6, delay: 0, left: 78 },
  ],
  girl: [],
};

/**
 * Decorative strip rendered at the END of a kid's page (normal flow — it never
 * overlaps the content), themed by the kid's sex. CSS props plus a lazy-loaded
 * WebGL characters, non-interactive and hidden from assistive tech; stops animating
 * under prefers-reduced-motion.
 */
export default function PlayScene({ sex }: { sex: KidSex | null }) {
  if (!sex) return null;
  return (
    <div className={`play-scene play-scene--${sex}`} aria-hidden="true">
      {SCENES[sex].map((p, i) => (
        <img
          key={i}
          src={p.src}
          alt=""
          className={`play-prop play-prop--${p.motion}`}
          style={{ width: p.size, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`, left: p.left !== undefined ? `${p.left}%` : undefined }}
        />
      ))}
      {sex === "boy" ? <Car3D /> : <Garden3D />}
    </div>
  );
}
