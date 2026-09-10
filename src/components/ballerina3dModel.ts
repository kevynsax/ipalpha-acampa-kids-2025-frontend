import * as THREE from "three";

/** A sculpted ballet figurine, with continuous limbs and a soft, draped skirt. */
export function buildBallerina() {
  const root = new THREE.Group();
  const dancer = new THREE.Group();
  root.add(dancer);
  // Warm brown skin with restrained reflections so the bright stage lighting
  // keeps her features defined rather than washing them out.
  const skin = new THREE.MeshPhysicalMaterial({ color: "#925333", roughness: .78, specularIntensity: .25, transparent: false, opacity: 1 });
  const satin = new THREE.MeshPhysicalMaterial({ color: "#a83d70", roughness: .42, sheen: .8, sheenColor: new THREE.Color("#ffe0ed") });
  const tulle = new THREE.MeshPhysicalMaterial({ color: "#c75b8b", roughness: .72, sheen: 1, sheenColor: new THREE.Color("#fff0f4"), side: THREE.DoubleSide });
  const lining = new THREE.MeshPhysicalMaterial({ color: "#ac3e70", roughness: .7, side: THREE.DoubleSide });
  const tights = new THREE.MeshStandardMaterial({ color: "#a26848", roughness: .9 });
  const slippers = new THREE.MeshPhysicalMaterial({ color: "#e8a5bc", roughness: .4, sheen: .65 });
  const hair = new THREE.MeshStandardMaterial({ color: "#291b17", roughness: .65 });
  const hairHighlight = new THREE.MeshStandardMaterial({ color: "#493024", roughness: .7 });
  const faceInk = new THREE.MeshStandardMaterial({ color: "#301b18", roughness: .8 });
  const lip = new THREE.MeshStandardMaterial({ color: "#a45150", roughness: .8 });
  const pearl = new THREE.MeshPhysicalMaterial({ color: "#fff0df", roughness: .32, metalness: .12 });
  const sphere = new THREE.SphereGeometry(1, 32, 24);

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
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, radius, 8, false), mat);
    parent.add(mesh);
    return mesh;
  }
  function lathe(points: number[][], mat: THREE.Material, depth: number) {
    const curve = new THREE.SplineCurve(points.map(([radius, y]) => new THREE.Vector2(radius, y)));
    const mesh = new THREE.Mesh(new THREE.LatheGeometry(curve.getPoints(48), 48), mat);
    mesh.scale.z = depth;
    mesh.castShadow = true;
    dancer.add(mesh);
    return mesh;
  }

  // A single tailored silhouette: narrow waist, rounded shoulders, long neck.
  lathe([[.02, 1.67], [.24, 1.73], [.21, 1.9], [.18, 2.05], [.235, 2.3], [.24, 2.4], [.12, 2.46], [.01, 2.46]], satin, .7);
  oval(dancer, skin, [0, 2.43, 0], [.25, .11, .155]);
  oval(dancer, skin, [0, 2.58, -.005], [.078, .2, .083]);
  for (const side of [-1, 1]) {
    stroke(dancer, [[side * .18, 2.29, .1], [side * .2, 2.43, .07], [side * .18, 2.46, -.07]], satin, .027);
  }
  // Ribbon waistband and a small rosette, rather than a hard plastic belt.
  const belt = new THREE.Mesh(new THREE.TorusGeometry(.213, .025, 10, 48), slippers);
  belt.rotation.x = Math.PI / 2;
  belt.position.y = 1.89;
  belt.scale.y = .7;
  dancer.add(belt);
  for (let i = 0; i < 5; i++) {
    const angle = i * Math.PI * 2 / 5;
    oval(dancer, tulle, [.13 + Math.cos(angle) * .033, 1.88 + Math.sin(angle) * .033, .16], [.03, .03, .015]);
  }
  oval(dancer, pearl, [.13, 1.88, .18], [.017, .017, .012]);

  const head = new THREE.Group();
  head.position.set(0, 2.92, 0);
  head.rotation.z = -.075;
  dancer.add(head);
  // Smaller tapered face, subtle nose, closed eyelids: no staring bead eyes.
  const faceGeometry = sphere.clone();
  const facePositions = faceGeometry.attributes.position;
  for (let i = 0; i < facePositions.count; i++) {
    const y = facePositions.getY(i);
    facePositions.setX(i, facePositions.getX(i) * (y < 0 ? 1 + y * .2 : 1));
  }
  faceGeometry.computeVertexNormals();
  const face = new THREE.Mesh(faceGeometry, skin);
  face.scale.set(.265, .325, .235);
  face.castShadow = true;
  head.add(face);
  oval(head, skin, [0, -.04, .229], [.028, .047, .024]);
  for (const side of [-1, 1]) {
    stroke(head, [[side * .055, .001, .23], [side * .1, -.017, .218], [side * .15, .003, .192]], faceInk, .009);
    stroke(head, [[side * .145, 0, .196], [side * .17, .019, .183]], faceInk, .006);
    oval(head, skin, [side * .251, -.025, -.006], [.033, .059, .037]);
    oval(head, pearl, [side * .257, -.071, .018], [.018, .024, .018]);
  }
  stroke(head, [[-.037, -.133, .203], [0, -.142, .211], [.037, -.133, .203]], lip, .007);

  // Fitted hair cap: a swept hairline in front, full coverage behind the ears.
  const hairVertices: number[] = [], hairIndices: number[] = [];
  for (let r = 0; r <= 20; r++) for (let s = 0; s <= 64; s++) {
    const azimuth = s / 64 * Math.PI * 2;
    const front = Math.max(0, Math.sin(azimuth));
    const edge = 1.91 - front * .96 + Math.cos(azimuth) * front * .16;
    const polar = r / 20 * edge;
    hairVertices.push(.276 * Math.sin(polar) * Math.cos(azimuth), .334 * Math.cos(polar) + .014, .25 * Math.sin(polar) * Math.sin(azimuth) - .012);
    if (r < 20 && s < 64) {
      const a = r * 65 + s, b = a + 65;
      hairIndices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const hairGeometry = new THREE.BufferGeometry();
  hairGeometry.setAttribute("position", new THREE.Float32BufferAttribute(hairVertices, 3));
  hairGeometry.setIndex(hairIndices);
  hairGeometry.computeVertexNormals();
  const cap = new THREE.Mesh(hairGeometry, hair);
  cap.castShadow = true;
  head.add(cap);
  oval(head, hair, [0, .26, -.19], [.145, .145, .125]);
  for (let i = 0; i < 4; i++) {
    const y = .19 + i * .033;
    stroke(head, [[-.115, y, -.21], [0, y + .025, -.31], [.115, y, -.21]], hairHighlight, .007);
  }
  // Small fabric flower at the bun, with one pearl centre.
  for (let i = 0; i < 5; i++) {
    const angle = i / 5 * Math.PI * 2;
    oval(head, tulle, [.13 + Math.cos(angle) * .047, .24 + Math.sin(angle) * .047, -.1], [.04, .04, .021]);
  }
  oval(head, pearl, [.13, .24, -.073], [.022, .022, .018]);

  // Bell-shaped tulle, with continuous folds instead of stacked flat discs.
  const skirt = new THREE.Group();
  skirt.position.y = 1.86;
  dancer.add(skirt);
  for (let layer = 0; layer < 3; layer++) {
    const vertices: number[] = [], indices: number[] = [];
    const rings = 20, segments = 96;
    for (let r = 0; r <= rings; r++) for (let s = 0; s <= segments; s++) {
      const t = r / rings, angle = s / segments * Math.PI * 2;
      const fold = Math.sin(angle * 10 + layer * .5);
      const radius = .22 + Math.sin(t * Math.PI * .48) * (.48 - layer * .04) + fold * .025 * t;
      const y = -t * (.59 - layer * .07) + Math.cos(angle * 10 + layer * .5) * .025 * t * t;
      vertices.push(Math.cos(angle) * radius, y, Math.sin(angle) * radius * .88);
      if (r < rings && s < segments) {
        const a = r * (segments + 1) + s, b = a + segments + 1;
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, layer === 0 ? tulle : lining);
    mesh.castShadow = true;
    skirt.add(mesh);
  }

  // Reusable deforming tubes: smooth shoulder-to-wrist and hip-to-ankle
  // surfaces, without exposed cylinder ends or disconnected elbow/knee joints.
  function limb(mat: THREE.Material, radii: number[]) {
    const rings = 24, sides = 12;
    const positions = new Float32Array((rings + 1) * (sides + 1) * 3);
    const indices: number[] = [];
    for (let r = 0; r < rings; r++) for (let s = 0; s < sides; s++) {
      const a = r * (sides + 1) + s, b = a + sides + 1;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setIndex(indices);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = true;
    // The shape changes every frame, so a cached bind-pose bound is not valid.
    mesh.frustumCulled = false;
    dancer.add(mesh);
    const point = new THREE.Vector3(), tangent = new THREE.Vector3(), normal = new THREE.Vector3(), binormal = new THREE.Vector3();
    const forward = new THREE.Vector3(0, 0, 1);
    return (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
      for (let r = 0; r <= rings; r++) {
        const t = r / rings, u = 1 - t;
        point.copy(a).multiplyScalar(u * u).addScaledVector(b, 2 * u * t).addScaledVector(c, t * t);
        tangent.copy(b).sub(a).multiplyScalar(u).addScaledVector(c, t).addScaledVector(b, -t).normalize();
        normal.crossVectors(tangent, forward).normalize();
        binormal.crossVectors(tangent, normal).normalize();
        const radius = u * u * radii[0] + 2 * u * t * radii[1] + t * t * radii[2];
        for (let s = 0; s <= sides; s++) {
          const angle = s / sides * Math.PI * 2, n = Math.cos(angle) * radius, b = Math.sin(angle) * radius;
          const index = (r * (sides + 1) + s) * 3;
          positions[index] = point.x + normal.x * n + binormal.x * b;
          positions[index + 1] = point.y + normal.y * n + binormal.y * b;
          positions[index + 2] = point.z + normal.z * n + binormal.z * b;
        }
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    };
  }
  const arms = [-1, 1].map(side => ({ side, bend: limb(skin, [.075, .06, .035]), hand: oval(dancer, skin, [0, 0, 0], [.039, .079, .033]) }));
  const legs = [-1, 1].map(side => {
    const foot = new THREE.Group();
    dancer.add(foot);
    oval(foot, slippers, [0, -.075, .015], [.065, .155, .075]);
    for (const turn of [-1, 1]) {
      stroke(foot, [[-.055, .13, 0], [0, .07 + turn * .025, .068], [.055, .01, 0]], slippers, .012);
    }
    return { side, bend: limb(tights, [.095, .074, .039]), foot };
  });
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  function pose(seconds: number, reduced: boolean) {
    const phase = reduced ? .12 : (seconds % 10) / 10;
    const gather = THREE.MathUtils.smoothstep(phase, .14, .32) * (1 - THREE.MathUtils.smoothstep(phase, .73, .9));
    const turn = THREE.MathUtils.smoothstep(phase, .32, .74);
    const lift = gather * .055;
    dancer.rotation.y = -.18 + turn * Math.PI * 4;
    dancer.position.y = lift;
    head.rotation.y = Math.sin(turn * Math.PI * 4) * -.2;
    skirt.rotation.y = -gather * .16;
    skirt.rotation.z = reduced ? 0 : Math.sin(seconds * 2) * .018 * gather;
    skirt.scale.set(1 + gather * .12, 1 - gather * .06, 1 + gather * .12);
    for (const arm of arms) {
      const s = arm.side;
      const raised = s < 0 ? 1 : gather;
      a.set(s * .22, 2.4, 0);
      b.set(s * (.83 - raised * .23), 2.15 + raised * 1.05, .09);
      c.set(s * (.9 - raised * .79), 2.1 + raised * 1.38, .08);
      arm.bend(a, b, c);
      arm.hand.position.copy(c);
      arm.hand.rotation.z = s * (1.1 - raised * 2.25);
    }
    for (const leg of legs) {
      const s = leg.side, bent = s > 0 ? gather : 0;
      a.set(s * .135, 1.76, 0);
      b.set(s * (.13 + bent * .72), .98 + bent * .2, bent * .13);
      c.set(s * (.09 + bent * .04), .23 + bent * .69 - lift, bent * .11);
      leg.bend(a, b, c);
      leg.foot.position.copy(c);
      leg.foot.rotation.z = s > 0 ? -.12 - bent * .6 : 0;
    }
  }
  pose(0, true);
  return { root, pose };
}
