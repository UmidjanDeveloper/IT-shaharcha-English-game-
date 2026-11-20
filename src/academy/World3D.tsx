// Home page: a cinematic studio. The teacher stands in a spotlight on a girih-pattern floor in front of
// a curved light wall; the club's sections float around her as glass panels you can click.
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { voiceEnergy } from './ai';
import { createCoach, pointer, qualityGuard, preloadTeacher } from './three/coach';
import type { Coach } from './three/coach';
import { dust, glassPanel, lightCone, lightWall, studioFloor } from './three/studio';

export type WorldSection = 'grammar' | 'ielts' | 'speaking' | 'games' | 'teacher';

const sections: { id: WorldSection; title: string; detail: string; tag: string; accent: string; at: [number, number, number]; turn: number }[] = [
  { id: 'ielts', title: 'IELTS', detail: 'Speaking imtihoni · band ball', tag: '3D examiner', accent: '#7cf6e4', at: [1.05, 1.82, -.9], turn: -.18 },
  { id: 'grammar', title: 'Grammatika', detail: 'A1 → C1 · 30 mavzu', tag: 'Kurs', accent: '#ffd27a', at: [2.25, 1.72, -.55], turn: -.42 },
  { id: 'speaking', title: 'Speaking', detail: 'Mikrofon bilan mashq', tag: 'Studiya', accent: '#ff9bc0', at: [1.1, 1.08, -.75], turn: -.2 },
  { id: 'games', title: 'O‘yinlar', detail: '75+ interaktiv o‘yin', tag: 'Sinf bilan', accent: '#b6a6ff', at: [2.3, .98, -.4], turn: -.45 },
];

