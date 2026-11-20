// The home page "English City": a floating island with the 3D teacher in the centre and
// clickable buildings for each part of the club. Everything is built in code — no extra downloads.
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
import { label, word } from './three/labels';

export type WorldSection = 'grammar' | 'ielts' | 'speaking' | 'games' | 'teacher';
type Building = { id: WorldSection; group: THREE.Group; hit: THREE.Mesh; glow: THREE.Mesh; tag: THREE.Sprite; home: THREE.Vector3 };

const std = (color: number, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: .55, metalness: .1, ...extra });

function shadowed<T extends THREE.Object3D>(o: T) { o.traverse(n => { if (n instanceof THREE.Mesh) { n.castShadow = true; n.receiveShadow = true; } }); return o; }

function sky() {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { top: { value: new THREE.Color(0x070420) }, mid: { value: new THREE.Color(0x2c1866) }, low: { value: new THREE.Color(0xff8a6a) } },
    vertexShader: 'varying vec3 vPos; void main(){ vPos = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 low; varying vec3 vPos; void main(){ float h = vPos.y; vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.65, h)) : mix(mid, low, smoothstep(0.0, -0.35, h)); gl_FragColor = vec4(c, 1.0); }',
  });
  return new THREE.Mesh(new THREE.SphereGeometry(80, 32, 16), material);
}

function stars(count = 1400) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(55 + Math.random() * 15);
    v.y = Math.abs(v.y) * .9 + 2;
    positions.set([v.x, v.y, v.z], i * 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: .22, sizeAttenuation: true, transparent: true, opacity: .9, depthWrite: false }));
}

function fireflies(count = 140) {
  const seeds = Array.from({ length: count }, () => ({ r: 1.5 + Math.random() * 6.5, a: Math.random() * Math.PI * 2, y: .4 + Math.random() * 3.5, s: .1 + Math.random() * .3 }));
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  const points = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffe28a, size: .09, transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  const update = (t: number) => {
    const p = g.getAttribute('position') as THREE.BufferAttribute;
    seeds.forEach((s, i) => p.setXYZ(i, Math.cos(s.a + t * s.s) * s.r, s.y + Math.sin(t * 1.3 + i) * .25, Math.sin(s.a + t * s.s) * s.r));
    p.needsUpdate = true;
  };
  return { points, update };
}

function cloud() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,220,240,.55)'); g.addColorStop(1, 'rgba(255,220,240,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(c);
  return () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, opacity: .7 })); return s; };
}

function island() {
  const group = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(7, 6.5, .6, 72), std(0x2f7a64, { roughness: .8 }));
  top.position.y = -.3; group.add(top);
  const rock = new THREE.Mesh(new THREE.ConeGeometry(6.5, 5.5, 11, 3), std(0x4b3a66, { flatShading: true, roughness: .9 }));
  rock.rotation.x = Math.PI; rock.position.y = -3.3; group.add(rock);
  for (let i = 0; i < 9; i++) {
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(.4 + Math.random() * .6), std(0x5d4a7c, { flatShading: true }));
    const a = Math.random() * Math.PI * 2; r.position.set(Math.cos(a) * (3 + Math.random() * 2.5), -2 - Math.random() * 3, Math.sin(a) * (3 + Math.random() * 2.5));
    group.add(r);
  }
  // Sandstone plaza with a turquoise tile ring (Uzbek madrasa colours).
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, .06, 64), std(0xc9b48f, { roughness: .8 }));
  plaza.position.y = .03; group.add(plaza);
  const tiles = new THREE.Mesh(new THREE.TorusGeometry(2.45, .07, 8, 96), std(0x1aa6b7, { emissive: 0x0b8a9a, emissiveIntensity: .5 }));
  tiles.rotation.x = Math.PI / 2; tiles.position.y = .07; group.add(tiles);
  for (let i = 0; i < 16; i++) {
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(.12), std(0x2a6fdb, { emissive: 0x2a6fdb, emissiveIntensity: .7 }));
    const a = (i / 16) * Math.PI * 2; star.position.set(Math.cos(a) * 2.05, .09, Math.sin(a) * 2.05); star.scale.y = .3; group.add(star);
  }
  // Paths to each building.
  for (const a of [-2.85, -2.0, -1.15, -.3]) {
    const path = new THREE.Mesh(new THREE.BoxGeometry(.7, .04, 2.4), std(0xd9c39a, { roughness: .8 }));
    path.position.set(Math.cos(a) * 3.6, .03, Math.sin(a) * 3.6); path.rotation.y = -a + Math.PI / 2; group.add(path);
  }
  // Little trees.
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2, r = 5.4 + Math.random() * 1.2;
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.05, .07, .4), std(0x6b4a2f)); trunk.position.y = .2;
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(.32 + Math.random() * .15), std([0x3fae6a, 0x67c27a, 0xf2a7c3][i % 3], { flatShading: true })); crown.position.y = .6;
    tree.add(trunk, crown); tree.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); group.add(tree);
  }
  return shadowed(group);
}

