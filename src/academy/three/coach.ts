// Shared 3D teacher rig: Geno (AI4AnimationPy, CC BY-NC 4.0) dressed as the club teacher,
// with motion clips plus procedural layers — waving, looking at the viewer, voice-driven gestures
// and a glowing visor that pulses while the teacher speaks.
import * as THREE from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

let source: Promise<GLTF> | null = null;
export function loadGeno() {
  source ??= new GLTFLoader().loadAsync('/mentor/geno.glb');
  return source;
}

export type CoachState = {
  pose: string;          // idle | talking | listening | attentive | review
  energy: number;        // 0..1 loudness of the teacher's voice
  look: THREE.Vector2;   // -1..1 where the viewer's pointer is
  present?: number;      // 0..1 gesture towards a board on the teacher's left
  cheer?: number;        // 0..1 both arms up (celebration)
};

export type Coach = {
  root: THREE.Object3D;
  height: number;
  visor: THREE.MeshStandardMaterial;
  wave(seconds?: number): void;
  update(dt: number, time: number, state: CoachState): void;
  dispose(): void;
};

const palette = { suit: 0x203246, skin: 0xd8e6ea, teal: 0x14868a, deep: 0x0f525b, gold: 0xffc66c };

function dress(root: THREE.Object3D) {
  const color = new THREE.Color();
  root.traverse(node => {
    if (!(node instanceof THREE.SkinnedMesh)) return;
    node.geometry = node.geometry.clone();
    const points = node.geometry.getAttribute('position');
    const colors: number[] = [];
    for (let i = 0; i < points.count; i++) {
      const y = points.getY(i), x = Math.abs(points.getX(i));
      let shade = palette.suit;
      if (y > 1.43 || x > .49) shade = palette.skin;
      else if (y > .88) {
        shade = x > .33 ? palette.teal : palette.deep;
        if (Math.abs(y - 1.23 - x * .32) < .018 || x < .009) shade = palette.gold;
      }
      color.setHex(shade);
      colors.push(color.r, color.g, color.b);
    }
    node.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    node.material = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .38, metalness: .25, clearcoat: .6, clearcoatRoughness: .25, sheen: .4, sheenColor: new THREE.Color(0x88fff0) });
    node.castShadow = true;
    node.frustumCulled = false;
  });
}

function headset(root: THREE.Object3D) {
  const head = root.getObjectByName('Head')!;
  const group = new THREE.Group();
  const visor = new THREE.MeshStandardMaterial({ color: 0x0d2633, emissive: 0x38ffe0, emissiveIntensity: .35, roughness: .15, metalness: .6 });
  const shell = new THREE.MeshStandardMaterial({ color: 0x102c3a, roughness: .3, metalness: .4 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xe9ac53, roughness: .3, metalness: .7, emissive: 0x3a2200 });
  const part = (material: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), material);
    mesh.position.set(x, y, z); mesh.scale.set(w, h, d); mesh.castShadow = true; group.add(mesh); return mesh;
  };
  part(shell, 0, 1.605, .046, .089, .049, .062);
  part(visor, 0, 1.6, .088, .07, .022, .03);                       // glowing visor band
  for (const side of [-1, 1]) {
    part(visor, side * .034, 1.608, .101, .014, .009, .008);       // eyes
    part(gold, side * .084, 1.59, -.012, .016, .039, .032);        // ear pieces
  }
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(.003, .003, .08), gold);
  antenna.position.set(.07, 1.66, -.01); antenna.rotation.z = -.35; group.add(antenna);
  const tip = part(visor, .087, 1.7, -.01, .011, .011, .011);
  tip.userData.tip = true;
  root.add(group);
  root.updateMatrixWorld(true);
  head.attach(group);
  return visor;
}

// Rotates a bone (in world space) so the direction to its child points along `target`, blended by weight.
const tmp = { a: new THREE.Vector3(), b: new THREE.Vector3(), q: new THREE.Quaternion(), full: new THREE.Quaternion(), w: new THREE.Quaternion(), p: new THREE.Quaternion(), id: new THREE.Quaternion() };
function aim(bone: THREE.Object3D, child: THREE.Object3D, target: THREE.Vector3, weight: number) {
  if (weight <= 0.001) return;
  bone.updateWorldMatrix(true, true);
  bone.getWorldPosition(tmp.a);
  child.getWorldPosition(tmp.b);
  const from = tmp.b.sub(tmp.a).normalize();
  tmp.full.setFromUnitVectors(from, target.clone().normalize());
  tmp.q.slerpQuaternions(tmp.id, tmp.full, Math.min(1, weight));
  bone.getWorldQuaternion(tmp.w);
  tmp.w.premultiply(tmp.q);
  bone.parent!.getWorldQuaternion(tmp.p);
  bone.quaternion.copy(tmp.p.invert().multiply(tmp.w));
  bone.updateWorldMatrix(false, true);
}

