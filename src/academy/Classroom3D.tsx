// Full-screen 3D classroom: the teacher stands next to a holographic board that writes out
// the explanation while the teacher speaks it. Good for projecting on the class board.
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { voiceEnergy } from './ai';
import { createCoach, pointer, qualityGuard } from './three/coach';
import type { Coach } from './three/coach';
import { hologram } from './three/labels';

export default function Classroom3D({ title, text, pose, children }: { title: string; text: string; pose: string; children?: React.ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const state = useRef({ title, text, pose, typed: 0, changed: 0 });
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const s = state.current;
    if (s.text !== text) { s.typed = 0; s.changed = performance.now(); }
    Object.assign(s, { title, text, pose });
  }, [title, text, pose]);

  useEffect(() => {
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
    catch { setFailed(true); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    el.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0820);
    scene.fog = new THREE.Fog(0x0b0820, 6, 16);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
    scene.environment = environment; scene.environmentIntensity = .4;
    const camera = new THREE.PerspectiveCamera(38, 1, .05, 50);

    scene.add(new THREE.HemisphereLight(0xb9a6ff, 0x101a2a, 1));
    const key = new THREE.SpotLight(0xffe2c0, 30, 12, .55, .6); key.position.set(-1, 4.5, 3); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); scene.add(key, key.target);
    const rim = new THREE.DirectionalLight(0x62f0ff, 3); rim.position.set(-3, 3, -3); scene.add(rim);
    const boardLight = new THREE.PointLight(0x5ff2dc, 6, 5); scene.add(boardLight);

    const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshStandardMaterial({ color: 0x14102a, roughness: .25, metalness: .6 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    const grid = new THREE.GridHelper(18, 36, 0x5ff2dc, 0x3b2a7a); (grid.material as THREE.Material).transparent = true; (grid.material as THREE.Material).opacity = .35; grid.position.y = .002; scene.add(grid);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.45, .52, 64), new THREE.MeshBasicMaterial({ color: 0x5ff2dc, side: THREE.DoubleSide, toneMapped: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = .01; scene.add(ring);
    const placeRing = () => { if (coach) ring.position.set(coach.root.position.x, .01, coach.root.position.z); };

    const board = hologram(2.6, 1.6); scene.add(board.mesh);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.7, .04, .04), new THREE.MeshBasicMaterial({ color: 0x9ffff0, toneMapped: false }));
    scene.add(frame);
    const dust = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(Array.from({ length: 600 }, () => (Math.random() - .5) * 10), 3)),
      new THREE.PointsMaterial({ color: 0x9ffff0, size: .02, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false }));
    dust.position.y = 2; scene.add(dust);

    let coach: Coach | undefined, inactive = false;
    createCoach().then(c => { if (inactive) { c.dispose(); return; } coach = c; scene.add(c.root); layout(); c.wave(2.4); }).catch(() => {});

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .4, .45, .88);
    composer.addPass(bloom); composer.addPass(new OutputPass());
    let useBloom = true;
    const guard = qualityGuard(() => { useBloom = false; renderer.setPixelRatio(1); });

    let portrait = false;
    const layout = () => {
      const w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight);
      renderer.setSize(w, h); composer.setSize(w, h); camera.aspect = w / h;
      portrait = w / h < 1;
      if (portrait) {
        // Phones: board above the teacher.
        board.mesh.position.set(0, 2.55, -.6); board.mesh.rotation.set(0, 0, 0); board.mesh.scale.setScalar(.82);
        frame.position.set(0, 1.86, -.58); frame.rotation.set(0, 0, 0); frame.scale.setScalar(.82);
        camera.fov = 58; camera.position.set(0, 1.75, 4.1);
        coach?.root.position.set(0, 0, .3);
      } else {
        board.mesh.position.set(1.15, 1.78, -.3); board.mesh.rotation.set(0, -.3, 0); board.mesh.scale.setScalar(1);
        frame.position.set(1.15, .95, -.3); frame.rotation.set(0, -.3, 0); frame.scale.setScalar(1);
        camera.fov = 38; camera.position.set(.1, 1.3, 4.4);
        coach?.root.position.set(-1.05, 0, .4);
      }
      boardLight.position.copy(board.mesh.position).add(new THREE.Vector3(0, 0, .6));
      placeRing();
      camera.updateProjectionMatrix();
    };
    const sizes = new ResizeObserver(layout); sizes.observe(el); layout();

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let last = performance.now(), drawn = '', lastDraw = 0;
    const look = new THREE.Vector2();
    renderer.setAnimationLoop(now => {
      const dt = Math.min(.06, (now - last) / 1000); last = now;
      if (document.hidden) return;
      guard(dt);
      const t = now / 1000, s = state.current, energy = voiceEnergy();
      // Type the explanation onto the board.
      s.typed = Math.min(s.text.length, s.typed + dt * (reduced ? 9999 : 55));
      const visible = s.text.slice(0, Math.floor(s.typed));
      if ((visible !== drawn || now - lastDraw > 120) && now - lastDraw > 40) {
        board.draw(s.title || 'Shaharcha Ustoz', visible + (s.typed < s.text.length && Math.floor(t * 3) % 2 ? '▍' : ''), t);
        drawn = visible; lastDraw = now;
      }
      const writing = s.typed < s.text.length;
      ring.scale.setScalar(1 + energy * .4 + Math.sin(t * 2) * .03);
      dust.rotation.y = t * .03;
      camera.lookAt(portrait ? 0 : .15, portrait ? 1.7 : 1.2, 0);
      if (coach) {
        look.set(portrait ? 0 : THREE.MathUtils.clamp(pointer.x * .8 + .2, -1, 1), THREE.MathUtils.clamp(pointer.y * .6, -1, 1));
        if (!portrait && (writing || energy > .02) && Math.sin(t * .6) > -.2) look.x = .9; // glance at the board
        coach.update(reduced ? 0 : dt, t, { pose: s.pose, energy, look, present: !portrait && (writing || energy > .02) ? 1 : 0 });
      }
      if (useBloom) composer.render(); else renderer.render(scene, camera);
    });
    return () => {
      inactive = true; renderer.setAnimationLoop(null); sizes.disconnect();
      coach?.dispose(); board.dispose(); composer.dispose(); environment.dispose(); pmrem.dispose();
      scene.traverse(n => { if (n instanceof THREE.Mesh || n instanceof THREE.Points) { n.geometry.dispose(); (Array.isArray(n.material) ? n.material : [n.material]).forEach(m => m.dispose()); } });
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, []);

  return <div className={`classroom3d ${failed ? 'classroom-failed' : ''}`} ref={host}>{children}</div>;
}
