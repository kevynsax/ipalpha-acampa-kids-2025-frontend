import * as THREE from "three";

function material(color: string, roughness = 0.45) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.05 });
}

function ellipsoid(parent: THREE.Object3D, mat: THREE.Material, position: number[], scale: number[]) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), mat);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.scale.set(scale[0], scale[1], scale[2]);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function line(parent: THREE.Object3D, points: THREE.Vector3[], mat: THREE.Material, radius: number) {
  const curve = new THREE.CatmullRomCurve3(points);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, radius, 6, false), mat);
  parent.add(mesh);
  return mesh;
}

export { buildBallerina } from "./ballerina3dModel";

/** Extruded, scalloped wings with raised veins and spots on both faces. */
export function buildButterfly() {
  const root = new THREE.Group();
  const dark = material("#4c3459");
  const edge = material("#754275", .4);
  const upper = new THREE.MeshPhysicalMaterial({ color: "#bc72bb", roughness: .35, metalness: .1, iridescence: .65, side: THREE.DoubleSide });
  const lower = new THREE.MeshPhysicalMaterial({ color: "#ec9bb6", roughness: .4, sheen: .8, sheenColor: new THREE.Color("#ffe4cb"), side: THREE.DoubleSide });
  const gold = material("#ffe1a0", .35);
  ellipsoid(root, dark, [0, 0, 0], [.09, .43, .1]);
  ellipsoid(root, dark, [0, .39, 0], [.13, .13, .12]);
  for (const side of [-1, 1]) {
    line(root, [new THREE.Vector3(side * .06, .45, 0), new THREE.Vector3(side * .15, .65, .02), new THREE.Vector3(side * .27, .69, .02)], dark, .016);
    ellipsoid(root, gold, [side * .27, .69, .02], [.04, .04, .04]);
  }
  const hinges = [-1, 1].map(side => {
    const hinge = new THREE.Group();
    root.add(hinge);
    const wing = new THREE.Group();
    wing.scale.x = side;
    hinge.add(wing);
    const fore = new THREE.Shape();
    fore.moveTo(.04, .15);
    fore.bezierCurveTo(.28, .8, .99, 1.17, 1.14, .79);
    fore.bezierCurveTo(1.32, .35, .92, -.12, .08, -.06);
    fore.closePath();
    const hind = new THREE.Shape();
    hind.moveTo(.07, .05);
    hind.bezierCurveTo(.95, .03, 1.11, -.49, .69, -.71);
    hind.bezierCurveTo(.38, -.91, .15, -.57, .07, .05);
    hind.closePath();
    for (const [shape, mat] of [[fore, upper], [hind, lower]] as const) {
      const geometry = new THREE.ExtrudeGeometry(shape, { depth: .025, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .025, bevelThickness: .012, curveSegments: 20 });
      geometry.translate(0, 0, -.0125);
      wing.add(new THREE.Mesh(geometry, [mat, edge]));
    }
    for (const face of [-1, 1]) {
      const z = face * .045;
      for (const [x, y] of [[.88, .64], [.95, .40], [.78, .16], [.67, -.40], [.43, -.56]]) {
        ellipsoid(wing, gold, [x, y, z], [.075, .095, .012]);
      }
      for (const [x, y] of [[.98, .78], [1.04, .3], [.75, -.56]]) {
        line(wing, [new THREE.Vector3(.09, .1, z), new THREE.Vector3(x * .5, y * .65, z), new THREE.Vector3(x, y, z)], edge, .012);
      }
    }
    return { hinge, side };
  });
  function pose(seconds: number, reduced: boolean) {
    const flap = reduced ? .3 : .2 + (Math.sin(seconds * 14) + 1) * .52;
    for (const { hinge, side } of hinges) hinge.rotation.y = side * flap;
    root.rotation.set(-.18, reduced ? .15 : Math.sin(seconds * .9) * .3, reduced ? -.12 : Math.sin(seconds * 1.3) * .2);
  }
  pose(0, true);
  return { root, pose };
}