export default function World3D({ onSelect, children }: { onSelect: (section: WorldSection) => void; children?: React.ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const select = useRef(onSelect);
  const [failed, setFailed] = useState(false);
  const [hover, setHover] = useState<WorldSection | null>(null);
  const [ready, setReady] = useState(false);
  const [phone, setPhone] = useState(false);
  useEffect(() => { select.current = onSelect; }, [onSelect]);

  useEffect(() => {
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
    catch { setFailed(true); return; }
    preloadTeacher().catch(() => {});
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    el.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b18);
    scene.fog = new THREE.Fog(0x0a1226, 8, 20);
    // Soft reflections so the suit and face read well under the stage lights.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const studioEnv = pmrem.fromScene(new RoomEnvironment(), .04).texture;
    scene.environment = studioEnv; scene.environmentIntensity = .45;
    const camera = new THREE.PerspectiveCamera(32, 1, .05, 60);
    const target = new THREE.Vector3(.55, 1.12, 0);

    scene.add(new THREE.HemisphereLight(0xc9d4ff, 0x1a2440, 1.1));
    const key = new THREE.SpotLight(0xfff1de, 9, 12, .42, .55, 1.4);
    key.position.set(.6, 5.2, 2.2); key.target.position.set(0, .9, 0); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0004; key.shadow.radius = 4;
    scene.add(key, key.target);
    const fill = new THREE.DirectionalLight(0x9ad7ff, .5); fill.position.set(-3, 2.5, 4); scene.add(fill);
    const rimL = new THREE.SpotLight(0x5ff2dc, 7, 9, .5, .7); rimL.position.set(-2.5, 3, -2.5); rimL.target.position.set(0, 1.2, 0); scene.add(rimL, rimL.target);
    const rimR = new THREE.SpotLight(0xa58bff, 6, 9, .5, .7); rimR.position.set(2.6, 2.8, -2.4); rimR.target.position.set(0, 1.2, 0); scene.add(rimR, rimR.target);

    scene.add(studioFloor(9.2, 11));
    const { wall, material: wallMaterial } = lightWall();
    scene.add(wall);
    const cone = lightCone(.9, 5.4); cone.position.x = .1; (cone.material as THREE.ShaderMaterial).uniforms.strength.value = .055; scene.add(cone);
    const stage = new THREE.Mesh(new THREE.CylinderGeometry(.62, .66, .04, 64), new THREE.MeshStandardMaterial({ color: 0x0e1730, metalness: .7, roughness: .25 }));
    stage.position.y = .02; stage.receiveShadow = true; scene.add(stage);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.64, .008, 8, 128), new THREE.MeshBasicMaterial({ color: 0x8ff8ea, toneMapped: false }));
    ring.rotation.x = Math.PI / 2; ring.position.y = .042; scene.add(ring);
    const motes = dust(); scene.add(motes.points);

    const panels = sections.map(s => {
      const p = glassPanel(s.title, s.detail, s.tag, s.accent, 1.1, .6);
      p.group.position.set(...s.at); p.group.rotation.y = s.turn;
      p.group.userData = { id: s.id, home: p.group.position.clone(), turn: s.turn, hover: 0 };
      scene.add(p.group);
      return p;
    });

    let coach: Coach | undefined, inactive = false;
    createCoach().then(c => {
      if (inactive) { c.dispose(); return; }
      coach = c; c.root.position.set(0, .04, 0); scene.add(c.root); setReady(true);
      setTimeout(() => { c.wave(2.6); }, 1200);
    }).catch(() => setFailed(true));

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .32, .55, .96);
    composer.addPass(bloom); composer.addPass(new OutputPass());
    let useBloom = true;
    const guard = qualityGuard(() => { useBloom = false; renderer.setPixelRatio(1); renderer.shadowMap.enabled = false; resize(); });

    let narrow = false;
    const resize = () => {
      const w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight);
      renderer.setSize(w, h); composer.setSize(w, h);
      camera.aspect = w / h; narrow = w / h < .8; setPhone(narrow);
      camera.fov = narrow ? 40 : 30;
      if (w / h > 1.25) camera.setViewOffset(w, h, -w * .08, 0, w, h);
      else if (narrow) camera.setViewOffset(w, h, 0, h * .2, w, h);
      else camera.clearViewOffset();
      // Phones: the teacher alone, larger; sections are in the buttons below.
      panels.forEach(p => { p.group.visible = !narrow; });
      target.x = narrow ? 0 : .55;
      camera.updateProjectionMatrix();
    };
    const sizes = new ResizeObserver(resize); sizes.observe(el); resize();
    let visible = true;
    const seen = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); seen.observe(el);

    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    const teacherHit = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, 1.6, 12), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
    teacherHit.position.y = .8; scene.add(teacherHit);
    let hovered: WorldSection | null = null, flying: { to: THREE.Vector3; look: THREE.Vector3; start: number; id: WorldSection } | null = null;
    const pick = (e: PointerEvent): WorldSection | null => {
      const box = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - box.left) / box.width) * 2 - 1, -((e.clientY - box.top) / box.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hits = ray.intersectObjects([...panels.filter(p => p.group.visible).map(p => p.mesh), teacherHit], false);
      if (!hits.length) return null;
      return hits[0].object === teacherHit ? 'teacher' : hits[0].object.parent!.userData.id;
    };
    const move = (e: PointerEvent) => {
      const id = pick(e);
      if (id === hovered) return;
      hovered = id; setHover(id);
      renderer.domElement.style.cursor = id ? 'pointer' : '';
      if (id === 'teacher') coach?.wave(1.8);
      else if (id) coach?.smile(1.2);
    };
    const click = (e: PointerEvent) => {
      const id = pick(e);
      if (!id || flying) return;
      if (id === 'teacher') { coach?.wave(1.6); select.current('teacher'); return; }
      const panel = panels.find(p => p.group.userData.id === id)!;
      const home = panel.group.userData.home as THREE.Vector3;
      const normal = new THREE.Vector3(Math.sin(panel.group.rotation.y), 0, Math.cos(panel.group.rotation.y));
      flying = { to: home.clone().addScaledVector(normal, 1.9), look: home.clone(), start: performance.now(), id };
    };
    renderer.domElement.addEventListener('pointermove', move);
    renderer.domElement.addEventListener('pointerdown', click);

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();
    const intro = new THREE.Vector3(.4, 2.4, 9.5), base = new THREE.Vector3(.35, 1.38, 5.4);
    const look = new THREE.Vector2(), lookAt = new THREE.Vector3(), headWorld = new THREE.Vector3(), projected = new THREE.Vector3();
    let last = start;
    renderer.setAnimationLoop(now => {
      const dt = Math.min(.06, (now - last) / 1000); last = now;
      if (!visible || document.hidden) return;
      guard(dt);
      const t = (now - start) / 1000, energy = voiceEnergy();

      if (flying) {
        const k = Math.min(1, (now - flying.start) / 800), e = k * k * (3 - 2 * k);
        camera.position.lerp(flying.to, e * .22); lookAt.lerp(flying.look, e * .22); camera.lookAt(lookAt);
        if (k >= 1) { const id = flying.id; flying = null; select.current(id); camera.position.copy(base); lookAt.copy(target); }
      } else {
        const k = reduced ? 1 : Math.min(1, t / 3.2), e = 1 - Math.pow(1 - k, 3);
        camera.position.lerpVectors(intro, base, e);
        if (!reduced) { camera.position.x += (Math.sin(t * .11) * .25 + pointer.x * .45) * e; camera.position.y += pointer.y * .18 * e; }
        if (narrow) { camera.position.x -= .35; camera.position.z -= .9; camera.position.y += .05; }
        lookAt.copy(target); camera.lookAt(lookAt);
      }

      wallMaterial.uniforms.time.value = t; wallMaterial.uniforms.energy.value = energy;
      ring.scale.setScalar(1 + energy * .12 + Math.sin(t * 1.8) * .01);
      motes.update(t);
      panels.forEach((p, i) => {
        const d = p.group.userData, on = hovered === d.id;
        d.hover += ((on ? 1 : 0) - d.hover) * Math.min(1, dt * 8);
        p.group.position.set(d.home.x, d.home.y + Math.sin(t * .9 + i * 1.7) * .035, d.home.z + d.hover * .25);
        p.group.rotation.y = d.turn * (1 - d.hover * .5) + pointer.x * .05;
        p.group.rotation.x = -pointer.y * .05;
        (p.glow.material as THREE.MeshBasicMaterial).opacity = d.hover * .16;
        if (Math.abs(d.hover - (d.drawn ?? -1)) > .2 || (d.hover < .02 && d.drawn !== 0) || (d.hover > .98 && d.drawn !== 1)) {
          d.drawn = d.hover < .02 ? 0 : d.hover > .98 ? 1 : d.hover; p.draw(d.drawn);
        }
      });
      if (coach) {
        // Eyes and head follow the visitor: project the head to the screen and compare with the pointer.
        coach.head.getWorldPosition(headWorld);
        projected.copy(headWorld).project(camera);
        look.set(THREE.MathUtils.clamp((pointer.x - projected.x) * .9, -1, 1), THREE.MathUtils.clamp((pointer.y - projected.y) * .9, -1, 1));
        const pose = hovered === 'teacher' ? 'attentive' : 'idle';
        coach.update(reduced ? 0 : dt, t, { pose, energy, look, present: hovered && hovered !== 'teacher' ? .55 : 0 });
      }
      if (useBloom) composer.render(); else renderer.render(scene, camera);
    });

    return () => {
      inactive = true; renderer.setAnimationLoop(null); sizes.disconnect(); seen.disconnect();
      renderer.domElement.removeEventListener('pointermove', move);
      renderer.domElement.removeEventListener('pointerdown', click);
      coach?.dispose();
      scene.traverse(n => {
        if (n instanceof THREE.Mesh || n instanceof THREE.Points) {
          n.geometry?.dispose();
          (Array.isArray(n.material) ? n.material : [n.material]).forEach(m => { (m as THREE.MeshBasicMaterial).map?.dispose(); m.dispose(); });
        }
      });
      composer.dispose(); studioEnv.dispose(); pmrem.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, []);

  const hints: Record<WorldSection, string> = { grammar: 'Grammatika kursi · A1 → C1', ielts: 'IELTS markazi · 3D examiner bilan imtihon', speaking: 'Speaking studiyasi', games: '75+ interaktiv o‘yin', teacher: 'Ustoz bilan suhbatlashish' };
  return <section className={`world3d ${failed ? 'world-failed' : ''} ${ready ? 'world-ready' : ''}`} ref={host}>
    {children}
    <p className="world-hint" aria-live="polite">{hover ? hints[hover] : ready ? (phone ? 'Ustozni bosing va savol bering' : 'Panellarni yoki ustozni bosing') : 'Ustoz yuklanmoqda…'}</p>
  </section>;
}
