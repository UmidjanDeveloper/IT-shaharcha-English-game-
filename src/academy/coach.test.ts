import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import * as THREE from 'three';

// Minimal browser stand-ins so GLTFLoader can decode texture placeholders in Node.
const g = globalThis as Record<string, unknown>;
g.self ??= globalThis;
g.createImageBitmap ??= async () => ({ width: 1, height: 1, close() {} });

test('instructor plays the AI4AnimationPy capture, waves, presents, speaks and keeps facing the class', async () => {
  const quiet = console.error; console.error = () => {};
  const { createCoach, provideTeacherFile } = await import('./three/coach');
  const b = fs.readFileSync('public/teacher/instructor.glb');
  provideTeacherFile(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer);
  const coach = await createCoach();
  console.error = quiet;
  const node = (name: string) => coach.root.getObjectByName(name)!;
  const at = (name: string) => { coach.root.updateMatrixWorld(true); return node(name).getWorldPosition(new THREE.Vector3()); };
  const run = (from: number, seconds: number, state: Partial<Parameters<typeof coach.update>[2]> = {}) => {
    for (let t = 0; t < seconds; t += 1 / 30) coach.update(1 / 30, from + t, { pose: 'idle', energy: 0, look: new THREE.Vector2(), ...state });
  };
  let mouth = 0;
  const face = () => { let m: THREE.Mesh | undefined; coach.root.traverse(o => { if ((o as THREE.Mesh).morphTargetDictionary && !m) m = o as THREE.Mesh; }); return m!; };

  assert.ok(coach.height > 1.7 && coach.height < 1.9, 'adult height');
  run(0, 3);
  const hips = at('b_root');
  assert.ok(at('b_r_wrist').y < hips.y + .1 && at('b_l_wrist').y < hips.y + .1, 'idle: arms down');
  assert.ok(at('b_r_wrist').x < 0 && at('b_l_wrist').x > 0, 'idle: hands on the correct sides');

  run(3, 2, { energy: .7 });
  const m = face(); mouth = m.morphTargetInfluences![m.morphTargetDictionary!.speech];
  assert.ok(mouth > .05, 'speaking: the mouth opens');

  coach.wave(2);
  run(5, .8);
  assert.ok(at('b_r_wrist').y > at('b_head').y - .15, 'wave: hand raised to head height');

  run(7, 3, { present: 1 });
  assert.ok(at('b_l_wrist').x > at('b_l_shoulder').x + .2, 'present: left hand opens towards the board');

  run(10, 8, { look: new THREE.Vector2(1, 0) });
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(coach.head.getWorldQuaternion(new THREE.Quaternion()));
  assert.ok(forward.z > .5, 'looking around never turns the head away');
  coach.dispose();
});

test('paper-thin triangles that stretch into stray lines are removed', async () => {
  const { dropSlivers } = await import('./three/coach');
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, .3, 0, 0, 0, 0, 0, 0, .1, 0, .1, .1, 0], 3));
  geometry.setIndex([0, 1, 2, 0, 3, 4]);          // first is a zero-area sliver, second is a real triangle
  assert.equal(dropSlivers(geometry), 1);
  assert.deepEqual(Array.from(geometry.index!.array), [0, 3, 4]);
});
