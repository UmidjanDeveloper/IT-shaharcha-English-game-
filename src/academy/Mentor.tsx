import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import frames from './mentor-motion.json';

export default function Mentor({ pose }: { pose: string }) {
  const host = useRef<HTMLDivElement>(null);
  const state = useRef(pose);
  const [fallback, setFallback] = useState(false);
  useEffect(() => { state.current = pose; }, [pose]);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
    catch { setFallback(true); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 10);
    camera.position.set(0.25, 0.13, 3.4);
    camera.lookAt(0, -0.04, 0);
    scene.add(new THREE.HemisphereLight(0xfff5ff, 0x8065ab, 2.6));
    const light = new THREE.DirectionalLight(0xffe9ca, 3);
    light.position.set(2, 4, 3);
    scene.add(light);
    const sphere = new THREE.SphereGeometry(1, 24, 18);
    const materials = [0x9061d8, 0xd2f775, 0x332047].map(color => new THREE.MeshStandardMaterial({color, roughness: 0.36}));
    const robot = new THREE.Group();
    scene.add(robot);
    function part(material: number) {
      const mesh = new THREE.Mesh(sphere, materials[material]);
      robot.add(mesh);
      return mesh;
    }
    const head = part(0), visor = part(2), torso = part(0);
    const eyes = [part(1), part(1)];
    const bones = [[3,4],[4,5],[6,7],[7,8],[9,10],[10,11],[12,13],[13,14]];
    const limbs = bones.map(() => part(0));
    const joints = frames[0].map(() => part(1));
    const points = frames[0].map(() => new THREE.Vector3());
    const direction = new THREE.Vector3(), up = new THREE.Vector3(0,1,0);
    function resize() {
      renderer.setSize(element!.clientWidth, element!.clientHeight);
      camera.aspect = element!.clientWidth / Math.max(1,element!.clientHeight);
      camera.updateProjectionMatrix();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const start = performance.now();
    renderer.setAnimationLoop(time => {
      const phase = reduced.matches ? 0 : (time - start) * 0.012;
      const frame = Math.max(0,phase) % frames.length;
      const left = frames[Math.floor(frame)], right = frames[(Math.floor(frame)+1)%frames.length];
      points.forEach((p,i) => {
        const a = left[i], b = right[i], f = frame % 1;
        p.set(a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f);
        joints[i].position.copy(p);
        joints[i].scale.setScalar(0.055);
      });
      bones.forEach(([a,b],i) => {
        direction.subVectors(points[b],points[a]);
        limbs[i].position.copy(points[a]).addScaledVector(direction,0.5);
        limbs[i].scale.set(0.062,direction.length()/2,0.062);
        limbs[i].quaternion.setFromUnitVectors(up,direction.normalize());
      });
      torso.position.copy(points[0]).lerp(points[1],0.55);
      torso.scale.set(0.22,0.28,0.15);
      head.position.copy(points[2]); head.position.y += 0.07;
      head.scale.set(0.255,0.21,0.2);
      visor.position.copy(head.position); visor.position.z += 0.13; visor.scale.set(0.21,0.14,0.1);
      eyes.forEach((eye,i) => {
        eye.position.copy(visor.position); eye.position.x += i ? 0.083 : -0.083;
        eye.position.z += 0.09; eye.scale.set(0.026,0.035,0.016);
      });
      robot.rotation.y = state.current === 'listening' ? -0.22 : 0.12;
      if (!reduced.matches && state.current === 'talking') head.rotation.x = Math.sin(phase)*0.06;
      renderer.render(scene,camera);
    });
    return () => {
      observer.disconnect(); renderer.setAnimationLoop(null);
      sphere.dispose(); materials.forEach(material => material.dispose());
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, []);
  return <div className="mentor-view" ref={host} role="img" aria-label="Harakatlanuvchi 3D ingliz tili ustozi">{fallback && <span aria-hidden="true">🤖</span>}</div>;
}
