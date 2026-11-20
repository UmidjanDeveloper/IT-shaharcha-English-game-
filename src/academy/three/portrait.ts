import * as T from 'three';

type Clip = {name:string; frames:number; offset:number};
type Capture = {fps:number; joints:string[]; clips:Clip[]};
let capture: Promise<{meta:Capture; bytes:ArrayBuffer}> | undefined;
export function loadCapture() {
  async function read(path:string) {
    const res = await fetch('/teacher/' + path);
    if (!res.ok) throw new Error(path);
    return res;
  }
  capture ??= Promise.all([read('motions.json').then(r => r.json() as Promise<Capture>), read('motions.bin').then(r => r.arrayBuffer())])
    .then(([meta, bytes]) => ({meta, bytes})).catch(error => { capture = undefined; throw error; });
  return capture;
}

// Studio portrait rig. Depth and weights are calibrated in the texture's UV space.
export function buildPortrait(texture:T.Texture) {
  const geo = new T.PlaneGeometry(.8, 1, 100, 140);
  const xyz = geo.attributes.position, uv = geo.attributes.uv;
  const indices:number[] = [], weights:number[] = [], jaw:number[] = [];
  const bell = (x:number,y:number) => Math.exp(-x*x-y*y);
  for (let i=0;i<xyz.count;i++) {
    const u=uv.getX(i), v=1-uv.getY(i);
    const x=u-.495;
    const face=bell(x/.20,(v-.255)/.24);
    const nose=bell(x/.034,(v-.331)/.044);
    xyz.setZ(i, .11*face + .038*nose + .065*bell(x/.5,(v-.8)/.38));
    const head=1-T.MathUtils.smoothstep(v,.43,.56);
    indices.push(0,1,0,0); weights.push(1-head,head,0,0);
    const lip=bell(x/.056,(v-.397)/.011);
    jaw.push(0,-.007*lip,.002*lip);
  }
  geo.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));
  geo.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
  geo.morphTargetsRelative=true;
  geo.morphAttributes.position=[new T.Float32BufferAttribute(jaw,3)];
  const body=new T.Bone(), head=new T.Bone();
  head.position.set(0,.02,.055); body.add(head);
  const material=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false});
  const mesh=new T.SkinnedMesh(geo,material);
  mesh.add(body);mesh.bind(new T.Skeleton([body,head]));
  return {mesh,body,head};
}

export function motionPlayer({meta,bytes}:Awaited<ReturnType<typeof loadCapture>>) {
  const tracks=meta.clips.map(clip=>({...clip, samples:new Int16Array(bytes,clip.offset,clip.frames*meta.joints.length*4)}));
  const joints=['b_spine2','b_head'].map(name=>meta.joints.indexOf(name));
  const first=new T.Quaternion(), sample=new T.Quaternion(), rest=new T.Quaternion();
  const delta=new T.Euler();
  return (t:number,pose:string,body:T.Bone,head:T.Bone,dt:number) => {
    const clip=tracks.find(c=>c.name===(pose==='talking'?'explain':/listen|attentive/.test(pose)?'listen':'idle')) ?? tracks[0];
    const frame=Math.floor(t*meta.fps)%clip.frames;
    for (const [i,bone] of [body,head].entries()) {
      const k=joints[i]*4;
      first.fromArray(clip.samples,k).normalize().invert();
      sample.fromArray(clip.samples,frame*meta.joints.length*4+k).normalize().multiply(first);
      delta.setFromQuaternion(sample,'YXZ');
      // Restrict turns to the photographed frontal view.
      delta.set(...([delta.x,delta.y,delta.z].map(a=>T.MathUtils.clamp(a*.32,-.09,.09)) as [number,number,number]),'YXZ');
      bone.quaternion.slerp(rest.setFromEuler(delta),1-Math.exp(-dt*7));
    }
  };
}
