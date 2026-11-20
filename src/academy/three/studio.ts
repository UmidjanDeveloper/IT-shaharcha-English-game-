// Shared look for the 3D scenes: a dark studio with a girih-pattern floor (Uzbek geometric art),
// a curved light wall, floating glass panels and dust in the light.
import * as THREE from 'three';

/** Eight-point star (girih) line pattern, drawn once and tiled. */
export function girihTexture(color = 'rgba(120,240,225,0.55)', size = 512) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.strokeStyle = color; ctx.lineWidth = size / 220;
  const star = (cx: number, cy: number, r: number) => {
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI * 2 + Math.PI / 8, rr = i % 2 ? r * .62 : r;
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke();
  };
  const step = size / 2;
  for (let y = 0; y <= 2; y++) for (let x = 0; x <= 2; x++) {
    star(x * step, y * step, step * .42);
    ctx.beginPath(); ctx.arc(x * step, y * step, step * .14, 0, Math.PI * 2); ctx.stroke();
    if (x < 2 && y < 2) { star(x * step + step / 2, y * step + step / 2, step * .2); }
  }
  ctx.globalAlpha = .5;
  for (let i = 0; i <= 2; i++) {
    ctx.beginPath(); ctx.moveTo(i * step, 0); ctx.lineTo(i * step, size); ctx.moveTo(0, i * step); ctx.lineTo(size, i * step); ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function studioFloor(radius = 14, repeat = 16) {
  const pattern = girihTexture();
  pattern.repeat.set(repeat, repeat);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(radius, 96), new THREE.MeshStandardMaterial({
    color: 0x0b1224, roughness: .32, metalness: .55, emissive: 0xffffff, emissiveMap: pattern, emissiveIntensity: .05,
  }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  const group = new THREE.Group(); group.add(floor);
  // Fade the floor pattern out towards the edge.
  const fade = new THREE.Mesh(new THREE.CircleGeometry(radius, 96), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { color: { value: new THREE.Color(0x0a1226) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 color; varying vec2 vUv; void main(){ float d = distance(vUv, vec2(.5)) * 2.0; gl_FragColor = vec4(color, smoothstep(.45, 1.0, d) * .9); }',
  }));
  fade.rotation.x = -Math.PI / 2; fade.position.y = .003; group.add(fade);
  return group;
}

/** Curved wall of light behind the stage, with a slow living gradient and the girih pattern. */
export function lightWall(radius = 9, height = 7) {
  const pattern = girihTexture('rgba(150,255,240,0.9)', 512);
  pattern.repeat.set(16, 6);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false,
    uniforms: { time: { value: 0 }, map: { value: pattern }, energy: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float time; uniform float energy; uniform sampler2D map; varying vec2 vUv;
      void main(){
        vec3 deep = vec3(0.02,0.035,0.08), teal = vec3(0.03,0.24,0.27), violet = vec3(0.10,0.07,0.24);
        float wave = 0.5 + 0.5 * sin(vUv.x * 6.0 + time * 0.25);
        vec3 c = mix(deep, mix(violet, teal, wave), smoothstep(0.0, 0.9, 1.0 - vUv.y) * 0.55);
        float lines = texture2D(map, vUv * vec2(16.0, 6.0)).a;
        float pulse = 0.025 + 0.025 * sin(time * 0.6 + vUv.x * 12.0) + energy * 0.08;
        c += vec3(0.4, 1.0, 0.95) * lines * pulse * (1.0 - vUv.y * 0.6);
        float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
        // Blend the foot of the wall into the floor so there is no seam.
        c = mix(vec3(0.04, 0.07, 0.15), c, smoothstep(0.0, 0.22, vUv.y));
        gl_FragColor = vec4(c, edge * 0.95);
      }`,
  });
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 96, 1, true, Math.PI * .62, Math.PI * .76), material);
  wall.position.y = height / 2 - .02;
  return { wall, material };
}

/** Additive cone of light from above (a stage spotlight you can see). */
export function lightCone(radius = 1.2, height = 5.5, color = 0x8ff8ea) {
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(.08, radius, height, 48, 1, true), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { color: { value: new THREE.Color(color) }, strength: { value: .16 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 color; uniform float strength; varying vec2 vUv; void main(){ float a = (1.0 - vUv.y) * 0.25 + vUv.y * 0.9; gl_FragColor = vec4(color, strength * (1.0 - vUv.y) * a); }',
  }));
  cone.position.y = height / 2;
  return cone;
}

export function dust(count = 500, spread = 8, height = 5) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) positions.set([(Math.random() - .5) * spread, Math.random() * height, (Math.random() - .5) * spread * .6], i * 3);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xbffcf2, size: .018, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false }));
  return { points, update(t: number) { points.rotation.y = t * .015; points.position.y = Math.sin(t * .2) * .05; } };
}

/** Frosted-glass information panel with a title, a line of detail and a small tag. */
export function glassPanel(title: string, detail: string, tag: string, accent: string, width = 1.5, height = .82) {
  const W = 1024, H = Math.round(W * height / width);
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const draw = (hover: number) => {
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, `rgba(30,44,80,${.72 + hover * .12})`); g.addColorStop(1, `rgba(12,18,40,${.62 + hover * .12})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(6, 6, W - 12, H - 12, 46); ctx.fill();
    ctx.lineWidth = 4 + hover * 3; ctx.strokeStyle = hover ? accent : 'rgba(190,240,255,.38)'; ctx.stroke();
    const shine = ctx.createLinearGradient(0, 0, 0, H * .5);
    shine.addColorStop(0, 'rgba(255,255,255,.14)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine; ctx.beginPath(); ctx.roundRect(10, 10, W - 20, H * .45, 40); ctx.fill();
    ctx.fillStyle = accent; ctx.font = '700 34px Inter, system-ui, sans-serif'; ctx.fillText(tag.toUpperCase(), 64, 92);
    ctx.fillStyle = '#ffffff'; ctx.font = '800 92px Inter, system-ui, sans-serif'; ctx.fillText(title, 60, 210);
    ctx.fillStyle = 'rgba(220,232,255,.82)'; ctx.font = '500 40px Inter, system-ui, sans-serif'; ctx.fillText(detail, 64, 290);
    ctx.fillStyle = accent; ctx.font = '700 40px Inter, system-ui, sans-serif'; ctx.fillText('Ochish  →', 64, H - 64);
    texture.needsUpdate = true;
  };
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
  draw(0);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }));
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(width * 1.18, height * 1.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(accent), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  glow.position.z = -.02;
  const group = new THREE.Group(); group.add(glow, mesh);
  return { group, mesh, glow, draw };
}
