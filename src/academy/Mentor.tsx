import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCcw, RotateCw, Focus, AudioLines } from 'lucide-react';
import { voiceEnergy } from './ai';
import { createObservatory, type Destination } from './three/observatory';

type View='card'|'cover'|'classroom';
type Controls={turn:(angle:number)=>void;reset:()=>void;focus:()=>void};
type Props={pose:string;energy?:()=>number;view?:View;wave?:boolean;onSelect?:(id:Destination)=>void};
function disposeScene(root:T.Object3D){
  const materials=new Set<T.Material>(), textures=new Set<T.Texture>();
  root.traverse(obj=>{
    if(!(obj instanceof T.Mesh))return;
    obj.geometry.dispose();
    if(obj instanceof T.SkinnedMesh)obj.skeleton.dispose();
    for(const mat of Array.isArray(obj.material)?obj.material:[obj.material]){
      materials.add(mat);if(mat.map)textures.add(mat.map);
    }
  });
  textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());
}
let modelBytes:Promise<ArrayBuffer>|undefined;
function loadTeacher(){
  modelBytes??=fetch('/teacher/instructor.glb').then(r=>{
    if(!r.ok)throw new Error('teacher');return r.arrayBuffer();
  }).catch(error=>{modelBytes=undefined;throw error;});
  return modelBytes.then(b=>new GLTFLoader().parseAsync(b,''));
}

