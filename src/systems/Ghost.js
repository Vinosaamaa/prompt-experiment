import * as THREE from 'three';

function faceTexture(kind) {
  const s = 256;
  const c = document.createElement('canvas'); c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, s, s);
  // gaunt pale face mass
  const grd = ctx.createRadialGradient(s / 2, s / 2, 20, s / 2, s / 2, s * 0.6);
  grd.addColorStop(0, 'rgba(150,150,158,0.95)');
  grd.addColorStop(0.7, 'rgba(60,60,70,0.85)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.ellipse(s / 2, s / 2, s * 0.32, s * 0.46, 0, 0, Math.PI * 2); ctx.fill();
  // hollow eye sockets
  ctx.fillStyle = 'rgba(0,0,0,0.92)';
  ctx.beginPath(); ctx.ellipse(s / 2 - 42, s / 2 - 24, 26, 34, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(s / 2 + 42, s / 2 - 24, 26, 34, 0, 0, Math.PI * 2); ctx.fill();
  // glowing pupils
  ctx.fillStyle = kind === 'rage' ? '#ff2a12' : '#ff7a2a';
  ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 24;
  ctx.beginPath(); ctx.arc(s / 2 - 42, s / 2 - 22, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(s / 2 + 42, s / 2 - 22, 8, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  // mouth per expression
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  if (kind === 'scream') {
    ctx.beginPath(); ctx.ellipse(s / 2, s / 2 + 62, 22, 40, 0, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'grin') {
    ctx.beginPath(); ctx.ellipse(s / 2, s / 2 + 60, 46, 20, 0, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = 'rgba(120,120,120,0.8)'; ctx.lineWidth = 2;
    for (let i = -4; i <= 4; i++) { const x = s / 2 + i * 10; ctx.beginPath(); ctx.moveTo(x, s / 2 + 44); ctx.lineTo(x, s / 2 + 74); ctx.stroke(); }
  } else {
    ctx.beginPath(); ctx.moveTo(s / 2 - 24, s / 2 + 66); ctx.quadraticCurveTo(s / 2, s / 2 + 58, s / 2 + 24, s / 2 + 66);
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class Ghost {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);

    const dark = new THREE.MeshStandardMaterial({ color: 0x0a0a12, roughness: 1, metalness: 0, emissive: 0x05060a, emissiveIntensity: 0.4 });
    this.dark = dark;

    // tall tapered body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.4, 2.5, 12, 1, true), dark);
    body.position.y = 1.3; body.castShadow = true; this.group.add(body);

    // shoulders
    const sh = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), dark);
    sh.position.y = 2.35; sh.scale.set(1.4, 0.7, 0.9); this.group.add(sh);

    // head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 14), dark);
    head.position.y = 2.75; head.scale.set(0.9, 1.15, 0.9); this.group.add(head);
    this.head = head;

    // face plane
    this.faces = { neutral: faceTexture('neutral'), scream: faceTexture('scream'), grin: faceTexture('grin'), rage: faceTexture('rage') };
    this.faceMat = new THREE.MeshBasicMaterial({ map: this.faces.neutral, transparent: true, depthWrite: false });
    this.facePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.66), this.faceMat);
    this.facePlane.position.set(0, 2.74, 0.2); this.group.add(this.facePlane);

    // glowing eyes (bloom targets)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff5a26 });
    this.eyeMat = eyeMat;
    this.eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeMat);
    this.eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeMat);
    this.eyeL.position.set(-0.09, 2.78, 0.22); this.eyeR.position.set(0.09, 2.78, 0.22);
    this.group.add(this.eyeL, this.eyeR);
    this.eyeLight = new THREE.PointLight(0xff4a1a, 0.0, 3, 2); this.eyeLight.position.set(0, 2.7, 0.3); this.group.add(this.eyeLight);

    // long arms with claws
    this.arms = [];
    for (const side of [-1, 1]) {
      const arm = new THREE.Group();
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.9, 8), dark);
      upper.position.y = -0.45; arm.add(upper);
      const fore = new THREE.Group(); fore.position.y = -0.9;
      const foreMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.85, 8), dark);
      foreMesh.position.y = -0.42; fore.add(foreMesh);
      const hand = new THREE.Group(); hand.position.y = -0.85;
      for (let f = 0; f < 4; f++) {
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.28, 6), dark);
        claw.position.set((f - 1.5) * 0.04, -0.14, 0); claw.rotation.x = Math.PI;
        hand.add(claw);
      }
      fore.add(hand); arm.add(fore);
      arm.position.set(side * 0.32, 2.3, 0);
      arm.rotation.z = side * 0.35;
      this.group.add(arm);
      this.arms.push({ arm, fore, side });
    }

    // tattered strips
    this.tatters = [];
    const tatMat = new THREE.MeshStandardMaterial({ color: 0x0c0c14, roughness: 1, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    for (let i = 0; i < 10; i++) {
      const w = 0.08 + Math.random() * 0.1, h = 0.6 + Math.random() * 1.1;
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(w, h), tatMat);
      const a = Math.random() * Math.PI * 2, r = 0.15 + Math.random() * 0.25;
      strip.position.set(Math.cos(a) * r, 1.4 + Math.random() * 0.9, Math.sin(a) * r);
      strip.rotation.y = a; this.group.add(strip);
      this.tatters.push({ strip, phase: Math.random() * Math.PI * 2, baseY: strip.position.y });
    }

    // black vapor billboards near the base
    this.vapor = [];
    const vaporTex = this._vaporTex();
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0),
        new THREE.MeshBasicMaterial({ map: vaporTex, transparent: true, opacity: 0.35, depthWrite: false, color: 0x0a0a12 }));
      m.position.set((Math.random() - 0.5) * 0.8, 0.4 + Math.random() * 0.8, (Math.random() - 0.5) * 0.8);
      this.group.add(m); this.vapor.push({ m, phase: Math.random() * Math.PI * 2 });
    }

    // state
    this.state = 'hidden';
    this.manifest = false;
    this.pos = new THREE.Vector3(0, 0, -6);
    this.burn = 0;
    this.timers = {};
    this.apparitionT = 0; this.apparitionDur = 0;
    this.stalkT = 0; this.nextStalk = 8;
    this.banishT = 0;
    this.chaseSpeed = 2.35;
    this.catchRadius = 0.85;
    this.flickerAcc = 0;
  }

  _vaporTex() {
    const s = 128; const c = document.createElement('canvas'); c.width = c.height = s;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(s / 2, s / 2, 2, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(20,20,30,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(c);
  }

  _setFace(kind) { this.faceMat.map = this.faces[kind] || this.faces.neutral; this.faceMat.needsUpdate = true; }

  _show(on) { this.group.visible = on; this.manifest = on; }

  getWorldPosition() { return this.pos.clone().setY(1.5); }

  // brief apparition at a fixed spot, then vanish (act 1/2 scripted scares)
  appearAt(x, z, face = 'neutral', duration = 1.2) {
    this.pos.set(x, 0, z);
    this.group.position.set(x, 0, z);
    this._setFace(face);
    this.eyeLight.intensity = 0.6;
    this.state = 'apparition';
    this.apparitionT = 0; this.apparitionDur = duration;
    this._show(true);
  }

  startStalking() {
    if (this.state === 'chase') return;
    this.state = 'stalking';
    this.stalkT = 0; this.nextStalk = 2.5;
    this._show(false);
  }

  startChase(playerPos) {
    this.state = 'chase';
    this._setFace('rage');
    this.eyeMat.color.setHex(0xff2a12);
    this.eyeLight.color.setHex(0xff2a12);
    this.eyeLight.intensity = 0.9;
    // spawn a little behind the player
    const behind = playerPos.clone(); behind.z += 4; behind.x += (Math.random() - 0.5) * 3;
    this.pos.set(behind.x, 0, behind.z);
    this.group.position.copy(this.pos);
    this.burn = 0;
    this._show(true);
  }

  banish() {
    this.burn = 0;
    this._setFace('scream');
    if (this.state === 'chase') {
      this.state = 'banished';
      this.banishT = 0;
      this._show(false);
    } else {
      this._show(false);
      if (this.state !== 'chase') this.state = 'stalking';
    }
  }

  // returns burn fraction; called by Game when beam is on the entity
  applyBurn(dt) {
    if (!this.manifest) return 0;
    this.burn = Math.min(1, this.burn + dt * 0.5);
    this._setFace('scream');
    if (this.burn >= 1) {
      this.banish();
      return 1;
    }
    return this.burn;
  }

  coolBurn(dt) {
    if (this.burn > 0) this.burn = Math.max(0, this.burn - dt * 0.25);
    if (this.manifest && this.state === 'chase' && this.burn < 0.05) this._setFace('rage');
  }

  _animateBody(dt, playerPos) {
    const t = performance.now() * 0.001;
    // face the player
    const dx = playerPos.x - this.pos.x, dz = playerPos.z - this.pos.z;
    const yaw = Math.atan2(dx, dz);
    this.group.rotation.y = yaw;
    // tatters sway
    for (const tt of this.tatters) {
      tt.strip.rotation.x = Math.sin(t * 2 + tt.phase) * 0.25;
      tt.strip.position.y = tt.baseY + Math.sin(t * 1.5 + tt.phase) * 0.05;
    }
    // vapor drift
    for (const v of this.vapor) {
      v.m.position.y = 0.4 + ((t * 0.3 + v.phase) % 1.2);
      v.m.material.opacity = 0.32 * (1 - ((t * 0.3 + v.phase) % 1.2) / 1.2);
      v.m.lookAt(playerPos.x, v.m.position.y + this.pos.y, playerPos.z);
    }
    // reaching arms during chase
    const reach = this.state === 'chase' ? 0.5 : 0.1;
    for (const a of this.arms) {
      a.arm.rotation.x = -reach + Math.sin(t * 3 + a.side) * 0.15;
      a.fore.rotation.x = -reach * 0.8;
    }
    // face billboard toward player
    this.facefacing = yaw;
  }

  _flicker(dt, strong) {
    this.flickerAcc += dt;
    if (this.flickerAcc > (strong ? 0.05 : 0.09)) {
      this.flickerAcc = 0;
      const p = strong ? 0.35 : 0.15;
      this.group.visible = Math.random() > p;
      const j = strong ? 0.05 : 0.02;
      this.group.position.set(this.pos.x + (Math.random() - 0.5) * j, (Math.random() - 0.5) * j, this.pos.z + (Math.random() - 0.5) * j);
    }
  }

  update(dt, playerPos) {
    let caught = false;
    if (this.state === 'hidden') return { caught };

    if (this.state === 'posed') {
      // frozen reveal pose: animate, allow burning, but do not drift, vanish or catch
      this._animateBody(dt, playerPos);
      this.eyeLight.intensity = 0.9;
      if (this.burn > 0.1) this._flicker(dt, true); else this.group.visible = true;
      return { caught };
    }

    if (this.state === 'apparition') {
      this.apparitionT += dt;
      this._animateBody(dt, playerPos);
      this._flicker(dt, false);
      if (this.apparitionT >= this.apparitionDur) { this._show(false); this.state = this._afterApparition || 'hidden'; this._afterApparition = null; }
      return { caught };
    }

    if (this.state === 'stalking') {
      this.stalkT += dt;
      if (this.manifest) {
        // drift slowly toward the player, weaving
        this._driftToward(playerPos, dt, 0.9);
        this._animateBody(dt, playerPos);
        this._flicker(dt, false);
        this.eyeLight.intensity = 0.6;
        // vanish after a while or if very close (it teases, doesn't kill yet)
        const dist = Math.hypot(playerPos.x - this.pos.x, playerPos.z - this.pos.z);
        if (this.stalkT > this.manifestDur || dist < 1.6) { this._show(false); this.stalkT = 0; this.nextStalk = 9 + Math.random() * 8; }
      } else if (this.stalkT >= this.nextStalk) {
        this._manifestNear(playerPos);
      }
      return { caught };
    }

    if (this.state === 'banished') {
      this.banishT += dt;
      if (this.banishT >= 8) { this.startChase(playerPos); }
      return { caught };
    }

    if (this.state === 'chase') {
      this._driftToward(playerPos, dt, this.chaseSpeed, true);
      this._animateBody(dt, playerPos);
      // subtle corrupted-frame flicker while burning
      if (this.burn > 0.1) this._flicker(dt, true); else this.group.visible = true;
      const dist = Math.hypot(playerPos.x - this.pos.x, playerPos.z - this.pos.z);
      this.eyeLight.intensity = 0.9 + Math.max(0, (4 - dist)) * 0.1;
      if (dist < this.catchRadius) caught = true;
      return { caught };
    }
    return { caught };
  }

  _manifestNear(playerPos) {
    // appear a few metres away, ideally toward a doorway/edge
    const ang = Math.random() * Math.PI * 2;
    const d = 5 + Math.random() * 2;
    let x = playerPos.x + Math.cos(ang) * d;
    let z = playerPos.z + Math.sin(ang) * d;
    x = THREE.MathUtils.clamp(x, -9.5, 9.5); z = THREE.MathUtils.clamp(z, -7.5, 7.5);
    this.pos.set(x, 0, z);
    this.group.position.copy(this.pos);
    this._setFace(Math.random() < 0.5 ? 'neutral' : 'grin');
    this.stalkT = 0; this.manifestDur = 4 + Math.random() * 3;
    this._show(true);
  }

  _driftToward(playerPos, dt, speed, weave = false) {
    const dx = playerPos.x - this.pos.x, dz = playerPos.z - this.pos.z;
    const d = Math.hypot(dx, dz) || 1;
    let vx = dx / d, vz = dz / d;
    if (weave) {
      const t = performance.now() * 0.001;
      const perpx = -vz, perpz = vx;
      const w = Math.sin(t * 2.2) * 0.5;
      vx += perpx * w; vz += perpz * w;
      const n = Math.hypot(vx, vz) || 1; vx /= n; vz /= n;
    }
    // glides through walls — no collision
    this.pos.x += vx * speed * dt;
    this.pos.z += vz * speed * dt;
    this.group.position.set(this.pos.x, this.pos.y, this.pos.z);
    // gentle vertical bob (floating)
    this.group.position.y = Math.sin(performance.now() * 0.003) * 0.06;
  }

  reset() {
    this.state = 'hidden';
    this._show(false);
    this.burn = 0;
    this.eyeMat.color.setHex(0xff5a26);
    this.eyeLight.color.setHex(0xff4a1a);
    this.eyeLight.intensity = 0;
    this._setFace('neutral');
    this.pos.set(0, 0, -6);
    this.stalkT = 0; this.nextStalk = 8;
  }
}
