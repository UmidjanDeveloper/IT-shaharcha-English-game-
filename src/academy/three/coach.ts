// The 3D teacher: a VRM avatar (pixiv VRoid sample, VRM Public License 1.0) whose body moves with
// real motion capture from AI4AnimationPy (Cranberry "standing" take, CC BY-NC 4.0), retargeted here
// onto the VRM humanoid. On top of the capture: blinking, lip-sync to the voice, eyes and head that
// follow the viewer, hair physics, and gestures (wave, present to the board, cheer).
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import type { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';

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
  vrm: VRM;
  head: THREE.Object3D;
  neck: THREE.Object3D;
  wave(seconds?: number): void;
  smile(seconds?: number): void;
  update(dt: number, time: number, state: CoachState): void;
  dispose(): void;
};

type Motion = { fps: number; joints: string[]; refQuat: number[][]; refPos: number[][]; clips: { name: string; frames: number; offset: number }[]; source: string };

let modelBytes: Promise<ArrayBuffer> | null = null;
let motionData: Promise<{ meta: Motion; bin: ArrayBuffer }> | null = null;
/** Downloads are shared by every 3D view; each view parses its own avatar instance. */
export function preloadTeacher() {
  modelBytes ??= fetch('/teacher/teacher.vrm').then(r => { if (!r.ok) throw new Error('model'); return r.arrayBuffer(); });
  motionData ??= Promise.all([
    fetch('/teacher/motions.json').then(r => r.json() as Promise<Motion>),
    fetch('/teacher/motions.bin').then(r => r.arrayBuffer()),
  ]).then(([meta, bin]) => ({ meta, bin }));
  return Promise.all([modelBytes, motionData]);
}
/** Lets tests and tools provide the files without HTTP. */
export function provideTeacherFiles(model: ArrayBuffer, meta: Motion, bin: ArrayBuffer) {
  modelBytes = Promise.resolve(model);
  motionData = Promise.resolve({ meta, bin });
}

// Motion-capture joint → VRM humanoid bone, and the joint used to measure each bone's direction.
const MAP: Record<string, VRMHumanBoneName> = {
  b_root: 'hips', b_spine1: 'spine', b_spine2: 'chest', b_spine3: 'upperChest', b_neck0: 'neck', b_head: 'head',
  b_l_shoulder: 'leftShoulder', b_l_arm: 'leftUpperArm', b_l_forearm: 'leftLowerArm', b_l_wrist: 'leftHand',
  b_r_shoulder: 'rightShoulder', b_r_arm: 'rightUpperArm', b_r_forearm: 'rightLowerArm', b_r_wrist: 'rightHand',
  b_l_upleg: 'leftUpperLeg', b_l_leg: 'leftLowerLeg', b_l_talocrural: 'leftFoot', b_l_ball: 'leftToes',
  b_r_upleg: 'rightUpperLeg', b_r_leg: 'rightLowerLeg', b_r_talocrural: 'rightFoot', b_r_ball: 'rightToes',
};
const CHILD: Record<string, [string, VRMHumanBoneName]> = {
  b_spine1: ['b_spine2', 'chest'], b_spine2: ['b_spine3', 'upperChest'], b_spine3: ['b_neck0', 'neck'], b_neck0: ['b_head', 'head'],
  b_l_shoulder: ['b_l_arm', 'leftUpperArm'], b_l_arm: ['b_l_forearm', 'leftLowerArm'], b_l_forearm: ['b_l_wrist', 'leftHand'],
  b_r_shoulder: ['b_r_arm', 'rightUpperArm'], b_r_arm: ['b_r_forearm', 'rightLowerArm'], b_r_forearm: ['b_r_wrist', 'rightHand'],
  b_l_upleg: ['b_l_leg', 'leftLowerLeg'], b_l_leg: ['b_l_talocrural', 'leftFoot'], b_l_talocrural: ['b_l_ball', 'leftToes'],
  b_r_upleg: ['b_r_leg', 'rightLowerLeg'], b_r_leg: ['b_r_talocrural', 'rightFoot'], b_r_talocrural: ['b_r_ball', 'rightToes'],
};

