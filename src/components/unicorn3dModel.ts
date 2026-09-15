import * as THREE from "three";

/** One pass: gallop in, stop and toss the head, gallop out, rest. */
const ENTER_AT = 5, STOP_AT = 11, LEAVE_AT = 16.5, GONE_AT = 22, PERIOD = 24;
type Section = [number, number, number, number, number];
type HairLock = { pivot: THREE.Group; tilt: number };

/** Sculpted pony facing -x, with tapered limbs and flowing, articulated hair. */
export function buildUnicorn() {
  const root = new THREE.Group();
  const horse = new THREE.Group();
  root.add(horse);
  // A cool coat and matte finish retain their silhouette against the warm page.
  const coat = new THREE.MeshStandardMaterial({ color: "#c4bbd8", roughness: .86, envMapIntensity: .3, vertexColors: true });
  const hoof = new THREE.MeshStandardMaterial({ color: "#62516f", roughness: .68, envMapIntensity: .35 });
  const gold = new THREE.MeshStandardMaterial({ color: "#e5ad36", roughness: .4, metalness: .45, envMapIntensity: .6 });
  const hornGroove = new THREE.MeshStandardMaterial({ color: "#956221", roughness: .65 });
  const ink = new THREE.MeshStandardMaterial({ color: "#302838", roughness: .9 });
  const iris = new THREE.MeshStandardMaterial({ color: "#426d80", roughness: .55, envMapIntensity: .3 });
  const blush = new THREE.MeshStandardMaterial({ color: "#c97c9f", roughness: .9 });
  const contour = new THREE.MeshStandardMaterial({ color: "#9685af", roughness: 1, envMapIntensity: .2 });
  const pearl = new THREE.MeshStandardMaterial({ color: "#eee3f2", roughness: .8, envMapIntensity: .3 });
  const hair = ["#c6477d", "#7652a7", "#209caa", "#e4b647", "#4b966f"].map(color =>
    new THREE.MeshStandardMaterial({ color, roughness: .65, envMapIntensity: .4 }));
  const hairGroove = hair.map(mat => new THREE.MeshStandardMaterial({
    color: mat.color.clone().multiplyScalar(.62), roughness: .85, envMapIntensity: .25,
  }));
  const sphere = new THREE.SphereGeometry(1, 20, 14);

  function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, mat: THREE.Material) {
    const result = new THREE.Mesh(geometry, mat);
    result.castShadow = true;
    result.receiveShadow = true;
    parent.add(result);
    return result;
  }
  function oval(parent: THREE.Object3D, mat: THREE.Material, at: number[], scale: number[]) {
    const result = mesh(parent, sphere, mat);
    result.position.set(at[0], at[1], at[2]);
    result.scale.set(scale[0], scale[1], scale[2]);
    return result;
  }
  function stroke(parent: THREE.Object3D, points: number[][], mat: THREE.Material, radius: number) {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    return mesh(parent, new THREE.TubeGeometry(curve, 28, radius, 6, false), mat);
  }

  /** Continuous elliptical cross-sections, not overlapping balls. Radii taper
   *  at the ends; vertex tint adds a shaded belly and softly painted dapples. */
  function sculpt(parent: THREE.Object3D, sections: Section[], mat: THREE.Material, dappled = false, segments = 40, paintedFace = false) {
    const path = new THREE.CatmullRomCurve3(sections.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    const profile = new THREE.CatmullRomCurve3(sections.map(([, , , width, depth]) => new THREE.Vector3(width, depth, 0)));
    const positions: number[] = [], colors: number[] = [], indices: number[] = [];
    const rings = 24;
    const center = new THREE.Vector3(), tangent = new THREE.Vector3(), radii = new THREE.Vector3();
    const shade = new THREE.Color(), belly = new THREE.Color("#89749e"), top = new THREE.Color("#fff8ff");
    const muzzleTint = new THREE.Color("#bc95b0");
    const spots = [[.28, .13, .07], [.45, .2, .06], [.58, .08, .075], [.36, -.04, .05], [.55, -.12, .045]];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      path.getPoint(t, center);
      path.getTangent(t, tangent);
      profile.getPoint(t, radii);
      // All centerlines lie in XY, so Z is a stable binormal, even at bends.
      const nx = -tangent.y, ny = tangent.x;
      for (let j = 0; j <= rings; j++) {
        const angle = j / rings * Math.PI * 2;
        const across = Math.cos(angle) * Math.max(.001, radii.x);
        const x = center.x + nx * across, y = center.y + ny * across;
        const z = center.z + Math.sin(angle) * Math.max(.001, radii.y);
        positions.push(x, y, z);
        shade.copy(belly).lerp(top, THREE.MathUtils.smoothstep(Math.cos(angle) * ny, -.85, .8));
        if (dappled) {
          for (const [sx, sy, size] of spots) {
            const distance = Math.hypot((x - sx) / size, (y - sy) / size);
            const paint = (1 - THREE.MathUtils.smoothstep(distance, .55, 1.15)) * THREE.MathUtils.smoothstep(Math.abs(z), .18, .27);
            shade.lerp(top, paint * .85);
          }
        }
        if (paintedFace) {
          // Paint follows the actual skin: no raised stripe or separate nose ball.
          const muzzle = 1 - THREE.MathUtils.smoothstep(x, -.39, -.27);
          shade.lerp(muzzleTint, muzzle * .65);
          const blazeWidth = THREE.MathUtils.lerp(.018, .05, THREE.MathUtils.smoothstep(x, -.32, -.08));
          const blaze = (1 - THREE.MathUtils.smoothstep(Math.abs(z), blazeWidth * .45, blazeWidth))
            * THREE.MathUtils.smoothstep(y - center.y, .04, .09)
            * THREE.MathUtils.smoothstep(x, -.39, -.29)
            * (1 - THREE.MathUtils.smoothstep(x, -.025, .065));
          shade.lerp(top, blaze * .95);
        }
        colors.push(shade.r, shade.g, shade.b);
        if (i < segments && j < rings) {
          const a = i * (rings + 1) + j, b = a + rings + 1;
          indices.push(a, a + 1, b, b, a + 1, b + 1);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return mesh(parent, geometry, mat);
  }

  /** Curved, pointed locks with a pair of inset-looking strand lines. */
  function lock(parent: THREE.Object3D, at: number[], length: number, tilt: number, color: number): HairLock {
    const pivot = new THREE.Group();
    pivot.position.set(at[0], at[1], at[2]);
    pivot.rotation.z = tilt;
    parent.add(pivot);
    sculpt(pivot, [
      [0, .035, 0, .025, .025], [0, 0, 0, .095, .055],
      [.015, -length * .35, 0, .115, .06], [-.045, -length * .72, 0, .075, .045],
      [.055, -length, 0, .001, .001],
    ], hair[color], false, 24);
    for (const side of [-1, 1]) {
      stroke(pivot, [[-.025, -.05, side * .052], [-.025, -length * .35, side * .059],
        [-.06, -length * .68, side * .043], [.035, -length * .94, side * .015]], hairGroove[color], .007);
    }
    return { pivot, tilt };
  }

  const body = new THREE.Group();
  body.position.y = 1.1;
  horse.add(body);
  // One barrel: defined withers, tucked belly, rounded haunch, no ball seams.
  sculpt(body, [
    [-.79, .05, 0, .015, .015], [-.64, .02, 0, .28, .245],
    [-.4, .04, 0, .36, .32], [0, -.015, 0, .32, .325],
    [.38, .025, 0, .34, .32], [.64, .045, 0, .285, .26], [.81, .035, 0, .005, .005],
  ], coat, true, 64);
  // Short shoulder creases articulate the chest without outlining the model.
  for (const side of [-1, 1]) {
    stroke(body, [[-.5, .19, side * .26], [-.38, .07, side * .322], [-.4, -.12, side * .285]], contour, .009);
  }

  const neck = new THREE.Group();
  neck.position.set(-.59, .13, 0);
  body.add(neck);
  sculpt(neck, [
    [.02, -.19, 0, .19, .21], [-.04, .03, 0, .25, .225],
    [-.17, .32, 0, .185, .165], [-.3, .59, 0, .125, .125], [-.39, .76, 0, .105, .11],
  ], coat);
  const head = new THREE.Group();
  head.position.set(-.36, .72, 0);
  neck.add(head);
  // Fuller cheek, gently sloping nose bridge and a soft, closed muzzle.
  const face = sculpt(head, [
    [.18, .065, 0, .002, .002], [.075, .07, 0, .2, .18],
    [-.09, .04, 0, .19, .19], [-.255, -.035, 0, .12, .14],
    [-.415, -.085, 0, .105, .132], [-.49, -.085, 0, .065, .09],
    [-.515, -.085, 0, .002, .002],
  ], coat, false, 64, true);
  // Place shallow details directly on the skin, including along the curved
  // muzzle. Raycasts use head-local coordinates before world transforms apply.
  const faceRay = new THREE.Raycaster();
  function onFace(x: number, y: number, side: number, offset = .004) {
    faceRay.set(new THREE.Vector3(x, y, side), new THREE.Vector3(0, 0, -side));
    const hit = faceRay.intersectObject(face, false)[0];
    return [x, y, hit ? hit.point.z + side * offset : side * .14];
  }
  for (const side of [-1, 1]) {
    const eye = new THREE.Group();
    const eyeAt = onFace(-.11, .075, side, .002);
    eye.position.set(eyeAt[0], eyeAt[1], eyeAt[2]);
    eye.rotation.y = side * -.2;
    head.add(eye);
    // Almond-shaped lids and inset irises replace the small black bead eyes.
    oval(eye, ink, [0, 0, 0], [.063, .071, .012]);
    oval(eye, pearl, [0, -.002, side * .009], [.054, .061, .009]);
    oval(eye, iris, [-.012, -.002, side * .017], [.037, .049, .007]);
    oval(eye, ink, [-.016, -.003, side * .023], [.023, .036, .005]);
    oval(eye, pearl, [-.028, .018, side * .029], [.01, .013, .003]);
    stroke(eye, [[-.054, .025, side * .01], [-.028, .059, side * .012],
      [.019, .065, side * .01], [.055, .032, side * .004]], ink, .007);
    stroke(eye, [[.044, .045, side * .007], [.069, .063, 0]], ink, .006);
    stroke(head, [onFace(-.16, .168, side), onFace(-.105, .182, side), onFace(-.05, .17, side)], contour, .008);
    oval(head, blush, onFace(-.145, -.047, side, .001), [.041, .02, .004]);
    const nostril = oval(head, ink, onFace(-.434, -.06, side, .002), [.023, .016, .006]);
    nostril.rotation.z = -.3;
    stroke(head, [onFace(-.477, -.128, side), onFace(-.433, -.15, side),
      onFace(-.376, -.15, side), onFace(-.344, -.127, side)], contour, .006);
    const ear = new THREE.Group();
    ear.position.set(.055, .19, side * .105);
    ear.rotation.set(side * -.24, 0, -.22);
    head.add(ear);
    sculpt(ear, [[0, -.025, 0, .045, .035], [0, .07, 0, .063, .041],
      [-.012, .2, 0, .034, .022], [-.04, .29, 0, .001, .001]], coat, false, 20);
    oval(ear, blush, [-.006, .105, side * .032], [.027, .092, .009]);
  }
  const horn = new THREE.Group();
  horn.position.set(-.075, .205, 0);
  horn.rotation.z = .42;
  head.add(horn);
  const spike = mesh(horn, new THREE.ConeGeometry(.062, .49, 24), gold);
  spike.position.y = .245;
  const spiral = Array.from({ length: 100 }, (_, i) => {
    const t = i / 99, angle = t * Math.PI * 2 * 4.5, radius = .062 * (1 - t) + .002;
    return [Math.cos(angle) * radius, t * .475, Math.sin(angle) * radius];
  });
  // More segments than a facial stroke keep the helix smooth.
  const spiralCurve = new THREE.CatmullRomCurve3(spiral.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  mesh(horn, new THREE.TubeGeometry(spiralCurve, 120, .005, 5, false), hornGroove);

  const mane: HairLock[] = [];
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    mane.push(lock(neck, [.16 - t * .43, .08 + t * .65, .015], .46 + .08 * Math.sin(t * Math.PI), .72 - t * .22, i % hair.length));
  }
  // Sweep the forelock backwards so it cannot cover the eyes.
  mane.push(lock(head, [.035, .255, .105], .24, .62, 1));
  mane.push(lock(head, [.06, .25, -.09], .22, .72, 0));
  const tail: HairLock[] = [];
  for (let i = 0; i < 5; i++) {
    tail.push(lock(body, [.73, .14, (i - 2) * .043], .85 - Math.abs(i - 2) * .065, 1.12 - i * .13, (i + 2) % hair.length));
  }

  const legs = [[-.46, -1], [-.46, 1], [.47, -1], [.47, 1]].map(([x, side]) => {
    const front = x < 0;
    const hip = new THREE.Group();
    hip.position.set(x, -.16, side * .19);
    body.add(hip);
    sculpt(hip, [[0, .13, 0, .065, .075], [0, .02, 0, front ? .125 : .17, .125],
      [front ? .015 : -.075, -.21, 0, .085, .08], [0, -.4, 0, .061, .063]], coat, false, 24);
    const knee = new THREE.Group();
    knee.position.y = -.4;
    hip.add(knee);
    // Overlap the tapered limb ends at the hinge, without a separate knee ball.
    sculpt(knee, [[0, .045, 0, .06, .062], [0, -.015, 0, .059, .061], [.015, -.15, 0, .043, .046],
      [-.012, -.35, 0, .052, .052], [-.02, -.45, 0, .067, .063]], coat, false, 20);
    // Flat-bottomed, flared hooves and a lighter coronet, not purple spheres.
    const foot = mesh(knee, new THREE.CylinderGeometry(.069, .09, .12, 16), hoof);
    foot.position.set(-.026, -.48, .009);
    foot.scale.z = 1.12;
    const rim = mesh(knee, new THREE.CylinderGeometry(.063, .071, .027, 16), pearl);
    rim.position.set(-.024, -.417, .009);
    rim.scale.z = 1.1;
    return { hip, knee, front, side };
  });

  const smooth = THREE.MathUtils.smoothstep;
  const easeOut = (t: number) => 1 - (1 - t) ** 3;
  const easeIn = (t: number) => t * t;

  /** Returns true while on stage; reduced motion is a fully reset still pose. */
  function pose(seconds: number, reduced: boolean, halfWidth: number) {
    const outside = halfWidth + 2.2;
    if (reduced) {
      root.position.x = halfWidth * .42;
      root.visible = true;
      neck.rotation.z = -.22;
      head.rotation.set(0, 0, 0);
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
    const lift = smooth(t, STOP_AT, STOP_AT + 1.1) * (1 - smooth(t, LEAVE_AT - 1.2, LEAVE_AT));
    const shake = Math.sin(seconds * 9) * lift * smooth(t, STOP_AT + .6, STOP_AT + 1.4) * (1 - smooth(t, LEAVE_AT - 2.2, LEAVE_AT - 1.4));
    const stride = seconds * Math.PI * 2 * 2.3;
    const bounce = Math.sin(stride);
    body.position.y = 1.1 + Math.max(0, bounce) * .11 * gallop;
    body.rotation.z = bounce * .045 * gallop;
    neck.rotation.z = .09 * gallop + bounce * .045 * gallop - .48 * lift + shake * .07;
    head.rotation.z = -.08 * lift + shake * .09;
    head.rotation.y = shake * .14;
    for (const leg of legs) {
      const phase = stride + (leg.front ? 0 : Math.PI) + leg.side * .3;
      leg.hip.rotation.z = Math.sin(phase) * .6 * gallop;
      leg.knee.rotation.z = Math.max(0, Math.sin(phase + (leg.front ? 1.2 : -1.2))) * .9 * gallop;
    }
    mane.forEach(({ pivot, tilt }, i) => {
      pivot.rotation.z = tilt + Math.sin(stride - i * .55) * .16 * gallop + .2 * gallop + Math.sin(seconds * 9 - i * .45) * .32 * Math.abs(shake) + Math.sin(seconds * 1.6 + i) * .025;
    });
    tail.forEach(({ pivot, tilt }, i) => {
      pivot.rotation.z = tilt + .3 * gallop + Math.sin(stride - i * .4) * .16 * gallop + Math.sin(seconds * 2.1 + i * .5) * .07;
    });
    return root.visible;
  }
  pose(0, true, 5);
  return { root, pose };
}
