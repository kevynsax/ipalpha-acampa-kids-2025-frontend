import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildBallerina, buildButterfly } from "./garden3dModels";
import { buildUnicorn } from "./unicorn3dModel";

/** One context and animation loop; separate lighting passes preserve each shadow style. */
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
  const unicornScene = new THREE.Scene();
  renderer.autoClear = false;
  const camera = new THREE.OrthographicCamera(-5, 5, 2.3, -2.3, .1, 40);
  camera.position.set(0, 1.5, 12);
  camera.lookAt(0, 0, 0);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  unicornScene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();
  // Preserve the dancer's original warm lighting and soft ground shadow.
  scene.add(new THREE.HemisphereLight("#fff0f7", "#839880", 2.5));
  const sun = new THREE.DirectionalLight("#fff0d9", 3);
  sun.position.set(-3, 7, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(512, 512);
  Object.assign(sun.shadow.camera, { top: 4, bottom: -4, near: .5, far: 20 });
  sun.shadow.normalBias = .035;
  scene.add(sun, sun.target);
  const ballerina = buildBallerina();
  const butterfly = buildButterfly();
  butterfly.root.scale.setScalar(.43);
  const unicorn = buildUnicorn();
  // Trots along a lane just behind the dancer, so crossing her never clips.
  unicorn.root.scale.setScalar(.95);
  unicorn.root.position.set(0, -2.1, -1.2);
  scene.add(ballerina.root, butterfly.root);
  unicornScene.add(unicorn.root);
  // The unicorn keeps its stronger self-shading without changing the dancer.
  unicornScene.add(new THREE.HemisphereLight("#fff0f7", "#77758c", 1.35));
  const unicornSun = new THREE.DirectionalLight("#fff0d9", 2.8);
  unicornSun.position.set(-3, 7, 5);
  unicornSun.castShadow = true;
  unicornSun.shadow.mapSize.set(1024, 1024);
  Object.assign(unicornSun.shadow.camera, { top: 4, bottom: -4, near: .5, far: 20 });
  unicornSun.shadow.normalBias = .012;
  unicornSun.shadow.bias = -.00015;
  unicornScene.add(unicornSun, unicornSun.target);
  // Transparent catchers must not write depth across the other lighting pass.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 8), new THREE.ShadowMaterial({ color: "#5c4052", opacity: .16, depthWrite: false }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -2.1;
  ground.receiveShadow = true;
  scene.add(ground);
  const unicornGround = new THREE.Mesh(ground.geometry, new THREE.ShadowMaterial({ color: "#51435f", opacity: .32, depthWrite: false }));
  unicornGround.rotation.copy(ground.rotation);
  unicornGround.position.copy(ground.position);
  unicornGround.receiveShadow = true;
  unicornScene.add(unicornGround);

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
    unicorn.pose(elapsed, reduced, halfWidth);
    // A closed, smooth figure-eight flight: no teleport at the loop boundary.
    const phase = (elapsed % 12) / 12 * Math.PI * 2;
    const left = Math.min(ballerina.root.position.x + 1.5, halfWidth - .8);
    const right = halfWidth - .65;
    butterfly.root.position.set(
      reduced ? (left + right) / 2 : left + (right - left) * (.5 - .5 * Math.cos(phase)),
      reduced ? .9 : .85 + Math.sin(phase * 2) * .43,
      reduced ? .3 : .3 + Math.sin(phase) * .65,
    );
    renderer.clear();
    // Render the rear lane first, retaining depth for correct character overlap.
    if (unicorn.root.visible) {
      renderer.toneMappingExposure = 1;
      renderer.render(unicornScene, camera);
    }
    renderer.toneMappingExposure = 1.15;
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
    // Anchor the light to the dancer as before, but cover both stage edges
    // relative to that offset so the butterfly's shadow is not clipped.
    ground.scale.x = halfWidth * 2 + 4;
    unicornGround.scale.x = ground.scale.x;
    unicornSun.shadow.camera.left = -halfWidth - 2;
    unicornSun.shadow.camera.right = halfWidth + 2;
    unicornSun.shadow.camera.far = 20 + halfWidth;
    unicornSun.shadow.camera.updateProjectionMatrix();
    sun.position.set(x - 3, 7, 5);
    sun.target.position.set(x, 0, 0);
    sun.shadow.camera.left = -halfWidth - x - 2;
    sun.shadow.camera.right = halfWidth - x + 2;
    sun.shadow.camera.far = 20 + halfWidth;
    sun.shadow.camera.updateProjectionMatrix();
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
    for (const stage of [scene, unicornScene]) stage.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      geometries.add(object.geometry);
      for (const mat of Array.isArray(object.material) ? object.material : [object.material]) materials.add(mat);
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(mat => mat.dispose());
    environment.dispose();
    sun.shadow.map?.dispose();
    unicornSun.shadow.map?.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
}
