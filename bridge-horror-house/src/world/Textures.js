import * as THREE from 'three';

// ---------------------------------------------------------------------------
// All textures are drawn on <canvas> at runtime — zero binary assets.
// Color maps use SRGB color space; bump/rough maps stay linear.
// ---------------------------------------------------------------------------

function canvas(size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}

function rand(a, b) {
  return a + Math.random() * (b - a);
}

function colorTexture(cvs, repeat = 1) {
  const t = new THREE.CanvasTexture(cvs);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  return t;
}

function dataTexture(cvs, repeat = 1) {
  const t = new THREE.CanvasTexture(cvs);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  return t;
}

function grain(ctx, w, h, amount, alpha) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
    if (alpha !== undefined) d[i + 3] = Math.min(255, d[i + 3] + Math.random() * alpha);
  }
  ctx.putImageData(img, 0, 0);
}

// --------------------------- Aged wood plank floor -------------------------
export function makeWoodFloor() {
  const s = 512;
  const cvs = canvas(s);
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#2a1d12';
  ctx.fillRect(0, 0, s, s);
  const planks = 6;
  const pw = s / planks;
  for (let i = 0; i < planks; i++) {
    const base = rand(28, 52);
    ctx.fillStyle = `rgb(${base + 14},${base},${base - 8})`;
    ctx.fillRect(i * pw, 0, pw, s);
    // wood grain streaks
    for (let g = 0; g < 40; g++) {
      ctx.strokeStyle = `rgba(0,0,0,${rand(0.04, 0.16)})`;
      ctx.lineWidth = rand(0.5, 2);
      ctx.beginPath();
      const x = i * pw + rand(2, pw - 2);
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + rand(-6, 6), s * 0.33, x + rand(-6, 6), s * 0.66, x + rand(-4, 4), s);
      ctx.stroke();
    }
    // plank gap
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(i * pw, 0, 2, s);
    // occasional dark stain
    if (Math.random() < 0.5) {
      const grd = ctx.createRadialGradient(
        i * pw + rand(10, pw), rand(40, s - 40), 2,
        i * pw + rand(10, pw), rand(40, s - 40), rand(30, 90));
      grd.addColorStop(0, 'rgba(0,0,0,0.35)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(i * pw, 0, pw, s);
    }
  }
  grain(ctx, s, s, 22);
  return { map: colorTexture(cvs, 5), bump: makeBumpFrom(cvs, 5) };
}

// --------------------------- Stained striped wallpaper ---------------------
export function makeWallpaper() {
  const s = 512;
  const cvs = canvas(s);
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#37302a';
  ctx.fillRect(0, 0, s, s);
  // vertical damask stripes
  const stripe = 40;
  for (let x = 0; x < s; x += stripe) {
    ctx.fillStyle = (x / stripe) % 2 === 0 ? '#3f3630' : '#332b26';
    ctx.fillRect(x, 0, stripe, s);
  }
  // faded floral motif dots
  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = `rgba(90,74,58,${rand(0.05, 0.16)})`;
    const r = rand(4, 12);
    ctx.beginPath();
    ctx.arc(rand(0, s), rand(0, s), r, 0, Math.PI * 2);
    ctx.fill();
  }
  // water stains creeping from top
  for (let i = 0; i < 7; i++) {
    const grd = ctx.createLinearGradient(0, 0, 0, rand(120, 300));
    grd.addColorStop(0, `rgba(20,12,6,${rand(0.3, 0.6)})`);
    grd.addColorStop(1, 'rgba(20,12,6,0)');
    ctx.fillStyle = grd;
    const w = rand(30, 90);
    ctx.fillRect(rand(0, s - w), 0, w, rand(120, 300));
  }
  // peeling / cracks
  for (let i = 0; i < 30; i++) {
    ctx.strokeStyle = `rgba(0,0,0,${rand(0.1, 0.3)})`;
    ctx.lineWidth = rand(0.5, 1.5);
    ctx.beginPath();
    let x = rand(0, s), y = rand(0, s);
    ctx.moveTo(x, y);
    for (let k = 0; k < 5; k++) { x += rand(-30, 30); y += rand(4, 40); ctx.lineTo(x, y); }
    ctx.stroke();
  }
  grain(ctx, s, s, 16);
  return { map: colorTexture(cvs, 3), bump: makeBumpFrom(cvs, 3) };
}

