import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type Destination = 'grammar'|'ielts'|'speaking'|'games'|'teacher';

function lettering(title:string, subtitle:string) {
  const canvas=document.createElement('canvas'); canvas.width=768;canvas.height=256;
  const ctx=canvas.getContext('2d')!;
  ctx.fillStyle='#12303a';ctx.fillRect(0,0,768,256);
  ctx.strokeStyle='#ab8a53';ctx.lineWidth=3;ctx.strokeRect(10,10,748,236);
  ctx.fillStyle='#f0ddb8';ctx.font='52px Georgia';ctx.fillText(title,42,117);
  ctx.fillStyle='#b3d6cf';ctx.font='26px system-ui';ctx.fillText(subtitle,44,183);
  const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;
  return tex;
}

export function createObservatory(scene:T.Scene) {
  const loader=new T.TextureLoader();
  const panorama=loader.load('/teacher/foothills.webp');
  panorama.colorSpace=T.SRGBColorSpace;panorama.wrapS=T.RepeatWrapping;panorama.repeat.x=3;
  const sky=new T.Mesh(new T.CylinderGeometry(22,22,16,96,1,true),new T.MeshBasicMaterial({map:panorama,side:T.BackSide,fog:false}));
  sky.position.y=2;scene.add(sky);
  scene.background=new T.Color(0x9eacb6);
  const matte=(color:number,metalness=0,roughness=.7)=>new T.MeshStandardMaterial({color,metalness,roughness});
  const steel=matte(0x1c333d,.38),brass=matte(0xba9562,.36,.36),wood=matte(0x724637),oak=matte(0xab7952),stone=matte(0x30434a),slate=matte(0x172b33);
  // Radial-cut oak veneer with a restrained grain and staggered plank joints.
  const surface=document.createElement('canvas');surface.width=surface.height=512;
  const brush=surface.getContext('2d')!;
  brush.fillStyle='#806b54';brush.fillRect(0,0,512,512);
  let seed=82;
  function noise(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
  for(let plank=0;plank<8;plank++){
    const x=plank*64, value=Math.floor(83+noise()*15);
    brush.fillStyle='rgb('+[value+24,value+8,value-8].join(',')+')';brush.fillRect(x,0,64,512);
    for(let line=0;line<195;line++){
      const at=x+noise()*63;brush.beginPath();brush.moveTo(at,0);
      brush.bezierCurveTo(at+noise()*4,180,at-noise()*4,360,at,512);
      brush.strokeStyle=noise()>.5?'#2f221919':'#dcc59c1d';brush.lineWidth=noise()*1.1+.2;brush.stroke();
    }
    brush.fillStyle='#463c34';brush.fillRect(x,0,1.5,512);brush.fillRect(x,Math.floor(noise()*512),64,1.5);
  }
  const veneer=new T.CanvasTexture(surface);veneer.wrapS=veneer.wrapT=T.RepeatWrapping;
  veneer.repeat.set(6,6);veneer.colorSpace=T.SRGBColorSpace;veneer.anisotropy=4;
  const parquet=new T.MeshStandardMaterial({map:veneer,roughness:.68});
  const glow=new T.MeshBasicMaterial({color:0xffdfaa});
  const groups=new Map<T.Material,T.BufferGeometry[]>();
  const box=new T.BoxGeometry(), cylinder=new T.CylinderGeometry(1,1,1,64);
  const matrix=new T.Matrix4(),rot=new T.Euler(),q=new T.Quaternion(),v=new T.Vector3(),s=new T.Vector3();
  function put(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number,sx:number,sy:number,sz:number,rx=0,ry=0,rz=0){
    const geo=g.clone();matrix.compose(v.set(x,y,z),q.setFromEuler(rot.set(rx,ry,rz)),s.set(sx,sy,sz));
    geo.applyMatrix4(matrix);if(!groups.has(m))groups.set(m,[]);groups.get(m)!.push(geo);
  }
  function deck(r:number,y:number,h:number,m:T.Material){put(cylinder,m,0,y,0,r,h,r);}
  function ring(r:number,y:number,width:number,m:T.Material){
    const g=new T.TorusGeometry(r,width,8,96);put(g,m,0,y,0,1,1,1,Math.PI/2);g.dispose();
  }
  // A walk-around circular gallery with visible floor joints, timber ribs and high clerestory.
  deck(5,-.19,.26,slate);deck(4.96,-.053,.035,parquet);deck(1.65,.003,.07,slate);
  for(const r of [1.56,1.61,2.8,4.85])ring(r,r<2?.04:-.03,.007,brass);
  for(let i=0;i<72;i++){
    const a=i*Math.PI/36;const len=i%6===0?.11:.047;
    put(box,brass,Math.sin(a)*(1.51-len/2),.04,Math.cos(a)*(1.51-len/2),.01,.005,len,0,a);
  }
  for(let i=0;i<24;i++){
    const a=i*Math.PI/12,x=Math.sin(a)*4.65,z=Math.cos(a)*4.65;
    put(box,steel,x,1.8,z,.085,3.7,.13,0,a);
    put(box,oak,x*.989,1.79,z*.989,.032,3.65,.05,0,a);
    put(box,wood,x*.54,3.74,z*.54,.08,.17,4.33,0,a);
    if(i%3===0)put(box,glow,x*.54,3.644,z*.54,.022,.009,3.55,0,a);
  }
  for(const y of [.25,.33,.81,3.27,3.62])ring(4.66,y,.038,steel);
  ring(1.55,3.72,.055,brass);ring(1.50,3.7,.016,glow);
  // A curved low library; the individual spines are batched into a handful of draw calls.
  const bindings=[0x9e6245,0x355b5c,0xbb9e6c,0x526772,0x432d29].map(c=>matte(c));
  for(let bay=0;bay<8;bay++){
    const a=Math.PI*.59+bay*.205;
    const R=4.22, x=Math.sin(a)*R,z=Math.cos(a)*R;
    for(const y of [.04,.38,.73])put(box,wood,x,y,z,.84,.048,.36,0,a);
    for(let row=0;row<2;row++)for(let k=0;k<11;k++){
      const off=(k-5)*.066,h=.20+((k*13+row*5+bay)%9)*.011;
      put(box,bindings[(k+bay+row)%5],x+Math.cos(a)*off,.07+.34*row+h/2,z-Math.sin(a)*off,.055,h,.21,0,a);
    }
  }
  const globe=new T.Group();globe.position.set(1.80,1.55,-2.65);scene.add(globe);
  const atlas=loader.load('/teacher/atlas.webp');atlas.colorSpace=T.SRGBColorSpace;
  const earth=new T.Mesh(new T.SphereGeometry(.46,56,36),new T.MeshStandardMaterial({map:atlas,roughness:.57,emissive:0x134956,emissiveIntensity:.32}));
  earth.rotation.z=.20;globe.add(earth);
  for(const angle of [-.42,.56]){
    const hoop=new T.Mesh(new T.TorusGeometry(.52,.011,8,80),brass);hoop.rotation.set(.18,angle,.34);globe.add(hoop);
  }
  put(cylinder,brass,1.80,.89,-2.65,.045,1.15,.045);
  put(cylinder,stone,1.80,.27,-2.65,.33,.54,.33);
  const targets:T.Object3D[]=[earth];earth.userData.destination='ielts';
  const labels:T.Texture[]=[];
  function sign(x:number,z:number,yaw:number,destination:Destination,title:string,sub:string){
    const tex=lettering(title,sub);labels.push(tex);
    const sign=new T.Mesh(new T.BoxGeometry(1.16,.392,.047),[steel,steel,steel,steel,new T.MeshBasicMaterial({map:tex}),steel]);
    sign.position.set(x,destination==='ielts'?.73:1.08,z);sign.rotation.y=yaw;scene.add(sign);
    put(box,brass,x,.53,z,.032,1.06,.032);
    sign.userData.destination=destination;targets.push(sign);
  }
  sign(-1.53,-1.44,.25,'grammar','Grammatika','A1  —  C1     ↗');
  sign(1.83,-2.13,-.2,'ielts','IELTS markazi','Mock imtihonlar     ↗');
  // Arched window tracery and brass mullions frame the mountains from every camera angle.
  const arc=new T.TorusGeometry(.53,.028,8,40,Math.PI);
  for(let i=0;i<24;i++){
    const a=(i+.5)*Math.PI/12;
    put(arc,brass,Math.sin(a)*4.61,2.59,Math.cos(a)*4.61,1.12,1.45,1,0,a);
  }
  arc.dispose();
  // Walnut reading desks and recessed task lamps occupy the outer gallery.
  for(const a of [-1.55,-2.2,1.59,2.10]){
    const x=Math.sin(a)*3.83,z=Math.cos(a)*3.83;
    put(box,oak,x,.78,z,1.32,.065,.59,0,a);
    for(const j of [-.48,.48]){
      put(box,steel,x+Math.cos(a)*j,.38,z-Math.sin(a)*j,.055,.74,.38,0,a);
    }
    put(cylinder,brass,x,1.02,z,.016,.44,.016);
    put(cylinder,glow,x,1.27,z,.14,.06,.14);
  }
  for(const [material,geometries] of groups){
    const merged=mergeGeometries(geometries)!;
    const mesh=new T.Mesh(merged,material);mesh.receiveShadow=true;scene.add(mesh);
    geometries.forEach(g=>g.dispose());
  }
  box.dispose();cylinder.dispose();
  scene.add(new T.HemisphereLight(0xfff1df,0x9aaab4,1.55));
  const key=new T.DirectionalLight(0xffe5ce,2.0);key.position.set(-3,5,4);key.castShadow=true;
  Object.assign(key.shadow.camera,{left:-3,right:3,top:3,bottom:-3,near:.4,far:13});
  key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0006;scene.add(key);
  const rim=new T.DirectionalLight(0xc4eeff,1.1);rim.position.set(3,3,-2);scene.add(rim);
  return {targets,earth,dispose(){panorama.dispose();atlas.dispose();labels.forEach(t=>t.dispose());}};
}
