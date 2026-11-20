// The 3D teacher: the club's instructor (instructor.glb, built from the owner's own photo) whose body
// plays motion capture from AI4AnimationPy (Cranberry "standing" take: idle, explaining, listening).
// On top of the capture: blinking, lip movement with the voice, a head that follows the viewer,
// waving, presenting to the board and cheering.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type CoachState = {
  pose: string;          // idle | talking | listening | attentive | review
  energy: number;        // 0..1 loudness of the teacher's voice
  look: THREE.Vector2;   // -1..1 where the viewer is, relative to the teacher
  present?: number;      // 0..1 open the left hand towards a board
  cheer?: number;        // 0..1 both arms up
};

export type Coach = {
  root: THREE.Object3D;
  height: number;
  head: THREE.Object3D;
  neck: THREE.Object3D;
  wave(seconds?: number): void;
  smile(seconds?: number): void;
  update(dt: number, time: number, state: CoachState): void;
  dispose(): void;
};

let modelBytes: Promise<ArrayBuffer> | null = null;
/** One download shared by every 3D view; each view parses its own copy. */
export function preloadTeacher() {
  modelBytes ??= fetch('/teacher/instructor.glb').then(r => { if (!r.ok) throw new Error('model'); return r.arrayBuffer(); })
    .catch(error => { modelBytes = null; throw error; });
  return modelBytes;
}
/** Lets tests provide the model without HTTP. */
export function provideTeacherFile(model: ArrayBuffer) { modelBytes = Promise.resolve(model); }

// Rotates a bone in world space so the direction to its child points along `target`, blended by weight.
const tmp = { a: new THREE.Vector3(), b: new THREE.Vector3(), q: new THREE.Quaternion(), full: new THREE.Quaternion(), w: new THREE.Quaternion(), p: new THREE.Quaternion(), id: new THREE.Quaternion(), t: new THREE.Vector3() };
function aim(bone: THREE.Object3D, child: THREE.Object3D, target: THREE.Vector3, weight: number, space: THREE.Object3D) {
  if (weight <= 0.001) return;
  bone.updateWorldMatrix(true, true);
  bone.getWorldPosition(tmp.a);
  child.getWorldPosition(tmp.b);
  const from = tmp.b.sub(tmp.a).normalize();
  // Targets are in the teacher's own space (x = his left, y = up, z = towards the viewer).
  tmp.t.copy(target).normalize().transformDirection(space.matrixWorld);
  tmp.full.setFromUnitVectors(from, tmp.t);
  tmp.q.slerpQuaternions(tmp.id, tmp.full, Math.min(1, weight));
  bone.getWorldQuaternion(tmp.w);
  tmp.w.premultiply(tmp.q);
  bone.parent!.getWorldQuaternion(tmp.p);
  bone.quaternion.copy(tmp.p.invert().multiply(tmp.w));
  bone.updateWorldMatrix(false, true);
}

/** Removes paper-thin triangles: at the ends of the limb tubes some zero-area triangles join vertices
 * bound to different joints, and once the body moves they stretch into stray lines. */
export function dropSlivers(geometry: THREE.BufferGeometry) {
  const index = geometry.index, position = geometry.attributes.position;
  if (!index) return 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), ab = new THREE.Vector3(), ac = new THREE.Vector3();
  const keep: number[] = [];
  let dropped = 0;
  for (let t = 0; t < index.count; t += 3) {
    const i = index.getX(t), j = index.getX(t + 1), k = index.getX(t + 2);
    a.fromBufferAttribute(position, i); b.fromBufferAttribute(position, j); c.fromBufferAttribute(position, k);
    const longest = Math.max(a.distanceTo(b), b.distanceTo(c), c.distanceTo(a));
    const area = ab.subVectors(b, a).cross(ac.subVectors(c, a)).length() / 2;
    // Zero-area joins, or needle-like triangles reaching out of the body (aspect > 18:1, longer than 12 cm).
    const thickness = (2 * area) / longest;
    if ((longest > .04 && thickness < .0008) || (longest > .12 && longest / thickness > 18)) { dropped++; continue; }
    keep.push(i, j, k);
  }
  if (dropped) geometry.setIndex(keep);
  return dropped;
}