export async function createCoach(): Promise<Coach> {
  const gltf = await loadGeno();
  const root = cloneSkinned(gltf.scene);
  dress(root);
  const visor = headset(root);
  const mixer = new THREE.AnimationMixer(root);
  const actions = Object.fromEntries(gltf.animations.map(clip => [clip.name, mixer.clipAction(clip)]));
  const bone = (name: string) => root.getObjectByName(name)!;
  const b = {
    head: bone('Head'), neck: bone('Neck1'), spine: bone('Spine2'),
    rArm: bone('RightArm'), rFore: bone('RightForeArm'), rHand: bone('RightHand'),
    lArm: bone('LeftArm'), lFore: bone('LeftForeArm'), lHand: bone('LeftHand'),
  };
  const height = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3()).y;
  // Procedural layers are added on top of the clips every frame, so bones without a clip track
  // must start each frame from their rest pose instead of accumulating.
  const rest: [THREE.Object3D, THREE.Quaternion][] = [];
  root.traverse(n => { if ((n as THREE.Bone).isBone) rest.push([n, n.quaternion.clone()]); });
  let active: THREE.AnimationAction | undefined;
  let waveUntil = 0, waveStart = 0, smoothEnergy = 0, smoothPresent = 0, smoothCheer = 0, clock = 0;
  const look = new THREE.Vector2();
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

  return {
    root, height, visor,
    wave(seconds = 2.2) { waveStart = clock; waveUntil = clock + seconds; },
    update(dt, time, state) {
      clock = time;
      const speaking = state.energy > 0.02;
      const name = speaking ? 'talking' : state.pose === 'attentive' ? 'idle' : state.pose;
      const next = actions[name] ?? actions.idle;
      if (next && next !== active) { active?.fadeOut(.3); next.reset().fadeIn(.3).play(); active = next; }
      for (const [node, q] of rest) node.quaternion.copy(q);
      mixer.update(dt);

      smoothEnergy += (state.energy - smoothEnergy) * Math.min(1, dt * 12);
      smoothPresent += ((state.present ?? 0) - smoothPresent) * Math.min(1, dt * 3);
      smoothCheer += ((state.cheer ?? 0) - smoothCheer) * Math.min(1, dt * 4);
      look.lerp(state.look, Math.min(1, dt * 4));

      // Look at the viewer, with a curious tilt when listening.
      b.head.rotation.y += look.x * .55;
      b.head.rotation.x += -look.y * .28;
      b.neck.rotation.y += look.x * .18;
      if (state.pose === 'listening' || state.pose === 'attentive') b.head.rotation.z += .1 + Math.sin(time * 1.3) * .02;

      // Speech: nods, small torso sway and hand beats that follow the loudness.
      if (smoothEnergy > .01) {
        b.head.rotation.x += Math.sin(time * 8.5) * .06 * smoothEnergy;
        b.head.rotation.y += Math.sin(time * 2.1) * .05 * smoothEnergy;
        b.spine.rotation.y += Math.sin(time * 1.3) * .05 * smoothEnergy;
        b.rFore.rotation.z += Math.sin(time * 3.2) * .18 * smoothEnergy;
      }

      // Presenting: the left hand opens towards the board.
      if (smoothPresent > .01) {
        const sway = Math.sin(time * 1.7) * .08;
        aim(b.lArm, b.lFore, v(.85, -.15 + sway, .5), smoothPresent * .85);
        aim(b.lFore, b.lHand, v(.75, .15, .65), smoothPresent * .8);
      }

      // Celebration: both arms up.
      if (smoothCheer > .01) {
        const bounce = Math.sin(time * 9) * .1;
        aim(b.rArm, b.rFore, v(-.35, 1, .1), smoothCheer);
        aim(b.rFore, b.rHand, v(-.15 + bounce, 1, .15), smoothCheer);
        aim(b.lArm, b.lFore, v(.35, 1, .1), smoothCheer);
        aim(b.lFore, b.lHand, v(.15 - bounce, 1, .15), smoothCheer);
      }

      // Waving hello: raise the right arm, then swing the forearm.
      if (time < waveUntil) {
        const t = time - waveStart, total = waveUntil - waveStart;
        const weight = Math.min(1, t / .35, (total - t) / .45);
        aim(b.rArm, b.rFore, v(-.62, .62, .48), weight);
        aim(b.rFore, b.rHand, v(-.18 + Math.sin(t * 11) * .38, 1, .25), weight);
        b.head.rotation.z += -.08 * weight;
      }

      // The visor glows with the voice; the antenna tip blinks while listening.
      visor.emissiveIntensity = .35 + smoothEnergy * 2.4 + (state.pose === 'listening' || state.pose === 'attentive' ? .3 + Math.sin(time * 6) * .2 : 0);
    },
    dispose() {
      mixer.stopAllAction();
      root.traverse(node => {
        if (!(node instanceof THREE.Mesh)) return;
        node.geometry.dispose();
        (Array.isArray(node.material) ? node.material : [node.material]).forEach(m => m.dispose());
      });
    },
  };
}

/** Pointer position over the whole window, -1..1, shared by every 3D view. */
export const pointer = new THREE.Vector2();
if (typeof window !== 'undefined') {
  window.addEventListener('pointermove', e => {
    pointer.set((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
  }, { passive: true });
}

/** Rendering quality for school computers: drops pixel ratio and effects when frames are slow. */
export function qualityGuard(onLow: () => void) {
  let frames = 0, total = 0, done = false;
  return (dt: number) => {
    if (done) return;
    frames++; total += dt;
    if (frames === 90) { done = true; if (total / frames > 1 / 32) onLow(); }
  };
}
