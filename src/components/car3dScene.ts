import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

/** A real mesh model, facing +X. Wheels and sprung body animate independently. */
function buildCar() {
  const car = new THREE.Group();
  const body = new THREE.Group();
  car.add(body);
  const paint = new THREE.MeshPhysicalMaterial({ color: "#e65332", roughness: 0.25, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.16 });
  const cream = new THREE.MeshStandardMaterial({ color: "#fff3d2", roughness: 0.35 });
  const glass = new THREE.MeshPhysicalMaterial({ color: "#214f60", roughness: 0.12, metalness: 0.35, clearcoat: 1 });
  const rubber = new THREE.MeshStandardMaterial({ color: "#202a2c", roughness: 0.85 });
  const chrome = new THREE.MeshStandardMaterial({ color: "#d4e1df", metalness: 0.8, roughness: 0.22 });
  const dark = new THREE.MeshStandardMaterial({ color: "#263b3e", roughness: 0.45 });
  const headlight = new THREE.MeshStandardMaterial({ color: "#fff4c5", emissive: "#ffd98c", emissiveIntensity: 0.7 });
  const taillight = new THREE.MeshStandardMaterial({ color: "#b92a24", emissive: "#ff3020", emissiveIntensity: 0.35 });

  function box(parent: THREE.Group, size: number[], position: number[], material: THREE.Material, radius = 0.06) {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(size[0], size[1], size[2], 3, radius), material);
    mesh.position.set(position[0], position[1], position[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // Rounded little rally coupe: sculpted hood, glazed cabin, cream roof.
  box(body, [3.55, 0.65, 1.58], [0, 0.77, 0], paint, 0.22);
  box(body, [3.2, 0.18, 1.48], [0, 0.43, 0], dark);
  box(body, [1.15, 0.25, 1.5], [1.05, 1.03, 0], paint, 0.1);
  const cabin = box(body, [1.72, 0.83, 1.32], [-0.28, 1.35, 0], glass, 0.23);
  cabin.rotation.z = -0.05;
  box(body, [1.56, 0.15, 1.36], [-0.35, 1.79, 0], cream, 0.07);
  for (const side of [-1, 1]) {
    const pillar = box(body, [0.12, 0.69, 0.08], [-0.42, 1.39, side * 0.655], paint, 0.025);
    pillar.rotation.z = -0.05;
    box(body, [0.25, 0.07, 0.06], [-0.39, 0.99, side * 0.793], chrome, 0.025);
    box(body, [0.28, 0.17, 0.21], [0.5, 1.22, side * 0.78], paint, 0.065);
    box(body, [0.09, 0.23, 0.36], [1.77, 0.85, side * 0.49], headlight, 0.035);
    box(body, [0.08, 0.18, 0.32], [-1.78, 0.88, side * 0.52], taillight, 0.025);
    // Ivory racing stripes continue over the hood and roof.
    box(body, [1.1, 0.015, 0.14], [1.06, 1.158, side * 0.22], cream, 0.005);
    box(body, [1.42, 0.015, 0.14], [-0.35, 1.871, side * 0.22], paint, 0.005);
  }
  box(body, [0.12, 0.17, 1.56], [1.8, 0.56, 0], chrome);
  box(body, [0.12, 0.17, 1.56], [-1.8, 0.56, 0], chrome);
  box(body, [0.08, 0.23, 0.52], [1.803, 0.82, 0], dark, 0.025);
  for (const z of [-0.16, 0, 0.16]) box(body, [0.02, 0.16, 0.025], [1.85, 0.82, z], chrome, 0.008);

  const wheels: THREE.Group[] = [];
  const steering: THREE.Group[] = [];
  const tireGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32);
  tireGeometry.rotateX(Math.PI / 2);
  const hubGeometry = new THREE.CylinderGeometry(0.245, 0.245, 0.315, 24);
  hubGeometry.rotateX(Math.PI / 2);
  for (const x of [-1.1, 1.1]) {
    for (const side of [-1, 1]) {
      const axle = new THREE.Group();
      axle.position.set(x, 0.41, side * 0.8);
      car.add(axle);
      if (x > 0) steering.push(axle);
      const wheel = new THREE.Group();
      axle.add(wheel);
      wheels.push(wheel);
      const tire = new THREE.Mesh(tireGeometry, rubber);
      tire.castShadow = true;
      wheel.add(tire, new THREE.Mesh(hubGeometry, dark));
      for (let spoke = 0; spoke < 5; spoke++) {
        const angle = spoke * Math.PI * 2 / 5;
        const rim = box(wheel, [0.075, 0.36, 0.035], [0, 0, side * 0.169], chrome, 0.018);
        rim.rotation.z = angle;
      }
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 8), cream);
      cap.position.z = side * 0.19;
      cap.scale.z = 0.45;
      wheel.add(cap);
    }
  }
  return { car, body, wheels, steering };
}

