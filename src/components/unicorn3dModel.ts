import * as THREE from "three";

/** Timeline (seconds) of one unicorn pass: rest off-screen right, gallop to
 *  the middle, stop and toss the head, gallop off to the left, rest again. */
const ENTER_AT = 5, STOP_AT = 11, LEAVE_AT = 16.5, GONE_AT = 22, PERIOD = 24;

/** A cartoon unicorn facing -x (it always travels right to left), built from
 *  soft ellipsoids: articulated neck, four legs, pastel mane and tail strands. */
export function buildUnicorn() {
  const root = new THREE.Group();
  const horse = new THREE.Group();
  root.add(horse);
  const coat = new THREE.MeshPhysicalMaterial({ color: "#fbf3f8", roughness: .62, sheen: .5, sheenColor: new THREE.Color("#ffd7ea") });
  const hoof = new THREE.MeshStandardMaterial({ color: "#b98cbb", roughness: .5 });
  const gold = new THREE.MeshPhysicalMaterial({ color: "#ffcf5c", roughness: .28, metalness: .55 });
  const ink = new THREE.MeshStandardMaterial({ color: "#3a2a3a", roughness: .8 });
  const blush = new THREE.MeshStandardMaterial({ color: "#f4a9c4", roughness: .9 });
  const pastels = ["#ec6fa3", "#9575cd", "#4dd0e1", "#ffd54f", "#81c784"].map(color =>
    new THREE.MeshPhysicalMaterial({ color, roughness: .55, sheen: .6, sheenColor: new THREE.Color("#ffffff") }));
  const sphere = new THREE.SphereGeometry(1, 28, 20);

  function oval(parent: THREE.Object3D, mat: THREE.Material, at: number[], scale: number[]) {
    const mesh = new THREE.Mesh(sphere, mat);
    mesh.position.set(at[0], at[1], at[2]);
    mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function stroke(parent: THREE.Object3D, points: number[][], mat: THREE.Material, radius: number) {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 10, false), mat);
    mesh.castShadow = true;
    parent.add(mesh);
    return { mesh, curve };
  }
  /** A tapered lock of hair hanging from a pivot, so it can swing. */
  function lock(parent: THREE.Object3D, at: number[], length: number, tilt: number, mat: THREE.Material) {
    const pivot = new THREE.Group();
    pivot.position.set(at[0], at[1], at[2]);
    pivot.rotation.z = tilt;
    parent.add(pivot);
    oval(pivot, mat, [0, -length * .45, 0], [.085, length * .55, .07]);
    return { pivot, tilt };
  }

  // Body: barrel, chest and rump blended from three ellipsoids.
  const body = new THREE.Group();
  body.position.y = 1.1;
  horse.add(body);
  oval(body, coat, [0, 0, 0], [.72, .4, .36]);
  oval(body, coat, [-.48, .06, 0], [.4, .37, .33]);
  oval(body, coat, [.5, .06, 0], [.38, .36, .32]);

  // Neck and head hinge at the chest so the whole head can lift.
  const neck = new THREE.Group();
  neck.position.set(-.62, .2, 0);
  body.add(neck);
  const neckLine = stroke(neck, [[.05, -.15, 0], [-.18, .3, 0], [-.42, .7, 0]], coat, .17);
  const head = new THREE.Group();
  head.position.set(-.42, .7, 0);
  neck.add(head);
  oval(head, coat, [0, .02, 0], [.24, .23, .2]);
  oval(head, coat, [-.27, -.08, 0], [.22, .145, .15]);
  for (const side of [-1, 1]) {
    // Closed, lashed eyes and a blush spot instead of bead eyes.
    stroke(head, [[-.1, .05, side * .17], [-.15, .075, side * .175], [-.2, .05, side * .155]], ink, .009);
    stroke(head, [[-.2, .05, side * .155], [-.225, .035, side * .15]], ink, .006);
    oval(head, blush, [-.14, -.05, side * .17], [.045, .03, .012]);
    const ear = new THREE.Mesh(new THREE.ConeGeometry(.06, .22, 10), coat);
    ear.position.set(.06, .27, side * .11);
    ear.rotation.set(side * -.3, 0, -.2);
    ear.castShadow = true;
    head.add(ear);
    oval(head, hoof, [-.39, -.1, side * .05], [.02, .015, .02]);
  }
  const horn = new THREE.Group();
  horn.position.set(-.08, .2, 0);
  horn.rotation.z = .42;
  head.add(horn);
  const spike = new THREE.Mesh(new THREE.ConeGeometry(.06, .56, 12), gold);
  spike.position.y = .28;
  spike.castShadow = true;
  horn.add(spike);
  for (let i = 0; i < 5; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.06 * (1 - (i + .5) / 5), .009, 6, 20), gold);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = (i + .5) / 5 * .56;
    horn.add(ring);
  }

  // Mane: locks along the crest of the neck plus a forelock beside the horn.
  const mane: { pivot: THREE.Group; tilt: number }[] = [];
  const crest = new THREE.Vector3(), along = new THREE.Vector3();
  for (let i = 0; i < 8; i++) {
    const t = .12 + i / 7 * .88;
    neckLine.curve.getPoint(t, crest);
    neckLine.curve.getTangent(t, along);
    // Push out perpendicular to the neck, onto the crest (back side), and let
    // each lock sweep backwards so it hangs outside the neck tube.
    crest.x += along.y * .2;
    crest.y -= along.x * .2;
    mane.push(lock(neck, [crest.x, crest.y + .04, 0], .5 + Math.sin(i * 1.7) * .07, .9 - i * .06, pastels[i % pastels.length]));
  }
  mane.push(lock(head, [-.16, .24, .06], .36, -1.15, pastels[1]));
  mane.push(lock(head, [-.13, .25, -.07], .32, -1.3, pastels[0]));

  // Tail: a fan of locks streaming back from the rump.
  const tail: { pivot: THREE.Group; tilt: number }[] = [];
  for (let i = 0; i < 5; i++) {
    tail.push(lock(body, [.84, .2, (i - 2) * .05], .78 - Math.abs(i - 2) * .07, 1.25 - i * .14, pastels[(i + 2) % pastels.length]));
  }

  // Legs: hip pivot, knee pivot, hoof.
  const legs = [[-.45, -1], [-.45, 1], [.45, -1], [.45, 1]].map(([x, side]) => {
    const hip = new THREE.Group();
    hip.position.set(x, -.15, side * .17);
    body.add(hip);
    oval(hip, coat, [0, -.22, 0], [.14, .32, .13]);
    const knee = new THREE.Group();
    knee.position.y = -.45;
    hip.add(knee);
    oval(knee, coat, [0, -.24, 0], [.1, .3, .1]);
    oval(knee, hoof, [0, -.5, .01], [.105, .085, .115]);
    return { hip, knee, front: x < 0, side };
  });

  const smooth = THREE.MathUtils.smoothstep;
  const easeOut = (t: number) => 1 - (1 - t) ** 3;
  const easeIn = (t: number) => t * t;

  /** Returns true while the unicorn is on stage (so callers may skip work). */
  function pose(seconds: number, reduced: boolean, halfWidth: number) {
    const outside = halfWidth + 1.8;
    if (reduced) {
      root.position.x = halfWidth * .42;
      root.visible = true;
      neck.rotation.z = -.3;
      body.position.y = 1.1;
      body.rotation.z = 0;
      for (const leg of legs) { leg.hip.rotation.z = 0; leg.knee.rotation.z = 0; }
      for (const { pivot, tilt } of mane) pivot.rotation.z = tilt;
      for (const { pivot, tilt } of tail) pivot.rotation.z = tilt;
      return true;
    }
    const t = seconds % PERIOD;
    let x: number, gallop: number;
    if (t < ENTER_AT || t >= GONE_AT) { x = outside; gallop = 0; }
    else if (t < STOP_AT) {
      const p = (t - ENTER_AT) / (STOP_AT - ENTER_AT);
      x = outside * (1 - easeOut(p));
      gallop = 1 - smooth(p, .8, 1);
    } else if (t < LEAVE_AT) { x = 0; gallop = 0; }
    else {
      const p = (t - LEAVE_AT) / (GONE_AT - LEAVE_AT);
      x = -outside * easeIn(p);
      gallop = smooth(p, 0, .15);
    }
    root.position.x = x;
    root.visible = Math.abs(x) < outside;
    // Head toss while stopped: lift the neck, then shake so the mane flies.
    const lift = smooth(t, STOP_AT, STOP_AT + 1.1) * (1 - smooth(t, LEAVE_AT - 1.2, LEAVE_AT));
    const shake = Math.sin(seconds * 9) * lift * smooth(t, STOP_AT + .6, STOP_AT + 1.4) * (1 - smooth(t, LEAVE_AT - 2.2, LEAVE_AT - 1.4));
    const stride = seconds * Math.PI * 2 * 2.3;
    const bounce = Math.sin(stride);
    body.position.y = 1.1 + Math.max(0, bounce) * .11 * gallop;
    body.rotation.z = bounce * .07 * gallop;
    neck.rotation.z = .12 * gallop + bounce * .07 * gallop - .62 * lift + shake * .1;
    head.rotation.z = -.1 * lift + shake * .12;
    head.rotation.y = shake * .18;
    for (const leg of legs) {
      const phase = stride + (leg.front ? 0 : Math.PI) + leg.side * .3;
      const swing = Math.sin(phase);
      leg.hip.rotation.z = swing * .6 * gallop;
      leg.knee.rotation.z = Math.max(0, Math.sin(phase + (leg.front ? 1.2 : -1.2))) * .9 * gallop;
    }
    mane.forEach(({ pivot, tilt }, i) => {
      pivot.rotation.z = tilt + Math.sin(stride + i * .55) * .22 * gallop + .25 * gallop + Math.sin(seconds * 9 - i * .45) * .45 * Math.abs(shake) + Math.sin(seconds * 1.6 + i) * .04;
    });
    tail.forEach(({ pivot, tilt }, i) => {
      pivot.rotation.z = tilt + .35 * gallop + Math.sin(stride + i * .4) * .2 * gallop + Math.sin(seconds * 2.1 + i * .5) * .08;
    });
    return root.visible;
  }
  pose(0, true, 5);
  return { root, pose };
}