function bookTower() {
  const g = new THREE.Group();
  const colors = [0xe35d6a, 0xf2b33d, 0x3cb6a8, 0x6c5ce7, 0xfd8a5e, 0x2a6fdb, 0x9bd14a];
  colors.forEach((c, i) => {
    const book = new THREE.Group();
    const cover = new THREE.Mesh(new THREE.BoxGeometry(1.25 - i * .05, .26, .9 - i * .03), std(c, { roughness: .45 }));
    const pages = new THREE.Mesh(new THREE.BoxGeometry(1.18 - i * .05, .2, .86 - i * .03), std(0xfbf6e8));
    pages.position.x = .04;
    book.add(cover, pages);
    book.position.y = .13 + i * .27; book.rotation.y = (i % 2 ? .25 : -.2) + i * .05;
    g.add(book);
  });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.18, 24, 16), std(0xfff3b0, { emissive: 0xffd36b, emissiveIntensity: 2.4 }));
  lamp.position.y = 2.15; g.add(lamp);
  return g;
}

function madrasa() {
  const g = new THREE.Group();
  const sand = std(0xdcc39a, { roughness: .75 }), blue = std(0x1f6fd0, { emissive: 0x123f9a, emissiveIntensity: .7 }), turq = std(0x19b0bf, { metalness: .35, roughness: .3, emissive: 0x0a6c78, emissiveIntensity: .45 });
  // Peshtoq (portal) with a pointed arch cut out.
  const shape = new THREE.Shape(); shape.moveTo(-1.2, 0); shape.lineTo(1.2, 0); shape.lineTo(1.2, 2.9); shape.lineTo(-1.2, 2.9); shape.closePath();
  const arch = new THREE.Path(); arch.moveTo(-.62, 0); arch.lineTo(-.62, 1.55); arch.quadraticCurveTo(-.6, 2.25, 0, 2.5); arch.quadraticCurveTo(.6, 2.25, .62, 1.55); arch.lineTo(.62, 0); arch.closePath();
  shape.holes.push(arch);
  const portal = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: .5, bevelEnabled: false }), sand);
  portal.position.z = -.25; g.add(portal);
  const frame = new THREE.Mesh(new THREE.TorusGeometry(.7, .06, 8, 48, Math.PI), blue); frame.position.set(0, 1.6, .27); g.add(frame);
  for (const x of [-.95, .95]) { const band = new THREE.Mesh(new THREE.BoxGeometry(.12, 2.7, .04), blue); band.position.set(x, 1.4, .27); g.add(band); }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.3, .14, .04), blue); lintel.position.set(0, 2.72, .27); g.add(lintel);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.4), new THREE.MeshBasicMaterial({ color: 0x3fc8b8, transparent: true, opacity: .22 }));
  glow.position.set(0, 1.2, -.2); g.add(glow);
  for (const x of [-1.45, 1.45]) {
    const minaret = new THREE.Mesh(new THREE.CylinderGeometry(.15, .19, 3.5, 16), sand); minaret.position.set(x, 1.75, 0); g.add(minaret);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(.24, .2, .14, 16), turq); ring.position.set(x, 3.2, 0); g.add(ring);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), turq); cap.position.set(x, 3.5, 0); g.add(cap);
  }
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, .5, 32), sand); drum.position.set(0, 2.9, -.9); g.add(drum);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(.8, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2), turq); dome.position.set(0, 3.15, -.9); dome.scale.y = 1.25; g.add(dome);
  for (let i = 0; i < 12; i++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(.8, .015, 4, 24, Math.PI / 2), std(0x0c5f8f));
    rib.position.set(0, 3.15, -.9); rib.rotation.set(0, (i / 12) * Math.PI * 2, Math.PI / 2); rib.scale.y = 1.25; g.add(rib);
  }
  return g;
}

