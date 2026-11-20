import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const bytes=readFileSync(new URL('../../public/teacher/instructor.glb',import.meta.url));
const document=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12))) as {
  skins:{joints:number[]}[];
  nodes:{name:string}[];
  accessors:{min:number[];max:number[]}[];
  meshes:{primitives:{attributes:Record<string,number>}[]}[];
  animations:{name:string;channels:{target:{node:number;path:string}}[]}[];
};

test('the orbitable instructor has volume around the head, trunk and four limbs',()=>{
  assert.equal(bytes.toString('ascii',0,4),'glTF');
  const parts=document.meshes.flatMap(mesh=>mesh.primitives);
  assert.equal(parts.length,6);
  for(const {attributes} of parts){
    assert.ok('JOINTS_0' in attributes && 'WEIGHTS_0' in attributes && 'TEXCOORD_0' in attributes);
    const {min,max}=document.accessors[attributes.POSITION];
    for(const axis of [0,1,2])assert.ok(max[axis]-min[axis]>.05);
  }
});

test('all three captures animate the head, arms and legs of the displayed instructor',()=>{
  assert.deepEqual(document.animations.map(a=>a.name),['idle','explain','listen']);
  for(const clip of document.animations){
    const driven=new Set(clip.channels.filter(c=>c.target.path==='rotation').map(c=>document.nodes[c.target.node].name));
    for(const bone of ['b_head','b_spine2','b_l_arm','b_r_arm','b_l_leg','b_r_leg'])assert.ok(driven.has(bone));
    assert.equal(driven.size,document.skins[0].joints.length);
  }
});
