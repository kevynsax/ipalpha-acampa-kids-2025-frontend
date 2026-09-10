import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildBallerina, buildButterfly } from "./garden3dModels";

/** Both characters share one context, lighting rig and animation loop. */
export function mountGardenScene(host: HTMLDivElement, onReady: () => void, onUnavailable: () => void): () => void {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  } catch {
    return () => {};
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = "play-garden__canvas";
  // Do not hide the image fallbacks until a complete frame has rendered.
  renderer.domElement.style.visibility = "hidden";
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-5, 5, 2.3, -2.3, .1, 40);
  camera.position.set(0, 1.5, 12);
  camera.lookAt(0, 0, 0);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight("#fff0f7", "#839880", 2.5));
  const sun = new THREE.DirectionalLight("#fff0d9", 3);
  sun.position.set(-3, 7, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(512, 512);
  Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 4, bottom: -4, near: .5, far: 20 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.normalBias = .035;
  scene.add(sun, sun.target);
  const ballerina = buildBallerina();
  const butterfly = buildButterfly();
  butterfly.root.scale.setScalar(.43);
  scene.add(ballerina.root, butterfly.root);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), new THREE.ShadowMaterial({ color: "#5c4052", opacity: .16 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -2.1;
  ground.receiveShadow = true;
  scene.add(ground);

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let inView = false;
  let lost = false;
  let frame = 0;
  let previous = 0;
  let elapsed = 0;
  let halfWidth = 5;
  let ready = false;

  function render(now: number) {
    frame = 0;
    if (!inView || document.hidden || lost) return;
    if (previous && !reducedMotion.matches) elapsed += Math.min((now - previous) / 1000, .05);
    previous = now;
    const reduced = reducedMotion.matches;
    ballerina.pose(elapsed, reduced);
    butterfly.pose(elapsed, reduced);
    // A closed, smooth figure-eight flight: no teleport at the loop boundary.
    const phase = (elapsed % 12) / 12 * Math.PI * 2;
    const left = Math.min(ballerina.root.position.x + 1.5, halfWidth - .8);
    const right = halfWidth - .65;
    butterfly.root.position.set(
      reduced ? (left + right) / 2 : left + (right - left) * (.5 - .5 * Math.cos(phase)),
      reduced ? .9 : .85 + Math.sin(phase * 2) * .43,
      reduced ? .3 : .3 + Math.sin(phase) * .65,
    );
    renderer.render(scene, camera);
    if (!ready) {
      ready = true;
      renderer.domElement.style.visibility = "";
      onReady();
    }
    if (!reduced) frame = requestAnimationFrame(render);
  }
  function resume() {
    cancelAnimationFrame(frame);
    previous = 0;
    frame = requestAnimationFrame(render);
  }
  function resize() {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    halfWidth = 2.3 * width / height;
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.updateProjectionMatrix();
    const x = -halfWidth + Math.max(1.05, halfWidth * .20);
    ballerina.root.position.set(x, -2.1, 0);
    ground.position.x = x;
    sun.position.set(x - 3, 7, 5);
    sun.target.position.set(x, 0, 0);
    resume();
  }
  const visibility = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    resume();
  });
  visibility.observe(host);
  const size = new ResizeObserver(resize);
  size.observe(host);
  const contextLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    ready = false;
    cancelAnimationFrame(frame);
    renderer.domElement.style.visibility = "hidden";
    onUnavailable();
  };
  const contextRestored = () => { lost = false; resume(); };
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  renderer.domElement.addEventListener("webglcontextrestored", contextRestored);
  document.addEventListener("visibilitychange", resume);
  reducedMotion.addEventListener("change", resume);
  resize();

  return () => {
    cancelAnimationFrame(frame);
    visibility.disconnect();
    size.disconnect();
    document.removeEventListener("visibilitychange", resume);
    reducedMotion.removeEventListener("change", resume);
    renderer.domElement.removeEventListener("webglcontextlost", contextLost);
    renderer.domElement.removeEventListener("webglcontextrestored", contextRestored);
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      geometries.add(object.geometry);
      for (const mat of Array.isArray(object.material) ? object.material : [object.material]) materials.add(mat);
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(mat => mat.dispose());
    environment.dispose();
    sun.shadow.map?.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
}
