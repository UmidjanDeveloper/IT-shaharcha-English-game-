import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Load the real Geno model from disk instead of over HTTP.
(GLTFLoader.prototype as unknown as { loadAsync: () => Promise<unknown> }).loadAsync = function (this: GLTFLoader) {
  const buf = fs.readFileSync('public/mentor/geno.glb');
  return new Promise((resolve, reject) => this.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, '', resolve, reject));
};

test('3D teacher waves, presents to the board and does not drift when looking around', async () => {
  const { createCoach } = await import('./three/coach');
  const coach = await createCoach();
  const hand = coach.root.getObjectByName('RightHand')!, left = coach.root.getObjectByName('LeftHand')!, head = coach.root.getObjectByName('Head')!;
  const at = (o: THREE.Object3D) => { coach.root.updateMatrixWorld(true); return o.getWorldPosition(new THREE.Vector3()); };
  const state = { pose: 'idle', energy: 0, look: new THREE.Vector2() };
  coach.update(.016, 1, state);
  const rest = at(hand).y;
  coach.wave(2);
  for (let i = 1; i <= 40; i++) coach.update(.016, 1 + i * .02, state);
  assert.ok(at(hand).y > rest + .5, 'hand is raised while waving');
  for (let i = 1; i <= 120; i++) coach.update(.016, 3 + i * .02, state);
  assert.ok(Math.abs(at(hand).y - rest) < .15, 'hand comes back down');

  const leftRest = at(left).x;
  for (let i = 1; i <= 120; i++) coach.update(.016, 6 + i * .02, { ...state, present: 1 });
  assert.ok(at(left).x > leftRest + .2, 'left hand opens towards the board');

  // Looking to the side for many frames must stay a bounded turn (no accumulation).
  const look = new THREE.Vector2(1, 0);
  for (let i = 1; i <= 300; i++) coach.update(.016, 9 + i * .02, { ...state, look });
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(head.getWorldQuaternion(new THREE.Quaternion()));
  assert.ok(forward.z > .5, 'head still faces mostly forward');
  coach.dispose();
});