/** Builds looping clips on the VRM's normalized humanoid from the capture's global rotations. */
export function retarget(vrm: VRM, meta: Motion, bin: ArrayBuffer) {
  const humanoid = vrm.humanoid;
  vrm.scene.updateMatrixWorld(true);
  const node = (b: VRMHumanBoneName) => humanoid.getNormalizedBoneNode(b);
  const worldPos = (o: THREE.Object3D) => o.getWorldPosition(new THREE.Vector3());
  const joints = meta.joints.map((name, i) => {
    const bone = MAP[name], target = bone && node(bone);
    if (!target) return null;
    // Correct for the actor's calibration pose not being a perfect T-pose.
    const ref = new THREE.Quaternion().fromArray(meta.refQuat[i]);
    const child = CHILD[name], childNode = child && node(child[1]);
    let fix = new THREE.Quaternion();
    if (child && childNode) {
      const c = meta.joints.indexOf(child[0]);
      const mocapDir = new THREE.Vector3().fromArray(meta.refPos[c]).sub(new THREE.Vector3().fromArray(meta.refPos[i])).normalize();
      const vrmDir = worldPos(childNode).sub(worldPos(target)).normalize();
      fix = new THREE.Quaternion().setFromUnitVectors(mocapDir, vrmDir);
    }
    // world(t) = q(t) * ref^-1 * fix^-1   (normalized bones rest at identity)
    const correction = ref.clone().invert().multiply(fix.clone().invert());
    return { index: i, bone, target, correction };
  });
  const mapped = joints.filter(Boolean) as NonNullable<typeof joints[number]>[];
  const byNode = new Map(mapped.map(j => [j.target, j]));
  const parentOf = (o: THREE.Object3D) => { let p = o.parent; while (p && !byNode.has(p)) p = p.parent; return p ? byNode.get(p)! : null; };
  const parents = mapped.map(j => parentOf(j.target));
  const hips = node('hips')!;
  const hipsRest = hips.position.clone();
  const hipsHeight = worldPos(hips).y - worldPos(vrm.scene).y;
  const refRootY = meta.refPos[meta.joints.indexOf('b_root')][1];
  const scale = hipsHeight / refRootY;
  const count = meta.joints.length;

  return meta.clips.map(clip => {
    const q = new Int16Array(bin, clip.offset, clip.frames * count * 4);
    const p = new Float32Array(bin, clip.offset + clip.frames * count * 8, clip.frames * 3);
    const times = Float32Array.from({ length: clip.frames }, (_, f) => f / meta.fps);
    const values = mapped.map(() => new Float32Array(clip.frames * 4));
    const world = mapped.map(() => new THREE.Quaternion());
    const local = new THREE.Quaternion(), inv = new THREE.Quaternion();
    for (let f = 0; f < clip.frames; f++) {
      mapped.forEach((j, k) => {
        const o = (f * count + j.index) * 4;
        world[k].set(q[o] / 32767, q[o + 1] / 32767, q[o + 2] / 32767, q[o + 3] / 32767).normalize().multiply(j.correction);
      });
      mapped.forEach((_, k) => {
        const parent = parents[k];
        if (parent) { inv.copy(world[mapped.indexOf(parent)]).invert(); local.multiplyQuaternions(inv, world[k]); }
        else local.copy(world[k]);
        if (f && local.x * values[k][f * 4 - 4] + local.y * values[k][f * 4 - 3] + local.z * values[k][f * 4 - 2] + local.w * values[k][f * 4 - 1] < 0) local.set(-local.x, -local.y, -local.z, -local.w);
        local.toArray(values[k], f * 4);
      });
    }
    const tracks: THREE.KeyframeTrack[] = mapped.map((j, k) => new THREE.QuaternionKeyframeTrack(`${j.target.name}.quaternion`, times, values[k]));
    const hipsValues = new Float32Array(clip.frames * 3);
    for (let f = 0; f < clip.frames; f++) {
      hipsValues[f * 3] = hipsRest.x + p[f * 3] * scale;
      hipsValues[f * 3 + 1] = hipsRest.y + (p[f * 3 + 1] - refRootY) * scale;
      hipsValues[f * 3 + 2] = hipsRest.z + p[f * 3 + 2] * scale;
    }
    tracks.push(new THREE.VectorKeyframeTrack(`${hips.name}.position`, times, hipsValues));
    return new THREE.AnimationClip(clip.name, clip.frames / meta.fps, tracks);
  });
}

