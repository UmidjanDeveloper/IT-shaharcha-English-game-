import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { voiceEnergy } from './ai';
import { createCoach, pointer } from './three/coach';
import type { Coach } from './three/coach';

// Compact 3D teacher used inside cards (IELTS examiner, Speaking Studio, AI teacher panel).
export default function Mentor({ pose, energy = voiceEnergy, wave = true }: { pose: string; energy?: () => number; wave?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const current = useRef(pose);
  const loudness = useRef(energy);
  const [failed, setFailed] = useState(false);
  useEffect(() => { current.current = pose; }, [pose]);
  useEffect(() => { loudness.current = energy; }, [energy]);
  useEffect(() => {
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
    catch { setFailed(true); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
    scene.environment = environment;
    scene.environmentIntensity = .55;
    const camera = new THREE.PerspectiveCamera(30, 1, .01, 30);
    scene.add(new THREE.HemisphereLight(0xffeed5, 0x3a4f7a, 1.2));
    const key = new THREE.DirectionalLight(0xffe0ba, 2.6); key.position.set(2, 3, 4); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); scene.add(key);
    const rim = new THREE.DirectionalLight(0x6ff5ff, 3.5); rim.position.set(-2.5, 2.2, -2.5); scene.add(rim);
    const rim2 = new THREE.DirectionalLight(0xb48cff, 2.2); rim2.position.set(2.5, 1.5, -2); scene.add(rim2);
    // Glowing platform ring under the teacher.
    const ring = new THREE.Mesh(new THREE.RingGeometry(.28, .34, 64), new THREE.MeshBasicMaterial({ color: 0x5ff2dc, transparent: true, opacity: .75, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = .005; scene.add(ring);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(.5, 48), new THREE.ShadowMaterial({ opacity: .25 }));
    disc.rotation.x = -Math.PI / 2; disc.receiveShadow = true; scene.add(disc);

    let inactive = false, coach: Coach | undefined, visible = true;
    const resize = () => {
      const w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight);
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize); observer.observe(el); resize();
    const seen = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }); seen.observe(el);
    createCoach().then(c => {
      if (inactive) { c.dispose(); return; }
      coach = c; scene.add(c.root);
      const h = c.height;
      // Waist-up portrait, like a video call with the teacher.
      camera.position.set(0, h * .8, h * 1.35);
      camera.lookAt(0, h * .74, 0);
      if (wave) c.wave(2.4);
    }).catch(() => { if (!inactive) setFailed(true); });

    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const look = new THREE.Vector2(), hips = new THREE.Vector3();
    let follow = 0;
    let last = performance.now();
    renderer.setAnimationLoop(now => {
      const dt = Math.min(.08, Math.max(0, now - last) / 1000); last = now;
      if (!visible || document.hidden) return;
      const level = loudness.current();
      ring.scale.setScalar(1 + level * .35 + Math.sin(now / 600) * .03);
      (ring.material as THREE.MeshBasicMaterial).opacity = .55 + level * .45;
      if (coach) {
        // Look at the pointer relative to this view.
        const box = el.getBoundingClientRect();
        const cx = ((box.left + box.width / 2) / innerWidth) * 2 - 1, cy = -(((box.top + box.height * .3) / innerHeight) * 2 - 1);
        look.set(THREE.MathUtils.clamp((pointer.x - cx) * .6, -.6, .6), THREE.MathUtils.clamp((pointer.y - cy) * .6, -.5, .5));
        coach.update(reduced.matches ? 0 : dt, now / 1000, { pose: current.current, energy: level, look });
        // Keep the teacher centred while the captured body sways.
        coach.neck.getWorldPosition(hips);
        follow += (hips.x - follow) * Math.min(1, dt * 2);
        camera.position.x = follow; camera.lookAt(follow, coach.height * .74, 0);
      }
      renderer.render(scene, camera);
    });
    return () => {
      inactive = true; observer.disconnect(); seen.disconnect(); renderer.setAnimationLoop(null);
      coach?.dispose(); environment.dispose(); pmrem.dispose();
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, [wave]);
  return <div ref={host} className="mentor-view" role="img" aria-label="Geno — ingliz tili ustozi">{failed && <span>Shaharcha ustozi</span>}</div>;
}
