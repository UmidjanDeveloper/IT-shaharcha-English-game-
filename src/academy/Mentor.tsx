import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { voiceEnergy } from './ai';
import { buildPortrait, loadCapture, motionPlayer } from './three/portrait';

type View = 'card'|'cover'|'classroom';
export default function Mentor({pose,energy=voiceEnergy,view='card'}:{pose:string;energy?:()=>number;view?:View;wave?:boolean}) {
  const host=useRef<HTMLDivElement>(null);
  const state=useRef({pose,energy});
  const [ready,setReady]=useState(false);
  useEffect(()=>{state.current={pose,energy};},[pose,energy]);
  useEffect(()=>{
    const el=host.current!;
    let renderer:T.WebGLRenderer;
    try { renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'}); }
    catch { return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
    el.append(renderer.domElement);
    const scene=new T.Scene(), camera=new T.PerspectiveCamera(28,1,.01,30);
    const studioDepth=4;
    const loader=new T.TextureLoader();
    let disposed=false,loaded=0;
    const complete=()=>{ if (!disposed && ++loaded===2) setReady(true); };
    const texture=loader.load('/teacher/portrait.webp',complete);
    const room=loader.load('/teacher/atelier.webp',complete);
    texture.colorSpace=room.colorSpace=T.SRGBColorSpace;
    const actor=buildPortrait(texture);
    scene.add(actor.mesh);
    const interior=new T.PlaneGeometry(1,1,40,30);
    const wall=new T.Mesh(interior,new T.MeshBasicMaterial({map:room,toneMapped:false}));
    scene.add(wall);
    camera.position.z=2;
    const resize=()=>{
      const w=Math.max(1,el.clientWidth),h=Math.max(1,el.clientHeight);
      renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
      const height=4*Math.tan(T.MathUtils.degToRad(14));
      const span=height*w/h;
      const scale=view==='cover' ? Math.min(1.10,span*.93) : Math.min(1.12,span*1.65);
      actor.mesh.scale.setScalar(scale);
      actor.mesh.position.set(view==='cover' && w>680 ? span*.245 : 0,-.055,0);
      // Project the architecture onto a recessed wall, side returns and foreground floor.
      const roomH=Math.max(height*2,span*2/(1672/941))*1.06,roomW=roomH*1672/941;
      const p=interior.attributes.position, uv=interior.attributes.uv;
      for(let i=0;i<p.count;i++){
        const x=uv.getX(i)-.5,y=uv.getY(i)-.5;
        const depth=studioDepth-Math.max(0,-y-.26)*3-Math.max(0,Math.abs(x)-.36)*2;
        p.setXYZ(i,x*roomW*depth/studioDepth,y*roomH*depth/studioDepth,camera.position.z-depth);
      }
      p.needsUpdate=true;interior.computeBoundingSphere();
    };
    const size=new ResizeObserver(resize);size.observe(el);resize();
    let updateMotion:ReturnType<typeof motionPlayer>|undefined;
    loadCapture().then(data=>{if(!disposed)updateMotion=motionPlayer(data);}).catch(()=>{});
    const reduce=matchMedia('(prefers-reduced-motion: reduce)');
    let visible=true,last=0,time=0,point=0;
    const seen=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;});seen.observe(el);
    function move(e:PointerEvent){ const b=el.getBoundingClientRect();point=T.MathUtils.clamp((e.clientX-b.left)/b.width*2-1,-1,1); }
    el.addEventListener('pointermove',move);
    renderer.setAnimationLoop(now=>{
      const dt=Math.min(.065,(now-last)/1000);last=now;
      if (!visible || document.hidden) return;
      if (!reduce.matches) {
        time+=dt;updateMotion?.(time,state.current.pose,actor.body,actor.head,dt);
        camera.position.x=T.MathUtils.damp(camera.position.x,point*.024,4,dt);
        camera.lookAt(0,0,0);
        const level=state.current.energy();
        actor.mesh.morphTargetInfluences![0]=Math.min(1,level*2 + (state.current.pose==='talking' ? .35*Math.abs(Math.sin(time*10)) : 0));
      }
      renderer.render(scene,camera);
    });
    return ()=>{disposed=true;renderer.setAnimationLoop(null);el.removeEventListener('pointermove',move);size.disconnect();seen.disconnect();
      texture.dispose();room.dispose();interior.dispose();wall.material.dispose();actor.mesh.geometry.dispose();actor.mesh.material.dispose();actor.mesh.skeleton.dispose();
      renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
  },[view]);
  return <div className={'mentor-view portrait-stage portrait-'+view+(ready?' is-ready':'')} ref={host} role="img" aria-label="IT Shaharcha ingliz tili ustozi studiyada"><img src="/teacher/portrait.webp" alt=""/></div>;
}