export async function createCoach(): Promise<Coach> {
  const bytes = await preloadTeacher();
  const gltf = await new GLTFLoader().parseAsync(bytes.slice(0), '');
  const model = gltf.scene;
  const faces: THREE.Mesh[] = [];
  model.traverse(o => {
    o.frustumCulled = false;
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true; mesh.receiveShadow = true;
    if (mesh.morphTargetDictionary) faces.push(mesh);
    dropSlivers(mesh.geometry);
    const material = mesh.material as THREE.MeshStandardMaterial;
    if (material.map) { material.map.anisotropy = 8; material.map.colorSpace = THREE.SRGBColorSpace; }
    material.envMapIntensity = .6;
  });
  const root = new THREE.Group();
  root.add(model);
  const bone = (name: string) => model.getObjectByName(name)!;
  const b = {
    head: bone('b_head'), neck: bone('b_neck0'), spine: bone('b_spine2'),
    rArm: bone('b_r_arm'), rFore: bone('b_r_forearm'), rHand: bone('b_r_wrist'),
    lArm: bone('b_l_arm'), lFore: bone('b_l_forearm'), lHand: bone('b_l_wrist'),
  };

  const mixer = new THREE.AnimationMixer(model);
  const actions = Object.fromEntries(gltf.animations.map(c => [c.name, mixer.clipAction(c)]));
  Object.values(actions).forEach((a, i) => { a.play(); a.setEffectiveWeight(i === 0 ? 1 : 0); a.time = Math.random() * a.getClip().duration; });
  const weights: Record<string, number> = { idle: 1, explain: 0, listen: 0 };
  model.updateMatrixWorld(true);
  const height = new THREE.Box3().setFromObject(model).max.y;

  const morph = (name: 'speech' | 'blink', value: number) => faces.forEach(m => {
    const i = m.morphTargetDictionary![name];
    if (i !== undefined && m.morphTargetInfluences) m.morphTargetInfluences[i] = value;
  });
  let waveUntil = 0, waveStart = 0, smileUntil = 0, clock = 0, nextBlink = 1.5, blinkT = -1;
  let energy = 0, present = 0, cheer = 0, mouth = 0;
  const look = new THREE.Vector2();
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

  return {
    root, height, head: b.head, neck: b.neck,
    wave(seconds = 2.4) { waveStart = clock; waveUntil = clock + seconds; smileUntil = Math.max(smileUntil, clock + seconds); },
    smile(seconds = 2) { smileUntil = clock + seconds; },
    update(dt, time, state) {
      clock = time;
      const k = Math.min(1, dt * 3);
      energy += (state.energy - energy) * Math.min(1, dt * 14);
      present += ((state.present ?? 0) - present) * Math.min(1, dt * 3);
      cheer += ((state.cheer ?? 0) - cheer) * Math.min(1, dt * 4);
      look.lerp(state.look, Math.min(1, dt * 5));

      // Body: blend the captured idle, explaining and listening takes.
      const speaking = energy > .03 || state.pose === 'talking';
      const want = speaking ? 'explain' : state.pose === 'listening' || state.pose === 'attentive' ? 'listen' : 'idle';
      for (const name of Object.keys(weights)) {
        weights[name] += ((name === want ? 1 : 0) - weights[name]) * k;
        actions[name]?.setEffectiveWeight(weights[name]);
      }
      mixer.update(dt);

      // The head turns to the viewer on top of the capture.
      b.head.rotation.y += look.x * .4;
      b.head.rotation.x += -look.y * .18;
      b.neck.rotation.y += look.x * .14;
      if (want === 'listen') b.head.rotation.z += .07;
      if (speaking) b.head.rotation.x += Math.sin(time * 7.5) * .03 * Math.min(1, energy * 2);

      if (present > .01) {
        const sway = Math.sin(time * 1.6) * .08;
        aim(b.lArm, b.lFore, v(.85, -.25 + sway, .45), present * .85, root);
        aim(b.lFore, b.lHand, v(.8, .05, .6), present * .8, root);
      }
      if (cheer > .01) {
        const bounce = Math.sin(time * 9) * .1;
        aim(b.rArm, b.rFore, v(-.35, 1, .1), cheer, root);
        aim(b.rFore, b.rHand, v(-.15 + bounce, 1, .15), cheer, root);
        aim(b.lArm, b.lFore, v(.35, 1, .1), cheer, root);
        aim(b.lFore, b.lHand, v(.15 - bounce, 1, .15), cheer, root);
      }
      if (time < waveUntil) {
        const t = time - waveStart, total = waveUntil - waveStart;
        const weight = Math.min(1, t / .4, (total - t) / .5);
        aim(b.rArm, b.rFore, v(-.7, .4, .45), weight, root);
        aim(b.rFore, b.rHand, v(-.25 + Math.sin(t * 10) * .4, 1, .2), weight, root);
        b.head.rotation.z += -.06 * weight;
      }

      // Face: blinking and the mouth moving with the voice (a little smile while greeting).
      if (time > nextBlink && blinkT < 0) { blinkT = 0; nextBlink = time + 2.4 + Math.random() * 3.5; }
      let blink = 0;
      if (blinkT >= 0) { blinkT += dt; blink = Math.sin(Math.min(1, blinkT / .16) * Math.PI); if (blinkT > .16) blinkT = -1; }
      const talk = Math.min(1, energy * 1.7) * (.45 + .55 * Math.abs(Math.sin(time * 10.5)) * (.7 + .3 * Math.sin(time * 6.3)));
      mouth += ((time < smileUntil && !speaking ? .12 : talk) - mouth) * Math.min(1, dt * 18);
      morph('speech', mouth);
      morph('blink', blink);
    },
    dispose() {
      mixer.stopAllAction();
      model.traverse(o => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        const material = mesh.material as THREE.MeshStandardMaterial;
        material.map?.dispose(); material.dispose();
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