export default function Mentor({pose,energy=voiceEnergy,view='card',onSelect}:Props){
  const host=useRef<HTMLDivElement>(null),controls=useRef<Controls|null>(null);
  const state=useRef({pose,energy,onSelect});state.current={pose,energy,onSelect};
  const [status,setStatus]=useState<'loading'|'ready'|'fallback'>('loading');
  const [close,setClose]=useState(false);
  const explore=view!=='card';
  useEffect(()=>{
    const el=host.current!;
    let renderer:T.WebGLRenderer;
    try {renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});}
    catch {setStatus('fallback');return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
    renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.99;
    const canvas=renderer.domElement;el.prepend(canvas);
    renderer.shadowMap.enabled=explore;renderer.shadowMap.type=T.PCFSoftShadowMap;
    const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.04,60);
    const studio=createObservatory(scene), orbit=new OrbitControls(camera,canvas);
    orbit.enabled=explore;orbit.enablePan=false;orbit.enableZoom=false;orbit.enableDamping=false;orbit.rotateSpeed=.55;
    orbit.minPolarAngle=Math.PI*.27;orbit.maxPolarAngle=Math.PI*.54;
    const compact=view==='card';
    let detail=compact,closed=false,visible=true,t=0,last=0;
    let mixer:T.AnimationMixer|undefined, active:T.AnimationAction|undefined;
    const face:T.Mesh[]=[],actions=new Map<string,T.AnimationAction>();
    const clock=(dt:number)=>Math.min(.06,Math.max(0,dt));
    const reset=()=>{
      const w=Math.max(1,el.clientWidth),h=Math.max(1,el.clientHeight);
      renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
      const distant=(!detail && w/h<1.05)?3.94:3.48;
      const d=detail?1.34:distant;
      orbit.target.set(!detail && w/h>1.4?.13:0,detail?1.5:.99,0);
      camera.position.set(d*.20,orbit.target.y+(detail?.035:.26),d*.978);
      orbit.update();
    };
    controls.current={reset(){detail=compact;setClose(detail);reset();},focus(){
      const direction=camera.position.clone().sub(orbit.target).normalize();
      detail=!detail;setClose(detail);reset();
      const distance=camera.position.distanceTo(orbit.target);
      camera.position.copy(orbit.target).addScaledVector(direction,distance);orbit.update();
    },turn(a){
      const rel=camera.position.clone().sub(orbit.target);
      camera.position.copy(orbit.target).add(rel.applyAxisAngle(new T.Vector3(0,1,0),a));orbit.update();
    }};
    const sizes=new ResizeObserver(reset);sizes.observe(el);reset();
    const seen=new IntersectionObserver(([e])=>{visible=e.isIntersecting;});seen.observe(el);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    // Directional contact shadows keep the animated figure and plinth on the same floor.
    const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;
    const ctx=shadowCanvas.getContext('2d')!;
    const grad=ctx.createRadialGradient(64,64,0,64,64,62);grad.addColorStop(0,'#070d12bd');grad.addColorStop(1,'#070d1200');ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);
    const shadow=new T.Mesh(new T.PlaneGeometry(.99,.55),new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));
    shadow.rotation.x=-Math.PI/2;shadow.position.y=.043;scene.add(shadow);
    // Use a stable body-sized target even between animated limb poses and on touch screens.
    const hitBody=new T.Mesh(new T.CapsuleGeometry(.21,1.4,4,12),new T.MeshBasicMaterial({visible:false}));
    hitBody.position.y=.95;hitBody.userData.destination='teacher';scene.add(hitBody);
    let teacher:T.Object3D|undefined;
    loadTeacher().then(gltf=>{
      if(closed){disposeScene(gltf.scene);return;}
      teacher=gltf.scene;teacher.position.y=.041;scene.add(teacher);
      teacher.traverse(obj=>{if(obj instanceof T.Mesh){obj.castShadow=true;if(obj.morphTargetInfluences)face.push(obj);}});
      mixer=new T.AnimationMixer(teacher);
      gltf.animations.forEach(clip=>actions.set(clip.name,mixer!.clipAction(clip)));
      setStatus('ready');
    }).catch(()=>{if(!closed)setStatus('fallback');});
    const down=new T.Vector2(), ray=new T.Raycaster();
    function start(e:PointerEvent){down.set(e.clientX,e.clientY);}
    function select(e:PointerEvent){
      if(!state.current.onSelect || down.distanceTo(new T.Vector2(e.clientX,e.clientY))>5 || !teacher)return;
      const b=canvas.getBoundingClientRect();
      camera.updateMatrixWorld();
      ray.setFromCamera(new T.Vector2((e.clientX-b.left)/b.width*2-1,1-(e.clientY-b.top)/b.height*2),camera);
      const hit=ray.intersectObjects([hitBody,...studio.targets],false)[0];
      if(hit)state.current.onSelect(hit.object.userData.destination ?? 'teacher');
    }
    const lost=(e:Event)=>{e.preventDefault();renderer.setAnimationLoop(null);setStatus('fallback');};
    canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('pointerdown',start);canvas.addEventListener('pointerup',select);
    renderer.setAnimationLoop(now=>{
      const dt=clock((now-last)/1000);last=now;
      if(!visible||document.hidden)return;
      const s=state.current,level=s.energy(),speaks=s.pose==='talking'||level>.035;
      const next=actions.get(speaks?'explain':/listen|attentive/.test(s.pose)?'listen':'idle');
      if(next && next!==active){active?.fadeOut(.35);next.reset().fadeIn(.35).play();active=next;}
      if(!reduced.matches){
        t+=dt;mixer?.update(dt);studio.earth.rotation.y=-1.3+t*.08;
        for(const mesh of face){
          mesh.morphTargetInfluences![0]=Math.min(1,level*3+(speaks?.26*Math.abs(Math.sin(t*10)):0));
          mesh.morphTargetInfluences![1]=Math.max(0,1-Math.abs(t%4.1-2.2)*10);
        }
      }
      renderer.render(scene,camera);
    });
    return ()=>{closed=true;controls.current=null;renderer.setAnimationLoop(null);sizes.disconnect();seen.disconnect();orbit.dispose();
      canvas.removeEventListener('pointerdown',start);canvas.removeEventListener('pointerup',select);canvas.removeEventListener('webglcontextlost',lost);
      mixer?.stopAllAction();studio.dispose();disposeScene(scene);renderer.dispose();renderer.forceContextLoss();canvas.remove();};
  },[view,explore]);
  return <div className={'mentor-view observatory-stage observatory-'+view+' scene-'+status} ref={host}>
    {status!=='ready' && <div className="observatory-poster" role="img" aria-label="Ustoz va til rasadxonasi"/>}
    {explore && status==='ready' && <div className="camera-bar" role="group" aria-label="3D kamera">
      <button aria-label="Chapga aylantirish" title="Chapga aylantirish" onClick={()=>controls.current?.turn(-Math.PI/4)}><RotateCcw size={17}/></button>
      <button aria-label="O‘ngga aylantirish" title="O‘ngga aylantirish" onClick={()=>controls.current?.turn(Math.PI/4)}><RotateCw size={17}/></button>
      <button aria-pressed={close} onClick={()=>controls.current?.focus()}><Focus size={17}/>{close?'Umumiy plan':'Yaqin plan'}</button>
      <button aria-label="Kamerani tiklash" title="Kamerani tiklash" onClick={()=>controls.current?.reset()}>↺</button>
    </div>}
    {view==='cover' && status==='ready' && <span className="scene-help">Ko‘rish uchun sahnani suring</span>}
    {explore && status==='fallback' && <span className="scene-help"><AudioLines size={14}/> Studiya tasviri</span>}
  </div>;
}
