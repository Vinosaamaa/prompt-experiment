import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import { buildHouse } from './world/House.js';
import { Player } from './player/Player.js';
import { AudioEngine } from './systems/AudioEngine.js';
import { Ghost } from './systems/Ghost.js';
import { ScareDirector } from './systems/ScareDirector.js';
import { HUD } from './ui/HUD.js';

const STATE = { TITLE: 'title', PLAYING: 'playing', CAUGHT: 'caught', ESCAPED: 'escaped' };

export class Game {
  constructor() {
    this.container = document.getElementById('app');
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.135);
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 60);
    this.scene.add(this.camera);

    // ---- world & systems ----
    this.house = buildHouse(this.scene);
    this.player = new Player(this.camera, this.renderer.domElement, this.house);
    this.audio = new AudioEngine();
    this.ghost = new Ghost(this.scene);
    this.hud = new HUD();
    this.director = new ScareDirector({
      house: this.house, ghost: this.ghost, audio: this.audio, hud: this.hud,
      onChaseStart: () => {},
    });

    this._buildDust();

    // ---- postprocessing ----
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight), 0.9, 0.6, 0.72);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    // ---- state ----
    this.state = STATE.TITLE;
    this.keysFound = 0;
    this.banishCount = 0;
    this.burning = false;
    this.startTime = 0;
    this.noteOpen = false;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 2.5;
    this.clock = new THREE.Clock();

    this._bindEvents();
    this._exposeDevApi();
    // render a first frame of the (dark) scene behind the title
    this.composer.render();
  }

  // Debug/QA helpers, callable from the browser console as window.__dev.*
  // These do NOT affect normal play (nothing here runs unless invoked manually);
  // they exercise the real gameplay systems for testing and demos.
  _exposeDevApi() {
    const near = (p, faceTo) => {
      this.player.pos.set(p.x, this.player.height, p.z + 0.75);
      const dx = p.x - this.player.pos.x, dz = (faceTo ? p.z : p.z) - this.player.pos.z;
      this.player.euler.set(-0.18, Math.atan2(-dx, -dz), 0, 'YXZ');
      this.camera.quaternion.setFromEuler(this.player.euler);
      this.camera.position.set(this.player.pos.x, this.player.height, this.player.pos.z);
    };
    window.__dev = {
      // walk up to and pick up key i (0..2), exercising the real pickup + escalation
      key: (i = 0) => {
        const k = this.house.keys.find((kk, idx) => !kk.taken && (i == null || idx === i)) || this.house.keys.find((kk) => !kk.taken);
        if (!k) return 'no keys left';
        near(k.hit.position, true);
        setTimeout(() => this._collectKey(k.hit), 400);
        return `walking to key in ${k.room}`;
      },
      keys: () => this.house.keys.map((k) => ({ room: k.room, taken: k.taken })),
      // jump straight to the finale chase
      chase: () => {
        while (this.keysFound < 2) { const k = this.house.keys.find((kk) => !kk.taken); if (!k) break; this._collectKey(k.hit); }
        const last = this.house.keys.find((kk) => !kk.taken);
        if (last) this._collectKey(last.hit); // 3rd key -> triggers _finalSequence + chase
        return 'chase incoming';
      },
      // reveal the entity a few metres ahead in a non-lethal stalking pose (for viewing/burn demo)
      show: (dist = 4) => {
        const fx = -Math.sin(this.player.euler.y), fz = -Math.cos(this.player.euler.y);
        const x = this.player.pos.x + fx * dist, z = this.player.pos.z + fz * dist;
        this.ghost.state = 'posed';
        this.ghost.pos.set(x, 0, z);
        this.ghost.group.position.set(x, 0, z);
        this.ghost._setFace('rage');
        this.ghost.eyeLight.intensity = 0.9;
        this.ghost._show(true);
        this.audio.setBreathing(0.7);
        return 'entity revealed ahead';
      },
      banish: () => { this.ghost.manifest && (this.ghost.burn = 0.99); return this.ghost.applyBurn(0.02); },
      win: () => { this.house.frontDoor.locked = false; this._escape(); return 'escaped'; },
      die: () => { this._caught(); return 'caught'; },
      pos: () => ({ x: +this.player.pos.x.toFixed(2), z: +this.player.pos.z.toFixed(2), room: this.house.roomAt(this.player.pos.x, this.player.pos.z) }),
    };
  }

  _buildDust() {
    const N = 340;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    this.dustPhase = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      // keep a small clear bubble around the camera so motes are not huge in-face
      let x, z;
      do { x = (Math.random() - 0.5) * 9; z = (Math.random() - 0.5) * 9; } while (x * x + z * z < 2.8);
      pos[i * 3] = x;
      pos[i * 3 + 1] = Math.random() * 3;
      pos[i * 3 + 2] = z;
      this.dustPhase[i] = Math.random() * Math.PI * 2;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x8f97a6, size: 0.035, map: this._dustSprite(), alphaMap: this._dustSprite(),
      transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending,
      depthWrite: false, sizeAttenuation: true,
    });
    this.dust = new THREE.Points(geo, mat);
    this.dust.frustumCulled = false;
    this.scene.add(this.dust);
  }

  _dustSprite() {
    const s = 32; const c = document.createElement('canvas'); c.width = c.height = s;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.4)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(c);
  }

  _bindEvents() {
    window.addEventListener('resize', () => this._onResize());

    document.getElementById('startBtn').addEventListener('click', () => this.start());
    document.getElementById('retryBtn').addEventListener('click', () => this.restart());
    document.getElementById('againBtn').addEventListener('click', () => this.restart());

    // interaction / note / burn
    document.addEventListener('keydown', (e) => {
      if (this.state !== STATE.PLAYING) return;
      if (e.code === 'KeyE') {
        if (this.noteOpen) { this._closeNote(); return; }
        this._interact();
      }
      if (e.code === 'Escape' && this.noteOpen) this._closeNote();
    });

    const dom = this.renderer.domElement;
    dom.addEventListener('mousedown', (e) => {
      if (this.state !== STATE.PLAYING) return;
      if (!this.player.locked) { this.player.requestLock(); return; }
      if (this.noteOpen) return;
      if (e.button === 0) this.burning = true;
    });
    window.addEventListener('mouseup', (e) => { if (e.button === 0) this.burning = false; });
  }

  _onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h); this.composer.setSize(w, h);
    this.bloom.setSize(w, h);
  }

  // ------------------------------ lifecycle -----------------------------
  start() {
    this.audio.init();
    this.audio.startAmbient();
    document.getElementById('title').classList.add('hidden');
    document.getElementById('loading').style.display = 'none';
    this.hud.showHUD(true);
    this._resetRun();
    this.player.enable();
    this.player.requestLock();
    this.state = STATE.PLAYING;
    this.startTime = performance.now();
    if (!this._running) { this._running = true; this._loop(); }
  }

  restart() {
    this.hud.hideDeath();
    this.hud.hideWin();
    this.hud.hideJump();
    this._resetRun();
    this.player.requestLock();
    this.state = STATE.PLAYING;
    this.startTime = performance.now();
  }

  _resetRun() {
    this.keysFound = 0;
    this.banishCount = 0;
    this.burning = false;
    this.noteOpen = false;
    this.hud.hideNote();
    this.hud.showBurn(null);
    this.hud.setObjective('Find 3 brass keys.', 0);

    // restore items
    for (const k of this.house.keys) { k.taken = false; k.group.visible = true; k.hit.visible = true; k.hit.userData.taken = false; }
    for (const b of this.house.batteries) { b.taken = false; b.group.visible = true; b.hit.visible = true; b.hit.userData.taken = false; }

    // doors closed, front locked
    this.house.studyDoor.setOpen(false, true);
    this.house.bedroomDoor.setOpen(false, true);
    this.house.frontDoor.setOpen(false, true);
    this.house.frontDoor.locked = true;

    // lights back to base
    const b = this.house.bulbs;
    b.foyerBulb.intensity = 0.55; b.hallBulb.intensity = 0.55; b.hallBulb2.intensity = 0.55;

    this.player.reset();
    this.ghost.reset();
    this.director.clearTimers();
    this.director.reset();
    this.audio.reset();
  }

  // ------------------------------ interaction ---------------------------
  _currentTarget() {
    this.raycaster.set(
      this.camera.getWorldPosition(new THREE.Vector3()),
      new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion));
    const list = this.house.interactables.filter((m) => m.visible && !m.userData.taken);
    const hits = this.raycaster.intersectObjects(list, false);
    return hits.length ? hits[0].object : null;
  }

  _interact() {
    const target = this._currentTarget();
    if (!target) return;
    const ud = target.userData;
    if (ud.kind === 'key') {
      this._collectKey(target);
    } else if (ud.kind === 'battery') {
      target.userData.taken = true; target.visible = false; ud.ref.visible = false;
      this.player.addBattery(0.45);
      this.audio.playPickup();
      this.hud.toast('Spare battery — flashlight recharged');
    } else if (ud.kind === 'note') {
      this._openNote(ud.title, ud.body);
    } else if (ud.kind === 'door') {
      this._useDoor(ud.ref);
    }
  }

  _collectKey(target) {
    const ud = target.userData;
    target.userData.taken = true; target.visible = false; ud.ref.visible = false;
    this.keysFound++;
    this.audio.playPickup();
    this.hud.setObjective(this.keysFound >= 3 ? 'The front door will open now — GO!' : 'Find the brass keys.', this.keysFound);
    this.hud.toast(`Brass key found (${this.keysFound}/3)`);
    if (this.keysFound >= 3) this.house.frontDoor.locked = false;
    this.director.keyTaken(ud.room, this.keysFound, this.player.pos);
  }

  _useDoor(ref) {
    if (ref === 'front') {
      if (this.house.frontDoor.locked) {
        this.hud.toast('The front door is locked. Three keys.');
        this.audio.playCreak();
        this.hud.shake(0.2);
        return;
      }
      this.house.frontDoor.setOpen(true);
      this.audio.playDoorCreak();
      this._escape();
      return;
    }
    const d = ref === 'study' ? this.house.studyDoor : this.house.bedroomDoor;
    d.setOpen(!d.isOpen);
    this.audio.playDoorCreak();
  }

  _openNote(title, body) {
    this.noteOpen = true;
    this.player.canMove = false;
    this.burning = false;
    this.hud.showNote(title, body);
  }
  _closeNote() {
    this.noteOpen = false;
    this.player.canMove = true;
    this.hud.hideNote();
  }

  // ------------------------------ burn mechanic -------------------------
  _updateBurn(dt) {
    const beamOnGhost = this._beamHitsGhost();
    if (this.burning && this.player.on && this.player.litNow && beamOnGhost) {
      this.player.burnDrain(dt);
      const frac = this.ghost.applyBurn(dt);
      this.hud.showBurn(this.ghost.burn);
      if (frac >= 1) {
        this.banishCount++;
        this.audio.playBanishShriek();
        this.hud.flash('#ff8a3a', 0.5, 260);
        this.hud.toast('You drove it back!');
        this.hud.showBurn(null);
      }
    } else {
      this.ghost.coolBurn(dt);
      if (this.ghost.manifest && this.ghost.burn > 0.02) this.hud.showBurn(this.ghost.burn);
      else this.hud.showBurn(null);
    }
  }

  _beamHitsGhost() {
    if (!this.ghost.manifest) return false;
    const gp = this.ghost.getWorldPosition();
    const cam = this.camera.getWorldPosition(new THREE.Vector3());
    const to = gp.clone().sub(cam);
    const dist = to.length();
    if (dist > 13) return false;
    to.normalize();
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const ang = fwd.angleTo(to);
    return ang < Math.PI / 7 + 0.06; // within the flashlight cone
  }

  // ------------------------------ end states ----------------------------
  _escape() {
    this.state = STATE.ESCAPED;
    this.burning = false;
    this.audio.stopChase();
    this.audio.setHeartRate(0);
    this.audio.setBreathing(0);
    this.ghost.reset();
    document.exitPointerLock?.();
    const secs = (performance.now() - this.startTime) / 1000;
    const mm = Math.floor(secs / 60), ss = Math.floor(secs % 60);
    this.hud.showBurn(null);
    this.hud.showWin(`${mm}:${String(ss).padStart(2, '0')}`, this.banishCount);
  }

  _caught() {
    if (this.state !== STATE.PLAYING) return;
    this.state = STATE.CAUGHT;
    this.burning = false;
    this.hud.showBurn(null);
    this.hud.jumpScare();
    this.hud.flash('#7c0000', 0.9, 400);
    this.audio.playScream();
    this.audio.stopChase();
    this.audio.setHeartRate(0);
    this.audio.setBreathing(0);
    document.exitPointerLock?.();
    setTimeout(() => { this.hud.hideJump(); this.hud.showDeath(); }, 950);
  }

  // ------------------------------ prompt --------------------------------
  _updatePrompt() {
    if (this.noteOpen) { this.hud.prompt(null); return; }
    const t = this._currentTarget();
    if (!t) { this.hud.prompt(null); return; }
    const ud = t.userData;
    let label = '';
    if (ud.kind === 'key') label = 'pick up brass key';
    else if (ud.kind === 'battery') label = 'take battery';
    else if (ud.kind === 'note') label = 'read note';
    else if (ud.kind === 'door') {
      if (ud.ref === 'front') label = this.house.frontDoor.locked ? 'locked — need 3 keys' : 'open the front door';
      else label = (ud.ref === 'study' ? this.house.studyDoor : this.house.bedroomDoor).isOpen ? 'close door' : 'open door';
    }
    this.hud.prompt(`<span class="k">E</span> ${label}`);
  }

  _updateDust(dt) {
    const t = performance.now() * 0.001;
    this.dust.position.set(this.camera.position.x, 0, this.camera.position.z);
    const p = this.dust.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) + Math.sin(t * 0.5 + this.dustPhase[i]) * 0.0009;
      p.setY(i, y > 3 ? 0 : y);
    }
    p.needsUpdate = true;
  }

  // ------------------------------ main loop -----------------------------
  _loop() {
    requestAnimationFrame(() => this._loop());
    const dt = Math.min(0.05, this.clock.getDelta());

    if (this.state === STATE.PLAYING) {
      this.player.update(dt);
      this.house.update(dt);
      const room = this.house.roomAt(this.player.pos.x, this.player.pos.z);
      this.director.update(dt, room, this.player.pos, this.keysFound);
      const res = this.ghost.update(dt, this.player.pos);
      this._updateBurn(dt);
      this._updatePrompt();
      this.hud.setBattery(this.player.battery);

      // light flicker (candles, bulbs, key glints) unless director overrides bulbs
      if (this.director.hardFlicker <= 0) {
        for (const f of this.house.flickerLights) {
          f.light.intensity = f.base + (Math.random() - 0.5) * f.jitter;
        }
      } else {
        for (const f of this.house.flickerLights) if (!f.bulb) f.light.intensity = f.base + (Math.random() - 0.5) * f.jitter;
      }

      if (res.caught) this._caught();
    }

    this._updateDust(dt);
    this.hud.update(dt);

    // camera shake
    const s = this.hud.getShakeOffset();
    this.camera.position.x += s.x; this.camera.position.y += s.y;
    this.camera.rotation.z = s.roll;

    this.composer.render();
  }
}
