import * as THREE from 'three';

/** A crisp text badge as a sprite (always faces the camera). */
export function label(text: string, { color = '#ffffff', background = 'rgba(20,12,40,.72)', border = '#9ef0d8', size = 54, height = .42, glow = false } = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const font = `800 ${size}px Inter, Geist, system-ui, sans-serif`;
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + size * 1.3, h = Math.ceil(size * 1.7);
  canvas.width = w; canvas.height = h;
  ctx.font = font;
  ctx.fillStyle = background;
  ctx.strokeStyle = border;
  ctx.lineWidth = size * .08;
  ctx.beginPath();
  ctx.roundRect(ctx.lineWidth, ctx.lineWidth, w - ctx.lineWidth * 2, h - ctx.lineWidth * 2, h / 2);
  ctx.fill(); ctx.stroke();
  if (glow) { ctx.shadowColor = border; ctx.shadowBlur = size * .35; }
  ctx.fillStyle = color;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2 + size * .04);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(height * (w / h), height, 1);
  return sprite;
}

/** Floating word without a badge, used for the orbiting vocabulary cloud. */
export function word(text: string, color: string, height = .32) {
  return label(text, { color, background: 'rgba(0,0,0,0)', border: 'rgba(0,0,0,0)', size: 64, height, glow: true });
}

/** Big holographic board with wrapped text; call draw() whenever the text changes. */
export function hologram(width = 3.2, heightUnits = 2) {
  const canvas = document.createElement('canvas');
  canvas.width = 1280; canvas.height = Math.round(1280 * heightUnits / width);
  const ctx = canvas.getContext('2d')!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, heightUnits), material);
  function draw(title: string, body: string, time = 0) {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(40,220,200,.20)'); grad.addColorStop(1, 'rgba(110,70,255,.16)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(8, 8, W - 16, H - 16, 36); ctx.fill();
    ctx.strokeStyle = 'rgba(120,255,230,.9)'; ctx.lineWidth = 6; ctx.stroke();
    for (let y = 0; y < H; y += 6) { ctx.fillStyle = `rgba(150,255,240,${0.025 + 0.02 * Math.sin(y * .05 + time * 3)})`; ctx.fillRect(14, y, W - 28, 2); }
    ctx.fillStyle = '#9ffff0';
    ctx.font = '800 44px Inter, system-ui, sans-serif';
    ctx.fillText(title.slice(0, 60), 54, 82);
    ctx.font = '500 40px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    const lines: string[] = [];
    for (const paragraph of body.split('\n')) {
      let line = '';
      for (const token of paragraph.split(' ')) {
        const test = line ? line + ' ' + token : token;
        if (ctx.measureText(test).width > W - 108 && line) { lines.push(line); line = token; } else line = test;
      }
      lines.push(line);
    }
    const max = Math.floor((H - 150) / 52);
    lines.slice(Math.max(0, lines.length - max)).forEach((line, i) => ctx.fillText(line, 54, 150 + i * 52));
    texture.needsUpdate = true;
  }
  return { mesh, draw, dispose() { texture.dispose(); material.dispose(); mesh.geometry.dispose(); } };
}