// --------------------------- Cracked plaster ceiling -----------------------
export function makeCeiling() {
  const s = 512;
  const cvs = canvas(s);
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#2b2622';
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 300; i++) {
    ctx.fillStyle = `rgba(${rand(20, 60) | 0},${rand(18, 52) | 0},${rand(16, 46) | 0},0.5)`;
    ctx.fillRect(rand(0, s), rand(0, s), rand(2, 10), rand(2, 10));
  }
  // long cracks
  for (let i = 0; i < 18; i++) {
    ctx.strokeStyle = `rgba(0,0,0,${rand(0.3, 0.6)})`;
    ctx.lineWidth = rand(0.6, 2);
    ctx.beginPath();
    let x = rand(0, s), y = rand(0, s);
    ctx.moveTo(x, y);
    for (let k = 0; k < 8; k++) { x += rand(-40, 40); y += rand(-40, 40); ctx.lineTo(x, y); }
    ctx.stroke();
  }
  grain(ctx, s, s, 20);
  return { map: colorTexture(cvs, 4), bump: makeBumpFrom(cvs, 4) };
}

// --------------------------- Dark furniture wood ---------------------------
export function makeFurnitureWood() {
  const s = 256;
  const cvs = canvas(s);
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#1c130c';
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 60; i++) {
    ctx.strokeStyle = `rgba(${rand(40, 70) | 0},${rand(26, 44) | 0},14,${rand(0.1, 0.3)})`;
    ctx.lineWidth = rand(0.5, 2);
    ctx.beginPath();
    const y = rand(0, s);
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(s * 0.33, y + rand(-8, 8), s * 0.66, y + rand(-8, 8), s, y + rand(-6, 6));
    ctx.stroke();
  }
  grain(ctx, s, s, 14);
  return { map: colorTexture(cvs, 1), bump: makeBumpFrom(cvs, 1) };
}

// --------------------------- Door wood -------------------------------------
export function makeDoorWood() {
  const s = 256;
  const cvs = canvas(s);
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#241812';
  ctx.fillRect(0, 0, s, s);
  // two recessed panels
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 24, s - 60, s * 0.42);
  ctx.strokeRect(30, s * 0.54, s - 60, s * 0.40);
  for (let i = 0; i < 80; i++) {
    ctx.strokeStyle = `rgba(${rand(40, 66) | 0},${rand(26, 40) | 0},18,${rand(0.08, 0.22)})`;
    ctx.beginPath();
    const x = rand(0, s);
    ctx.moveTo(x, 0); ctx.lineTo(x + rand(-6, 6), s); ctx.stroke();
  }
  grain(ctx, s, s, 12);
  return { map: colorTexture(cvs, 1), bump: makeBumpFrom(cvs, 1) };
}

