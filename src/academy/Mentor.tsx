import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

function dispose(root: THREE.Object3D) {
  root.traverse(child => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach(material => material.dispose());
    if (child instanceof THREE.SkinnedMesh) child.skeleton.dispose();
  });
}

// Fit the coach uniform to Geno's bind-pose vertices so it follows the skin.
function dressCoach(scene: THREE.Object3D) {
  const color = new THREE.Color();
  scene.traverse(mesh => {
    if (!(mesh instanceof THREE.SkinnedMesh)) return;
    const points = mesh.geometry.getAttribute('position');
    const colors = [];
    for (let i = 0; i < points.count; i++) {
      const y = points.getY(i), x = Math.abs(points.getX(i));
      let shade = 0x203246;
      if (y > 1.43 || x > .49) shade = 0xd1e0e3;
      else if (y > .88) {
        shade = x > .33 ? 0x167e80 : 0x10555d;
        if (Math.abs(y - 1.23 - x * .32) < .018 || x < .009) shade = 0xffc66c;
      }
      color.setHex(shade);
      colors.push(color.r, color.g, color.b);
    }
    mesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    mesh.material.dispose();
    mesh.material = new THREE.MeshStandardMaterial({vertexColors:true, roughness:.48, metalness:.22});
    mesh.frustumCulled = false;
  });
  const head = scene.getObjectByName('Head');
  if (!head) return;
  const headset = new THREE.Group();
  const oval = (x:number,y:number,z:number,w:number,h:number,d:number,tint:number) => {
    const part = new THREE.Mesh(new THREE.SphereGeometry(1,32,20),
      new THREE.MeshStandardMaterial({color:tint, roughness:.32, metalness:.28}));
    part.position.set(x,y,z); part.scale.set(w,h,d); headset.add(part);
  };
  oval(0,1.605,.046,.089,.049,.062,0x102c3a);
  for (const side of [-1,1]) {
    oval(side*.034,1.608,.101,.014,.009,.008,0x75ffdc);
    oval(side*.084,1.59,-.012,.016,.039,.032,0xe9ac53);
  }
  scene.add(headset);
  scene.updateMatrixWorld(true);
  head.attach(headset);
}

export default function Mentor({ pose }: { pose: string }) {
  const host = useRef<HTMLDivElement>(null);
  const current = useRef(pose);
  const [failed, setFailed] = useState(false);
  useEffect(() => { current.current = pose; }, [pose]);
  useEffect(() => {
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
    catch { setFailed(true); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(31, 1, 0.01, 30);
    scene.add(new THREE.HemisphereLight(0xffeed5, 0x537995, 2.2));
    for (const [x,y,z,color,intensity] of [[2,3,4,0xffe0ba,3],[-2,2,-2,0x77e4ff,4]]) {
      const light = new THREE.DirectionalLight(color,intensity);
      light.position.set(x,y,z); scene.add(light);
    }
    let inactive = false;
    let mixer: THREE.AnimationMixer | undefined;
    let actions: Record<string, THREE.AnimationAction> = {};
    let active: THREE.AnimationAction | undefined;
    const resize = () => {
      const w=Math.max(1,el.clientWidth), h=Math.max(1,el.clientHeight);
      renderer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix();
    };
    const observer=new ResizeObserver(resize);observer.observe(el);resize();
    new GLTFLoader().load('/mentor/geno.glb', model => {
      if (inactive) { dispose(model.scene); return; }
      scene.add(model.scene);
      dressCoach(model.scene);
      mixer=new THREE.AnimationMixer(model.scene);
      actions=Object.fromEntries(model.animations.map(clip=>[clip.name,mixer!.clipAction(clip)]));
      const height=new THREE.Box3().setFromObject(model.scene).getSize(new THREE.Vector3()).y;
      camera.position.set(height*.1,height*.78,height*1.12);
      camera.lookAt(0,height*.72,0);
    },undefined,()=>{ if (!inactive) setFailed(true); });
    let last=performance.now();
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    renderer.setAnimationLoop(now=>{
      const next=actions[current.current] ?? actions.idle;
      if (next && active!==next) {
        active?.fadeOut(.25); next.reset().fadeIn(.25).play(); active=next;
      }
      mixer?.update(reduced.matches ? 0 : Math.min(.08,Math.max(0,now-last)/1000));
      last=now;renderer.render(scene,camera);
    });
    return ()=>{inactive=true;observer.disconnect();renderer.setAnimationLoop(null);mixer?.stopAllAction();dispose(scene);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
  },[]);
  return <div ref={host} className="mentor-view" role="img" aria-label="Geno — ingliz tili murabbiyi">{failed && <span>Shaharcha ustozi</span>}</div>;
}