// Rotates a bone in world space so the direction to its child points along `target`, blended by weight.
const tmp = { a: new THREE.Vector3(), b: new THREE.Vector3(), q: new THREE.Quaternion(), full: new THREE.Quaternion(), w: new THREE.Quaternion(), p: new THREE.Quaternion(), id: new THREE.Quaternion(), t: new THREE.Vector3() };
function aim(bone: THREE.Object3D, child: THREE.Object3D, target: THREE.Vector3, weight: number, space: THREE.Object3D) {
  if (weight <= 0.001) return;
  bone.updateWorldMatrix(true, true);
  bone.getWorldPosition(tmp.a);
  child.getWorldPosition(tmp.b);
  const from = tmp.b.sub(tmp.a).normalize();
  // Targets are given in the teacher's own space (x = her left, y = up, z = towards the viewer).
  tmp.t.copy(target).normalize().transformDirection(space.matrixWorld);
  tmp.full.setFromUnitVectors(from, tmp.t);
  tmp.q.slerpQuaternions(tmp.id, tmp.full, Math.min(1, weight));
  bone.getWorldQuaternion(tmp.w);
  tmp.w.premultiply(tmp.q);
  bone.parent!.getWorldQuaternion(tmp.p);
  bone.quaternion.copy(tmp.p.invert().multiply(tmp.w));
  bone.updateWorldMatrix(false, true);
}

