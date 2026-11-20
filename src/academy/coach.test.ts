import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import * as THREE from 'three';

// Minimal browser stand-ins so GLTFLoader can decode texture placeholders in Node.
const g = globalThis as Record<string, unknown>;
g.self ??= globalThis;
g.createImageBitmap ??= async () => ({ width: 1, height: 1, close() {} });

const file = (p: string) => { const b = fs.readFileSync(p); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer; };

test('VRM teacher moves with the AI4AnimationPy capture, waves, presents and stays facing the class', async () => {
  const quiet = console.error; console.error = () => {};      // textures cannot decode in Node; geometry is what we test
  const { createCoach, provideTeacherFiles } = await import('./three/coach');
  provideTeacherFiles(file('public/teacher/teacher.vrm'), JSON.parse(fs.readFileSync('public/teacher/motions.json', 'utf8')), file('public/teacher/motions.bin'));
  const coach = await createCoach();
  console.error = quiet;
  const bone = (name: Parameters<typeof coach.vrm.humanoid.getNormalizedBoneNode>[0]) => coach.vrm.humanoid.getNormalizedBoneNode(name)!;
  const at = (name: Parameters<typeof bone>[0]) => { coach.root.updateMatrixWorld(true); return bone(name).getWorldPosition(new THREE.Vector3()); };
  const run = (from: number, seconds: number, state: Partial<Parameters<typeof coach.update>[2]> = {}) => {
    for (let t = 0; t < seconds; t += 1 / 30) coach.update(1 / 30, from + t, { pose: 'idle', energy: 0, look: new THREE.Vector2(), ...state });
  };

  run(0, 3);
  const hips = at('hips'), hand = at('rightHand'), left = at('leftHand');
  assert.ok(hand.y < hips.y + .05 && left.y < hips.y + .05, 'idle: arms hang down');
  assert.ok(hand.x < 0 && left.x > 0, 'idle: right hand on the right, left hand on the left');

  run(3, 4, { energy: .7 });                                     // speaking → explaining take
  const chest = at('upperChest');
  assert.ok(at('rightHand').y > hips.y + .05 || at('leftHand').y > hips.y + .05, 'explaining: hands come up');
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(bone('hips').getWorldQuaternion(new THREE.Quaternion()));
  assert.ok(forward.z > .7, 'explaining: still facing the class');
  assert.ok(at('rightHand').z > chest.z - .1, 'explaining: hands are in front, not behind');

  coach.wave(2);
  run(7, .8);
  assert.ok(at('rightHand').y > at('head').y - .1, 'wave: hand raised to head height');

  run(9, 3, { present: 1 });
  assert.ok(at('leftHand').x > at('leftShoulder').x + .2, 'present: left hand opens towards the board');

  const look = new THREE.Vector2(1, 0);
  run(12, 8, { look });
  const face = new THREE.Vector3(0, 0, 1).applyQuaternion(bone('head').getWorldQuaternion(new THREE.Quaternion()));
  assert.ok(face.z > .5, 'looking around never turns the head away');
  coach.dispose();
});