function microphone() {
  const g = new THREE.Group();
  const metal = std(0x2a2440, { metalness: .8, roughness: .3 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.55, .65, .18, 32), metal); base.position.y = .09; g.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.6, 16), metal); pole.position.y = 1; g.add(pole);
  const yoke = new THREE.Mesh(new THREE.TorusGeometry(.5, .05, 8, 32, Math.PI), metal); yoke.position.y = 1.85; yoke.rotation.z = Math.PI; g.add(yoke);
  const head = new THREE.Mesh(new THREE.CapsuleGeometry(.42, .55, 8, 24), std(0xbfc4d6, { metalness: 1, roughness: .25 })); head.position.y = 2.15; g.add(head);
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(.435, .55, 8, 24), new THREE.MeshBasicMaterial({ color: 0x5ff2dc, wireframe: true, transparent: true, opacity: .5, toneMapped: false })); mesh.position.y = 2.15; g.add(mesh);
  const band = new THREE.Mesh(new THREE.TorusGeometry(.44, .05, 8, 32), std(0xff5d8f, { emissive: 0xff2d6f, emissiveIntensity: 1.5 })); band.position.y = 1.95; band.rotation.x = Math.PI / 2; g.add(band);
  const waves = [0, 1, 2].map(i => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.7, .025, 8, 48), new THREE.MeshBasicMaterial({ color: 0x8fffe8, transparent: true, toneMapped: false }));
    ring.position.y = 2.15; ring.userData.phase = i / 3; g.add(ring); return ring;
  });
  g.userData.animate = (t: number, energy: number) => waves.forEach(w => {
    const p = (t * .45 + w.userData.phase) % 1;
    w.scale.setScalar(1 + p * 2.2 + energy); (w.material as THREE.MeshBasicMaterial).opacity = (1 - p) * .8;
  });
  return g;
}

function letterCube(letter: string, color: string) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = color; ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(8, 8, 112, 112);
  ctx.fillStyle = '#fff'; ctx.font = '900 84px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(letter, 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.BoxGeometry(.55, .55, .55), new THREE.MeshStandardMaterial({ map: t, roughness: .35, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .25 }));
}

function arcade() {
  const g = new THREE.Group();
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(.5, .7, .5, 6), std(0x6c5ce7, { emissive: 0x3a2aa0, emissiveIntensity: .5, flatShading: true })); stand.position.y = .25; g.add(stand);
  const cubes = [['E', '#e35d6a'], ['N', '#f2b33d'], ['G', '#3cb6a8'], ['L', '#6c5ce7'], ['I', '#fd8a5e'], ['S', '#2a6fdb'], ['H', '#9bd14a']].map(([l, c], i) => {
    const cube = letterCube(l, c); cube.userData.i = i; g.add(cube); return cube;
  });
  const pad = new THREE.Mesh(new THREE.TorusKnotGeometry(.22, .07, 64, 8), std(0xffd36b, { emissive: 0xffa400, emissiveIntensity: 1.2, metalness: .5 })); pad.position.y = 1.1; g.add(pad);
  g.userData.animate = (t: number) => {
    cubes.forEach(cube => {
      const a = t * .7 + (cube.userData.i / cubes.length) * Math.PI * 2;
      cube.position.set(Math.cos(a) * 1, 1.15 + Math.sin(t * 2 + cube.userData.i) * .25, Math.sin(a) * 1);
      cube.rotation.set(t * .6 + cube.userData.i, t * .9, 0);
    });
    pad.rotation.set(t * .8, t * 1.1, 0);
  };
  return g;
}