export async function createCoach(): Promise<Coach> {
  const [bytes, motion] = await preloadTeacher();
  const loader = new GLTFLoader();
  loader.register(parser => new VRMLoaderPlugin(parser));
  const gltf = await loader.parseAsync(bytes.slice(0), '');
  const vrm = gltf.userData.vrm as VRM;
  VRMUtils.removeUnnecessaryVertices(gltf.scene);
  VRMUtils.combineSkeletons(gltf.scene);
  if ((vrm.meta as { metaVersion?: string }).metaVersion === '0') VRMUtils.rotateVRM0(vrm);
  vrm.scene.traverse(o => { o.frustumCulled = false; if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
  const root = new THREE.Group();
  root.add(vrm.scene);

  const h = (b: VRMHumanBoneName) => vrm.humanoid.getNormalizedBoneNode(b)!;
  // Relaxed hands: the capture has no fingers, so curl them naturally.
  for (const side of ['left', 'right'] as const) {
    const s = side === 'left' ? 1 : -1;
    for (const finger of ['Index', 'Middle', 'Ring', 'Little'] as const) {
      ([['Proximal', .35], ['Intermediate', .55], ['Distal', .35]] as const).forEach(([part, angle], i) => {
        const bone = vrm.humanoid.getNormalizedBoneNode(`${side}${finger}${part}` as VRMHumanBoneName);
        if (bone) bone.rotation.z = s * (angle + (finger === 'Little' ? .12 : 0) + i * .02);
      });
    }
    const thumb = vrm.humanoid.getNormalizedBoneNode(`${side}ThumbProximal` as VRMHumanBoneName);
    if (thumb) thumb.rotation.y = s * -.35;
  }

  const clips = retarget(vrm, motion.meta, motion.bin);
  const mixer = new THREE.AnimationMixer(vrm.scene);
  const actions = Object.fromEntries(clips.map(c => [c.name, mixer.clipAction(c)]));
  Object.values(actions).forEach((a, i) => { a.play(); a.setEffectiveWeight(i === 0 ? 1 : 0); a.time = Math.random() * a.getClip().duration; });
  const weights: Record<string, number> = { idle: 1, explain: 0, listen: 0 };

  vrm.scene.updateMatrixWorld(true);
  const height = h('head').getWorldPosition(new THREE.Vector3()).y + .12;
  const lookTarget = new THREE.Object3D();
  root.add(lookTarget);
  if (vrm.lookAt) vrm.lookAt.target = lookTarget;
  const expressions = vrm.expressionManager;
  let waveUntil = 0, waveStart = 0, smileUntil = 0, clock = 0, nextBlink = 1.5, blinkT = -1;
  let energy = 0, present = 0, cheer = 0;
  const look = new THREE.Vector2(), level = new THREE.Quaternion();
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const springReset = () => vrm.springBoneManager?.reset();
  let firstFrame = true;

  return {
    root, height, vrm, head: h('head'), neck: h('neck'),
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
      // In the listening take the actor looks up; keep the teacher's head level and on the class.
      if (weights.listen > .01) {
        h('head').quaternion.slerp(level, .75 * weights.listen);
        h('neck').quaternion.slerp(level, .5 * weights.listen);
      }

      // Head turns to the viewer on top of the capture.
      h('head').rotation.y += look.x * .45;
      h('head').rotation.x += -look.y * .2;
      h('neck').rotation.y += look.x * .15;
      if (want === 'listen') h('head').rotation.z += .08;
      if (speaking) h('head').rotation.x += Math.sin(time * 7.5) * .035 * Math.min(1, energy * 2);

      if (present > .01) {
        const sway = Math.sin(time * 1.6) * .08;
        aim(h('leftUpperArm'), h('leftLowerArm'), v(.85, -.2 + sway, .45), present * .85, root);
        aim(h('leftLowerArm'), h('leftHand'), v(.8, .1, .6), present * .8, root);
      }
      if (cheer > .01) {
        const bounce = Math.sin(time * 9) * .1;
        aim(h('rightUpperArm'), h('rightLowerArm'), v(-.35, 1, .1), cheer, root);
        aim(h('rightLowerArm'), h('rightHand'), v(-.15 + bounce, 1, .15), cheer, root);
        aim(h('leftUpperArm'), h('leftLowerArm'), v(.35, 1, .1), cheer, root);
        aim(h('leftLowerArm'), h('leftHand'), v(.15 - bounce, 1, .15), cheer, root);
      }
      if (time < waveUntil) {
        const t = time - waveStart, total = waveUntil - waveStart;
        const weight = Math.min(1, t / .4, (total - t) / .5);
        aim(h('rightUpperArm'), h('rightLowerArm'), v(-.7, .45, .45), weight, root);
        aim(h('rightLowerArm'), h('rightHand'), v(-.25 + Math.sin(t * 10) * .4, 1, .2), weight, root);
        h('head').rotation.z += -.07 * weight;
      }

      // Face: blinking, smiling and lip-sync to the voice.
      if (expressions) {
        if (time > nextBlink && blinkT < 0) { blinkT = 0; nextBlink = time + 2.2 + Math.random() * 3.5; }
        let blink = 0;
        if (blinkT >= 0) { blinkT += dt; blink = Math.sin(Math.min(1, blinkT / .16) * Math.PI); if (blinkT > .16) blinkT = -1; }
        const smiling = time < smileUntil ? 1 : 0;
        const happy = expressions.getValue('happy') ?? 0;
        expressions.setValue('happy', happy + (smiling * .85 - happy) * Math.min(1, dt * 6));
        expressions.setValue('relaxed', smiling ? 0 : .25);
        expressions.setValue('blink', smiling ? 0 : blink);
        const open = Math.min(1, energy * 1.6);
        expressions.setValue('aa', open * (.55 + .45 * Math.abs(Math.sin(time * 10.5))));
        expressions.setValue('oh', open * .45 * (.5 + .5 * Math.sin(time * 6.3 + 1)));
        expressions.setValue('ee', open * .3 * (.5 + .5 * Math.sin(time * 8.1 + 2)));
        expressions.setValue('ih', open * .2 * (.5 + .5 * Math.sin(time * 12.7)));
      }

      // Eyes follow the viewer.
      lookTarget.position.set(look.x * .9, height - .05 + look.y * .45, 1.4);
      if (firstFrame) { root.updateMatrixWorld(true); springReset(); firstFrame = false; }
      vrm.update(dt);
    },
    dispose() {
      mixer.stopAllAction();
      VRMUtils.deepDispose(vrm.scene);
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