export function mountCarScene(host: HTMLDivElement, onReady: () => void, onUnavailable: () => void): () => void {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  } catch {
    return () => {};
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.domElement.className = "play-car__canvas";
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 40);
  camera.position.set(5.2, 3.4, 8.6);
  camera.lookAt(0, 0.85, 0);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight("#e4f5ff", "#8c7750", 2));
  const sun = new THREE.DirectionalLight("#fff0d7", 3);
  sun.position.set(-3, 7, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(512, 512);
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 18 });
  sun.shadow.normalBias = 0.025;
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun);
  const { car, body, wheels, steering } = buildCar();
  scene.add(car);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), new THREE.ShadowMaterial({ color: "#304437", opacity: 0.2 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  let inView = false;
  let lost = false;
  let frame = 0;
  let previousTime = 0;
  let wheelAngle = 0;
  let ready = false;

  function render(now: number) {
    frame = 0;
    if (lost || !inView || document.hidden) return;
    const dt = previousTime ? Math.min((now - previousTime) / 1000, 0.05) : 0;
    previousTime = now;
    // Read the CSS timeline so lazy loading / background tabs never desync
    // the car's drift from its travel, or its entrance from the ball's exit.
    const animation = host.getAnimations()[0];
    const seconds = Math.max(0, (Number(animation?.currentTime ?? 0) / 1000) - 0.5);
    const phase = (seconds % 16) / 16;
    const drift = Math.sin(Math.PI * THREE.MathUtils.clamp((phase - 0.61) / 0.12, 0, 1));
    const acceleration = THREE.MathUtils.smoothstep(phase, 0.74, 0.82);
    const moving = !reduce.matches && phase > 0.52 && phase < 0.9;
    car.rotation.y = reduce.matches ? -0.14 : -0.12 - drift * 0.65;
    body.position.y = moving ? Math.sin(seconds * 25) * 0.019 : 0;
    body.rotation.x = reduce.matches ? 0 : drift * 0.07;
    body.rotation.z = moving ? -drift * 0.045 + acceleration * 0.055 : 0;
    if (moving) wheelAngle -= dt * (9 + acceleration * 24);
    for (const wheel of wheels) wheel.rotation.z = wheelAngle;
    for (const axle of steering) axle.rotation.y = reduce.matches ? 0 : drift * 0.35;
    // No GPU work while the car waits offscreen during the ball's turn.
    if (reduce.matches || (phase >= 0.52 && phase <= 0.92) || !ready) {
      renderer.render(scene, camera);
      if (!ready) { ready = true; onReady(); }
    }
    if (!reduce.matches) frame = requestAnimationFrame(render);
  }
  function resume() {
    cancelAnimationFrame(frame);
    previousTime = 0;
    frame = requestAnimationFrame(render);
  }
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    resume();
  }
  // Observe the stationary strip, not the car that spends half a loop outside it.
  const visibility = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    resume();
  });
  visibility.observe(host.parentElement!);
  const size = new ResizeObserver(resize);
  size.observe(host);
  const contextLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(frame);
    renderer.domElement.style.visibility = "hidden";
    onUnavailable();
  };
  const contextRestored = () => {
    lost = false;
    ready = false;
    renderer.domElement.style.visibility = "";
    resume();
  };
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  renderer.domElement.addEventListener("webglcontextrestored", contextRestored);
  document.addEventListener("visibilitychange", resume);
  reduce.addEventListener("change", resume);
  resize();

  return () => {
    cancelAnimationFrame(frame);
    visibility.disconnect();
    size.disconnect();
    document.removeEventListener("visibilitychange", resume);
    reduce.removeEventListener("change", resume);
    renderer.domElement.removeEventListener("webglcontextlost", contextLost);
    renderer.domElement.removeEventListener("webglcontextrestored", contextRestored);
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
      }
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    environment.dispose();
    sun.shadow.map?.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
}