export default function World3D({ onSelect, children }: { onSelect: (section: WorldSection) => void; children?: React.ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const select = useRef(onSelect);
  const [failed, setFailed] = useState(false);
  const [hover, setHover] = useState<WorldSection | null>(null);
  useEffect(() => { select.current = onSelect; }, [onSelect]);

  useEffect(() => {
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
    catch { setFailed(true); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    el.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x2c1866, 22, 60);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
    scene.environment = environment; scene.environmentIntensity = .22;
    scene.add(sky(), stars());
    const camera = new THREE.PerspectiveCamera(40, 1, .1, 200);
    const target = new THREE.Vector3(0, 1.45, -.6);

    scene.add(new THREE.HemisphereLight(0xb9a6ff, 0x1d5a4c, .75));
    const sun = new THREE.DirectionalLight(0xffd2a8, 2.1); sun.position.set(6, 10, 7); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 }); sun.shadow.bias = -.0005;
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x62f0ff, 2); rim.position.set(-6, 5, -8); scene.add(rim);

    const world = new THREE.Group(); scene.add(world);
    world.add(island());
    const makeCloud = cloud();
    const clouds = Array.from({ length: 10 }, (_, i) => {
      const s = makeCloud(); const a = (i / 10) * Math.PI * 2;
      s.position.set(Math.cos(a) * (9 + Math.random() * 4), -3 - Math.random() * 3, Math.sin(a) * (9 + Math.random() * 4)); s.scale.setScalar(6 + Math.random() * 5);
      scene.add(s); return s;
    });
    const flies = fireflies(); scene.add(flies.points);

    // Teacher on a hologram pedestal.
    const pedestal = new THREE.Group();
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(.75, .85, .3, 48), std(0x1b1630, { metalness: .6, roughness: .25 })); stone.position.y = .15;
    const halo = new THREE.Mesh(new THREE.TorusGeometry(.78, .03, 8, 64), new THREE.MeshBasicMaterial({ color: 0x5ff2dc, toneMapped: false })); halo.rotation.x = Math.PI / 2; halo.position.y = .31;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.7, .78, 2.6, 48, 1, true), new THREE.MeshBasicMaterial({ color: 0x5ff2dc, transparent: true, opacity: .07, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    beam.position.y = 1.6;
    pedestal.add(shadowed(stone), halo, beam); pedestal.position.set(0, 0, 1.6); pedestal.scale.setScalar(1.25); world.add(pedestal);
    const bubble = label('Salom!', { size: 60, height: .34, border: '#ffd36b' }); bubble.position.set(0, 2.95, 1.6); world.add(bubble);
    const greetings = ['Salom!', 'Hello!', 'Let’s learn English!', 'Binolarni bosing!', 'IELTS 9.0? Birga!'];

    const buildings: Building[] = [];
    const place = (id: WorldSection, title: string, object: THREE.Object3D, x: number, z: number, accent: number, labelY: number, size = 1.3) => {
      const group = new THREE.Group(); group.position.set(x, 0, z); group.lookAt(0, 0, 1.5); group.rotation.x = 0; group.rotation.z = 0;
      group.add(shadowed(object));
      const glow = new THREE.Mesh(new THREE.RingGeometry(size, size + .12, 64), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: .5, side: THREE.DoubleSide, toneMapped: false }));
      glow.rotation.x = -Math.PI / 2; glow.position.y = .02; group.add(glow);
      const hit = new THREE.Mesh(new THREE.CylinderGeometry(size, size, labelY + .4, 16), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
      hit.position.y = (labelY + .4) / 2; group.add(hit);
      const tag = label(title, { border: '#' + accent.toString(16).padStart(6, '0'), height: .38 }); tag.position.y = labelY; group.add(tag);
      world.add(group);
      buildings.push({ id, group, hit, glow, tag, home: group.position.clone() });
    };
    place('grammar', 'Grammatika', bookTower(), -4.3, -1.3, 0xf2b33d, 2.75, 1.1);
    place('ielts', 'IELTS markazi', madrasa(), -1.55, -4.35, 0x5ff2dc, 4.35, 1.7);
    place('speaking', 'Speaking', microphone(), 1.85, -4.15, 0xff5d8f, 3.2, 1);
    place('games', 'O‘yinlar', arcade(), 4.35, -1.15, 0x9b8cff, 2.4, 1.2);
    const teacherHit = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 2.2, 12), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
    teacherHit.position.set(0, 1.4, 1.6); world.add(teacherHit);

    const vocabulary = [['Hello', '#9ffff0'], ['Salom', '#ffd36b'], ['Grammar', '#ffb3c7'], ['Fluency', '#c4b5ff'], ['Band 9', '#9ffff0'], ['Present Perfect', '#ffd36b'], ['Vocabulary', '#b8f28a'], ['Speak up!', '#ffb3c7'], ['A1 → C1', '#c4b5ff'], ['Well done!', '#b8f28a'], ['Pronunciation', '#9ffff0'], ['Kelajak', '#ffd36b'], ['Dream big', '#ffb3c7'], ['IELTS', '#c4b5ff']];
    const words = vocabulary.map(([text, color], i) => {
      const s = word(text, color, .24 + (i % 3) * .05);
      s.userData = { r: 6 + (i % 4) * .6, a: (i / vocabulary.length) * Math.PI * 2, y: 3.3 + (i % 5) * .45, speed: .05 + (i % 3) * .02 };
      scene.add(s); return s;
    });

    let coach: Coach | undefined, inactive = false;
    createCoach().then(c => {
      if (inactive) { c.dispose(); return; }
      coach = c; c.root.position.set(0, .37, 1.6); c.root.scale.setScalar(1.3); world.add(c.root);
      setTimeout(() => c.wave(2.6), 1400);
    }).catch(() => {});

    // Post-processing glow.
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .5, .45, .9);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    let useBloom = true;
    const guard = qualityGuard(() => { useBloom = false; renderer.setPixelRatio(1); renderer.shadowMap.enabled = false; resize(); });

    const resize = () => {
      const w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight);
      renderer.setSize(w, h); composer.setSize(w, h); bloom.setSize(w, h);
      camera.aspect = w / h;
      camera.fov = w < 700 ? 58 : 40;
      // On wide screens shift the island to the right so the title has room on the left.
      if (w / h > 1.25) camera.setViewOffset(w, h, -w * .2, 0, w, h);
      else if (w / h < .8) camera.setViewOffset(w, h, 0, h * .2, w, h); // phones: island in the upper half, text below
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    };
    const sizes = new ResizeObserver(resize); sizes.observe(el); resize();
    let visible = true;
    const seen = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); seen.observe(el);

    // Picking.
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    let hovered: WorldSection | null = null, flying: { to: THREE.Vector3; look: THREE.Vector3; start: number; id: WorldSection } | null = null;
    const pick = (e: PointerEvent) => {
      const box = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - box.left) / box.width) * 2 - 1, -((e.clientY - box.top) / box.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hits = ray.intersectObjects([...buildings.map(b => b.hit), teacherHit], false);
      if (!hits.length) return null;
      return hits[0].object === teacherHit ? 'teacher' : buildings.find(b => b.hit === hits[0].object)!.id;
    };
    const move = (e: PointerEvent) => {
      const id = pick(e);
      if (id !== hovered) {
        hovered = id; setHover(id);
        renderer.domElement.style.cursor = id ? 'pointer' : '';
        if (id === 'teacher') coach?.wave(1.8);
      }
    };
    const click = (e: PointerEvent) => {
      const id = pick(e);
      if (!id || flying) return;
      if (id === 'teacher') { coach?.wave(1.5); select.current('teacher'); return; }
      const b = buildings.find(x => x.id === id)!;
      const to = b.home.clone().multiplyScalar(.62).add(new THREE.Vector3(0, 2.2, 3.2));
      flying = { to, look: b.home.clone().add(new THREE.Vector3(0, 1.4, 0)), start: performance.now(), id };
    };
    renderer.domElement.addEventListener('pointermove', move);
    renderer.domElement.addEventListener('pointerdown', click);

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();
    const intro = new THREE.Vector3(0, 9, 22), base = new THREE.Vector3(0, 2.75, 8.8);
    const look = new THREE.Vector2(), lookTarget = new THREE.Vector3();
    let last = start, greeting = 0;
    renderer.setAnimationLoop(now => {
      const dt = Math.min(.06, (now - last) / 1000); last = now;
      if (!visible || document.hidden) return;
      guard(dt);
      const t = (now - start) / 1000;
      const energy = voiceEnergy();

      // Camera: intro flight, then gentle sway and pointer parallax, or a flight to the chosen building.
      if (flying) {
        const k = Math.min(1, (now - flying.start) / 750), e = k * k * (3 - 2 * k);
        camera.position.lerp(flying.to, e * .25);
        lookTarget.lerp(flying.look, e * .25);
        camera.lookAt(lookTarget);
        if (k >= 1) { const id = flying.id; flying = null; select.current(id); camera.position.copy(base); lookTarget.copy(target); }
      } else {
        const k = reduced ? 1 : Math.min(1, t / 2.8), e = 1 - Math.pow(1 - k, 3);
        camera.position.lerpVectors(intro, base, e);
        if (!reduced) {
          camera.position.x += Math.sin(t * .12) * .8 * e + pointer.x * .9 * e;
          camera.position.y += pointer.y * .45 * e;
        }
        lookTarget.copy(target); camera.lookAt(lookTarget);
      }

      world.position.y = Math.sin(t * .6) * .08;
      clouds.forEach((c, i) => { c.position.x += Math.sin(t * .1 + i) * .002; });
      flies.update(t);
      words.forEach(w => {
        const d = w.userData; const a = d.a + t * d.speed;
        // Words orbit on an ellipse behind the teacher so they never block the camera.
        w.position.set(Math.cos(a) * d.r, d.y + Math.sin(t * .8 + d.a * 3) * .2 + world.position.y, Math.sin(a) * d.r * .5 - 2.6);
      });
      buildings.forEach(b => {
        const on = hovered === b.id;
        const s = THREE.MathUtils.lerp(b.group.scale.x, on ? 1.08 : 1, dt * 8); b.group.scale.setScalar(s);
        (b.glow.material as THREE.MeshBasicMaterial).opacity = on ? .95 : .45 + Math.sin(t * 2 + b.home.x) * .1;
        b.tag.position.y = (b.tag.userData.y ??= b.tag.position.y) + Math.sin(t * 1.5 + b.home.x) * .06 + (on ? .15 : 0);
        b.group.traverse(n => n.userData.animate?.(t, energy));
      });
      halo.scale.setScalar(1 + Math.sin(t * 2) * .03 + energy * .3);
      (beam.material as THREE.MeshBasicMaterial).opacity = .06 + energy * .2;
      if (Math.floor(t / 4) !== greeting) {
        greeting = Math.floor(t / 4);
        const next = label(greetings[greeting % greetings.length], { size: 60, height: .34, border: '#ffd36b' });
        (bubble.material as THREE.SpriteMaterial).map?.dispose();
        bubble.material.map = next.material.map; bubble.scale.copy(next.scale); bubble.material.needsUpdate = true; next.material.dispose();
      }
      bubble.position.y = 2.95 + Math.sin(t * 2) * .05 + world.position.y;
      if (coach) {
        // The teacher looks towards the pointer (projected from the camera view).
        look.set(THREE.MathUtils.clamp(pointer.x * 1.1, -1, 1), THREE.MathUtils.clamp(pointer.y * .8 + .1, -1, 1));
        coach.update(reduced ? 0 : dt, t, { pose: hovered === 'teacher' ? 'attentive' : 'idle', energy, look });
      }
      if (useBloom) composer.render(); else renderer.render(scene, camera);
    });

    return () => {
      inactive = true; renderer.setAnimationLoop(null); sizes.disconnect(); seen.disconnect();
      renderer.domElement.removeEventListener('pointermove', move);
      renderer.domElement.removeEventListener('pointerdown', click);
      coach?.dispose();
      scene.traverse(n => {
        if (n instanceof THREE.Mesh || n instanceof THREE.Points || n instanceof THREE.Sprite) {
          n.geometry?.dispose();
          const materials = Array.isArray(n.material) ? n.material : [n.material];
          materials.forEach(m => { (m as THREE.MeshStandardMaterial).map?.dispose(); m.dispose(); });
        }
      });
      composer.dispose(); environment.dispose(); pmrem.dispose();
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, []);

  const hints: Record<WorldSection, string> = { grammar: 'Grammatika kursi: A1 → C1', ielts: 'IELTS markazi: 3D examiner bilan imtihon', speaking: 'Speaking: mikrofonga gapiring', games: '75+ interaktiv o‘yin', teacher: 'Ustoz bilan suhbat — bosing!' };
  return <section className={`world3d ${failed ? 'world-failed' : ''}`} ref={host}>
    {children}
    <p className="world-hint" aria-live="polite">{hover ? hints[hover] : 'Binolarni yoki ustozni bosing ✨'}</p>
  </section>;
}