// --------------------------- Creepy portrait -------------------------------
export function makePortrait(seed = Math.random()) {
  const s = 256;
  const cvs = canvas(s);
  const ctx = cvs.getContext('2d');
  // aged canvas background
  const bg = ctx.createRadialGradient(s / 2, s / 2, 10, s / 2, s / 2, s * 0.7);
  bg.addColorStop(0, '#3a3020');
  bg.addColorStop(1, '#120d08');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, s, s);

  const cx = s / 2, cy = s * 0.52;
  // gaunt face
  ctx.fillStyle = '#b6a37e';
  ctx.beginPath();
  ctx.ellipse(cx, cy, s * 0.20, s * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  // shadow hollows
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath(); ctx.ellipse(cx - 24, cy - 18, 16, 20, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 24, cy - 18, 16, 20, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx, cy + 20, 12, 22, 0, 0, Math.PI * 2); ctx.fill();
  // eyes — black with a faint dead glint
  ctx.fillStyle = '#050505';
  ctx.beginPath(); ctx.arc(cx - 24, cy - 16, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 24, cy - 16, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(200,190,160,0.5)';
  ctx.beginPath(); ctx.arc(cx - 26, cy - 18, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 22, cy - 18, 2, 0, Math.PI * 2); ctx.fill();
  // grim mouth
  ctx.strokeStyle = '#1a0e0a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy + 46);
  ctx.quadraticCurveTo(cx, cy + (seed > 0.5 ? 40 : 58), cx + 18, cy + 46);
  ctx.stroke();
  // cracks over the whole painting
  for (let i = 0; i < 16; i++) {
    ctx.strokeStyle = `rgba(0,0,0,${rand(0.2, 0.5)})`;
    ctx.lineWidth = rand(0.4, 1.2);
    ctx.beginPath();
    let x = rand(0, s), y = rand(0, s);
    ctx.moveTo(x, y);
    for (let k = 0; k < 6; k++) { x += rand(-20, 20); y += rand(-20, 20); ctx.lineTo(x, y); }
    ctx.stroke();
  }
  grain(ctx, s, s, 18);
  return colorTexture(cvs, 1);
}

// --------------------------- Cobweb (transparent) --------------------------
export function makeCobweb() {
  const s = 256;
  const cvs = canvas(s);
  const ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, s, s);
  ctx.strokeStyle = 'rgba(220,220,220,0.5)';
  ctx.lineWidth = 0.7;
  const cx = 0, cy = 0; // corner web
  const spokes = 9;
  for (let i = 0; i <= spokes; i++) {
    const a = (i / spokes) * (Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
    ctx.stroke();
  }
  for (let r = 30; r < s; r += rand(20, 34)) {
    ctx.beginPath();
    for (let i = 0; i <= spokes; i++) {
      const a = (i / spokes) * (Math.PI / 2);
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(cvs);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// --------------------------- Flashlight lens cookie ------------------------
export function makeFlashlightCookie() {
  const s = 256;
  const cvs = canvas(s);
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, s, s);
  const grd = ctx.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s / 2);
  grd.addColorStop(0, '#ffffff');
  grd.addColorStop(0.55, '#d8d8d8');
  grd.addColorStop(0.8, '#4a4a4a');
  grd.addColorStop(1, '#000000');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
  ctx.fill();
  // subtle reflector imperfections
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(0,0,0,${rand(0.02, 0.08)})`;
    ctx.beginPath();
    ctx.arc(rand(0, s), rand(0, s), rand(1, 5), 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(cvs);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// --------------------------- Rug -------------------------------------------
export function makeRug() {
  const s = 256;
  const cvs = canvas(s);
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#3a1414';
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = '#5a2020';
  ctx.lineWidth = 10;
  ctx.strokeRect(16, 16, s - 32, s - 32);
  ctx.strokeStyle = '#732a2a';
  ctx.lineWidth = 3;
  ctx.strokeRect(34, 34, s - 68, s - 68);
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = `rgba(120,60,40,${rand(0.2, 0.5)})`;
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, 20 + i * 12, 0, Math.PI * 2);
    ctx.stroke();
  }
  grain(ctx, s, s, 24);
  return colorTexture(cvs, 1);
}

// --------------------------- bump map from a color canvas ------------------
function makeBumpFrom(srcCanvas, repeat) {
  const s = srcCanvas.width;
  const cvs = canvas(s);
  const ctx = cvs.getContext('2d');
  ctx.drawImage(srcCanvas, 0, 0);
  const img = ctx.getImageData(0, 0, s, s);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = (d[i] + d[i + 1] + d[i + 2]) / 3;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return dataTexture(cvs, repeat);
}
